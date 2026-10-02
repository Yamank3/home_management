/** @type {import('tailwindcss').Config} */
// The gray scale is driven by CSS variables (see index.css) so every page
// supports dark mode without per-class `dark:` variants.
const gray = Object.fromEntries(
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((n) => [n, `rgb(var(--gray-${n}) / <alpha-value>)`])
);

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        gray,
        surface: 'rgb(var(--surface) / <alpha-value>)',
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
      },
      borderRadius: { xl: '0.875rem', '2xl': '1.25rem' },
      boxShadow: {
        card: '0 1px 2px rgb(0 0 0 / 0.04), 0 1px 3px rgb(0 0 0 / 0.04)',
        float: '0 8px 24px rgb(0 0 0 / 0.12)',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'none' } },
        'sheet-up': { from: { transform: 'translateY(100%)' }, to: { transform: 'none' } },
      },
      animation: {
        'fade-in': 'fade-in 0.18s ease-out',
        'sheet-up': 'sheet-up 0.22s ease-out',
      },
    },
  },
  plugins: [],
};
