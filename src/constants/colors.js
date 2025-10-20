// Palette de couleurs Woning V2
export const COLORS = {
  // Couleurs principales
  primary: {
    DEFAULT: '#003C57', // Bleu pétrole
    light: 'rgba(0, 60, 87, 0.1)',
    hover: '#00293E'
  },

  secondary: {
    DEFAULT: '#00B894', // Vert turquoise
    light: 'rgba(0, 184, 148, 0.1)',
    hover: '#009977',
    gradient: 'linear-gradient(135deg, #00B894 0%, #00D9A8 100%)'
  },

  // Couleurs neutres
  neutral: {
    DEFAULT: '#F5F7FA', // Gris clair
    50: '#F5F7FA',
    100: '#E9ECEF',
    200: '#DEE2E6',
    300: '#CED4DA',
    400: '#ADB5BD',
    500: '#6C757D',
    600: '#495057',
    700: '#343A40',
    800: '#212529'
  },

  // Couleurs d'état
  success: {
    DEFAULT: '#00B894',
    light: 'rgba(0, 184, 148, 0.1)'
  },

  warning: {
    DEFAULT: '#F39C12',
    light: 'rgba(243, 156, 18, 0.1)'
  },

  error: {
    DEFAULT: '#E74C3C',
    light: 'rgba(231, 76, 60, 0.1)'
  },

  info: {
    DEFAULT: '#003C57',
    light: 'rgba(0, 60, 87, 0.1)'
  },

  // Couleurs spéciales
  gold: '#FFD700',

  // Blanc / Noir
  white: '#FFFFFF',
  black: '#000000'
}

// Gradient principal
export const GRADIENT_PRIMARY = 'linear-gradient(135deg, #003C57 0%, #00B894 100%)'

// Ombres
export const SHADOWS = {
  soft: '0 2px 8px rgba(0, 0, 0, 0.08)',
  medium: '0 4px 12px rgba(0, 0, 0, 0.15)',
  strong: '0 8px 24px rgba(0, 0, 0, 0.25)',
  primary: '0 4px 12px rgba(0, 60, 87, 0.25)',
  secondary: '0 4px 12px rgba(0, 184, 148, 0.3)'
}

export default COLORS
