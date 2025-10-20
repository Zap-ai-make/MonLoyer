/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Charte graphique MonLoyer V2
        primary: {
          DEFAULT: '#003C57', // Bleu pétrole - Confiance, sérieux
          50: '#E8F1F8',
          100: '#C8DFF0',
          200: '#91BFE0',
          300: '#5A9FD1',
          400: '#2379B8',
          500: '#0F4C75',
          600: '#0C3D5E',
          700: '#092E47',
          800: '#061F30',
          900: '#030F18',
        },
        secondary: {
          DEFAULT: '#00B894', // Vert turquoise - Finance, stabilité
          50: '#E8F8F5',
          100: '#C8EFE7',
          200: '#91DFD0',
          300: '#5AD0B8',
          400: '#23C0A0',
          500: '#1ABC9C',
          600: '#15967D',
          700: '#10715E',
          800: '#0B4B3E',
          900: '#05261F',
        },
        accent: {
          DEFAULT: '#F39C12', // Orange doux - CTA, surbrillance
          50: '#FEF5E7',
          100: '#FCE8C2',
          200: '#F9D085',
          300: '#F6B847',
          400: '#F3A00A',
          500: '#F39C12',
          600: '#C27D0E',
          700: '#925E0B',
          800: '#613E07',
          900: '#311F04',
        },
        neutral: {
          DEFAULT: '#F5F7FA', // Gris clair - Fond neutre
          50: '#FFFFFF',
          100: '#F8F9FA',
          200: '#E9ECEF',
          300: '#DEE2E6',
          400: '#CED4DA',
          500: '#ADB5BD',
          600: '#6C757D',
          700: '#495057',
          800: '#343A40',
          900: '#212529',
        },
      },
      fontFamily: {
        // Typographie MonLoyer
        sans: ['Roboto', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'soft-lg': '0 4px 16px rgba(0, 0, 0, 0.1)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
