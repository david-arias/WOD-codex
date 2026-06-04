# backend/schemas/ — Pydantic v2 DTOs para request/response de la API
from backend.schemas.chronicle import (
    ChronicleCreate,
    ChronicleUpdate,
    ChronicleResponse,
    ChronicleListResponse,
)
from backend.schemas.character import (
    CharacterCreate,
    CharacterUpdate,
    CharacterResponse,
    CharacterListResponse,
    StatsV20,
    StatsW20,
    StatsM20,
)
from backend.schemas.game_rule import (
    GameRuleCreate,
    GameRuleUpdate,
    GameRuleResponse,
    GameRuleListResponse,
)

__all__ = [
    "ChronicleCreate", "ChronicleUpdate", "ChronicleResponse", "ChronicleListResponse",
    "CharacterCreate", "CharacterUpdate", "CharacterResponse", "CharacterListResponse",
    "StatsV20", "StatsW20", "StatsM20",
    "GameRuleCreate", "GameRuleUpdate", "GameRuleResponse", "GameRuleListResponse",
]
