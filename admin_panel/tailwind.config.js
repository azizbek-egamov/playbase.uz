/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4edea3",
        "primary-container": "#10b981",
        "primary-fixed": "#6ffbbe",
        "on-primary": "#003824",
        "on-primary-container": "#00422b",
        
        surface: "#0f131c",
        "surface-dim": "#0f131c",
        "surface-bright": "#353943",
        "surface-container-lowest": "#0a0e17",
        "surface-container-low": "#181b25",
        "surface-container": "#1c1f29",
        "surface-container-high": "#262a34",
        "surface-container-highest": "#31353f",
        
        "on-surface": "#dfe2ef",
        "on-surface-variant": "#bbcabf",
        
        secondary: "#ffb2b7",
        "secondary-container": "#b50036",
        "on-secondary": "#67001b",
        
        tertiary: "#ffb95f",
        "tertiary-container": "#e29100",
        "on-tertiary": "#472a00",
        
        error: "#ffb4ab",
        "error-container": "#93000a",
        "on-error": "#690005",
        
        outline: "#86948a",
        "outline-variant": "#3c4a42",
        
        background: "#0f131c",
        "on-background": "#dfe2ef",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s infinite ease-in-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.02)' },
        }
      }
    },
  },
  plugins: [],
}
