import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand:    '#00D4AA',
        danger:   '#FF4D6A',
        warning:  '#FFB547',
        info:     '#6C8EFF',
        'bg-base':       '#0A0B0E',
        'bg-surface':    '#111318',
        'bg-elevated':   '#1A1D24',
        'bg-subtle':     '#1E2128',
        'border-dim':    '#1E2535',
        'border-bright': '#2A3045',
        'text-primary':   '#F0F2F5',
        'text-secondary': '#8B92A5',
        'text-muted':     '#4A5065',
      },
      fontFamily: {
        sans:    ['DM Sans', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
        mono:    ['DM Mono', 'monospace'],
        code:    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        xl:  '12px',
        '2xl': '16px',
      },
      animation: {
        'pulse-brand': 'pulseBrand 2s ease-in-out infinite',
        'slide-up':    'slideUp 0.3s ease-out',
        'fade-in':     'fadeIn 0.2s ease-out',
      },
      keyframes: {
        pulseBrand: {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0.6' },
        },
        slideUp: {
          from: { transform: 'translateY(8px)', opacity: '0' },
          to:   { transform: 'translateY(0)',   opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
