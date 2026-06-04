/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {

      // ── Paleta Gothic-Punk Modern (design.md) ──────────────────
      colors: {
        // Surface tiers — del fondo más oscuro al más elevado
        surface: {
          DEFAULT:   '#141313',
          dim:       '#141313',
          bright:    '#3a3939',
          lowest:    '#0e0e0e',
          low:       '#1c1b1b',
          base:      '#201f1f',
          high:      '#2a2a2a',
          highest:   '#353434',
        },

        // Text tokens
        'on-surface':         '#e5e2e1',
        'on-surface-variant': '#c4c7c8',
        'text-muted':         '#9ca3af',

        // Borders
        'outline':         '#8e9192',
        'outline-variant': '#444748',

        // ── Faction Accents ─────────────────────────────────────
        // Vampire — Blood Red
        blood: {
          DEFAULT: '#8b1a1a',
          bright:  '#c62828',
          dim:     '#4a0e0e',
          text:    '#f87171',
        },
        // Werewolf — Amber/Ochre
        amber: {
          DEFAULT: '#92400e',
          bright:  '#d97706',
          dim:     '#451a03',
          text:    '#fbbf24',
        },
        // Mage — Deep Purple
        arcane: {
          DEFAULT: '#4c1d95',
          bright:  '#7c3aed',
          dim:     '#2e1065',
          text:    '#a78bfa',
        },

        // ── Legacy aliases (compatibilidad Fase 1-2) ────────────
        'bg-root':       '#141313',
        'bg-container':  '#1c1b1b',
        'bg-elevated':   '#201f1f',
      },

      // ── Tipografías ────────────────────────────────────────────
      fontFamily: {
        playfair: ['"Playfair Display"', 'Georgia', 'serif'],
        inter:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono:     ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },

      // ── Tipografía tipada (design.md typography tokens) ───────
      fontSize: {
        'display-lg': ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg': ['32px', { lineHeight: '40px', fontWeight: '600' }],
        'headline-md': ['28px', { lineHeight: '36px', fontWeight: '600' }],
        'title-md':   ['20px', { lineHeight: '28px', fontWeight: '500' }],
        'body-lg':    ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-sm':    ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'label-caps': ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '600' }],
      },

      // ── Bordes ─────────────────────────────────────────────────
      borderWidth: { '1': '1px', '2': '2px' },
      borderRadius: {
        'sm':  '0.125rem',   // 2px
        DEFAULT: '0.25rem',  // 4px — el borde "punk" del design.md
        'md':  '0.375rem',
        'lg':  '0.5rem',
        'xl':  '0.75rem',
        'full': '9999px',
      },

      // ── Sombras ────────────────────────────────────────────────
      boxShadow: {
        'glow-blood':  '0 0 16px rgba(139, 26, 26, 0.4)',
        'glow-arcane': '0 0 16px rgba(124, 58, 237, 0.35)',
        'glow-amber':  '0 0 16px rgba(217, 119, 6, 0.35)',
        'glow-white':  '0 0 12px rgba(229, 226, 225, 0.15)',
        'panel':       '0 4px 24px rgba(0, 0, 0, 0.7)',
        'modal':       '0 8px 40px rgba(0, 0, 0, 0.85)',
      },

      // ── Espaciado (design.md spacing tokens) ──────────────────
      spacing: {
        'xs': '8px',
        'sm': '16px',
        'md': '24px',
        'lg': '32px',
        'xl': '48px',
        'gutter': '20px',
      },

      // ── Animaciones ────────────────────────────────────────────
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-blood': {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.6' },
        },
        'scan-line': {
          '0%':   { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '0% 100%' },
        },
      },
      animation: {
        'fade-up':    'fade-up 200ms ease forwards',
        'pulse-blood': 'pulse-blood 2s ease-in-out infinite',
      },

      // ── Backdrop blur ──────────────────────────────────────────
      backdropBlur: {
        'sm': '8px',
        DEFAULT: '16px',
        'lg': '24px',
        'xl': '32px',
      },
    },
  },
  plugins: [],
}
