import { useState } from 'react'
import { COLORS } from '../constants/colors'

function IconButton({
  icon: Icon,
  onClick,
  disabled = false,
  ariaLabel,
  variant = 'default', // 'default' | 'primary'
  className = ''
}) {
  const [isHovered, setIsHovered] = useState(false)

  const getStyles = () => {
    if (variant === 'primary') {
      // Bouton d'envoi (vert)
      return {
        backgroundColor: isHovered && !disabled ? COLORS.secondary.hover : COLORS.secondary.DEFAULT,
        color: COLORS.white
      }
    }

    // Bouton par défaut (blanc avec bordure)
    return {
      backgroundColor: isHovered && !disabled ? COLORS.secondary.DEFAULT : COLORS.white,
      color: isHovered && !disabled ? COLORS.white : COLORS.neutral[500],
      border: `1px solid ${isHovered && !disabled ? COLORS.secondary.DEFAULT : COLORS.neutral[100]}`
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => !disabled && setIsHovered(false)}
      className={`p-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={getStyles()}
      aria-label={ariaLabel}
    >
      <Icon className="w-5 h-5" />
    </button>
  )
}

export default IconButton
