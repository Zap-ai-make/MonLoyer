import { COLORS, GRADIENT_PRIMARY, SHADOWS } from './colors'

/**
 * Styles constants pour le Dashboard
 * Évite la recréation d'objets style à chaque render
 */

// Style pour la carte d'en-tête avec gradient
export const HEADER_CARD_STYLE = {
  background: GRADIENT_PRIMARY,
  boxShadow: SHADOWS.primary
}

// Style pour le titre principal
export const HEADER_TITLE_STYLE = {
  color: COLORS.white,
  fontFamily: 'Poppins, sans-serif'
}

// Style pour le sous-titre de l'en-tête
export const HEADER_SUBTITLE_STYLE = {
  color: 'rgba(255, 255, 255, 0.95)'
}

// Style pour l'icône de fond de l'en-tête
export const HEADER_ICON_STYLE = {
  color: COLORS.white
}

// Style pour les cartes statistiques
export const STAT_CARD_STYLE = {
  backgroundColor: COLORS.white,
  boxShadow: SHADOWS.soft
}

// Style pour les cartes statistiques au hover
export const STAT_CARD_HOVER_STYLE = {
  boxShadow: SHADOWS.medium
}

// Fonction pour générer le style d'un wrapper d'icône
export const getIconWrapperStyle = (iconBg) => ({
  backgroundColor: iconBg
})

// Style pour les valeurs de statistiques
export const STAT_VALUE_STYLE = {
  color: COLORS.neutral[800],
  fontFamily: 'Poppins, sans-serif'
}

// Style pour les labels de statistiques
export const STAT_LABEL_STYLE = {
  color: COLORS.neutral[500]
}

// Style pour les cartes financières
export const FINANCE_CARD_STYLE = {
  backgroundColor: COLORS.white,
  boxShadow: SHADOWS.soft
}

// Fonction pour l'animation de slideUp
export const getSlideUpAnimation = (index) => ({
  animation: `slideUp 0.6s ease-out ${index * 0.1}s backwards`
})

// Style pour l'icône Sparkles animée
export const SPARKLES_ICON_STYLE = {
  color: COLORS.gold
}

export default {
  HEADER_CARD_STYLE,
  HEADER_TITLE_STYLE,
  HEADER_SUBTITLE_STYLE,
  HEADER_ICON_STYLE,
  STAT_CARD_STYLE,
  STAT_CARD_HOVER_STYLE,
  getIconWrapperStyle,
  STAT_VALUE_STYLE,
  STAT_LABEL_STYLE,
  FINANCE_CARD_STYLE,
  getSlideUpAnimation,
  SPARKLES_ICON_STYLE
}
