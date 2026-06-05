# 📜 HANDOFF.MD — El Códice del Narrador
> **Bitácora Viva del Proyecto** · Actualizado por el 📝 Documentador Técnico
> **Versión:** 0.4.0 · **Fecha:** 2026-06-05 · **Fase Actual:** Fase 5 — Grimorio & Seed de Reglas

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
│   │   ├── dependencies.py                 ← JWT HS256 + upsert ✅ (VALIDADO Fase 4)
│   │   └── routers/
│   │       ├── chronicles.py               ← CRUD crónicas + owner filter ✅
│   │       ├── characters.py               ← CRUD personajes ✅
│   │       └── game_rules.py               ← Grimorio CRUD ✅
│   ├── schemas/
│   │   ├── common.py                       ← PaginatedResponse[T] ✅
│   │   ├── chronicle.py                    ✅
│   │   ├── character.py                    ← StatsV20/W20/M20 ✅
│   │   └── game_rule.py                    ✅
│   ├── services/                           ← (Fase 5)
│   ├── requirements.txt                    ✅
│   │
│   ⚠️  DEPRECADOS — eliminar antes de Fase 5:
│   ├── config.py   ← usar core/config.py
│   ├── database.py ← usar db/database.py
│   └── routers/__init__.py
│
└── frontend/
    ├── package.json                        ✅ + @supabase/supabase-js ^2.47.0
    ├── vite.config.js                      ✅ (cacheDir → /tmp)
    ├── tailwind.config.js                  ✅ (paleta Gothic-Punk)
    ├── postcss.config.js                   ✅
    ├── index.html                          ✅
    └── src/
        ├── main.jsx                        ✅
        ├── App.jsx                         ✅ AuthProvider + RequireAuth + PublicOnly guards
        ├── index.css                       ✅ (design tokens + primitivos)
        ├── lib/
        │   └── supabaseClient.js           ✅ singleton createClient (NUEVO Fase 4)
        ├── context/
        │   └── AuthContext.jsx             ✅ session/user/token + signIn/signOut + authFetch (NUEVO Fase 4)
        ├── components/
        │   ├── ui/
        │   │   ├── OracleChat.jsx          ✅ widget flotante chat + botón circular + popover + mock responses (NUEVO Fase 5.5)
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
            ├── Login.jsx                   ✅ gothic-punk + ghost borders + Supabase auth (NUEVO Fase 4)
            ├── Dashboard.jsx               ✅ API real + GAME_LINE_MAP + modal crear crónica (ACTUALIZADO Fase 4)
            ├── Grimorio.jsx                ✅ Enciclopedia A-Z pantalla completa + tabs V20/W20/M20 + búsqueda predictiva (REDISEÑO Fase 5.5)
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
| `/` | `Dashboard.jsx` | ✅ API real + modal crear crónica |
| `/grimorio` | `Grimorio.jsx` | ✅ Enciclopedia A-Z + API + Links dinámicos |
| `/grimorio/:gameLine/:slug` | `DetalleRegla.jsx` | ✅ Detalle por slug + Markdown renderer |
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

### Fase 4 — Auth + Dashboard Real (2026-06-05)
- [x] `frontend/src/lib/supabaseClient.js` — singleton `createClient` con `persistSession` y `autoRefreshToken`
- [x] `frontend/package.json` — añadida dependencia `@supabase/supabase-js ^2.47.0`
- [x] `frontend/src/context/AuthContext.jsx` — `AuthProvider` + `useAuth` hook + `authFetch` helper con Bearer JWT automático
- [x] `frontend/src/views/Login.jsx` — vista gótica-punk, ghost borders, focus glow blood, traducción de errores Supabase al español
- [x] `frontend/src/App.jsx` — `RequireAuth` guard (→ /login si no session) + `PublicOnly` guard (→ / si ya logueado) + spinner de hidratación
- [x] `frontend/src/views/Dashboard.jsx` — mock data eliminado, `GET /api/v1/chronicles/` con JWT, `GAME_LINE_MAP` dinámico V20/W20/M20, `relativeTime()`, modal `POST /api/v1/chronicles/`

### Fase 5 — Parser Markdown + Enrutamiento de Detalle (2026-06-05)
- [x] `backend/models.py` — campo `slug VARCHAR(300)` añadido al modelo `GameRule` con índice. Ejecutar `backend/scripts/add_slug_column.sql` en Supabase SQL Editor para añadir la columna a la tabla existente.
- [x] `backend/schemas/game_rule.py` — `slug` añadido a `GameRuleCreate` y `GameRuleResponse`
- [x] `backend/scripts/parse_markdown.py` — Script standalone de seed: parsea secciones con YAML front matter, hace upsert por `(game_line, slug)`, soporta `--dry-run`, `--verify` y `--verbose`. Uso: `python -m backend.scripts.parse_markdown backend/data/v20_disciplinas.md --verify`
- [x] `backend/scripts/add_slug_column.sql` — SQL para agregar columna `slug` + índice único a la tabla existente en Supabase
- [x] `backend/data/v20_disciplinas_ejemplo.md` — Archivo de ejemplo con 4 entradas (Celeridad Nv1, Celeridad Nv2, Auspex Nv1, Brujah) en formato correcto para el parser
- [x] `backend/api/routers/game_rules.py` — Nuevos endpoints: `GET /gamerules/glossary/{game_line}` (A-Z para Grimorio) y `GET /gamerules/detail/{game_line}/{slug}` (detalle por slug con fallback por nombre slugificado)
- [x] `frontend/src/views/Grimorio.jsx` — Entries ahora son `<Link>` a `/grimorio/:gameLine/:slug`. Fetch real desde `GET /api/v1/gamerules/glossary/{game}` con fallback a mock si la DB está vacía. Filtros de categoría conectados a enum de DB.
- [x] `frontend/src/views/DetalleRegla.jsx` — Nueva vista de detalle: consume `GET /api/v1/gamerules/detail/{game_line}/{slug}`, renderiza Markdown con renderer inline (sin dependencias externas), breadcrumb de navegación, badge de categoría/nivel/afiliación, bloque de Sistema destacado.
- [x] `frontend/src/App.jsx` — Ruta añadida: `/grimorio/:gameLine/:slug` → `<DetalleRegla />`

### Fase 5.5 — Grimorio Enciclopedia + Oráculo Flotante (2026-06-05)
- [x] `frontend/src/views/Grimorio.jsx` — **Rediseño completo**: pantalla completa tipo enciclopedia/diccionario A-Z. Tabs superiores para V20/W20/M20 con acento dinámico de facción. Búsqueda predictiva con ghost border. Filtros de categoría por juego (Disciplinas/Clanes/Sectas para V20, Dones/Tribus/Ritos para W20, Esferas/Tradiciones/Paradoja para M20). Glosario indexado A-Z con `EntryCard` expandible al clic.
- [x] `frontend/src/components/ui/OracleChat.jsx` — Widget flotante: botón circular con ícono de ojo en esquina inferior derecha. Popover de chat con animación `oracle-slide-up`. Header con estado "Consultando el Tapiz…", botones minimizar/cerrar. Indicador de escritura con dots animados. Respuestas mock que en Fase 6 se conectarán a `POST /api/v1/ai/oracle`.
- [x] ADR-015: Decisión de diseño — de panel dividido (60/40) a enciclopedia completa + chat flotante para optimizar espacio en mesa y consultas rápidas durante sesión.

### Fase 4 — Hotfixes de integración (2026-06-05)
- [x] `backend/api/routers/chronicles.py` — `response_model=None` en `DELETE 204` (FastAPI 0.115 strict)
- [x] `backend/api/routers/characters.py` — ídem `DELETE 204`
- [x] `backend/db/database.py` — `poolclass=NullPool` (Supabase PgBouncer Transaction mode incompatible con asyncpg prepared statements)
- [x] `backend/requirements-core.txt` — creado con dependencias mínimas Fase 1-4 (sin spacy/LangChain/ChromaDB); añadido `greenlet==3.1.1`
- [x] `backend/api/dependencies.py` — **soporte dual ES256/HS256**: proyectos nuevos de Supabase usan ES256 (ECDSA); la clave pública se descarga del JWKS endpoint (`{SUPABASE_URL}/auth/v1/.well-known/jwks.json`) y se cachea 1 hora en memoria. Proyectos legacy siguen usando HS256 con `SUPABASE_JWT_SECRET`.

---

## 📋 Próximos Pasos — Fase 5 (Grimorio & Seed de Reglas)

### 🧠 Arquitecto Backend
- [ ] Eliminar archivos deprecados: `backend/config.py`, `backend/database.py`, `backend/routers/__init__.py`
- [ ] `alembic init` + primera migración `create_initial_tables`
- [ ] `backend/scripts/seed_rules.py` — poblar `game_rules` con Dominar Nv1-5 (V20), Dones Ragabash (W20), Esfera Materia (M20)

### 🤖 Ingeniero de IA
- [ ] `backend/services/rag_service.py` — ChromaDB + sentence-transformers + LangChain LCEL
- [ ] `backend/api/routers/ai_chat.py` — endpoint `POST /api/v1/ai/oracle` (Grimorio)
- [ ] `backend/api/routers/npc_forge.py` — endpoint `POST /api/v1/ai/forge` (La Forja)

### 🎨 Líder Frontend — Fase 6 (La Forja)
- [ ] Rediseñar `Forja.jsx` — Creador de personajes interactivo con ficha completa V20/W20/M20 dinámica
- [ ] Conectar `OracleChat.jsx` al endpoint `POST /api/v1/ai/oracle` (reemplaza respuestas mock)
- [ ] Conectar `HubCronica.jsx` a `GET /api/v1/chronicles/:id` + `GET /api/v1/characters/?chronicle_id=`
- [ ] Añadir botón "Cerrar sesión" en `Sidebar.jsx` usando `signOut()` del `useAuth` hook
- [ ] Poblar el Grimorio desde `GET /api/v1/gamerules/` (reemplaza `GLOSARIO` mock)

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
| ADR-009 | `authFetch` como helper en `AuthContext` | Centraliza el header `Authorization: Bearer` en un solo lugar; evitar duplicar lógica en cada vista |
| ADR-010 | `RequireAuth` + `PublicOnly` como route guards en `App.jsx` | Separación limpia de rutas públicas/protegidas sin lógica de auth en cada vista individual |
| ADR-011 | `session === undefined` vs `null` en `AuthContext` | `undefined` = hidratando (spinner), `null` = sin sesión confirmada; evita flash de redireccionamiento |
| ADR-012 | `NullPool` para SQLAlchemy + Supabase | PgBouncer en modo Transaction no soporta prepared statements de asyncpg; `NullPool` abre/cierra conexión por request. Supabase gestiona el pooling en su lado |
| ADR-013 | Soporte dual ES256/HS256 en `dependencies.py` | Supabase migró a ES256 en proyectos nuevos. El backend lee el `alg` del header JWT y descarga la clave pública del JWKS endpoint si es ES256; usa `SUPABASE_JWT_SECRET` si es HS256 |
| ADR-014 | Python 3.12 vía pyenv para el backend | Python 3.14 no tiene wheels precompiladas para pydantic-core; pyenv permite fijar 3.12.7 solo en `/backend` sin afectar el sistema |
| ADR-015 | Grimorio: enciclopedia completa + chat flotante | El panel dividido 60/40 perdía espacio útil en mesa. La enciclopedia completa maximiza el glosario consultable; el Oráculo como widget flotante no interrumpe la lectura |
| ADR-016 | Glosario mock en `GLOSARIO` const | Las entradas vienen de código hasta que `GET /api/v1/gamerules/` esté poblado con seed data. Misma forma de datos, el switch a API es un `useEffect` + `authFetch` |
| ADR-017 | Slug derivado de nombre como fallback | Si la regla no tiene `slug` en DB, `DetalleRegla` usa `slugify(name)` para generar la URL. El endpoint `/detail` tiene el mismo fallback en el backend. Garantiza URLs funcionales sin depender del campo |
| ADR-018 | Parser Markdown sin PyYAML | `parse_markdown.py` parsea YAML front matter con regex + split para evitar dependencias adicionales en requirements-core.txt. Compatible con el formato exacto del ejemplo |

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

# ── Frontend (.env.local en /frontend) ─────────────────────────
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>           # Pública — segura en el cliente
VITE_API_BASE_URL=http://localhost:8000      # Base para authFetch; cambiar en producción

# ── IA (Fase 5) ────────────────────────────────────────────────
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
