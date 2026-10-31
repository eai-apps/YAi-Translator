/** Tailwind CSS: цвета берутся из CSS-переменных, чтобы работали темы. */
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page: 'var(--color-page)',
        card: 'var(--color-card)',
        soft: 'var(--color-soft)',
        ink: 'var(--color-ink)',
        muted: 'var(--color-muted)',
        line: 'var(--color-line)',
        accent: 'var(--color-accent)',
        accentSoft: 'var(--color-accent-soft)',
        accentInk: 'var(--color-accent-ink)',
        der: 'var(--color-der)',
        die: 'var(--color-die)',
        das: 'var(--color-das)',
        success: 'var(--color-success)',
        danger: 'var(--color-danger)',
        warning: 'var(--color-warning)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Unbounded', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '14px',
        '2xl': '18px',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        pop: 'var(--shadow-pop)',
      },
      maxWidth: {
        reading: '46rem',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
      },
      animation: {
        'fade-in': 'fade-in 180ms ease-out',
        'pulse-soft': 'pulse-soft 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
