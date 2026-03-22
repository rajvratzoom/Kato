/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        kato: {
          50: '#f0f4ff',
          100: '#dbe4ff',
          200: '#bac8ff',
          300: '#91a7ff',
          400: '#748ffc',
          500: '#5c7cfa',
          600: '#4c6ef5',
          700: '#4263eb',
          800: '#3b5bdb',
          900: '#364fc7',
        },
        dark: {
          primary: '#1a1a1e',
          surface: '#222326',
          elevated: '#2a2a2e',
        },
        light: {
          primary: '#f7f6f0',
          surface: '#ffffff',
        },
      },
      borderColor: {
        subtle: {
          DEFAULT: 'rgba(0,0,0,0.06)',
          dark: 'rgba(255,255,255,0.06)',
        },
      },
      textColor: {
        'primary-dark': '#f4f5f8',
        'secondary-dark': 'rgba(255,255,255,0.5)',
        'muted-dark': 'rgba(255,255,255,0.3)',
      },
      fontSize: {
        'body': '13px',
        'label': '11px',
        'heading': '15px',
      },
    },
  },
  plugins: [],
}
