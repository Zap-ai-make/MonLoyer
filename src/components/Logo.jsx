import { memo } from 'react'
import { COLORS } from '../constants/colors'

/**
 * Composant Logo - Logo de l'application avec icône maison
 * @param {Object} props
 * @param {string} props.className - Classes CSS additionnelles
 * @param {'sm'|'md'|'lg'|'xl'} props.size - Taille du logo
 * @param {boolean} props.showText - Afficher le texte à côté du logo
 * @param {string} props.customText - Texte personnalisé (défaut: 'Woning')
 */
const Logo = memo(function Logo({ className = "", size = "md", showText = true, customText = null }) {
  const sizes = {
    sm: { icon: 24, text: "text-sm" },
    md: { icon: 32, text: "text-lg" },
    lg: { icon: 40, text: "text-2xl" },
    xl: { icon: 48, text: "text-3xl" }
  }

  const currentSize = sizes[size] || sizes.md

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width={currentSize.icon}
        height={currentSize.icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Icône maison moderne minimaliste */}
        <rect x="8" y="20" width="32" height="22" rx="2" fill={COLORS.primary.DEFAULT} />
        <path d="M24 6L40 18V20H8V18L24 6Z" fill={COLORS.secondary.DEFAULT} />
        {/* Porte */}
        <rect x="18" y="30" width="8" height="12" rx="1" fill={COLORS.neutral.DEFAULT} />
        {/* Fenêtre */}
        <rect x="28" y="26" width="6" height="6" rx="1" fill={COLORS.neutral.DEFAULT} opacity="0.9" />
        {/* Accent */}
        <circle cx="22" cy="36" r="1" fill={COLORS.warning.DEFAULT} />
      </svg>

      {showText && (
        <span className={`font-display font-bold ${currentSize.text}`} style={{ color: 'inherit' }}>
          {customText || 'Woning'}
        </span>
      )}
    </div>
  )
})

export default Logo
