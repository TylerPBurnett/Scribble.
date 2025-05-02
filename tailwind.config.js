/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,vue}",
    "./note.html",
    "./settings.html"
  ],
  theme: {
  	extend: {
  		colors: {
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			'primary-dark': '#e69009',
  			background: 'hsl(var(--background))',
  			'background-notes': '#282a36',
  			'background-titlebar': '#21222c',
  			'background-sidebar': '#21222c',
  			border: 'hsl(var(--border))',
  			text: {
  				DEFAULT: '#f8fafc',
  				secondary: '#cbd5e1',
  				tertiary: '#94a3b8'
  			},
  			note: {
  				slate: '#64748b',
  				sky: '#0ea5e9',
  				emerald: '#10b981',
  				amber: '#f59e0b',
  				rose: '#f43f5e',
  				violet: '#8b5cf6'
  			},
  			danger: '#f43f5e',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		backgroundColor: {
  			'white-5': 'rgba(255, 255, 255, 0.05)',
  			'black-10': 'rgba(0, 0, 0, 0.1)',
  			'primary-10': 'rgba(245, 158, 11, 0.1)'
  		},
  		gridTemplateColumns: {
  			'auto-fill-250': 'repeat(auto-fill, minmax(250px, 1fr))'
  		},
  		height: {
  			'note-card': '180px'
  		},
  		width: {
  			sidebar: '240px',
  			'sidebar-compact': '56px'
  		},
  		translate: {
  			sidebar: '240px',
  			'sidebar-compact': '56px'
  		},
  		boxShadow: {
  			card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  			'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  			selected: '0 0 0 2px #f59e0b'
  		},
  		borderWidth: {
  			'3': '3px'
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
  				'sans-serif'
  			],
  			twitter: [
  				'Chirp',
  				'Segoe UI',
  				'Helvetica Neue',
  				'Arial',
  				'sans-serif'
  			]
  		},
  		fontSize: {
  			xs: '0.75rem',
  			sm: '0.875rem',
  			base: '1rem',
  			lg: '1.125rem',
  			xl: '1.25rem'
  		},
  		letterSpacing: {
  			wider: '0.05em'
  		},
  		borderRadius: {
  			DEFAULT: '0.25rem',
  			md: 'calc(var(--radius) - 2px)',
  			lg: 'var(--radius)',
  			full: '9999px',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		transitionProperty: {
  			colors: 'color, background-color, border-color',
  			transform: 'transform',
  			all: 'all'
  		},
  		transitionDuration: {
  			'200': '200ms',
  			'300': '300ms'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
