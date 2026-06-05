#!/usr/bin/env python3
"""
backend/scripts/smart_ingest.py — Parser Autónomo de V20.md para El Códice.

Lee el archivo v20.md directamente, detecta los capítulos de Clanes y Disciplinas
mediante expresiones regulares, extrae las entradas estructuradas y las sube a
Supabase mediante upsert seguro.

Uso (desde la raíz del proyecto WOD Codex/):
    source backend/.venv/bin/activate
    python -m backend.scripts.smart_ingest backend/data/v20.md --dry-run
    python -m backend.scripts.smart_ingest backend/data/v20.md --verbose
    python -m backend.scripts.smart_ingest backend/data/v20.md --only clanes
    python -m backend.scripts.smart_ingest backend/data/v20.md --only disciplinas

Flags:
    --dry-run     Muestra qué se ingeriría sin escribir en la DB
    --verbose     Imprime detalle de cada entrada procesada
    --only TYPE   'clanes' | 'disciplinas' | 'todo' (default: todo)
    --levels N    Niveles máximos por disciplina a procesar (default: 5)
"""

from __future__ import annotations

import argparse
import asyncio
import re
import sys
import unicodedata
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from backend.core.config import settings
from backend.models import GameRule


# ═════════════════════════════════════════════════════════════════
# CONOCIMIENTO ESTÁTICO DEL V20
# ═════════════════════════════════════════════════════════════════

# Disciplinas del V20 Core — nombre exacto como aparece en el MD
V20_DISCIPLINES: dict[str, str] = {
    "Animalismo":    "animalismo",
    "Auspex":        "auspex",
    "Celeridad":     "celeridad",
    "Dementación":   "dementacion",
    "Dominación":    "dominacion",
    "Extinción":     "extincion",
    "Fortaleza":     "fortaleza",
    "Necromancia":   "necromancia",
    "Obtenebración": "obtenebración",
    "Ofuscación":    "ofuscacion",
    "Potencia":      "potencia",
    "Presencia":     "presencia",
    "Protean":       "protean",
    "Quimerismo":    "quimerismo",
    "Quietus":       "quietus",
    "Serpentis":     "serpentis",
    "Taumaturgia":   "taumaturgia",
    "Temporis":      "temporis",
    "Vicisitud":     "vicisitud",
    "Melpominee":    "melpominee",
}

# Apodo → (nombre_clan, slug, disciplinas_de_clan)
APODO_MAP: dict[str, tuple[str, str, str]] = {
    "Asesinos":               ("Assamitas",        "assamitas",         "Celeridad, Extinción, Ofuscación"),
    "Chusma":                 ("Brujah",            "brujah",            "Celeridad, Potencia, Presencia"),
    "Forasteros":             ("Gangrel",           "gangrel",           "Animalismo, Fortaleza, Protean"),
    "Necromantes":            ("Giovanni",          "giovanni",          "Dominación, Necromancia, Potencia"),
    "Guardianes":             ("Lasombra",          "lasombra",          "Dominación, Obtenebración, Potencia"),
    "Lunáticos":              ("Malkavian",         "malkavian",         "Auspex, Dementación, Ofuscación"),
    "Ratas de Alcantarilla":  ("Nosferatu",         "nosferatu",         "Animalismo, Ofuscación, Potencia"),
    "Embusteros":             ("Ravnos",            "ravnos",            "Animalismo, Chimerismo, Fortaleza"),
    "Setitas":                ("Seguidores de Set", "seguidores-de-set", "Ofuscación, Presencia, Serpentis"),
    "Serpientes":             ("Seguidores de Set", "seguidores-de-set", "Ofuscación, Presencia, Serpentis"),
    "Degenerados":            ("Toreador",          "toreador",          "Auspex, Celeridad, Presencia"),
    "Brujos":                 ("Tremere",           "tremere",           "Auspex, Dominación, Taumaturgia"),
    "Demonios":               ("Tzimisce",          "tzimisce",          "Animalismo, Auris, Vicisitud"),
    "Sangre Azul":            ("Ventrue",           "ventrue",           "Dominación, Fortaleza, Presencia"),
}

# Capítulos del V20 (marcadores de inicio)
CHAPTER_CLANES     = "Capítulo Dos: Sectas y Clanes"
CHAPTER_DISCIPLINAS = "Capítulo Cuatro: Disciplinas"
CHAPTER_TRES       = "Capítulo Tres: Personajes"
CHAPTER_CINCO      = "Capítulo Cinco: Reglas"

# Niveles 1-5: bullets usados en el texto
# Nivel 1: "- PowerName" (guion + espacio + mayúscula)
# Nivel 2-5: "•• PowerName", "••• PowerName", etc.
# Nivel 6+: "••••• • PowerName" (excluimos del DB principal)
LEVEL_RE = re.compile(
    r'^(••••• •{1,4}|••••• |•{1,4} |^- )(.+)$'
)


# ═════════════════════════════════════════════════════════════════
# LIMPIEZA DE TEXTO
# ═════════════════════════════════════════════════════════════════

# Artefactos del PDF a eliminar
_PDF_ARTIFACTS = [
    re.compile(r'```[^`]*```', re.DOTALL),           # bloques de código
    re.compile(r'\(\^[0-9]+\)'),                      # números de página (^128)
    re.compile(r'^VAMPIRO LA MASCARADA.*$', re.M),    # headers de página
    re.compile(r'^CAPÍTULO [A-Z].*$', re.M),          # headers de capítulo
    re.compile(r'^\(\^\d+\s+\d+\).*$', re.M),        # page refs dobles
    re.compile(r'^\(\^\d+\).*$', re.M),               # page refs simples
    re.compile(r'```\n?'),                            # backticks sueltos
]

# Líneas que son ruido puro (encabezados repetidos del PDF)
_NOISE_LINES = re.compile(
    r'^\s*(?:\(\^?\d+\)|```|~~~|VAMPIRO LA MASCARADA|CAPÍTULO [A-Z]|pág\. \d+)\s*$',
    re.I
)


def clean_text(raw: str) -> str:
    """Elimina artefactos del PDF y normaliza el texto."""
    # Eliminar bloques de código del PDF
    text = re.sub(r'```', '', raw)
    # Eliminar numeración de página PDF: (^128) o (^128 40)
    text = re.sub(r'\(\^\d+(?:\s+\d+)?\)', '', text)
    # Eliminar headers de página repetidos
    text = re.sub(r'^VAMPIRO LA MASCARADA.*\n?', '', text, flags=re.M)
    text = re.sub(r'^CAPÍTULO (?:UNO|DOS|TRES|CUATRO|CINCO|SEIS|SIETE|OCHO|NUEVE|DIEZ)[^\n]*\n?', '', text, flags=re.M | re.I)
    # Rejoin guiones al final de línea (palabras cortadas)
    text = re.sub(r'(\w)-\n(\w)', r'\1\2', text)
    # Limpiar líneas vacías múltiples
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def slugify(text: str) -> str:
    """
    Genera URL slug limpio.
    'Dominación' → 'dominacion'
    'Seguidores de Set' → 'seguidores-de-set'
    """
    text = unicodedata.normalize('NFKD', text)
    text = text.encode('ascii', 'ignore').decode('ascii')
    text = re.sub(r'[^\w\s-]', '', text.lower())
    return re.sub(r'[-\s]+', '-', text).strip('-')


def extract_sistema(text: str) -> tuple[str, str]:
    """
    Divide un bloque de texto en (descripción, sistema).
    Detecta '**Sistema:**', 'Sistema:' o '**Sistema**:' como separador.
    """
    sistema_re = re.compile(
        r'\*\*Sistema[:\s*]*\*\*:?|Sistema:\s*\n?|System:\s*\n?',
        re.I
    )
    match = sistema_re.search(text)
    if match:
        description = text[:match.start()].strip()
        mechanical  = text[match.end():].strip()
    else:
        description = text.strip()
        mechanical  = ''
    return description, mechanical


def count_bullets(line: str) -> int:
    """
    Determina el nivel de un poder a partir de sus bullets.
    '- Power'      → 1
    '•• Power'     → 2
    '••• Power'    → 3
    '•••• Power'   → 4
    '••••• Power'  → 5
    '••••• • Power'→ 6 (excluido del parseo principal)
    '- Auto' donde Auto no empieza en mayúscula → 0 (lista normal, no poder)
    """
    stripped = line.strip()

    # Nivel 6+ (extended): ••••• seguido de espacio y más bullets
    if re.match(r'^•{5}\s+•', stripped):
        return 6

    # Niveles 1-5
    m = re.match(r'^(•+)\s+', stripped)
    if m:
        return min(len(m.group(1)), 5)

    # Nivel 1 con guion: solo si la siguiente palabra empieza en Mayúscula
    m2 = re.match(r'^-\s+([A-ZÁÉÍÓÚÑÜ])', stripped)
    if m2:
        return 1

    return 0


def get_power_name(line: str, level: int) -> str:
    """Extrae el nombre del poder de una línea de bullet."""
    stripped = line.strip()
    # Quitar bullets iniciales
    cleaned = re.sub(r'^[•-]+\s+', '', stripped)
    return cleaned.strip()


# ═════════════════════════════════════════════════════════════════
# PARSING DE CAPÍTULOS
# ═════════════════════════════════════════════════════════════════

def find_chapter_bounds(lines: list[str]) -> dict[str, tuple[int, int]]:
    """
    Localiza los índices de inicio y fin de los capítulos clave.
    Retorna dict: {'clanes': (start, end), 'disciplinas': (start, end)}
    """
    bounds: dict[str, tuple[int, int]] = {}
    chapter_markers = {
        CHAPTER_CLANES:      'clanes',
        CHAPTER_DISCIPLINAS: 'disciplinas',
        CHAPTER_TRES:        '_end_clanes',
        CHAPTER_CINCO:       '_end_disciplinas',
    }

    starts: dict[str, int] = {}
    for i, line in enumerate(lines):
        for marker, key in chapter_markers.items():
            if marker in line:
                starts[key] = i
                break

    c2_start = starts.get('clanes', 0)
    c2_end   = starts.get('_end_clanes', len(lines))
    c4_start = starts.get('disciplinas', 0)
    c4_end   = starts.get('_end_disciplinas', len(lines))

    bounds['clanes']      = (c2_start, c2_end)
    bounds['disciplinas'] = (c4_start, c4_end)
    return bounds


# ═════════════════════════════════════════════════════════════════
# PARSER DE CLANES (Capítulo 2)
# ═════════════════════════════════════════════════════════════════

def parse_clans(lines: list[str], start: int, end: int, verbose: bool) -> list[dict[str, Any]]:
    """
    Extrae los 13 clanes del Capítulo Dos.
    Usa **Apodo:** como ancla principal.
    """
    records: list[dict[str, Any]] = []
    apodo_re = re.compile(r'^\*\*Apodo:\*\*\s*(.+)$')
    disc_re  = re.compile(r'^\*\*Disciplinas de Clan:\*\*\s*(.+)$')
    deb_re   = re.compile(r'^\*\*Debilidades?:\*\*\s*(.*)$')
    sect_re  = re.compile(r'^\*\*Sectas?\s*(?:habitual)?[:\-]?\*\*\s*(.+)$', re.I)

    # Encontrar todos los **Apodo:** en el capítulo
    apodo_lines: list[tuple[int, str]] = []
    for i in range(start, end):
        m = apodo_re.match(lines[i].strip())
        if m:
            raw_apodo = m.group(1).strip().rstrip('.')
            # Manejar apodos compuestos: "Setitas, Serpientes" → tomar el primero
            primary_apodo = raw_apodo.split(',')[0].strip()
            apodo_lines.append((i, primary_apodo))

    if not apodo_lines:
        print("  ⚠️  No se encontraron líneas **Apodo:** en el capítulo de Clanes.")
        return records

    if verbose:
        print(f"\n  📍 Encontrados {len(apodo_lines)} apodos de clan:")
        for ln, ap in apodo_lines:
            print(f"     L{ln}: {ap}")

    for idx, (apodo_line_num, apodo) in enumerate(apodo_lines):

        # Lookup en el mapa
        if apodo not in APODO_MAP:
            if verbose:
                print(f"  ⚠️  Apodo desconocido '{apodo}' en L{apodo_line_num} — omitido")
            continue

        clan_name, slug, default_disciplines = APODO_MAP[apodo]

        # Definir el rango de texto del clan
        section_start = max(apodo_line_num - 200, start)
        section_end   = apodo_lines[idx + 1][0] - 1 if idx + 1 < len(apodo_lines) else min(apodo_line_num + 400, end)

        # Extraer la sección completa
        section_lines = lines[section_start:section_end]
        section_text  = clean_text('\n'.join(section_lines))

        # Extraer campos estructurados
        disciplines_found = default_disciplines
        weakness_lines: list[str] = []
        in_weakness = False

        for j, raw_line in enumerate(lines[apodo_line_num:min(apodo_line_num + 50, end)]):
            line = raw_line.strip()
            m_disc = disc_re.match(line)
            m_deb  = deb_re.match(line)

            if m_disc:
                disciplines_found = m_disc.group(1).strip().rstrip('.')
                in_weakness = False
            elif m_deb:
                in_weakness = True
                first_part = m_deb.group(1).strip()
                if first_part:
                    weakness_lines.append(first_part)
            elif in_weakness:
                if line.startswith('**') or not line:
                    in_weakness = False
                else:
                    weakness_lines.append(line)

        weakness_text = ' '.join(weakness_lines).strip()

        # Construir descripción: texto antes del primer **Apodo:** desde la narrativa
        # Buscar el texto introductorio del clan mirando atrás desde **Apodo:**
        narrative_start = apodo_line_num - 1
        narrative_lines: list[str] = []
        for k in range(apodo_line_num - 1, max(apodo_line_num - 180, start), -1):
            ln = lines[k].strip()
            if _NOISE_LINES.match(ln) or not ln:
                continue
            if ln.startswith('**') and ('Apodo' in ln or 'Disciplina' in ln):
                continue
            narrative_lines.insert(0, ln)
            if len(narrative_lines) >= 8:
                break

        intro = ' '.join(narrative_lines).strip()
        description = intro if intro else f"El clan {clan_name} del Mundo de Tinieblas."

        # mechanical_effect = disciplines + weakness
        mechanical = (
            f"Disciplinas de Clan: {disciplines_found}.\n"
            f"Debilidad: {weakness_text or 'Ver texto completo.'}"
        )

        record = {
            'game_line':         'V20',
            'category':          'clan',
            'name':              clan_name,
            'name_en':           None,
            'slug':              slug,
            'level':             None,
            'parent_name':       None,
            'group_affinity':    None,
            'description':       description,
            'mechanical_effect': mechanical,
            'system_text':       section_text[:8000],  # Limitar a 8k chars
            'tags':              ['clan', 'v20', slugify(clan_name)],
            'source_book':       'Vampiro: La Mascarada 20th Anniversary Edition',
            'source_page':       None,
            'duration':          None,
            'cost':              {'action_type': 'passive'},
            'prerequisites':     {'disciplines': [], 'gifts': [], 'spheres': [], 'attributes': {}, 'abilities': {}, 'other': [], 'experience_cost': 0},
        }
        records.append(record)

        if verbose:
            print(f"  ✅ Clan: {clan_name} ({slug}) | Disciplinas: {disciplines_found[:40]}...")

    return records


# ═════════════════════════════════════════════════════════════════
# PARSER DE DISCIPLINAS (Capítulo 4)
# ═════════════════════════════════════════════════════════════════

def parse_disciplines(
    lines: list[str],
    start: int,
    end: int,
    max_levels: int,
    verbose: bool,
) -> list[dict[str, Any]]:
    """
    Extrae disciplinas y sus poderes por nivel del Capítulo Cuatro.
    Estrategia:
      1. Detectar líneas que coincidan EXACTAMENTE con el nombre de una disciplina.
      2. Recopilar el bloque hasta la siguiente disciplina.
      3. Dentro del bloque, detectar poderes por sus bullets.
    """
    records: list[dict[str, Any]] = []

    # Construir índice de nombres de disciplinas
    discipline_names_set = set(V20_DISCIPLINES.keys())

    # Localizar posición de cada disciplina en el capítulo
    disc_positions: list[tuple[int, str]] = []
    for i in range(start, end):
        line_stripped = lines[i].strip()
        if line_stripped in discipline_names_set:
            disc_positions.append((i, line_stripped))

    if not disc_positions:
        print("  ⚠️  No se encontraron disciplinas en el capítulo indicado.")
        return records

    if verbose:
        print(f"\n  📍 Encontradas {len(disc_positions)} disciplinas:")
        for ln, nm in disc_positions:
            print(f"     L{ln}: {nm}")

    for d_idx, (disc_start_line, disc_name) in enumerate(disc_positions):
        disc_slug = V20_DISCIPLINES[disc_name]

        # Bloque de la disciplina = hasta la siguiente disciplina o fin de capítulo
        disc_end_line = (
            disc_positions[d_idx + 1][0]
            if d_idx + 1 < len(disc_positions)
            else min(disc_start_line + 1200, end)
        )

        disc_lines = lines[disc_start_line:disc_end_line]

        # ── 1. Descripción general (texto antes del primer bullet) ────
        intro_lines: list[str] = []
        first_power_idx = len(disc_lines)  # default si no hay poderes

        for j, raw in enumerate(disc_lines[1:], 1):  # skip nombre
            lvl = count_bullets(raw.strip())
            if lvl == 1:
                first_power_idx = j
                break
            cleaned = clean_text(raw)
            if cleaned and not _NOISE_LINES.match(raw):
                intro_lines.append(cleaned)

        intro_text = clean_text('\n'.join(intro_lines))
        intro_desc, intro_mech = extract_sistema(intro_text)

        # Entrada general de la disciplina (sin nivel)
        general_record = {
            'game_line':         'V20',
            'category':          'discipline',
            'name':              disc_name,
            'name_en':           None,
            'slug':              disc_slug,
            'level':             None,
            'parent_name':       None,
            'group_affinity':    None,
            'description':       intro_desc or f'La Disciplina {disc_name} del Vampiro: La Mascarada.',
            'mechanical_effect': intro_mech or f'Ver los poderes de {disc_name} por nivel.',
            'system_text':       intro_text,
            'tags':              ['disciplina', 'v20', disc_slug],
            'source_book':       'Vampiro: La Mascarada 20th Anniversary Edition',
            'source_page':       None,
            'duration':          None,
            'cost':              {'action_type': 'standard'},
            'prerequisites':     {'disciplines': [], 'gifts': [], 'spheres': [], 'attributes': {}, 'abilities': {}, 'other': [], 'experience_cost': 0},
        }
        records.append(general_record)

        # ── 2. Parsear poderes por nivel ──────────────────────────────
        power_blocks: list[tuple[int, str, int]] = []  # (line_idx, power_name, level)

        for j, raw in enumerate(disc_lines[first_power_idx:], first_power_idx):
            lvl = count_bullets(raw.strip())
            if 1 <= lvl <= 5:
                power_name = get_power_name(raw.strip(), lvl)
                if power_name and len(power_name) > 2:
                    power_blocks.append((j, power_name, lvl))

        # Para cada poder, recopilar su texto hasta el siguiente poder del mismo nivel o inferior
        for p_idx, (power_line_idx, power_name, level) in enumerate(power_blocks):
            if level > max_levels:
                continue

            # Texto del poder: desde la línea siguiente hasta el inicio del próximo poder
            p_start = power_line_idx + 1
            p_end   = power_blocks[p_idx + 1][0] if p_idx + 1 < len(power_blocks) else len(disc_lines)

            power_text_lines: list[str] = []
            for raw in disc_lines[p_start:p_end]:
                if _NOISE_LINES.match(raw):
                    continue
                next_lvl = count_bullets(raw.strip())
                if next_lvl >= 1:
                    break
                power_text_lines.append(raw)

            power_raw  = clean_text('\n'.join(power_text_lines))
            power_desc, power_mech = extract_sistema(power_raw)

            level_slug = f"{disc_slug}-{level}"

            level_record = {
                'game_line':         'V20',
                'category':          'discipline',
                'name':              f'{disc_name} — {power_name}',
                'name_en':           None,
                'slug':              level_slug,
                'level':             level,
                'parent_name':       disc_name,
                'group_affinity':    None,
                'description':       power_desc or f'Poder de nivel {level} de {disc_name}.',
                'mechanical_effect': power_mech or f'Ver texto completo de {power_name}.',
                'system_text':       power_raw,
                'tags':              ['disciplina', 'v20', disc_slug, f'nivel-{level}'],
                'source_book':       'Vampiro: La Mascarada 20th Anniversary Edition',
                'source_page':       None,
                'duration':          None,
                'cost':              {'action_type': 'standard'},
                'prerequisites':     {'disciplines': [f'{disc_name} {level - 1}'] if level > 1 else [], 'gifts': [], 'spheres': [], 'attributes': {}, 'abilities': {}, 'other': [], 'experience_cost': level * 5},
            }
            records.append(level_record)

            if verbose:
                print(f"    Nv{level}: {power_name[:50]}...")

        if verbose:
            levels_found = [r['level'] for r in records if r.get('parent_name') == disc_name]
            print(f"  ✅ {disc_name} ({disc_slug}) | {len(levels_found)} niveles procesados")

    return records


# ═════════════════════════════════════════════════════════════════
# UPSERT EN BASE DE DATOS
# ═════════════════════════════════════════════════════════════════

def build_embedding_text(r: dict[str, Any]) -> str:
    lvl_str = f" Nivel {r['level']}" if r.get('level') else ''
    cat_up  = str(r.get('category', '')).upper()
    return (
        f"[{cat_up}] [V20] {r['name']}{lvl_str}: "
        f"{r['description']} | Sistema: {r['mechanical_effect']}"
    ).strip()


async def upsert_record(
    session: AsyncSession,
    data: dict[str, Any],
    verify: bool = False,
    verbose: bool = False,
) -> str:
    result = await session.execute(
        select(GameRule).where(
            GameRule.game_line == data['game_line'],
            GameRule.slug      == data['slug'],
        )
    )
    rule = result.scalar_one_or_none()

    if rule is None:
        rule = GameRule(
            game_line         = data['game_line'],
            category          = data['category'],
            name              = data['name'],
            name_en           = data.get('name_en'),
            slug              = data['slug'],
            level             = data.get('level'),
            parent_name       = data.get('parent_name'),
            group_affinity    = data.get('group_affinity'),
            description       = data['description'],
            mechanical_effect = data['mechanical_effect'],
            system_text       = data.get('system_text', ''),
            tags              = data.get('tags', []),
            cost              = data.get('cost', {'action_type': 'standard'}),
            prerequisites     = data.get('prerequisites', {
                'disciplines': [], 'gifts': [], 'spheres': [],
                'attributes': {}, 'abilities': {}, 'other': [],
                'experience_cost': 0,
            }),
            source_book       = data.get('source_book'),
            source_page       = data.get('source_page'),
            duration          = data.get('duration'),
            is_verified       = verify,
        )
        rule.embedding_text = build_embedding_text(data)
        session.add(rule)
        action = 'CREADO'
    else:
        for field in (
            'name', 'name_en', 'category', 'level', 'parent_name', 'group_affinity',
            'description', 'mechanical_effect', 'system_text', 'tags',
            'cost', 'prerequisites', 'source_book', 'source_page', 'duration',
        ):
            if field in data:
                setattr(rule, field, data[field])
        rule.embedding_text = build_embedding_text(data)
        rule.chroma_id      = None  # invalidar embedding anterior
        if verify:
            rule.is_verified = True
        action = 'ACTUALIZADO'

    if verbose:
        lvl = f" Nv{data['level']}" if data.get('level') else ''
        print(f"    [{action}] {data['name']}{lvl}  →  /{data['slug']}")

    return action


# ═════════════════════════════════════════════════════════════════
# PUNTO DE ENTRADA
# ═════════════════════════════════════════════════════════════════

async def main(
    filepath: str,
    dry_run: bool,
    verbose: bool,
    only: str,
    max_levels: int,
    verify: bool,
) -> None:

    path = Path(filepath)
    if not path.exists():
        print(f"❌ Archivo no encontrado: {filepath}")
        sys.exit(1)

    print(f"\n📜 El Códice — Smart Ingestor v2.0")
    print(f"   Archivo : {path.name}  ({path.stat().st_size // 1024} KB)")
    print(f"   Modo    : {'DRY RUN' if dry_run else 'ESCRITURA en Supabase'}")
    print(f"   Procesar: {only.upper()}")
    print(f"   Niveles : 1–{max_levels}")
    print()

    # Leer el archivo
    try:
        content = path.read_text(encoding='utf-8')
    except UnicodeDecodeError:
        content = path.read_text(encoding='latin-1')

    lines = content.splitlines()
    print(f"   Líneas  : {len(lines):,}")

    # Localizar capítulos
    bounds = find_chapter_bounds(lines)

    clanes_start, clanes_end         = bounds.get('clanes', (0, len(lines)))
    disciplinas_start, disciplinas_end = bounds.get('disciplinas', (0, len(lines)))

    print(f"\n   📖 Capítulo 2 (Clanes):      L{clanes_start}–{clanes_end}")
    print(f"   📖 Capítulo 4 (Disciplinas): L{disciplinas_start}–{disciplinas_end}\n")

    all_records: list[dict[str, Any]] = []

    # Parsear clanes
    if only in ('todo', 'clanes'):
        print("── Parseando Clanes ─────────────────────────")
        clan_records = parse_clans(lines, clanes_start, clanes_end, verbose)
        print(f"   Clanes extraídos: {len(clan_records)}")
        all_records.extend(clan_records)

    # Parsear disciplinas
    if only in ('todo', 'disciplinas'):
        print("\n── Parseando Disciplinas ────────────────────")
        disc_records = parse_disciplines(
            lines, disciplinas_start, disciplinas_end, max_levels, verbose
        )
        print(f"   Registros extraídos: {len(disc_records)}")
        all_records.extend(disc_records)

    # Resumen de lo que se va a escribir
    print(f"\n{'─'*50}")
    print(f"  TOTAL registros a ingerir: {len(all_records)}")
    cats = {}
    for r in all_records:
        cats[r['category']] = cats.get(r['category'], 0) + 1
    for cat, n in sorted(cats.items()):
        print(f"    {cat}: {n}")
    print(f"{'─'*50}")

    if dry_run:
        print("\n[DRY RUN] Primeras 5 entradas que se escribirían:\n")
        for r in all_records[:5]:
            lvl = f" Nv{r['level']}" if r.get('level') else ''
            print(f"  • [{r['category']}] {r['name']}{lvl}")
            print(f"    slug={r['slug']} | tags={r['tags']}")
            print(f"    desc: {r['description'][:100]}...")
            print()
        print("Ejecuta sin --dry-run para escribir en la DB.")
        return

    # Conectar a Supabase y hacer upsert
    print("\n⬆️  Conectando a Supabase...")
    engine = create_async_engine(settings.DATABASE_URL, poolclass=NullPool, echo=False)
    AsyncSessionLocal = async_sessionmaker(
        bind=engine, class_=AsyncSession, expire_on_commit=False
    )

    created = updated = errors = 0

    async with AsyncSessionLocal() as session:
        for record in all_records:
            try:
                action = await upsert_record(session, record, verify=verify, verbose=verbose)
                if action == 'CREADO':
                    created += 1
                else:
                    updated += 1
            except Exception as e:
                errors += 1
                print(f"  ❌ Error en '{record.get('name', '?')}' ({record.get('slug', '?')}): {e}")
                if verbose:
                    import traceback
                    traceback.print_exc()

        await session.commit()

    await engine.dispose()

    print(f"\n{'═'*50}")
    print(f"  ✅ Creados    : {created}")
    print(f"  🔄 Actualizados: {updated}")
    if errors:
        print(f"  ❌ Errores   : {errors}")
    print(f"{'═'*50}")
    print(f"\nEl Grimorio ha sido alimentado. 🩸\n")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Smart Ingestor de V20.md → Supabase GameRule',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument('filepath',         help='Ruta al archivo v20.md')
    parser.add_argument('--dry-run',        action='store_true', help='Solo muestra, sin escribir')
    parser.add_argument('--verbose', '-v',  action='store_true', help='Log detallado')
    parser.add_argument('--verify',         action='store_true', help='Marcar como is_verified=True')
    parser.add_argument('--only',           choices=['todo', 'clanes', 'disciplinas'],
                        default='todo',     help='Qué procesar')
    parser.add_argument('--levels', '-l',   type=int, default=5, dest='max_levels',
                        help='Niveles máximos por disciplina (default: 5)')

    args = parser.parse_args()
    asyncio.run(main(
        args.filepath,
        args.dry_run,
        args.verbose,
        args.only,
        args.max_levels,
        args.verify,
    ))
