"""
models.py — Modelos ORM SQLAlchemy 2.0 para El Códice del Narrador.

Autor: 🧠 Arquitecto Backend
Versión: 0.1.0

Tablas:
    - users          → Usuarios (sincronizado con Supabase Auth)
    - chronicles     → Crónicas/Campañas de rol
    - game_sessions  → Sesiones individuales de juego
    - characters     → Personajes (PJs y PNJs) con ficha completa en JSONB
    - game_rules     → Fuente de verdad de reglas oficiales V20/W20/M20

Notas de diseño:
    - Todos los PKs son UUID v4 (compatible con Supabase).
    - JSONB se usa en `characters.stats` para soportar las tres líneas de juego
      sin romper el esquema con migraciones disruptivas.
    - `game_rules` es la ÚNICA fuente de verdad para reglas mecánicas.
      La IA RAG indexa esta tabla; nunca usa su memoria de entrenamiento.
    - Timestamps con timezone=True para consistencia global.
"""

from __future__ import annotations

import enum
from datetime import datetime
from typing import Any
from uuid import uuid4

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.database import Base


# ══════════════════════════════════════════════════════════════════
# ENUMS
# ══════════════════════════════════════════════════════════════════

class GameLine(str, enum.Enum):
    """
    Línea de juego soportada.
    Solo ediciones 20 Aniversario — NO 5ª Edición.
    """
    V20 = "V20"   # Vampiro: La Mascarada 20th Anniversary
    W20 = "W20"   # Hombre Lobo: El Apocalipsis 20th Anniversary
    M20 = "M20"   # Mago: La Ascensión 20th Anniversary


class CharacterType(str, enum.Enum):
    """Tipo de personaje en la crónica."""
    PC  = "PC"   # Personaje Jugador
    NPC = "NPC"  # Personaje No Jugador (generado por el Narrador / IA)


class RuleCategory(str, enum.Enum):
    """
    Categorías de reglas en el Grimorio.
    Cubre todas las mecánicas de V20, W20 y M20.
    """
    # ── Poderes ──────────────────
    DISCIPLINE  = "discipline"   # V20: Disciplinas
    GIFT        = "gift"         # W20: Dones
    SPHERE      = "sphere"       # M20: Esferas
    RITUAL      = "ritual"       # V20/M20: Rituales / Recetarios Mágicos
    RITE        = "rite"         # W20: Ritos
    # ── Identidad ─────────────────
    CLAN        = "clan"         # V20: Clanes (13)
    TRIBE       = "tribe"        # W20: Tribus (13)
    TRADITION   = "tradition"    # M20: Tradiciones (9)
    SECT        = "sect"         # V20: Sectas (Camarilla, Sabbat, etc.)
    AUSPICE     = "auspice"      # W20: Augurios (Luna)
    BREED       = "breed"        # W20: Razas (Homid, Metis, Lupus)
    # ── Rasgos ────────────────────
    MERIT       = "merit"        # Méritos
    FLAW        = "flaw"         # Defectos
    BACKGROUND  = "background"   # Trasfondos
    ABILITY     = "ability"      # Habilidades (Talentos, Destrezas, Conocimientos)
    ATTRIBUTE   = "attribute"    # Atributos (Físicos, Sociales, Mentales)
    VIRTUE      = "virtue"       # Virtudes
    # ── Sistema ───────────────────
    ROAD        = "road"         # V20: Caminos de Iluminación
    SYSTEM      = "system"       # Reglas de sistema general (dificultad, daño, etc.)
    COMBINATION = "combination"  # V20: Poderes combinados de Disciplinas


class ChronicleStatus(str, enum.Enum):
    """Estado operativo de una crónica."""
    ACTIVE    = "active"
    PAUSED    = "paused"
    COMPLETED = "completed"
    ARCHIVED  = "archived"


class SessionStatus(str, enum.Enum):
    """Estado de una sesión de juego."""
    PLANNED   = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


# ══════════════════════════════════════════════════════════════════
# MODELO: User
# ══════════════════════════════════════════════════════════════════

class User(Base):
    """
    Usuario de la plataforma.

    El ID es el mismo UUID que Supabase Auth asigna al usuario.
    NO almacenamos contraseñas aquí — la auth es responsabilidad de Supabase.
    Este registro extiende el perfil del usuario con datos del dominio.
    """
    __tablename__ = "users"

    # ── Primary Key (mismo UUID que auth.users en Supabase) ──
    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid4()),
        comment="UUID sincronizado con auth.users de Supabase",
    )

    # ── Identidad ──────────────────────────────────────────
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
        comment="Email del usuario (read-only, viene de Supabase Auth)",
    )
    display_name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        comment="Nombre visible en la plataforma",
    )
    avatar_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
        comment="URL del avatar (Supabase Storage)",
    )

    # ── Preferencias ───────────────────────────────────────
    preferred_game_line: Mapped[str | None] = mapped_column(
        Enum(GameLine, name="game_line_enum"),
        nullable=True,
        comment="Línea de juego favorita del narrador",
    )
    preferences: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        comment=(
            "Preferencias de UI y configuración del narrador. "
            "Estructura libre: { theme, sidebar_collapsed, default_difficulty, ... }"
        ),
    )

    # ── Control ────────────────────────────────────────────
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        comment="Cuenta activa. False = suspendida.",
    )

    # ── Timestamps ─────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # ── Relaciones ─────────────────────────────────────────
    chronicles: Mapped[list["Chronicle"]] = relationship(
        back_populates="owner",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<User id={self.id!r} email={self.email!r}>"


# ══════════════════════════════════════════════════════════════════
# MODELO: Chronicle
# ══════════════════════════════════════════════════════════════════

class Chronicle(Base):
    """
    Crónica — la campaña de rol gestionada por el Narrador.

    Una crónica agrupa sesiones, personajes, tramas y la línea temporal.
    Es el contenedor raíz del contenido de cada narrador.
    """
    __tablename__ = "chronicles"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid4()),
    )

    # ── Propiedad ──────────────────────────────────────────
    owner_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Narrador propietario de la crónica",
    )

    # ── Identidad ──────────────────────────────────────────
    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        comment="Título de la crónica",
    )
    tagline: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
        comment="Subtítulo o frase evocadora de la crónica",
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Sinopsis extendida de la crónica",
    )
    cover_image_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
        comment="URL de la imagen de portada (Supabase Storage)",
    )

    # ── Configuración de Juego ─────────────────────────────
    game_line: Mapped[str] = mapped_column(
        Enum(GameLine, name="game_line_enum"),
        nullable=False,
        comment="Línea de juego: V20, W20 o M20",
    )
    setting: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        comment=(
            "Configuración del mundo de la crónica. Ejemplos: "
            "{ city, year, sect_in_power, primary_clan, mood_tags[], house_rules[] }"
        ),
    )

    # ── Estado y Progreso ──────────────────────────────────
    status: Mapped[str] = mapped_column(
        Enum(ChronicleStatus, name="chronicle_status_enum"),
        nullable=False,
        default=ChronicleStatus.ACTIVE,
    )
    session_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        comment="Contador desnormalizado de sesiones jugadas",
    )

    # ── Timestamps ─────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    last_played_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp de la última sesión jugada",
    )

    # ── Relaciones ─────────────────────────────────────────
    owner: Mapped["User"] = relationship(back_populates="chronicles")
    sessions: Mapped[list["GameSession"]] = relationship(
        back_populates="chronicle",
        cascade="all, delete-orphan",
        order_by="GameSession.session_number",
        lazy="select",
    )
    characters: Mapped[list["Character"]] = relationship(
        back_populates="chronicle",
        cascade="all, delete-orphan",
        lazy="select",
    )

    # ── Índices ────────────────────────────────────────────
    __table_args__ = (
        Index("ix_chronicles_owner_status", "owner_id", "status"),
    )

    def __repr__(self) -> str:
        return f"<Chronicle id={self.id!r} title={self.title!r} game_line={self.game_line!r}>"


# ══════════════════════════════════════════════════════════════════
# MODELO: GameSession
# ══════════════════════════════════════════════════════════════════

class GameSession(Base):
    """
    Sesión de juego individual dentro de una Crónica.

    Registra el número de sesión, la narrativa de lo ocurrido,
    y la transcripción procesada por la IA para extraer eventos mecánicos.
    """
    __tablename__ = "game_sessions"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid4()),
    )

    # ── FK ─────────────────────────────────────────────────
    chronicle_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("chronicles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Identificación ─────────────────────────────────────
    session_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="Número secuencial de la sesión dentro de la crónica",
    )
    title: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
        comment="Título narrativo de la sesión (ej: 'La Noche del Primer Abrazo')",
    )

    # ── Contenido ──────────────────────────────────────────
    narrator_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Texto libre escrito por el Narrador durante/post sesión (Bitácora)",
    )
    ai_summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Resumen generado por la IA a partir de las notas del Narrador",
    )
    extracted_events: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        comment=(
            "Entidades y eventos mecánicos extraídos por la IA de las notas. "
            "Estructura: { npcs_mentioned[], disciplines_used[], plots_advanced[], "
            "experience_awarded, key_decisions[], timeline_events[] }"
        ),
    )

    # ── Estado ─────────────────────────────────────────────
    status: Mapped[str] = mapped_column(
        Enum(SessionStatus, name="session_status_enum"),
        nullable=False,
        default=SessionStatus.PLANNED,
    )
    played_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Fecha y hora real en que se jugó la sesión",
    )

    # ── Timestamps ─────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # ── Relaciones ─────────────────────────────────────────
    chronicle: Mapped["Chronicle"] = relationship(back_populates="sessions")

    # ── Constraints e Índices ──────────────────────────────
    __table_args__ = (
        UniqueConstraint("chronicle_id", "session_number", name="uq_session_number_per_chronicle"),
        Index("ix_sessions_chronicle_played", "chronicle_id", "played_at"),
    )

    def __repr__(self) -> str:
        return f"<GameSession chronicle={self.chronicle_id!r} #{self.session_number} status={self.status!r}>"


# ══════════════════════════════════════════════════════════════════
# MODELO: Character
# ══════════════════════════════════════════════════════════════════

class Character(Base):
    """
    Personaje — PJ (Jugador) o PNJ (No Jugador / generado por IA).

    La ficha completa se almacena en el campo JSONB `stats`.
    Esto permite soportar las tres líneas (V20/W20/M20) con una sola tabla,
    ya que cada línea tiene mecánicas divergentes (Disciplinas, Dones, Esferas).

    Estructura JSONB `stats` documentada abajo.
    """
    __tablename__ = "characters"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid4()),
    )

    # ── FK ─────────────────────────────────────────────────
    chronicle_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("chronicles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Identidad ──────────────────────────────────────────
    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        comment="Nombre del personaje",
    )
    player_name: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
        comment="Nombre del jugador (solo para PCs)",
    )
    character_type: Mapped[str] = mapped_column(
        Enum(CharacterType, name="character_type_enum"),
        nullable=False,
        default=CharacterType.NPC,
    )
    game_line: Mapped[str] = mapped_column(
        Enum(GameLine, name="game_line_enum"),
        nullable=False,
        comment="V20 (Vampiro), W20 (Hombre Lobo) o M20 (Mago)",
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        comment="False = personaje muerto, retirado o archivado",
    )

    # ── Ficha Completa (JSONB Elástico) ───────────────────
    stats: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        comment="""
        ESTRUCTURA JSONB stats — Ficha completa del personaje.
        Validada por Pydantic antes de persistir.

        ┌─ SECCIÓN COMÚN (V20 + W20 + M20) ──────────────────────────────┐
        │ attributes: {                                                    │
        │   physical: { strength, dexterity, stamina },                   │
        │   social:   { charisma, manipulation, appearance },             │
        │   mental:   { perception, intelligence, wits }                  │
        │ }                                                                │
        │ abilities: {                                                     │
        │   talents:     { alertness, athletics, brawl, dodge, empathy,   │
        │                  expression, intimidation, leadership,           │
        │                  streetwise, subterfuge },                       │
        │   skills:      { animal_ken, crafts, drive, etiquette, firearms,│
        │                  melee, performance, security, stealth,          │
        │                  survival },                                     │
        │   knowledges:  { academics, computer, finance, investigation,   │
        │                  law, linguistics, medicine, occult,             │
        │                  politics, science }                             │
        │ }                                                                │
        │ backgrounds:   { allies, contacts, fame, generation, haven,     │
        │                  herd, influence, mentor, resources, retainers } │
        │ merits_flaws:  [{ name, category, points, description }]        │
        │ virtues: {                                                       │
        │   conscience_conviction: int (1-5),                             │
        │   self_control_instinct: int (1-5),                             │
        │   courage: int (1-5)                                            │
        │ }                                                                │
        │ willpower:   { current: int, max: int }                         │
        │ health:      { levels: [...], current_damage: [...] }           │
        │ experience:  { total: int, spent: int, log: [...] }             │
        │ notes:       { appearance, biography, personality, goals }      │
        │ portrait_url: str | null                                         │
        │                                                                  │
        ├─ SECCIÓN V20 (Vampiro) ─────────────────────────────────────────┤
        │ clan:        str (ej: "Brujah", "Ventrue", "Nosferatu"...)      │
        │ sect:        str (ej: "Camarilla", "Sabbat", "Anarca"...)       │
        │ generation:  int (4-15)                                          │
        │ blood_pool:  { current: int, max: int }                         │
        │ road:        { name: str, rating: int }  ← Camino de Iluminación│
        │ disciplines: [{ name: str, level: int, description: str }]      │
        │ combination_powers: [{ name, requirements, description }]       │
        │ humanity_or_path: int (1-10)                                    │
        │                                                                  │
        ├─ SECCIÓN W20 (Hombre Lobo) ─────────────────────────────────────┤
        │ tribe:       str (ej: "Garras de Plata", "Fianna"...)            │
        │ auspice:     str (ej: "Ragabash", "Theurge", "Ahroun"...)       │
        │ breed:       str (ej: "Homid", "Metis", "Lupus")                │
        │ rank:        int (0-5)  ← Rango Garou                            │
        │ gnosis:      { current: int, max: int }                         │
        │ rage:        { current: int, max: int }                         │
        │ glory_honor_wisdom: { glory: int, honor: int, wisdom: int }     │
        │ gifts:       [{ name: str, rank: int, tribe: str, ... }]        │
        │ rites:       [{ name: str, level: int, description: str }]      │
        │ forms:       { homid, glabro, crinos, hispo, lupus }            │
        │                                                                  │
        └─ SECCIÓN M20 (Mago) ────────────────────────────────────────────┘
          tradition:   str (ej: "Verbena", "Hermética", "Virtual Adept"...)│
          essence_type:str (ej: "Dynamic", "Pattern", "Primordial"...)    │
          arete:       int (1-10)                                          │
          quintessence:{ current: int, max: int }                         │
          paradox:     { current: int, permanent: int }                   │
          spheres:     { correspondence, entropy, forces, life, matter,   │
                         mind, prime, spirit, time }  ← cada uno int 0-5 │
          foci:        [{ sphere: str, focus_item: str, description: str }]│
          resonance:   [{ type: str, rating: int }]                       │
        """,
    )

    # ── Timestamps ─────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # ── Relaciones ─────────────────────────────────────────
    chronicle: Mapped["Chronicle"] = relationship(back_populates="characters")

    # ── Índices ────────────────────────────────────────────
    __table_args__ = (
        # Búsqueda rápida de personajes por crónica y tipo
        Index("ix_characters_chronicle_type", "chronicle_id", "character_type"),
        # Índice GIN sobre JSONB stats para búsquedas por contenido
        # (ej: todos los Brujah de una crónica)
        Index(
            "ix_characters_stats_gin",
            "stats",
            postgresql_using="gin",
        ),
    )

    def __repr__(self) -> str:
        return (
            f"<Character id={self.id!r} name={self.name!r} "
            f"type={self.character_type!r} game_line={self.game_line!r}>"
        )


# ══════════════════════════════════════════════════════════════════
# MODELO: GameRule
# ══════════════════════════════════════════════════════════════════

class GameRule(Base):
    """
    Regla de Juego — La ÚNICA fuente de verdad para mecánicas oficiales.

    Esta tabla es el "Grimorio" estructurado de la plataforma.
    La IA RAG indexa estos registros en ChromaDB; NUNCA responde
    preguntas de reglas desde su memoria de entrenamiento.

    Cada registro representa una regla atómica: una Disciplina en un nivel,
    un Don, una Esfera, un Mérito, una regla de sistema, etc.
    """
    __tablename__ = "game_rules"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid4()),
    )

    # ── Clasificación ──────────────────────────────────────
    game_line: Mapped[str] = mapped_column(
        Enum(GameLine, name="game_line_enum"),
        nullable=False,
        index=True,
        comment="Línea de juego a la que pertenece esta regla",
    )
    category: Mapped[str] = mapped_column(
        Enum(RuleCategory, name="rule_category_enum"),
        nullable=False,
        index=True,
        comment="Categoría de la regla (discipline, gift, sphere, merit, etc.)",
    )

    # ── Identificación ─────────────────────────────────────
    name: Mapped[str] = mapped_column(
        String(300),
        nullable=False,
        comment="Nombre oficial de la regla en español",
    )
    name_en: Mapped[str | None] = mapped_column(
        String(300),
        nullable=True,
        comment="Nombre en inglés (para búsquedas cruzadas)",
    )
    level: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        comment="Nivel de la regla si aplica (Disciplina nv1-5, Esfera nv1-5, etc.)",
    )
    parent_name: Mapped[str | None] = mapped_column(
        String(300),
        nullable=True,
        index=True,
        comment=(
            "Nombre del poder/grupo padre. "
            "Ej: para 'Dominación Nv3', parent_name='Dominación'. "
            "Permite agrupar todos los niveles de una Disciplina."
        ),
    )

    # ── Agrupación / Origen ────────────────────────────────
    group_affinity: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
        comment=(
            "Clan, Tribu o Tradición que posee este poder de forma nativa. "
            "Ej: 'Brujah' para Potencia, 'Fianna' para un Don de Fianna."
        ),
    )

    # ── Contenido de la Regla ──────────────────────────────
    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Descripción narrativa/temática de la regla (texto completo del libro)",
    )
    mechanical_effect: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment=(
            "Efecto mecánico preciso de la regla. "
            "Ej: 'Lanzamiento: Fuerza + Atletismo, dificultad 6. "
            "Éxito: +1 punto de Fuerza durante la escena.'"
        ),
    )
    system_text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Texto exacto de la sección 'Sistema:' del libro, si existe",
    )

    # ── Costos y Requisitos ────────────────────────────────
    cost: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        comment=(
            "Costos de activación. "
            "Ej: { blood_points: 1, willpower: 0, gnosis: 0, quintessence: 0, action: 'reflexive' }"
        ),
    )
    prerequisites: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        comment=(
            "Requisitos para aprender/usar la regla. "
            "Ej: { disciplines: ['Dominar 2', 'Presencia 1'], attributes: {manipulation: 3}, "
            "      experience_cost: 10 }"
        ),
    )
    duration: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
        comment="Duración del efecto (ej: 'Una escena', 'Permanente', 'Un turno por éxito')",
    )

    # ── Tags para búsqueda semántica ───────────────────────
    tags: Mapped[list[str]] = mapped_column(
        JSONB,
        nullable=False,
        default=list,
        comment=(
            "Tags para búsqueda y filtrado. "
            "Ej: ['combate', 'mental', 'no-resistible', 'out-of-clan']"
        ),
    )

    # ── Fuente bibliográfica ───────────────────────────────
    source_book: Mapped[str | None] = mapped_column(
        String(300),
        nullable=True,
        comment="Nombre del libro fuente (ej: 'Vampiro: La Mascarada 20th Anniversary Edition')",
    )
    source_page: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        comment="Número de página en el libro fuente",
    )

    # ── Contenido RAG ──────────────────────────────────────
    embedding_text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment=(
            "Texto concatenado y optimizado para generar el embedding vectorial en ChromaDB. "
            "Se genera automáticamente al insertar/actualizar la regla. "
            "Formato: '[CATEGORIA] [LINEA] Nombre: descripcion + mechanical_effect'"
        ),
    )
    chroma_id: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        unique=True,
        comment="ID del documento correspondiente en ChromaDB",
    )

    # ── Control ────────────────────────────────────────────
    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        comment="True = revisado por un humano contra el libro oficial",
    )

    # ── Timestamps ─────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # ── Índices y Constraints ──────────────────────────────
    __table_args__ = (
        # Unicidad: no puede haber dos registros del mismo poder al mismo nivel
        UniqueConstraint(
            "game_line", "category", "name", "level",
            name="uq_rule_identity",
        ),
        # Búsqueda compuesta más común: "dame todas las Disciplinas de V20"
        Index("ix_rules_line_category", "game_line", "category"),
        # Búsqueda por grupo padre: "dame todos los niveles de Dominar"
        Index("ix_rules_parent_name", "parent_name"),
        # Índice GIN sobre tags JSONB para búsquedas por etiqueta
        Index(
            "ix_rules_tags_gin",
            "tags",
            postgresql_using="gin",
        ),
    )

    def __repr__(self) -> str:
        level_str = f" Nv{self.level}" if self.level else ""
        return (
            f"<GameRule [{self.game_line}] [{self.category}] "
            f"{self.name!r}{level_str}>"
        )
