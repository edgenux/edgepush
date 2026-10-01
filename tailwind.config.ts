import { type Config } from "tailwindcss"

const oklch = (token: string) => `oklch(var(${token}) / <alpha-value>)`

const config = {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		fontFamily: {
  			sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
  			mono: ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
  		},
  		fontSize: {
  			xs: ['12px', { lineHeight: '16px' }],
  			sm: ['13px', { lineHeight: '20px' }],
  			base: ['14px', { lineHeight: '21px' }],
  			lg: ['16px', { lineHeight: '24px' }],
  			xl: ['20px', { lineHeight: '28px' }],
  			'2xl': ['24px', { lineHeight: '32px' }],
  			'3xl': ['30px', { lineHeight: '36px' }],
  			'4xl': ['36px', { lineHeight: '40px' }],
  		},
  		colors: {
  			border: oklch('--border'),
  			input: oklch('--input'),
  			ring: oklch('--ring'),
  			background: oklch('--background'),
  			foreground: oklch('--foreground'),
  			canvas: oklch('--canvas'),
  			sidebar: {
  				DEFAULT: oklch('--sidebar'),
  				foreground: oklch('--sidebar-foreground'),
  			},
  			primary: {
  				DEFAULT: oklch('--primary'),
  				foreground: oklch('--primary-foreground'),
  			},
  			secondary: {
  				DEFAULT: oklch('--secondary'),
  				foreground: oklch('--secondary-foreground'),
  			},
  			destructive: {
  				DEFAULT: oklch('--destructive'),
  				foreground: oklch('--destructive-foreground'),
  			},
  			muted: {
  				DEFAULT: oklch('--muted'),
  				foreground: oklch('--muted-foreground'),
  			},
  			accent: {
  				DEFAULT: oklch('--accent'),
  				foreground: oklch('--accent-foreground'),
  			},
  			popover: {
  				DEFAULT: oklch('--popover'),
  				foreground: oklch('--popover-foreground'),
  			},
  			card: {
  				DEFAULT: oklch('--card'),
  				foreground: oklch('--card-foreground'),
  			},
  			kumo: {
  				base: oklch('--kumo-base'),
  				elevated: oklch('--kumo-elevated'),
  				recessed: oklch('--kumo-recessed'),
  				tint: oklch('--kumo-tint'),
  				fill: oklch('--kumo-fill'),
  				'fill-hover': oklch('--kumo-fill-hover'),
  				brand: oklch('--kumo-brand'),
  				'brand-hover': oklch('--kumo-brand-hover'),
  				'text-brand': 'var(--kumo-text-brand)',
  				'text-strong': oklch('--kumo-text-strong'),
  				'text-danger': oklch('--kumo-text-danger'),
  				link: oklch('--kumo-text-link'),
  				success: oklch('--kumo-success'),
  				'success-tint': oklch('--kumo-success-tint'),
  				'danger-tint': oklch('--kumo-danger-tint'),
  				'info-tint': oklch('--kumo-info-tint'),
  				focus: oklch('--kumo-focus'),
  				line: 'oklch(14.5% 0 0 / 0.1)',
  				hairline: oklch('--border'),
  			},
  			chart: {
  				'1': oklch('--chart-1'),
  				'2': oklch('--chart-2'),
  				'3': oklch('--chart-3'),
  				'4': oklch('--chart-4'),
  				'5': oklch('--chart-5'),
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		boxShadow: {
  			kumo: '0 4px 16px oklch(0% 0 0 / 0.08), 0 0 0 1px oklch(14.5% 0 0 / 0.1)',
  			'kumo-sm': '0 1px 2px oklch(0% 0 0 / 0.06), 0 0 0 1px oklch(14.5% 0 0 / 0.08)',
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
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
