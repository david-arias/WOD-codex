# 🧠 /.ai-context — Directorio de Agentes IA
> **"Prompts as Code"** — La memoria estructurada del equipo de desarrollo.

Este directorio contiene los perfiles de los 4 agentes que conforman el equipo de desarrollo de **El Códice del Narrador**. Cada archivo define el rol, las habilidades, las restricciones y el contexto de trabajo de cada agente, funcionando como prompts de sistema reutilizables.

---

## 📂 Estructura

```
.ai-context/
├── README.md               ← Este archivo
├── project_context.md      ← Contexto global compartido por todos los agentes
└── agents/
    ├── arquitecto_backend.md
    ├── lider_frontend.md
    ├── ingeniero_ia.md
    └── documentador_tecnico.md
```

---

## 📖 Cómo Usar Este Directorio

Al iniciar una nueva sesión de trabajo, el agente activo debe:

1. Leer `project_context.md` para recordar el estado global.
2. Leer su propio archivo de perfil en `agents/`.
3. Consultar `../handoff.md` para conocer tareas completadas y pendientes.
4. Al finalizar, el 📝 Documentador Técnico actualiza `../handoff.md`.

---

## 🔄 Protocolo de Cambio de Rol

```
🧠 → Cambio a Arquitecto Backend
🎨 → Cambio a Líder Frontend
🤖 → Cambio a Ingeniero de IA
📝 → Cambio a Documentador Técnico
```

Cuando el usuario cambia de rol, el agente activo debe anunciar explícitamente el cambio y releer el perfil correspondiente.
