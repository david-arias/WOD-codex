# 📜 HANDOFF.MD — El Códice del Narrador
> **Bitácora Viva del Proyecto** · Actualizado por el 📝 Documentador Técnico  
> **Versión:** 0.1.0 · **Fecha:** 2026-06-04 · **Fase Actual:** Fase 1 — Fundación

---

## 🗺️ Resumen Ejecutivo

**El Códice del Narrador** es una aplicación web SaaS diseñada para Directores de Juego (Narradores) del sistema de rol **Mundo de Tinieblas**, cubriendo las ediciones 20 Aniversario: **V20** (Vampiro), **W20** (Hombre Lobo) y **M20** (Mago).

El sistema actúa como asistente integral de sesión: gestiona crónicas, genera PNJs con fichas completas, ofrece una wiki consultable de reglas oficiales, y permite a la IA interpretar dudas mecánicas complejas basándose exclusivamente en la base de datos estructurada (nunca en memoria de entrenamiento).

---

## 🏗️ Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Browser)                        │
│  React 18 + Vite · Tailwind CSS · Zustand · React Router DOM   │
│                    Alojado en Vercel (Free)                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS / REST + JWT
┌───────────────────────────▼─────────────────────────────────────┐
│                     BACKEND (FastAPI)                           │
│            Python 3.11+ · SQLAlchemy · Pydantic v2             │
│          JWT validation directa con clave pública Supabase      │
│                  Ejecuta local / Free Tier                      │
└──────────┬────────────────────────────────────────┬─────────────┘
           │ SQLAlchemy ORM                         │ LangChain
┌──────────▼──────────┐                  ┌──────────▼─────────────┐
│   SUPABASE          │                  │   CAPA DE IA           │
│   PostgreSQL        │                  │   ChromaDB (Local)     │
│   Auth (JWT)        │                  │   LangChain + RAG      │
│   Storage (assets)  │                  │   Groq / Gemini /      │
│   Row Level Security│                  │   Ollama (OpenSource)  │
└─────────────────────┘                  └────────────────────────┘
```

### Principios Arquitectónicos Clave

| Principio | Implementación |
|-----------|---------------|
| **Ground Truth** | Las reglas del juego viven SOLO en `game_rules` (PostgreSQL). La IA **nunca** inventa reglas. |
| **JSONB Elástico** | La tabla `characters` usa JSONB para la ficha completa; cada línea (V20/W20/M20) extiende sin romper el esquema. |
| **Auth Unificada** | Supabase emite JWTs. El backend los valida directamente (sin proxy). |
| **Zero Cost** | Vercel Free + Supabase Free + Groq Free Tier / Ollama local = $0/mes. |
| **Terminología** | **Prohibido** usar términos de 5ª Edición. Solo V20/W20/M20 20th Anniversary. |

---

## 📁 Estructura del Monorepo

```
wod-codex/                          ← Raíz del monorepo
├── handoff.md                      ← Este archivo (bitácora viva)
├── .gitignore
├── .env.example                    ← Variables de entorno plantilla
│
├── .ai-context/                    ← "Prompts as Code" — Memoria del equipo IA
│   ├── README.md
│   ├── project_context.md          ← Contexto global del proyecto
│   └── agents/
│       ├── arquitecto_backend.md
│       ├── lider_frontend.md
│       ├── ingeniero_ia.md
│       └── documentador_tecnico.md
│
├── backend/                        ← FastAPI Python App
│   ├── requirements.txt
│   ├── main.py                     ← Entry point FastAPI
│   ├── database.py                 ← Engine SQLAlchemy + SessionLocal
│   ├── models.py                   ← Modelos ORM (User, Chronicle, Character…)
│   ├── schemas/                    ← Pydantic v2 schemas (request/response)
│   │   └── __init__.py
│   ├── routers/                    ← Routers FastAPI por dominio
│   │   └── __init__.py
│   └── services/                   ← Lógica de negocio + capa IA
│       └── __init__.py
│
└── frontend/                       ← React 18 + Vite App
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.jsx                ← Entry point React
        ├── App.jsx                 ← Router principal
        ├── components/             ← UI Kit propio (Ghost Borders, etc.)
        ├── pages/                  ← Vistas principales (6 vistas)
        ├── store/                  ← Zustand stores
        └── styles/
            └── globals.css         ← Tokens CSS + Tailwind base
```

---

## 🎯 Las 6 Vistas del Producto

| # | Vista | Descripción | Estado |
|---|-------|-------------|--------|
| 1 | **Tablero Principal** | CRUD de Crónicas activas | 🔴 Pendiente |
| 2 | **El Grimorio** | Wiki de reglas + Chat IA consultor | 🔴 Pendiente |
| 3 | **La Forja** | Generador de PNJs con ficha completa | 🔴 Pendiente |
| 4 | **Pantalla del Narrador** | Dashboard en vivo durante la partida | 🔴 Pendiente |
| 5 | **Hub de la Crónica** | Detalle de campaña, tramas, línea temporal | 🔴 Pendiente |
| 6 | **Bitácora de Sesión** | Ingreso de texto + extracción de eventos por IA | 🔴 Pendiente |

---

## ✅ Tareas Completadas

### Fase 1 — Fundación (2026-06-04)

- [x] **Definición de arquitectura** general del sistema (multi-agente)
- [x] **handoff.md** creado — bitácora viva inicializada
- [x] **/.ai-context** — Directorio de agentes con perfiles "Prompts as Code"
- [x] **Estructura del monorepo** — árbol de carpetas scaffoldeado
- [x] **models.py** — 5 modelos SQLAlchemy: `User`, `Chronicle`, `Session`, `Character` (JSONB), `GameRule`
- [x] **requirements.txt** — dependencias Python 3.11+
- [x] **package.json** — dependencias React 18 + Vite + Tailwind + Zustand

---

## 🔄 Tareas en Curso

*(ninguna — fase 1 recién completada)*

---

## 📋 Próximos Pasos (Fase 2)

### Prioridad Alta
- [ ] **database.py** — Configurar engine SQLAlchemy con Supabase connection string
- [ ] **main.py** — App FastAPI base con middleware CORS y health check
- [ ] **schemas/** — Pydantic v2 schemas para todos los modelos
- [ ] **Auth router** — Validación de JWT Supabase + endpoint `/auth/me`
- [ ] **Migraciones** — Alembic init + primera migración (create all tables)
- [ ] **Seed script** — Poblar `game_rules` con datos de V20 (muestra: 10 Disciplinas)

### Prioridad Media
- [ ] **CRUD routers** — `/chronicles`, `/characters`, `/sessions`
- [ ] **GameRule router** — Endpoint de búsqueda con filtros (game_line, category)
- [ ] **Supabase config** — RLS policies para multi-tenant seguro

### Prioridad Baja
- [ ] **Frontend scaffold** — Tokens CSS, componentes base (GhostButton, GhostCard)
- [ ] **Zustand stores** — `useChronicleStore`, `useCharacterStore`
- [ ] **React Router** — Rutas base para las 6 vistas

---

## 🧠 Decisiones Arquitectónicas Registradas

### ADR-001: JSONB para fichas de personaje
- **Decisión:** Usar columna JSONB `stats` en `characters` en lugar de tablas relacionales separadas por sistema.
- **Razón:** V20/W20/M20 tienen estructuras divergentes (Disciplinas vs Dones vs Esferas). JSONB permite extensión sin migraciones disruptivas.
- **Trade-off:** Se pierde validación de esquema a nivel DB; se compensa con Pydantic v2 validators en el backend.

### ADR-002: Backend valida JWT directamente (sin proxy Supabase)
- **Decisión:** FastAPI valida el JWT con la clave pública JWKS de Supabase directamente.
- **Razón:** Elimina un hop de red y mantiene el backend stateless.
- **Trade-off:** Requiere sincronizar la URL del JWKS endpoint (`SUPABASE_JWKS_URL`) en el entorno.

### ADR-003: IA es oráculo, no fuente de verdad
- **Decisión:** El LLM nunca responde preguntas de reglas desde su memoria de entrenamiento. Siempre consulta `game_rules` vía RAG.
- **Razón:** Las reglas del TTRPG son precisas y deben ser fidedignas. La alucinación en reglas rompería la partida.
- **Implementación:** ChromaDB indexa los registros de `game_rules`; LangChain retrieves antes de cada respuesta.

### ADR-004: Terminología bloqueada (5ª Edición)
- **Decisión:** El sistema NO soporta, referencia ni usa terminología de V5/W5/M5.
- **Razón:** El público objetivo son narradores de las ediciones 20 Aniversario. Mezclar ediciones crea confusión mecánica.

---

## 👥 Equipo de Agentes

| Agente | Rol | Archivo de Perfil |
|--------|-----|-------------------|
| 🧠 Arquitecto Backend | FastAPI, SQLAlchemy, Supabase, JWT | `.ai-context/agents/arquitecto_backend.md` |
| 🎨 Líder Frontend | React, Tailwind, Gothic-Punk UI Kit | `.ai-context/agents/lider_frontend.md` |
| 🤖 Ingeniero de IA | LangChain, ChromaDB, RAG, LLMs | `.ai-context/agents/ingeniero_ia.md` |
| 📝 Documentador Técnico | handoff.md, ADRs, Project Management | `.ai-context/agents/documentador_tecnico.md` |

---

## 🌐 Variables de Entorno Requeridas

```env
# Supabase
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_KEY=<service-role-key>
SUPABASE_JWKS_URL=https://<project>.supabase.co/auth/v1/.well-known/jwks.json

# Database
DATABASE_URL=postgresql+asyncpg://<user>:<pass>@db.<project>.supabase.co:5432/postgres

# IA
GROQ_API_KEY=<groq-key>          # Opción A: Groq (LLaMA 3)
GEMINI_API_KEY=<gemini-key>      # Opción B: Google Gemini
OLLAMA_BASE_URL=http://localhost:11434  # Opción C: Local

# App
SECRET_KEY=<random-256-bit>
ENVIRONMENT=development
FRONTEND_URL=http://localhost:5173
```

---

*Documento mantenido por el agente 📝 Documentador Técnico. Actualizar en cada cambio significativo.*
