import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        surface: { DEFAULT: '#111118', hover: '#1a1a24' },
        border: { DEFAULT: '#2a2a3a', bright: '#3a3a5a' },
        accent: {
          cyan: '#00e5ff',
          green: '#39ff14',
          magenta: '#ff0080',
          amber: '#ffaa00',
          purple: '#b366ff',
        },
        txt: { primary: '#e8e8ef', secondary: '#6a6a80' },
      },
      fontFamily: {
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'Cascadia Code',
          'SF Mono',
          'monospace',
        ],
      },
      borderRadius: {
        pixel: '2px',
      },
    },
  },
  plugins: [],
};

export default config;
