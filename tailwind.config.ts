import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/modules/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          goldDark: '#7a580f',
          goldLight: '#c59b4e',
          emerald: '#1b6d24',
          ivory: '#fcf9f8',
          ink: '#1f1a14',
          muted: '#6e6253',
          border: '#eadfce',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Outfit"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        editorial: '0 10px 30px -5px rgba(122, 88, 15, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
