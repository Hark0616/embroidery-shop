import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        industrial: {
          black: '#0a0a0a',
          gray: '#171717',
          light: '#f5f5f5',
          warning: '#EAB308', // Yellow-500
          text: '#ffffff',
          'text-muted': '#a3a3a3', // Neutral-400
        },
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'sans-serif'], // Inter bold
        body: ['var(--font-body)', 'sans-serif'], // Inter
        mono: ['monospace'], // For technical details
      },
    },
  },
  plugins: [],
}
export default config
