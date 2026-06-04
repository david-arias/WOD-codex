# 🌍 Contexto Global del Proyecto
> Compartido por todos los agentes. Leer antes de cualquier tarea.

## Identidad del Producto

- **Nombre:** El Códice del Narrador
- **Tipo:** SaaS Web App para Directores de Juego de Rol
- **Juego:** Mundo de Tinieblas — Ediciones 20 Aniversario
  - **V20** — Vampiro: La Mascarada
  - **W20** — Hombre Lobo: El Apocalipsis
  - **M20** — Mago: La Ascensión

## Reglas Fundamentales del Sistema

### Terminología Bloqueada (NUNCA usar)
- ❌ "Humanidad" como stat de Vampiro 5ª Ed (es "Humanidad" en V20 también, pero sin el sistema de Crónica Oscura de V5)
- ❌ Cualquier clan, disciplina o regla exclusiva de V5/W5/M5
- ❌ "Resonancia", "Hunger dice", "Compulsions" (terminología V5)

### Terminología Correcta V20/W20/M20
- ✅ **Virtudes:** Conciencia (o Convicción), Autocontrol (o Instinto), Valor
- ✅ **Caminos de Iluminación** (no "Humanidad" como único camino en vampiros)
- ✅ **Disciplinas** (Vampiro), **Dones** (Hombre Lobo), **Esferas** (Mago)
- ✅ **Sectas** (Camarilla, Sabbat, Anarquistas, Independientes)
- ✅ **Clanes** (13 clanes V20), **Tribus** (13 tribus W20), **Tradiciones** (9 Tradiciones M20)
- ✅ **Méritos y Defectos** (sistema de puntos opcionales)
- ✅ **Trasfondos** (no "Advantages" al estilo V5)

## Stack Tecnológico (Resumen Rápido)

| Capa | Tech | Notas |
|------|------|-------|
| Frontend | React 18, Vite, Tailwind CSS, Zustand | Sin librerías de componentes prefabricadas |
| Backend | Python 3.11, FastAPI, SQLAlchemy 2.0 | Pydantic v2 para schemas |
| DB & Auth | Supabase (PostgreSQL), JWT | RLS activado |
| IA | LangChain, ChromaDB, Groq/Gemini/Ollama | RAG sobre game_rules |
| Deploy | Vercel (Frontend), local o Free Tier (Backend) | $0/mes |

## Principio de Ground Truth

```
❌ MAL: "Según mis conocimientos, Potencia nivel 3 permite..."
✅ BIEN: SELECT * FROM game_rules WHERE name = 'Potencia' AND level = 3;
          → LLM interpreta el resultado, no lo inventa
```

## Paleta Visual

```css
--bg-root:        #121212;   /* Fondo raíz */
--bg-container:   #1a1a1a;   /* Contenedores */
--bg-elevated:    #242424;   /* Elementos elevados */
--text-primary:   #e8e6e1;   /* Off-white principal */
--text-secondary: #a09890;   /* Texto secundario */
--text-muted:     #6b6560;   /* Texto apagado */
--border-ghost:   rgba(232, 230, 225, 0.08);  /* Ghost Border */
--accent-blood:   #8b0000;   /* Rojo sangre — acento primario */
--accent-silver:  #c0c0c0;   /* Plata — acento secundario */
--accent-amber:   #b8860b;   /* Ámbar — acento terciario */
```

## Tipografía

- **Títulos:** `Playfair Display` (serif, elegante, gótico)
- **UI / Cuerpo:** `Inter` (sans-serif, legible, moderno)
- **Código / Stats:** `JetBrains Mono` (monospace)
