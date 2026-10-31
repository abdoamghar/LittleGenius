/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./app/**/*.{ts,tsx,js,jsx}", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		opacity: Object.fromEntries(Array.from({ length: 101 }, (_, i) => [i, `${i / 100}`])),
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			xl: 'calc(var(--radius) + 4px)',
  			'2xl': 'calc(var(--radius) + 10px)',
  			'3xl': 'calc(var(--radius) + 18px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
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
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			/* LittleGenius brand palette */
  			ink: '#16233A',
  			inkMuted: '#4C5A73',
  			cream: '#FBF6EC',
  			paper: '#FFFDF8',
  			navy: {
  				50: '#EEF3FA',
  				100: '#DCE6F4',
  				200: '#C2D4EC',
  				300: '#9CB6DA',
  				400: '#5B84BC',
  				500: '#2E5FA3',
  				600: '#1B4C8F',
  				700: '#163E75',
  				800: '#12305A'
  			},
  			sun: {
  				50: '#FEF9E8',
  				100: '#FDF0CC',
  				200: '#FBE59F',
  				300: '#F9DC86',
  				400: '#F7C948',
  				500: '#E8B22B',
  				600: '#C08F16'
  			},
  			leaf: {
  				50: '#EEF5EF',
  				100: '#E4EFE5',
  				200: '#CDE1D0',
  				400: '#8FB89A',
  				500: '#6E9C7C',
  				600: '#4E7C5D'
  			},
  			coral: {
  				50: '#FDF1EC',
  				100: '#FBE4DC',
  				200: '#F7C9B9',
  				400: '#EF8A6B',
  				600: '#C4603F'
  			},
  			sky: {
  				50: '#EFF6FC',
  				100: '#E2EEF8',
  				200: '#C6DFF3',
  				400: '#7FB2DC',
  				600: '#3A6FA0'
  			},
  			plum: {
  				50: '#F4F0FA',
  				100: '#EDE6F6',
  				200: '#DBCFF0',
  				400: '#9C86C6',
  				600: '#6B4E9B'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		fontFamily: {
  			heading: ['var(--font-heading)'],
  			body: ['var(--font-body)'],
  			display: ['var(--font-display)'],
  			mono: ['var(--font-mono)']
  		},
  		boxShadow: {
  			paper: '0 1px 0 0 rgba(22,35,58,0.05), 0 10px 30px -18px rgba(22,35,58,0.35)',
  			lift: '0 2px 0 0 rgba(22,35,58,0.06), 0 18px 40px -22px rgba(22,35,58,0.45)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'lg-rise': {
  				from: { opacity: '0', transform: 'translateY(10px)' },
  				to: { opacity: '1', transform: 'translateY(0px)' }
  			},
  			'lg-pop': {
  				'0%': { opacity: '0', transform: 'scale(0.94)' },
  				'70%': { transform: 'scale(1.02)' },
  				'100%': { opacity: '1', transform: 'scale(1)' }
  			},
  			'lg-wiggle': {
  				'0%, 100%': { transform: 'rotate(-2deg)' },
  				'50%': { transform: 'rotate(2deg)' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'lg-rise': 'lg-rise 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
  			'lg-pop': 'lg-pop 0.32s cubic-bezier(0.22, 1, 0.36, 1) both',
  			'lg-wiggle': 'lg-wiggle 2.4s ease-in-out infinite'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
