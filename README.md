# 📜 El Códice del Narrador

> *"El conocimiento es poder. El poder es sangre. La sangre es todo."*

Plataforma SaaS para **Directores de Juego** del sistema de rol **Mundo de Tinieblas** — ediciones 20 Aniversario: V20 (Vampiro), W20 (Hombre Lobo) y M20 (Mago). Una herramienta que se siente tan antigua como los libros que referencia y tan precisa como las reglas que contiene.

![Stack](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Stack](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)
![Stack](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)
![Stack](https://img.shields.io/badge/LangChain-RAG-1C3C3C?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-white?style=flat-square)

---

## ✨ Características Principales

| Vista | Descripción |
|-------|-------------|
| **🏛️ Tablero** | CRUD de Crónicas activas con soporte multijuego (V20/W20/M20) |
| **📖 El Grimorio** | Wiki enciclopédica de reglas oficiales + Oráculo IA con RAG |
| **⚒️ La Forja** | Generador de PNJs con ficha completa (atributos, poderes, virtudes) |
| **🎭 Pantalla del Narrador** | Dashboard en vivo: estado de coterie, notas, dado roller |
| **🗺️ Hub de la Crónica** | Detalle de campaña, amenazas activas, línea temporal de sesiones |
| **📓 Bitácora de Sesión** | Ingreso de texto y extracción automática de eventos mecánicos por IA |

### ⚡ Lo que hace diferente a este proyecto

- **Ground Truth en DB** — Las reglas del juego viven en PostgreSQL, no en la memoria del LLM. La IA nunca inventa reglas: solo interpreta lo que encuentra en la base de datos.
- **Soporte real de 3 líneas** — V20, W20 y M20 en una sola app. Fichas JSONB elásticas que soportan Disciplinas, Dones y Esferas sin romper el esquema.
- **Costo cero** — Vercel Free + Supabase Free + Groq Free Tier + Ollama local = $0/mes.
- **Sin terminología de 5ª Edición** — Diseñado exclusivamente para las ediciones 20 Aniversario.

---

## 🛠️ Stack Tecnológico

```
Frontend          Backend           Base de Datos     IA
──────────        ───────────       ─────────────     ──────────────
React 18          Python 3.11       Supabase          LangChain
Vite 6            FastAPI           PostgreSQL        ChromaDB (local)
Tailwind CSS      SQLAlchemy 2.0    JWT / HS256       sentence-transformers
Zustand           Pydantic v2       Row Level         Groq API (LLaMA 3)
React Router v6   asyncpg           Security          Gemini / Ollama
```

---

## 📁 Estructura del Proyecto

```
wod-codex/
├── 📄 handoff.md              ← Bitácora viva del proyecto (leer primero)
├── 📄 .env.example            ← Variables de entorno (plantilla)
├── 📄 .gitignore
│
├── 🧠 .ai-context/            ← "Prompts as Code" — memoria del equipo
│   ├── project_context.md
│   └── agents/
│       ├── arquitecto_backend.md
│       ├── lider_frontend.md
│       ├── ingeniero_ia.md
│       └── documentador_tecnico.md
│
├── ⚙️  backend/
│   ├── main.py                ← Entry point FastAPI
│   ├── models.py              ← ORM: User, Chronicle, Character (JSONB), GameRule
│   ├── core/config.py         ← pydantic-settings
│   ├── db/database.py         ← asyncpg engine + get_db
│   ├── api/
│   │   ├── dependencies.py    ← JWT auth + upsert en primer login
│   │   └── routers/           ← chronicles · characters · game_rules
│   ├── schemas/               ← Pydantic v2 DTOs (StatsV20/W20/M20)
│   ├── services/              ← Lógica de negocio + RAG (Fase 4)
│   └── requirements.txt
│
└── 🎨 frontend/
    ├── src/
    │   ├── App.jsx            ← Router con 6 vistas
    │   ├── index.css          ← Design tokens Gothic-Punk Modern
    │   ├── components/
    │   │   ├── ui/            ← Card · Button · Badge · Input · Select · DotRating
    │   │   └── layout/        ← Sidebar · MainLayout
    │   └── views/             ← Dashboard · Grimorio · Forja · Narrador · Hub · Bitácora
    ├── tailwind.config.js     ← Paleta + tipografías + animaciones
    └── package.json
```

---

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js ≥ 18
- Python 3.11+
- Cuenta en [Supabase](https://supabase.com) (Free Tier)
- Cuenta en [Groq](https://console.groq.com) (Free Tier) — opcional para Fase 4

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/wod-codex.git
cd wod-codex
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus credenciales de Supabase
```

Variables mínimas requeridas:

```env
DATABASE_URL=postgresql+asyncpg://<user>:<pass>@db.<ref>.supabase.co:5432/postgres
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_JWT_SECRET=<jwt-secret>    # Dashboard → Settings → API → JWT Secret
ENVIRONMENT=development
FRONTEND_URL=http://localhost:5173
```

### 3. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000
```

API disponible en `http://localhost:8000` · Docs en `http://localhost:8000/docs`

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

App disponible en `http://localhost:5173`

---

## 🗺️ Rutas de la API

```
GET  /health                              → Health check (sin auth)

GET  /api/v1/chronicles/                  → Listar mis crónicas
POST /api/v1/chronicles/                  → Crear crónica
GET  /api/v1/chronicles/{id}              → Obtener crónica
PATCH /api/v1/chronicles/{id}             → Actualizar crónica
DELETE /api/v1/chronicles/{id}            → Eliminar (cascade)

GET  /api/v1/characters/?chronicle_id=    → Listar personajes
POST /api/v1/characters/                  → Crear personaje
PATCH /api/v1/characters/{id}             → Actualizar stats (JSONB)

GET  /api/v1/gamerules/                   → Buscar reglas (filtros múltiples)
GET  /api/v1/gamerules/hierarchy/{name}   → Niveles de un poder (ej: Dominar)
POST /api/v1/gamerules/                   → Crear regla (seed/admin)
```

Todos los endpoints (excepto `/health`) requieren `Authorization: Bearer <supabase_jwt>`.

---

## 🎨 Design System

El proyecto implementa el sistema **Gothic-Punk Modern** definido en `design.md`.

| Token | Valor | Uso |
|-------|-------|-----|
| `surface` | `#141313` | Fondo raíz |
| `surface-low` | `#1c1b1b` | Cards y sidebar |
| `surface-base` | `#201f1f` | Inputs y contenedores elevados |
| `on-surface` | `#e5e2e1` | Texto primario |
| `blood` | `#8b1a1a` / `#c62828` | Acento Vampiro (V20) |
| `amber` | `#92400e` / `#d97706` | Acento Hombre Lobo (W20) |
| `arcane` | `#4c1d95` / `#7c3aed` | Acento Mago (M20) |

**Tipografía:** `Playfair Display` para títulos y lore · `Inter` para UI · `JetBrains Mono` para stats y código.

**Ghost Borders:** todos los contenedores usan `border: 1px solid rgba(255,255,255,0.06)` — el efecto visual central del diseño.

---

## 🤖 Arquitectura de IA (Fase 4)

```
Usuario pregunta → Query Embedding (local) → ChromaDB Retrieval
                                                      ↓
                              Chunks de game_rules recuperados
                                                      ↓
                              LLM (Groq/Gemini) interpreta → Respuesta
```

**Principio fundamental:** el LLM **nunca inventa reglas**. Solo interpreta los registros de la tabla `game_rules` recuperados por RAG. Si una regla no está en la DB, el Oráculo lo dice explícitamente.

---

## 📚 Mecánicas Soportadas

| Sistema | Cobertura |
|---------|-----------|
| **V20** | 13 Clanes · Sectas (Camarilla/Sabbat/Anarquistas) · Disciplinas Nv1-5 · Caminos de Iluminación · Generación · Pool de Sangre |
| **W20** | 13 Tribus · Augurios · Razas · Dones por Rango · Ritos · Gnosis · Rabia · Renombre |
| **M20** | 9 Tradiciones · 9 Esferas Nv0-5 · Areté · Quintaesencia · Paradoja · Resonancia |
| **Común** | 9 Atributos · 30 Habilidades · Trasfondos · Méritos y Defectos · Virtudes · Fuerza de Voluntad · Salud |

> ⚠️ **Nota:** Este proyecto usa **exclusivamente** terminología de las ediciones 20 Aniversario. No se soporta ni referencia ningún contenido de las ediciones de 5ª Generación (V5/W5/M5).

---

## 🗺️ Roadmap

- [x] **Fase 1** — Fundación: monorepo, modelos DB, dependencias
- [x] **Fase 2** — API Base: CRUD completo, JWT auth, schemas Pydantic v2
- [x] **Fase 3** — Frontend Base: design system, UI Kit, 6 vistas con mock data
- [ ] **Fase 4** — IA & Seed: pipeline RAG, Oráculo del Grimorio, Forja de PNJs
- [ ] **Fase 5** — Integración: conectar frontend con API real, Supabase Auth
- [ ] **Fase 6** — Deploy: Vercel (frontend) + Railway/Render (backend)

---

## 🤝 Contribuir

El proyecto usa **Conventional Commits**:

```bash
feat(backend): add character CRUD endpoints
fix(frontend): resolve z-index in Sidebar
docs(handoff): update ADR-008 with vite cacheDir fix
```

Antes de contribuir, lee el `handoff.md` para entender el estado actual del proyecto y las decisiones arquitectónicas registradas.

---

## 📄 Licencia

MIT — ver [LICENSE](LICENSE)

---

<div align="center">
  <sub>Construido con ⚡ por Narradores, para Narradores · Mundo de Tinieblas es propiedad de Paradox Interactive</sub>
</div>
