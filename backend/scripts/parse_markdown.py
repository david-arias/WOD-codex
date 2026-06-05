#!/usr/bin/env python3
"""
backend/scripts/parse_markdown.py — Parser de Libros de Rol en Markdown.

Transforma archivos .md con secciones en formato Front Matter YAML en registros
de GameRule en Supabase, haciendo upsert (insertar o actualizar) por game_line + slug.

Uso:
    # Desde la raíz del proyecto (WOD Codex/)
    source backend/.venv/bin/activate
    python -m backend.scripts.parse_markdown backend/data/v20_disciplinas.md
    python -m backend.scripts.parse_markdown backend/data/m20_esferas.md --dry-run

Flags:
    --dry-run   Solo muestra las reglas que procesaría, sin escribir en DB
    --verify    Marca las reglas creadas/actualizadas como is_verified=True
    --verbose   Imprime el detalle completo de cada regla procesada

Formato esperado del .md (ver ejemplo en backend/data/ejemplo_regla.md):
    Cada entrada en el archivo debe empezar con un bloque YAML entre ---
    seguido del cuerpo en Markdown. Las entradas se separan con una línea ---

Campos YAML obligatorios:
    game_line   → v20 | w20 | m20
    category    → discipline | gift | sphere | clan | tribe | tradition |
                  sect | merit | flaw | background | rite | ritual | virtue | path | rank | other
    name        → Nombre en español
    slug        → URL slug (ej: celeridad, camino-de-la-humanidad)

Campos YAML opcionales:
    name_en         → Nombre en inglés
    level           → int (1-10)
    parent_name     → Nombre del grupo padre (ej: Dominación para Dominación Nv3)
    group_affinity  → Clan/Tribu/Tradición asociada
    duration        → Duración del efecto
    source_book     → Título del libro
    source_page     → int
    tags            → lista separada por comas (ej: combate, mental, reflexivo)

Estructura del cuerpo Markdown (secciones reconocidas):
    # Nombre — Nivel N          → usado como título (ignorado, se usa el nombre del front matter)
    Párrafos normales           → van a `description`
    **Sistema:**                → todo lo que sigue va a `mechanical_effect`
    **Efecto Mecánico:**        → alternativa a Sistema
    ## Sistema                  → alternativa
    **Costo:** / **Duración:**  → van a cost / duration
    > Cita textual              → va al final de description como contexto
"""

from __future__ import annotations

import argparse
import asyncio
import re
import sys
import unicodedata
from pathlib import Path
from typing import Any

# ─── Ajustar PYTHONPATH para imports relativos ────────────────────
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from backend.core.config import settings
from backend.models import GameLine, GameRule, RuleCategory


# ─────────────────────────────────────────────────────────────────
# Utilidades
# ─────────────────────────────────────────────────────────────────

def slugify(text: str) -> str:
    """
    Genera un URL slug desde un nombre en español.
    Ej: 'Celeridad'              → 'celeridad'
        'Camino de la Humanidad' → 'camino-de-la-humanidad'
        'Areté'                  → 'arete'
    """
    text = unicodedata.normalize('NFKD', text)
    text = text.encode('ascii', 'ignore').decode('ascii')
    text = re.sub(r'[^\w\s-]', '', text.lower())
    return re.sub(r'[-\s]+', '-', text).strip('-')


def _parse_yaml_value(value: str) -> Any:
    """Convierte un valor de YAML inline a Python (int, bool, list, str)."""
    value = value.strip()
    if not value:
        return None
    if value.isdigit():
        return int(value)
    if value.lower() in ('true', 'yes'):
        return True
    if value.lower() in ('false', 'no'):
        return False
    if ',' in value:
        return [v.strip() for v in value.split(',') if v.strip()]
    return value


def parse_front_matter(block: str) -> dict[str, Any]:
    """
    Parsea el YAML front matter de una sección.
    No usa PyYAML para no añadir dependencias al script.
    """
    meta: dict[str, Any] = {}
    for line in block.strip().splitlines():
        if ':' not in line:
            continue
        key, _, value = line.partition(':')
        key = key.strip().lower().replace('-', '_')
        meta[key] = _parse_yaml_value(value)
    return meta


def extract_sections(content: str) -> list[dict[str, str]]:
    """
    Extrae secciones del Markdown. Cada sección comienza con --- y termina
    con otra --- o con el fin del archivo.

    Retorna lista de dicts {'front_matter': str, 'body': str}
    """
    sections = []
    # Divide por bloques --- ... ---
    # Cada entrada tiene: --- YAML --- BODY
    parts = re.split(r'^---\s*$', content, flags=re.MULTILINE)

    # parts[0] es texto antes del primer --- (normalmente vacío o un título de archivo)
    # parts[1], parts[3], parts[5]... son bloques YAML
    # parts[2], parts[4], parts[6]... son los cuerpos Markdown

    i = 1
    while i < len(parts) - 1:
        fm_block = parts[i].strip()
        body     = parts[i + 1].strip() if (i + 1) < len(parts) else ''
        if fm_block:
            sections.append({'front_matter': fm_block, 'body': body})
        i += 2

    return sections


def parse_body(body: str) -> dict[str, str]:
    """
    Extrae description, mechanical_effect y system_text del cuerpo Markdown.

    Lógica:
      - Párrafos antes de '**Sistema:**', '**Efecto:**' o '## Sistema' → description
      - Párrafos después de esos marcadores → mechanical_effect
      - Todo el body también se guarda en system_text (texto completo para RAG)
    """
    system_markers = re.compile(
        r'^(\*\*Sistema[:\s]|\*\*Efecto Mecánico[:\s]|## Sistema|## Mecánica)',
        re.IGNORECASE | re.MULTILINE,
    )

    match = system_markers.search(body)
    if match:
        description_raw     = body[:match.start()].strip()
        mechanical_raw      = body[match.end():].strip()
    else:
        description_raw     = body.strip()
        mechanical_raw      = ''

    # Limpiar Markdown básico para texto plano (descripción narrativa)
    def md_to_plain(text: str) -> str:
        text = re.sub(r'^#{1,4}\s+', '', text, flags=re.MULTILINE)  # headings
        text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)                 # bold
        text = re.sub(r'\*(.*?)\*', r'\1', text)                      # italic
        text = re.sub(r'^\s*>\s*', '', text, flags=re.MULTILINE)      # blockquote
        return re.sub(r'\n{3,}', '\n\n', text).strip()

    return {
        'description':       md_to_plain(description_raw) or 'Sin descripción.',
        'mechanical_effect': md_to_plain(mechanical_raw)  or 'Ver system_text.',
        'system_text':       body,  # texto completo en Markdown para RAG
    }


def build_embedding_text(rule_data: dict[str, Any]) -> str:
    """Genera el texto optimizado para embedding vectorial."""
    level_str    = f" Nivel {rule_data['level']}" if rule_data.get('level') else ''
    affinity_str = f" [{rule_data['group_affinity']}]" if rule_data.get('group_affinity') else ''
    category_up  = str(rule_data.get('category', '')).upper()
    game_line_up = str(rule_data.get('game_line', '')).upper()
    return (
        f"[{category_up}] [{game_line_up}]{affinity_str} "
        f"{rule_data['name']}{level_str}: "
        f"{rule_data['description']} "
        f"| Sistema: {rule_data['mechanical_effect']}"
    ).strip()


# ─────────────────────────────────────────────────────────────────
# Mapeo de categorías (front matter → RuleCategory enum)
# ─────────────────────────────────────────────────────────────────
CATEGORY_MAP: dict[str, str] = {
    # V20
    'discipline':       'discipline',
    'disciplina':       'discipline',
    'disciplinas':      'discipline',
    'clan':             'clan',
    'clanes':           'clan',
    'sect':             'sect',
    'secta':            'sect',
    'sectas':           'sect',
    'ritual':           'ritual',
    'rituales':         'ritual',
    'virtue':           'virtue',
    'virtud':           'virtue',
    'path':             'path',
    'camino':           'path',
    'background':       'background',
    'trasfondo':        'background',
    # W20
    'gift':             'gift',
    'don':              'gift',
    'dones':            'gift',
    'tribe':            'tribe',
    'tribu':            'tribe',
    'tribus':           'tribe',
    'rite':             'rite',
    'rito':             'rite',
    'ritos':            'rite',
    'rank':             'rank',
    'rango':            'rank',
    # M20
    'sphere':           'sphere',
    'esfera':           'sphere',
    'esferas':          'sphere',
    'tradition':        'tradition',
    'tradicion':        'tradition',
    'tradición':        'tradition',
    'paradigm':         'paradigm',
    'paradigma':        'paradigm',
    # Genéricos
    'merit':            'merit',
    'merito':           'merit',
    'mérito':           'merit',
    'flaw':             'flaw',
    'defecto':          'flaw',
    'other':            'other',
    'otro':             'other',
}

GAME_LINE_MAP: dict[str, str] = {
    'v20': 'V20',
    'w20': 'W20',
    'm20': 'M20',
}


# ─────────────────────────────────────────────────────────────────
# Procesador principal de sección
# ─────────────────────────────────────────────────────────────────
def process_section(front_matter: str, body: str) -> dict[str, Any] | None:
    """
    Convierte una sección (front matter + body) en un dict de datos para GameRule.
    Retorna None si la sección no tiene los campos obligatorios.
    """
    meta = parse_front_matter(front_matter)

    # Validar campos obligatorios
    required = ['game_line', 'category', 'name', 'slug']
    missing  = [f for f in required if not meta.get(f)]
    if missing:
        print(f"  ⚠️  Sección '{meta.get('name', '??')}' ignorada — faltan campos: {missing}")
        return None

    # Normalizar game_line
    game_line_raw = str(meta['game_line']).lower()
    game_line     = GAME_LINE_MAP.get(game_line_raw)
    if not game_line:
        print(f"  ⚠️  game_line '{meta['game_line']}' no reconocido. Use: v20, w20, m20")
        return None

    # Normalizar category
    category_raw = str(meta['category']).lower().strip()
    category     = CATEGORY_MAP.get(category_raw)
    if not category:
        print(f"  ⚠️  category '{meta['category']}' no reconocida. Ver CATEGORY_MAP en el script.")
        return None

    # Parsear cuerpo
    body_data = parse_body(body)

    # Construir datos del registro
    slug  = str(meta['slug']).lower().strip()
    level = int(meta['level']) if meta.get('level') and str(meta['level']).isdigit() else None

    # Tags: lista o string separado por comas
    tags_raw = meta.get('tags', [])
    if isinstance(tags_raw, str):
        tags = [t.strip().lower() for t in tags_raw.split(',') if t.strip()]
    elif isinstance(tags_raw, list):
        tags = [str(t).strip().lower() for t in tags_raw if str(t).strip()]
    else:
        tags = []

    return {
        'game_line':        game_line,
        'category':         category,
        'name':             str(meta['name']).strip(),
        'name_en':          str(meta['name_en']).strip() if meta.get('name_en') else None,
        'slug':             slug,
        'level':            level,
        'parent_name':      str(meta['parent_name']).strip() if meta.get('parent_name') else None,
        'group_affinity':   str(meta['group_affinity']).strip() if meta.get('group_affinity') else None,
        'description':      body_data['description'],
        'mechanical_effect': body_data['mechanical_effect'],
        'system_text':      body_data['system_text'],
        'duration':         str(meta['duration']).strip() if meta.get('duration') else None,
        'source_book':      str(meta['source_book']).strip() if meta.get('source_book') else None,
        'source_page':      int(meta['source_page']) if meta.get('source_page') else None,
        'tags':             tags,
        'cost':             {'action_type': 'standard'},
        'prerequisites':    {'disciplines': [], 'gifts': [], 'spheres': [], 'attributes': {}, 'abilities': {}, 'other': [], 'experience_cost': 0},
    }


# ─────────────────────────────────────────────────────────────────
# Upsert en base de datos
# ─────────────────────────────────────────────────────────────────
async def upsert_rule(
    session: AsyncSession,
    data: dict[str, Any],
    verify: bool = False,
    verbose: bool = False,
) -> tuple[str, str]:
    """
    Inserta o actualiza una GameRule en la DB.
    Clave de upsert: (game_line, slug).
    Retorna ('created'|'updated', rule.name).
    """
    result = await session.execute(
        select(GameRule).where(
            GameRule.game_line == data['game_line'],
            GameRule.slug      == data['slug'],
        )
    )
    rule = result.scalar_one_or_none()

    if rule is None:
        rule = GameRule(
            game_line        = data['game_line'],
            category         = data['category'],
            name             = data['name'],
            name_en          = data['name_en'],
            slug             = data['slug'],
            level            = data['level'],
            parent_name      = data['parent_name'],
            group_affinity   = data['group_affinity'],
            description      = data['description'],
            mechanical_effect = data['mechanical_effect'],
            system_text      = data['system_text'],
            duration         = data['duration'],
            source_book      = data['source_book'],
            source_page      = data['source_page'],
            tags             = data['tags'],
            cost             = data['cost'],
            prerequisites    = data['prerequisites'],
            is_verified      = verify,
        )
        rule.embedding_text = build_embedding_text(data)
        session.add(rule)
        action = 'created'
    else:
        # Actualizar campos de contenido
        for field in ('name', 'name_en', 'category', 'level', 'parent_name',
                      'group_affinity', 'description', 'mechanical_effect',
                      'system_text', 'duration', 'source_book', 'source_page',
                      'tags', 'cost', 'prerequisites'):
            setattr(rule, field, data[field])
        rule.embedding_text = build_embedding_text(data)
        rule.chroma_id      = None  # invalidar embedding anterior
        if verify:
            rule.is_verified = True
        action = 'updated'

    if verbose:
        lvl = f" Nv{data['level']}" if data['level'] else ''
        print(f"    [{action.upper()}] {data['game_line']} / {data['category']} / {data['name']}{lvl}  (slug: {data['slug']})")

    return action, rule.name


# ─────────────────────────────────────────────────────────────────
# Punto de entrada
# ─────────────────────────────────────────────────────────────────
async def main(filepath: str, dry_run: bool, verify: bool, verbose: bool) -> None:
    path = Path(filepath)
    if not path.exists():
        print(f"❌ Archivo no encontrado: {filepath}")
        sys.exit(1)

    content  = path.read_text(encoding='utf-8')
    sections = extract_sections(content)

    if not sections:
        print(f"⚠️  No se encontraron secciones con front matter en {path.name}")
        print("    Asegúrate de que cada entrada empiece con --- y termine con ---")
        sys.exit(1)

    print(f"\n📜 El Códice — Parser de Markdown")
    print(f"   Archivo  : {path.name}")
    print(f"   Secciones: {len(sections)}")
    print(f"   Modo     : {'DRY RUN (sin escritura)' if dry_run else 'ESCRITURA en DB'}")
    print(f"   Verificar: {verify}\n")

    # Parsear todas las secciones
    records = []
    for i, sec in enumerate(sections, 1):
        data = process_section(sec['front_matter'], sec['body'])
        if data:
            records.append(data)
        else:
            print(f"  ❌ Sección {i} ignorada.")

    print(f"\n✅ {len(records)} reglas válidas de {len(sections)} secciones procesadas.")

    if dry_run:
        print("\n[DRY RUN] Reglas que se escribirían:")
        for r in records:
            lvl = f" Nv{r['level']}" if r['level'] else ''
            print(f"  • [{r['game_line']}] {r['name']}{lvl}  →  /{r['slug']}")
        print("\nEjecuta sin --dry-run para escribir en la DB.")
        return

    # Conectar a la DB y hacer upsert
    engine = create_async_engine(settings.DATABASE_URL, poolclass=NullPool, echo=False)
    AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    created_count = 0
    updated_count = 0
    errors        = 0

    async with AsyncSessionLocal() as session:
        for data in records:
            try:
                action, name = await upsert_rule(session, data, verify=verify, verbose=verbose)
                if action == 'created':
                    created_count += 1
                else:
                    updated_count += 1
            except Exception as e:
                print(f"  ❌ Error en '{data['name']}': {e}")
                errors += 1
        await session.commit()

    await engine.dispose()

    print(f"\n{'─'*50}")
    print(f"  ✅ Creadas : {created_count}")
    print(f"  🔄 Actualizadas: {updated_count}")
    if errors:
        print(f"  ❌ Errores : {errors}")
    print(f"{'─'*50}\n")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Parser de Markdown → GameRule en Supabase',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument('filepath',          help='Ruta al archivo .md a procesar')
    parser.add_argument('--dry-run',         action='store_true', help='Solo muestra qué procesaría, sin escribir')
    parser.add_argument('--verify',          action='store_true', help='Marca reglas como is_verified=True')
    parser.add_argument('--verbose', '-v',   action='store_true', help='Muestra detalle de cada regla')

    args = parser.parse_args()
    asyncio.run(main(args.filepath, args.dry_run, args.verify, args.verbose))
