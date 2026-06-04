# 📜 HANDOFF.MD — El Códice del Narrador
> **Bitácora Viva del Proyecto** · Actualizado por el 📝 Documentador Técnico
> **Versión:** 0.3.1 · **Fecha:** 2026-06-04 · **Fase Actual:** Fase 4 — IA & Seed de Reglas

---

## 🗺️ Resumen Ejecutivo

**El Códice del Narrador** es una aplicación web SaaS para Directores de Juego del sistema de rol **Mundo de Tinieblas**, cubriendo las ediciones 20 Aniversario: **V20** (Vampiro), **W20** (Hombre Lobo) y **M20** (Mago). Stack 100% gratuito: React + FastAPI + Supabase + Groq/Gemini.

---

## 🏗️ Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Browser)                        │
│  React 18 + Vite · Tailwind CSS · Zustand · React Router DOM   │
│         Gothic-Punk Modern Design System (design.md)            │
│                    Alojado en Vercel (Free)                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS · /api/v1/* · JWT Bearer
┌───────────────────────────▼─────────────────────────────────────┐
│                     BACKEND (FastAPI 0.2.0)                     │
│     core/config.py · db/database.py · api/dependencies.py      │
│     Routers: /chronicles · /characters · /gamerules             │
│          JWT validado contra SUPABASE_JWT_SECRET (HS256)        │
└──────────┬──────────────────────────────────────────────────────┘
           │ SQLAlchemy 2.0 async (asyncpg)
┌──────────▼──────────┐              ┌────────────────────────────┐
│   SUPABASE          │              │   CAPA DE IA (Fase 4)      │
│   PostgreSQL        │              │   ChromaDB + LangChain      │
│   Auth (JWT/HS256)  │              │   Groq / Gemini / Ollama   │
│   Storage (assets)  │              └────────────────────────────┘
└─────────────────────┘
```

---

## 📁 Estructura del Monorepo (v0.3.1)

```
wod-codex/
├── handoff.md                              ← Bitácora viva ✅
├── .gitignore                              ✅
├── .env.example                            ✅
│
├── .ai-context/                            ← Prompts as Code ✅
│   ├── README.md
│   ├── project_context.md
│   └── agents/
│       ├── arquitecto_backend.md
│       ├── lider_frontend.md
│       ├── ingeniero_ia.md
│       └── documentador_tecnico.md
│
├── backend/
│   ├── main.py                             ← FastAPI app v0.2.0 ✅
│   ├── models.py                           ← ORM 5 modelos JSONB ✅
│   ├── core/config.py                      ← pydantic-settings ✅
│   ├── db/database.py                      ← asyncpg engine ✅
│   ├── api/
│   │   ├── dependencies.py                 ← JWT auth + upsert ✅
│   │   └── routers/
│   │       ├── chronicles.py               ← CRUD crónicas ✅
│   │       ├── characters.py               ← CRUD personajes ✅
│   │       └── game_rules.py               ← Grimorio CRUD ✅
│   ├── schemas/
│   │   ├── common.py                       ← PaginatedResponse[T] ✅
│   │   ├── chronicle.py                    ✅
│   │   ├── character.py                    ← StatsV20/W20/M20 ✅
│   │   └── game_rule.py                    ✅
│   ├── services/                           ← (Fase 4)
│   ├── requirements.txt                    ✅
│   │
│   ⚠️  DEPRECADOS — eliminar antes de Fase 4:
│   ├── config.py   ← usar core/config.py
│   ├── database.py ← usar db/database.py
│   └── routers/__init__.py
│
└── frontend/
    ├── package.json                        ✅ (globals corregido)
    ├── vite.config.js                      ✅ (cacheDir → /tmp)
    ├── tailwind.config.js                  ✅ (paleta Gothic-Punk)
    ├── postcss.config.js                   ✅
    ├── index.html                          ✅
    └── src/
        ├── main.jsx                        ✅ (importa index.css)
        ├── App.jsx                         ✅ (6 rutas + MainLayout)
        ├── index.css                       ✅ (design tokens + primitivos)
        ├── components/
        │   ├── ui/
        │   │   ├── Card.jsx                ✅ ghost border + faction top-border
        │   │   ├── Button.jsx              ✅ 5 variantes + label-caps
        │   │   ├── Badge.jsx               ✅ faction colors + dot
        │   │   ├── Input.jsx               ✅ dark + focus glow
        │   │   ├── Select.jsx              ✅ (bug forwardRef corregido)
        │   │   ├── DotRating.jsx           ✅ dots interactivos
        │   │   └── index.js                ✅ barrel export
        │   └── layout/
        │       ├── Sidebar.jsx             ✅ active left-border + SVG icons
        │       └── MainLayout.jsx          ✅ Outlet + scroll
        └── views/
            ├── Dashboard.jsx               ✅ grid V20/W20/M20 mock
            ├── Grimorio.jsx                ✅ wiki + Oracle AI chat
            ├── Forja.jsx                   ✅ form + ficha M20
            ├── PantallaNarrador.jsx        ✅ 3 cols + dado roller
            ├── HubCronica.jsx              ✅ W20 hub + timeline
            └── BitacoraSesion.jsx          ✅ mic + AI scan badges
```

---

## 🌐 Mapa de Rutas API (v0.2.0)

| Método   | Ruta | Descripción | Auth |
|----------|------|-------------|------|
| `GET`    | `/health` | Health check | ❌ |
| `GET`    | `/api/v1/chronicles/` | Listar crónicas (paginado) | 🔒 |
| `POST`   | `/api/v1/chronicles/` | Crear crónica | 🔒 |
| `GET`    | `/api/v1/chronicles/{id}` | Obtener crónica | 🔒 |
| `PATCH`  | `/api/v1/chronicles/{id}` | Actualizar crónica | 🔒 |
| `DELETE` | `/api/v1/chronicles/{id}` | Eliminar (cascade) | 🔒 |
| `GET`    | `/api/v1/characters/?chronicle_id=` | Listar personajes | 🔒 |
| `POST`   | `/api/v1/characters/` | Crear personaje | 🔒 |
| `GET`    | `/api/v1/characters/{id}` | Obtener personaje | 🔒 |
| `PATCH`  | `/api/v1/characters/{id}` | Actualizar stats | 🔒 |
| `DELETE` | `/api/v1/characters/{id}` | Eliminar personaje | 🔒 |
| `GET`    | `/api/v1/gamerules/` | Buscar reglas (filtros múltiples) | 🔒 |
| `GET`    | `/api/v1/gamerules/hierarchy/{name}` | Niveles de un poder | 🔒 |
| `GET`    | `/api/v1/gamerules/{id}` | Obtener regla | 🔒 |
| `POST`   | `/api/v1/gamerules/` | Crear regla (seed) | 🔒 |
| `PATCH`  | `/api/v1/gamerules/{id}` | Actualizar + regen embedding | 🔒 |

## 🌐 Mapa de Rutas Frontend (v0.3.1)

| Ruta | Vista | Estado |
|------|-------|--------|
| `/` | `Dashboard.jsx` | ✅ Mock data V20/W20/M20 |
| `/grimorio` | `Grimorio.jsx` | ✅ Oracle AI chat funcional |
| `/forja` | `Forja.jsx` | ✅ Ficha M20 interactiva |
| `/narrador` | `PantallaNarrador.jsx` | ✅ Dado roller funcional |
| `/cronica/:id` | `HubCronica.jsx` | ✅ Mock W20 |
| `/bitacora` | `BitacoraSesion.jsx` | ✅ Mic + AI scan |

---

## ✅ Historial de Fases Completadas

### Fase 1 — Fundación (2026-06-04)
- [x] `handoff.md` inicializado · `.ai-context/` con 4 perfiles de agentes
- [x] Monorepo scaffoldeado (`/backend`, `/frontend`, `/.ai-context`)
- [x] `models.py` — 5 modelos SQLAlchemy: `User`, `Chronicle`, `GameSession`, `Character` (JSONB), `GameRule`
- [x] `requirements.txt` + `package.json` base

### Fase 2 — API Base FastAPI (2026-06-04)
- [x] `core/config.py` — pydantic-settings con CORS dinámico
- [x] `db/database.py` — asyncpg, `pool_pre_ping=True`, `get_db` dependency
- [x] `api/dependencies.py` — `get_current_user` JWT HS256 + upsert en primer login
- [x] Schemas Pydantic v2: `common`, `chronicle`, `character` (StatsV20/W20/M20), `game_rule`
- [x] 3 routers CRUD: `/chronicles`, `/characters`, `/gamerules` — paginación, ownership, filtros
- [x] `main.py` v0.2.0 — CORS, X-Process-Time, exception handlers

### Fase 3 — Frontend Base (2026-06-04)
- [x] Design system completo: `tailwind.config.js` (paleta Gothic-Punk, 3 faction colors) + `index.css`
- [x] UI Kit atómico (6 componentes, cero librerías externas): `Card`, `Button`, `Badge`, `Input`, `Select`, `DotRating`
- [x] Layout: `Sidebar` (active left-border SVG) + `MainLayout` (React Router Outlet)
- [x] 6 vistas con mock data fiel a los screenshots: Dashboard, Grimorio, Forja, PantallaNarrador, HubCronica, BitacoraSesion
- [x] `App.jsx` — React Router con `<Route element={<MainLayout />}>` wrapping las 6 vistas

### Fase 3 — Hotfixes (2026-06-04)
- [x] `package.json` — `@globals/browser` → `globals` (paquete npm correcto)
- [x] `Select.jsx` — bug sintaxis `forwardRef((...)) =>` → `forwardRef((...) =>` (un solo `)` antes del `=>`)
- [x] `vite.config.js` — `cacheDir: '/tmp/vite-wod-codex'` para evitar `EACCES` en rutas con espacios

---

## 📋 Próximos Pasos — Fase 4 (IA & Seed de Reglas)

### 🧠 Arquitecto Backend
- [ ] Eliminar archivos deprecados: `backend/config.py`, `backend/database.py`, `backend/routers/__init__.py`
- [ ] `alembic init` + primera migración `create_initial_tables`
- [ ] `backend/scripts/seed_rules.py` — poblar `game_rules` con Dominar Nv1-5 (V20)

### 🤖 Ingeniero de IA
- [ ] `backend/services/rag_service.py` — ChromaDB + sentence-transformers + LangChain LCEL
- [ ] `backend/api/routers/ai_chat.py` — endpoint `POST /ai/oracle` (Grimorio)
- [ ] `backend/api/routers/npc_forge.py` — endpoint `POST /ai/forge` (La Forja)

### 🎨 Líder Frontend
- [ ] `src/store/useAuthStore.js` — Zustand + Supabase Auth
- [ ] `src/store/useChronicleStore.js` — CRUD real (reemplaza mock en Dashboard)
- [ ] `src/views/AuthPage.jsx` — login/registro
- [ ] Conectar `Grimorio.jsx` Oracle al endpoint `/api/v1/ai/oracle`

---

## 🧠 Decisiones Arquitectónicas (ADRs)

| # | Decisión | Razón |
|---|----------|-------|
| ADR-001 | JSONB para `Character.stats` | V20/W20/M20 estructuras divergentes; sin migraciones disruptivas |
| ADR-002 | JWT HS256 directo (no JWKS) | Sin hop extra de red; secreto en Dashboard de Supabase |
| ADR-003 | IA como oráculo (no fuente de verdad) | Reglas precisas en DB; LLM solo interpreta, nunca inventa |
| ADR-004 | Terminología bloqueada (5ª Edición) | Público objetivo son narradores de ediciones 20 Aniversario |
| ADR-005 | Upsert de usuario en primer login | Sin endpoint `/register` separado; Supabase maneja el registro |
| ADR-006 | `PaginatedResponse[T]` genérico | Frontend necesita `total` y `pages` para controles de paginación |
| ADR-007 | Ownership check via JOIN SQL | Evita traer objetos ORM para descartarlos; más eficiente y seguro |
| ADR-008 | `cacheDir` de Vite en `/tmp` | Evita `EACCES` en rutas con espacios en macOS |

---

## 👥 Equipo de Agentes

| Agente | Rol | Estado |
|--------|-----|--------|
| 🧠 Arquitecto Backend | FastAPI, SQLAlchemy, Auth | Fase 2 ✅ |
| 🎨 Líder Frontend | React, Tailwind, UI Kit | Fase 3 ✅ |
| 🤖 Ingeniero de IA | LangChain, ChromaDB, RAG | Fase 4 pendiente |
| 📝 Documentador Técnico | handoff.md, ADRs | Activo |

---

## 🌐 Variables de Entorno Requeridas

```env
# ── Base de Datos ──────────────────────────────────────────────
DATABASE_URL=postgresql+asyncpg://<user>:<pass>@db.<ref>.supabase.co:5432/postgres

# ── Supabase ───────────────────────────────────────────────────
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_KEY=<service-role-key>
SUPABASE_JWT_SECRET=<jwt-secret>    # Dashboard → Settings → API → JWT Secret

# ── App ────────────────────────────────────────────────────────
ENVIRONMENT=development
FRONTEND_URL=http://localhost:5173  # Cambiar a dominio Vercel en producción

# ── IA (Fase 4) ────────────────────────────────────────────────
GROQ_API_KEY=<groq-key>
GEMINI_API_KEY=<gemini-key>
```

---

## 🚀 Comandos de Arranque

```bash
# ── Backend ────────────────────────────────────────────────────
cd backend
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000
# Docs: http://localhost:8000/docs

# ── Frontend ───────────────────────────────────────────────────
cd frontend
npm install
npm run dev    # → http://localhost:5173
```

---

*Documento mantenido por el agente 📝 Documentador Técnico. Actualizar en cada cambio significativo.*
