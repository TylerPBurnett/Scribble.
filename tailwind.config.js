/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,vue}",
    "./note.html",
    "./settings.html"
  ],
  theme: {
    extend: {
      colors: {
        // Exact colors from the CSS variables in app.css.bak
        primary: '#f59e0b', // --accent-primary
        'primary-dark': '#e69009', // hover state from CSS
        background: {
          DEFAULT: '#0f172a', // --bg-primary
          secondary: '#1e293b', // --bg-secondary
          tertiary: '#334155', // --bg-tertiary
        },
        border: '#334155', // --border-color
        text: {
          DEFAULT: '#f8fafc', // --text-primary
          secondary: '#cbd5e1', // --text-secondary
          tertiary: '#94a3b8', // --text-tertiary
        },
        // Note card accent colors
        note: {
          slate: '#64748b', // --color-slate
          sky: '#0ea5e9', // --color-sky
          emerald: '#10b981', // --color-emerald
          amber: '#f59e0b', // --color-amber
          rose: '#f43f5e', // --color-rose
          violet: '#8b5cf6', // --color-violet
        },
        danger: '#f43f5e', // --color-rose for delete actions
      },
      backgroundColor: {
        'white-5': 'rgba(255, 255, 255, 0.05)', // For dropdown menu hover
        'black-10': 'rgba(0, 0, 0, 0.1)', // For note footer
        'primary-10': 'rgba(245, 158, 11, 0.1)', // For active nav item
      },
      gridTemplateColumns: {
        'auto-fill-250': 'repeat(auto-fill, minmax(250px, 1fr))',
      },
      height: {
        'note-card': '180px',
      },
      width: {
        'sidebar': '240px',
        'sidebar-compact': '56px',
      },
      translate: {
        'sidebar': '240px',
        'sidebar-compact': '56px',
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', // --card-shadow
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', // From CSS
        'selected': '0 0 0 2px #f59e0b', // For selected note card
      },
      borderWidth: {
        '3': '3px', // For the note card left border
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Open Sans',
          'Helvetica Neue',
          'sans-serif',
        ],
      },
      fontSize: {
        'xs': '0.75rem', // 12px
        'sm': '0.875rem', // 14px
        'base': '1rem', // 16px
        'lg': '1.125rem', // 18px
        'xl': '1.25rem', // 20px
      },
      letterSpacing: {
        'wider': '0.05em', // For section titles
      },
      borderRadius: {
        'DEFAULT': '0.25rem', // 4px
        'md': '0.375rem', // 6px
        'lg': '0.5rem', // 8px
        'full': '9999px', // For rounded elements
      },
      transitionProperty: {
        'colors': 'color, background-color, border-color',
        'transform': 'transform',
        'all': 'all',
      },
      transitionDuration: {
        '200': '200ms',
        '300': '300ms',
      },
    },
  },
  plugins: [],
}
