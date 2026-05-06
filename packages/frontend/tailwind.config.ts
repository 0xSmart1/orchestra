import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
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
          400: '#3a3a4a',
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
      borderRadius: {
        sm: '2px',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
