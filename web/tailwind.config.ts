import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1.25rem',
      screens: { '2xl': '1280px' },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-jakarta)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'var(--font-jakarta)', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        // PayFollows fintech brand ramp (reference orange roles -> violet)
        brand: {
          DEFAULT: '#7c3aed',
          bright: '#9f67ff',
          soft: '#b990ff',
          lavender: '#c4b5fd',
          deep: '#5b21b6',
        },
        // Midnight-indigo surface ramp (reference espresso roles)
        ink: {
          950: '#0a0712',
          900: '#120d1f',
          850: '#181127',
          800: '#221a36',
          700: '#2c2347',
          600: '#3a2f5c',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        surface: {
          DEFAULT: 'rgba(255,255,255,0.04)',
          strong: 'rgba(255,255,255,0.07)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
        '3xl': 'calc(var(--radius) + 14px)',
      },
      boxShadow: {
        'glow-xs': '0 0 10px rgba(139, 92, 246, 0.35)',
        'glow-sm': '0 0 18px rgba(124, 58, 237, 0.45)',
        glow: '0 0 32px rgba(124, 58, 237, 0.5)',
        'glow-lg': '0 0 70px rgba(124, 58, 237, 0.38)',
        'glow-brand': '0 10px 34px -8px rgba(124, 58, 237, 0.65)',
        card: '0 14px 44px -16px rgba(0, 0, 0, 0.65)',
        'card-hover': '0 22px 60px -18px rgba(124, 58, 237, 0.35)',
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, #7c3aed 0%, #9f67ff 52%, #b990ff 100%)',
        'brand-gradient': 'linear-gradient(135deg, #7c3aed 0%, #9f67ff 52%, #b990ff 100%)',
        'brand-gradient-soft': 'linear-gradient(135deg, rgba(124,58,237,0.22) 0%, rgba(159,103,255,0.12) 100%)',
        'radial-fade': 'radial-gradient(ellipse at top, rgba(124, 58, 237, 0.20), transparent 58%)',
        'ambient-glow':
          'radial-gradient(900px 520px at 82% -12%, rgba(124, 58, 237, 0.16), transparent 60%), radial-gradient(720px 460px at -5% 8%, rgba(59, 130, 246, 0.08), transparent 60%)',
        'grid-pattern':
          'linear-gradient(rgba(167, 139, 250, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(167, 139, 250, 0.05) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '44px 44px',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(124,58,237,0.0)' },
          '50%': { boxShadow: '0 0 24px 2px rgba(124,58,237,0.35)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        float: 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        marquee: 'marquee 32s linear infinite',
        'glow-pulse': 'glow-pulse 3.2s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
