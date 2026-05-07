import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#2a2420',
          900: '#1a1614',
          800: '#352f2a',
          700: '#403832',
          hover: '#352f2a',
        },
        border: {
          DEFAULT: '#4a403a',
          600: '#4a403a',
          500: '#5a4e46',
          400: '#6b5d54',
          bright: '#63564d',
        },
        'accent-cyan': '#c8956c',
        'accent-green': '#7c9a5e',
        'accent-magenta': '#c75050',
        'accent-amber': '#d4a574',
        'accent-purple': '#8b7355',
        txt: {
          primary: '#f5ebe0',
          secondary: '#a89f94',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
      },
      borderRadius: {
        pixel: '2px',
      },
      animation: {
        'pixel-blink': 'pixel-blink 1s step-end infinite',
        'pixel-pulse': 'pixel-pulse 1.5s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'glow-cyan': 'glow-cyan 2s ease-in-out infinite',
        'glow-green': 'glow-green 2s ease-in-out infinite',
        'glow-amber': 'glow-amber 2s ease-in-out infinite',
        'slide-in': 'slide-in 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
      },
      keyframes: {
        'pixel-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'pixel-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 4px rgba(0,229,255,0.3)' },
          '50%': { boxShadow: '0 0 12px rgba(0,229,255,0.6)' },
        },
        'glow-cyan': {
          '0%, 100%': { boxShadow: '0 0 6px rgba(0,229,255,0.15), inset 0 0 6px rgba(0,229,255,0.05)' },
          '50%': { boxShadow: '0 0 14px rgba(0,229,255,0.35), inset 0 0 10px rgba(0,229,255,0.1)' },
        },
        'glow-green': {
          '0%, 100%': { boxShadow: '0 0 6px rgba(57,255,20,0.15), inset 0 0 6px rgba(57,255,20,0.05)' },
          '50%': { boxShadow: '0 0 14px rgba(57,255,20,0.35), inset 0 0 10px rgba(57,255,20,0.1)' },
        },
        'glow-amber': {
          '0%, 100%': { boxShadow: '0 0 6px rgba(255,170,0,0.15), inset 0 0 6px rgba(255,170,0,0.05)' },
          '50%': { boxShadow: '0 0 14px rgba(255,170,0,0.35), inset 0 0 10px rgba(255,170,0,0.1)' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
