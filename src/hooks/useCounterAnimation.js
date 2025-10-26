import { useState, useEffect, useRef } from 'react'

/**
 * Hook personnalisé pour animer les compteurs numériques
 * @param {number} end - Valeur finale du compteur
 * @param {number} duration - Durée de l'animation en ms (défaut: 2000)
 * @param {boolean} enabled - Activer/désactiver l'animation (défaut: true)
 * @returns {number} - Valeur animée actuelle
 */
export function useCounterAnimation(end, duration = 2000, enabled = true) {
  const [count, setCount] = useState(0)
  const startTimeRef = useRef(null)
  const requestRef = useRef(null)

  useEffect(() => {
    if (!enabled) {
      setCount(end)
      return
    }

    // Réinitialiser si la valeur cible change
    startTimeRef.current = null
    setCount(0)

    const animate = (timestamp) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp
      }

      const progress = timestamp - startTimeRef.current
      const percentage = Math.min(progress / duration, 1)

      // Utiliser une fonction d'easing (easeOutQuart) pour un effet plus naturel
      const easeOut = 1 - Math.pow(1 - percentage, 4)
      const currentCount = Math.floor(easeOut * end)

      setCount(currentCount)

      if (percentage < 1) {
        requestRef.current = requestAnimationFrame(animate)
      } else {
        setCount(end) // S'assurer que la valeur finale est exacte
      }
    }

    requestRef.current = requestAnimationFrame(animate)

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [end, duration, enabled])

  return count
}

/**
 * Hook pour animer les pourcentages
 * @param {number} end - Valeur finale (0-100)
 * @param {number} duration - Durée de l'animation en ms
 * @returns {number} - Valeur animée actuelle
 */
export function usePercentageAnimation(end, duration = 2000) {
  return useCounterAnimation(end, duration)
}

export default useCounterAnimation
