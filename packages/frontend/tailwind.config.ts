import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          900: '#0a0a0f',
          800: '#12121a',
          700: '#1a1a2e',
        },
        border: {
          600: '#2a2a3a',
          500: '#3a3a4a',
          400: '#4a4a5a',
        },
        'accent-cyan': '#00e5ff',
        'accent-green': '#39ff14',
        'accent-magenta': '#ff0080',
        'accent-amber': '#ffaa00',
        'accent-purple': '#b366ff',
        txt: {
          primary: '#e0e0e0',
          secondary: '#888888',
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
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        'pixel-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 4px rgba(0,229,255,0.3)' },
          '50%': { boxShadow: '0 0 12px rgba(0,229,255,0.6)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
