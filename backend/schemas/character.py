"""
backend/schemas/character.py — Schemas Pydantic v2 para Personajes.

El campo `stats` es el JSONB elástico que contiene la ficha completa.
Validamos su estructura con schemas anidados específicos por línea de juego,
pero el campo acepta `dict[str, Any]` para máxima flexibilidad.

Schemas de stats (anidados, opcionales):
    AttributeGroup   → Bloque de 3 atributos con valor 1-5
    Attributes       → Físicos, Sociales, Mentales
    Abilities        → Talentos, Destrezas, Conocimientos (30 habilidades)
    StatsV20         → Ficha completa Vampiro 20
    StatsW20         → Ficha completa Hombre Lobo 20
    StatsM20         → Ficha completa Mago 20
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import Field, field_validator, model_validator

from backend.models import CharacterType, GameLine
from backend.schemas.common import AppBaseModel, PaginatedResponse, UUIDStr


# ═══════════════════════════════════════════════════════════════
# Sub-schemas de Stats — bloques reutilizables por las 3 líneas
# ═══════════════════════════════════════════════════════════════

class AttributeStat(AppBaseModel):
    """Un único atributo con valor 1-5."""
    value: int = Field(ge=1, le=5, default=1)


class PhysicalAttributes(AppBaseModel):
    strength:   int = Field(ge=1, le=5, default=1, description="Fuerza")
    dexterity:  int = Field(ge=1, le=5, default=1, description="Destreza")
    stamina:    int = Field(ge=1, le=5, default=1, description="Resistencia")


class SocialAttributes(AppBaseModel):
    charisma:     int = Field(ge=1, le=5, default=1, description="Carisma")
    manipulation: int = Field(ge=1, le=5, default=1, description="Manipulación")
    appearance:   int = Field(ge=1, le=5, default=1, description="Apariencia")


class MentalAttributes(AppBaseModel):
    perception:   int = Field(ge=1, le=5, default=1, description="Percepción")
    intelligence: int = Field(ge=1, le=5, default=1, description="Inteligencia")
    wits:         int = Field(ge=1, le=5, default=1, description="Astucia")


class Attributes(AppBaseModel):
    physical: PhysicalAttributes = Field(default_factory=PhysicalAttributes)
    social:   SocialAttributes   = Field(default_factory=SocialAttributes)
    mental:   MentalAttributes   = Field(default_factory=MentalAttributes)


class Talents(AppBaseModel):
    """10 Talentos — Habilidades innatas (V20/W20/M20)."""
    alertness:    int = Field(ge=0, le=5, default=0, description="Alerta")
    athletics:    int = Field(ge=0, le=5, default=0, description="Atletismo")
    brawl:        int = Field(ge=0, le=5, default=0, description="Pelea")
    dodge:        int = Field(ge=0, le=5, default=0, description="Esquiva")
    empathy:      int = Field(ge=0, le=5, default=0, description="Empatía")
    expression:   int = Field(ge=0, le=5, default=0, description="Expresión")
    intimidation: int = Field(ge=0, le=5, default=0, description="Intimidación")
    leadership:   int = Field(ge=0, le=5, default=0, description="Liderazgo")
    streetwise:   int = Field(ge=0, le=5, default=0, description="Callejeo")
    subterfuge:   int = Field(ge=0, le=5, default=0, description="Subterfugio")


class Skills(AppBaseModel):
    """10 Destrezas — Habilidades aprendidas (V20/W20/M20)."""
    animal_ken:  int = Field(ge=0, le=5, default=0, description="Trato con animales")
    crafts:      int = Field(ge=0, le=5, default=0, description="Artesanía")
    drive:       int = Field(ge=0, le=5, default=0, description="Conducción")
    etiquette:   int = Field(ge=0, le=5, default=0, description="Etiqueta")
    firearms:    int = Field(ge=0, le=5, default=0, description="Armas de fuego")
    melee:       int = Field(ge=0, le=5, default=0, description="Armas blancas")
    performance: int = Field(ge=0, le=5, default=0, description="Interpretación")
    security:    int = Field(ge=0, le=5, default=0, description="Seguridad")
    stealth:     int = Field(ge=0, le=5, default=0, description="Sigilo")
    survival:    int = Field(ge=0, le=5, default=0, description="Supervivencia")


class Knowledges(AppBaseModel):
    """10 Conocimientos — Habilidades académicas (V20/W20/M20)."""
    academics:     int = Field(ge=0, le=5, default=0, description="Académicos")
    computer:      int = Field(ge=0, le=5, default=0, description="Informática")
    finance:       int = Field(ge=0, le=5, default=0, description="Finanzas")
    investigation: int = Field(ge=0, le=5, default=0, description="Investigación")
    law:           int = Field(ge=0, le=5, default=0, description="Leyes")
    linguistics:   int = Field(ge=0, le=5, default=0, description="Lingüística")
    medicine:      int = Field(ge=0, le=5, default=0, description="Medicina")
    occult:        int = Field(ge=0, le=5, default=0, description="Ocultismo")
    politics:      int = Field(ge=0, le=5, default=0, description="Política")
    science:       int = Field(ge=0, le=5, default=0, description="Ciencia")


class Abilities(AppBaseModel):
    talents:    Talents    = Field(default_factory=Talents)
    skills:     Skills     = Field(default_factory=Skills)
    knowledges: Knowledges = Field(default_factory=Knowledges)


class Pool(AppBaseModel):
    """Pool de recurso con valor actual y máximo."""
    current: int = Field(ge=0, default=0)
    maximum: int = Field(ge=0, default=0)

    @model_validator(mode="after")
    def current_le_maximum(self) -> "Pool":
        if self.current > self.maximum:
            raise ValueError("El valor actual no puede superar el máximo")
        return self


class Virtues(AppBaseModel):
    """
    Virtudes del Mundo de Tinieblas (V20/W20/M20).
    Los nombres duales reflejan las dos variantes (Caminos de Humanidad vs Iluminación).
    """
    conscience_conviction: int = Field(ge=1, le=5, default=1, description="Conciencia / Convicción")
    self_control_instinct: int = Field(ge=1, le=5, default=1, description="Autocontrol / Instinto")
    courage:               int = Field(ge=1, le=5, default=1, description="Valor")


class MeritFlaw(AppBaseModel):
    """Mérito o Defecto individual."""
    name:        str             = Field(min_length=1)
    category:    str             = Field(description="'merit' o 'flaw'")
    points:      int             = Field(description="Costo en puntos (positivo=Mérito, negativo=Defecto)")
    description: str | None     = None


class DisciplineEntry(AppBaseModel):
    """Una Disciplina con su nivel — para fichas V20."""
    name:        str        = Field(min_length=1, examples=["Dominación"])
    level:       int        = Field(ge=1, le=5)
    description: str | None = None  # Efecto específico del nivel


class GiftEntry(AppBaseModel):
    """Un Don Garou con su rango — para fichas W20."""
    name:        str        = Field(min_length=1, examples=["Rugido de Mjolnir"])
    rank:        int        = Field(ge=1, le=5, description="Rango del Don (1-5)")
    tribe:       str | None = None
    auspice:     str | None = None
    description: str | None = None


class SphereRatings(AppBaseModel):
    """Las 9 Esferas de Mago con sus niveles (0-5) — para fichas M20."""
    correspondence: int = Field(ge=0, le=5, default=0, description="Correspondencia")
    entropy:        int = Field(ge=0, le=5, default=0, description="Entropía")
    forces:         int = Field(ge=0, le=5, default=0, description="Fuerzas")
    life:           int = Field(ge=0, le=5, default=0, description="Vida")
    matter:         int = Field(ge=0, le=5, default=0, description="Materia")
    mind:           int = Field(ge=0, le=5, default=0, description="Mente")
    prime:          int = Field(ge=0, le=5, default=0, description="Primo")
    spirit:         int = Field(ge=0, le=5, default=0, description="Espíritu")
    time:           int = Field(ge=0, le=5, default=0, description="Tiempo")


# ═══════════════════════════════════════════════════════════════
# Stats completos por línea de juego
# ═══════════════════════════════════════════════════════════════

class _BaseStats(AppBaseModel):
    """Campos comunes a V20, W20 y M20."""
    attributes:   Attributes         = Field(default_factory=Attributes)
    abilities:    Abilities           = Field(default_factory=Abilities)
    backgrounds:  dict[str, int]     = Field(
        default_factory=dict,
        description="Trasfondos y sus puntos. Ej: {'recursos': 3, 'mentor': 2}",
    )
    merits_flaws: list[MeritFlaw]    = Field(default_factory=list)
    virtues:      Virtues             = Field(default_factory=Virtues)
    willpower:    Pool                = Field(default_factory=Pool)
    health:       dict[str, Any]     = Field(
        default_factory=lambda: {
            "bruised": 0, "hurt": 0, "injured": 0, "wounded": 0,
            "mauled": 0, "crippled": 0, "incapacitated": 0,
        },
        description="Niveles de salud con daño acumulado",
    )
    experience:   dict[str, Any]     = Field(
        default_factory=lambda: {"total": 0, "spent": 0, "log": []},
    )
    notes:        dict[str, str]     = Field(
        default_factory=lambda: {
            "appearance": "", "biography": "", "personality": "", "goals": "",
        },
    )
    portrait_url: str | None = None


class StatsV20(_BaseStats):
    """Ficha completa para Vampiro: La Mascarada 20th Anniversary."""
    # Identidad vampírica
    clan:       str = Field(
        description="Clan del vampiro",
        examples=["Brujah", "Malkaviano", "Nosferatu", "Toreador", "Tremere",
                  "Ventrue", "Gangrel", "Lasombra", "Tzimisce", "Assamita",
                  "Ravnos", "Seguidor de Set", "Giovanni"],
    )
    sect:       str = Field(
        description="Secta",
        examples=["Camarilla", "Sabbat", "Anarquistas", "Independiente"],
    )
    generation: int = Field(ge=4, le=15, default=12, description="Generación del vampiro")

    # Recursos vampíricos
    blood_pool:    Pool = Field(default_factory=Pool)
    humanity_path: int  = Field(
        ge=0, le=10, default=7,
        description="Humanidad o Puntuación del Camino de Iluminación",
    )
    road:          dict[str, Any] = Field(
        default_factory=lambda: {"name": "Humanidad", "rating": 7},
        description="Camino de Iluminación activo",
    )

    # Poderes vampíricos
    disciplines:       list[DisciplineEntry] = Field(default_factory=list)
    combination_powers: list[dict[str, Any]] = Field(
        default_factory=list,
        description="Poderes combinados de Disciplinas (V20 core, pp. 138+)",
    )


class StatsW20(_BaseStats):
    """Ficha completa para Hombre Lobo: El Apocalipsis 20th Anniversary."""
    # Identidad Garou
    tribe:   str = Field(
        description="Tribu del Garou",
        examples=["Garras de Plata", "Fianna", "Dientes de Hueso", "Uktena",
                  "Wendigo", "Perros de guerra", "Hijos de Gaia", "Jinetes de la Tormenta",
                  "Get of Fenris", "Red Talons", "Shadow Lords", "Silent Striders", "Stargazers"],
    )
    auspice: str = Field(
        description="Augurio lunar",
        examples=["Ragabash", "Theurge", "Philodox", "Galliard", "Ahroun"],
    )
    breed:   str = Field(
        description="Raza de nacimiento",
        examples=["Homid", "Metis", "Lupus"],
    )
    rank:    int = Field(ge=0, le=5, default=1, description="Rango Garou (Cliath=1 ... Leyenda=5)")

    # Recursos Garou
    gnosis: Pool = Field(default_factory=Pool)
    rage:   Pool = Field(default_factory=Pool)

    # Renombre
    glory_honor_wisdom: dict[str, int] = Field(
        default_factory=lambda: {"glory": 0, "honor": 0, "wisdom": 0},
        description="Renombre en las tres categorías",
    )

    # Poderes
    gifts: list[GiftEntry]      = Field(default_factory=list, description="Dones conocidos")
    rites: list[dict[str, Any]] = Field(default_factory=list, description="Ritos conocidos")

    # Formas (estadísticas de modificación por forma)
    forms: dict[str, Any] = Field(
        default_factory=lambda: {
            "homid": {}, "glabro": {}, "crinos": {}, "hispo": {}, "lupus": {},
        },
        description="Modificadores de estadísticas por cada forma Garou",
    )


class StatsM20(_BaseStats):
    """Ficha completa para Mago: La Ascensión 20th Anniversary."""
    # Identidad mágica
    tradition: str = Field(
        description="Tradición o Convenio del Mago",
        examples=["Verbena", "Hermética", "Virtual Adept", "Sons of Ether",
                  "Akashic Brotherhood", "Celestial Chorus", "Cult of Ecstasy",
                  "Dreamspeakers", "Euthanatos"],
    )
    essence_type: str = Field(
        description="Tipo de esencia mágica",
        examples=["Dinámico", "Patrón", "Primordial", "Quiescente"],
    )

    # Recursos mágicos
    arete:        int  = Field(ge=1, le=10, default=1, description="Areté del Mago")
    quintessence: Pool = Field(default_factory=Pool)
    paradox:      dict[str, int] = Field(
        default_factory=lambda: {"current": 0, "permanent": 0},
        description="Paradoja acumulada",
    )

    # Poderes
    spheres:   SphereRatings        = Field(default_factory=SphereRatings)
    foci:      list[dict[str, Any]] = Field(
        default_factory=list,
        description="Focos por esfera. Ej: [{ sphere: 'Fuerzas', focus_item: 'Varita', ... }]",
    )
    resonance: list[dict[str, Any]] = Field(
        default_factory=list,
        description="Resonancia mágica del Mago",
    )


# ═══════════════════════════════════════════════════════════════
# Schemas de entrada (request body)
# ═══════════════════════════════════════════════════════════════

class CharacterCreate(AppBaseModel):
    """Body para crear un nuevo personaje (PJ o PNJ)."""
    chronicle_id:   UUIDStr       = Field(description="ID de la crónica a la que pertenece")
    name:           str           = Field(min_length=1, max_length=200)
    player_name:    str | None    = Field(default=None, max_length=200)
    character_type: CharacterType = Field(default=CharacterType.NPC)
    game_line:      GameLine      = Field(description="V20, W20 o M20")
    # stats acepta dict libre — la validación más estricta (StatsV20, etc.)
    # ocurre en el servicio si se requiere validación profunda.
    stats: dict[str, Any] = Field(
        default_factory=dict,
        description=(
            "Ficha completa del personaje en formato JSONB. "
            "Estructura validable con StatsV20, StatsW20 o StatsM20 según game_line."
        ),
    )

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("El nombre del personaje no puede estar vacío")
        return v.strip()


class CharacterUpdate(AppBaseModel):
    """Body para actualización parcial (PATCH) de un personaje."""
    name:           str | None           = Field(default=None, min_length=1, max_length=200)
    player_name:    str | None           = None
    is_active:      bool | None          = None
    stats:          dict[str, Any] | None = None


# ═══════════════════════════════════════════════════════════════
# Schemas de salida (response)
# ═══════════════════════════════════════════════════════════════

class CharacterResponse(AppBaseModel):
    """Representación completa de un personaje en respuestas de la API."""
    id:             UUIDStr
    chronicle_id:   UUIDStr
    name:           str
    player_name:    str | None
    character_type: CharacterType
    game_line:      GameLine
    is_active:      bool
    stats:          dict[str, Any]
    created_at:     datetime
    updated_at:     datetime


# Alias paginado
CharacterListResponse = PaginatedResponse[CharacterResponse]
