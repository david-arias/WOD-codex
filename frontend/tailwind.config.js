/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class', // 'class' para activar con la clase `dark` en <html>
  theme: {
    extend: {
      // ── Colores del Design System ──────────────────
      colors: {
        'bg-root':       '#121212',
        'bg-container':  '#1a1a1a',
        'bg-elevated':   '#242424',
        'text-primary':  '#e8e6e1',
        'text-secondary':'#a09890',
        'text-muted':    '#6b6560',
        'accent-blood':  '#8b0000',
        'accent-silver': '#c0c0c0',
        'accent-amber':  '#b8860b',
      },

      // ── Tipografías ────────────────────────────────
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', '"Times New Roman"', 'serif'],
        sans:  ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono:  ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },

      // ── Bordes ────────────────────────────────────
      borderColor: {
        ghost:        'rgba(232, 230, 225, 0.08)',
        'ghost-hover':'rgba(232, 230, 225, 0.16)',
      },

      // ── Sombras personalizadas ──────────────────
      boxShadow: {
        'glow-blood': '0 0 20px rgba(139, 0, 0, 0.3)',
        'panel':      '0 4px 16px rgba(0, 0, 0, 0.6)',
      },

      // ── Border radius minimalista ───────────────
      borderRadius: {
        'sm': '2px',
        DEFAULT: '4px',
        'lg': '8px',
      },

      // ── Animaciones ────────────────────────────
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-blood': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(139, 0, 0, 0)' },
          '50%':       { boxShadow: '0 0 12px 2px rgba(139, 0, 0, 0.4)' },
        },
      },
      animation: {
        'fade-in':    'fade-in 200ms ease forwards',
        'pulse-blood':'pulse-blood 2s ease infinite',
      },
    },
  },
  plugins: [],
}
