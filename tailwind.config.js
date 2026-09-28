/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#040b16', // Deep atmospheric navy
        panel: 'rgba(10, 20, 38, 0.7)', // Glassmorphism panel
        panelBorder: 'rgba(30, 60, 100, 0.5)',
        primary: '#0ea5e9', // Cyan/blue accent
        secondary: '#38bdf8',
        accent: '#22d3ee',
        textMain: '#f8fafc',
        textMuted: '#94a3b8',
        danger: '#ef4444',
        warning: '#f59e0b',
        success: '#10b981',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
