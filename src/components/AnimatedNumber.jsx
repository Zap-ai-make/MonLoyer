import { useCounterAnimation } from '../hooks/useCounterAnimation'

/**
 * Composant pour afficher un nombre avec animation
 * @param {number} value - Valeur à afficher
 * @param {number} duration - Durée de l'animation en ms
 * @param {string} suffix - Suffixe (%, FCFA, etc.)
 * @param {string} className - Classes CSS additionnelles
 * @param {boolean} formatNumber - Formater le nombre avec séparateurs (défaut: true)
 */
function AnimatedNumber({ value, duration = 2000, suffix = '', className = '', formatNumber = true }) {
  const animatedValue = useCounterAnimation(value, duration)

  const displayValue = formatNumber
    ? animatedValue.toLocaleString('fr-FR')
    : animatedValue

  return (
    <span className={className}>
      {displayValue}{suffix}
    </span>
  )
}

export default AnimatedNumber
