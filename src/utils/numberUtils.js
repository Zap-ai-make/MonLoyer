/**
 * Utilitaires pour la validation et conversion des nombres
 */

/**
 * Convertit une valeur en nombre sécurisé (parseFloat avec validation NaN)
 * @param {*} value - Valeur à convertir
 * @param {number} defaultValue - Valeur par défaut si conversion échoue
 * @returns {number} Nombre converti ou valeur par défaut
 */
export const safeParseFloat = (value, defaultValue = 0) => {
  if (value === null || value === undefined || value === '') {
    return defaultValue
  }

  const parsed = parseFloat(value)
  return isNaN(parsed) ? defaultValue : parsed
}

/**
 * Convertit une valeur en entier sécurisé (parseInt avec validation NaN)
 * @param {*} value - Valeur à convertir
 * @param {number} defaultValue - Valeur par défaut si conversion échoue
 * @param {number} radix - Base de conversion (défaut: 10)
 * @returns {number} Entier converti ou valeur par défaut
 */
export const safeParseInt = (value, defaultValue = 0, radix = 10) => {
  if (value === null || value === undefined || value === '') {
    return defaultValue
  }

  const parsed = parseInt(value, radix)
  return isNaN(parsed) ? defaultValue : parsed
}

/**
 * Formate un montant en FCFA avec séparateurs de milliers
 * @param {number|string} amount - Montant à formater
 * @param {boolean} includeCurrency - Inclure "FCFA" dans le résultat
 * @returns {string} Montant formaté
 */
export const formatCurrency = (amount, includeCurrency = true) => {
  const numAmount = safeParseFloat(amount, 0)
  const formatted = Math.round(numAmount).toLocaleString('fr-FR')
  return includeCurrency ? `${formatted} FCFA` : formatted
}

/**
 * Valide qu'une valeur est un nombre valide dans une plage
 * @param {*} value - Valeur à valider
 * @param {number} min - Valeur minimale (optionnel)
 * @param {number} max - Valeur maximale (optionnel)
 * @returns {boolean} true si valide
 */
export const isValidNumber = (value, min = null, max = null) => {
  const num = parseFloat(value)

  if (isNaN(num)) {
    return false
  }

  if (min !== null && num < min) {
    return false
  }

  if (max !== null && num > max) {
    return false
  }

  return true
}

/**
 * Calcule un pourcentage de manière sécurisée
 * @param {number|string} value - Valeur
 * @param {number|string} total - Total
 * @param {number} decimals - Nombre de décimales (défaut: 1)
 * @returns {number} Pourcentage calculé
 */
export const calculatePercentage = (value, total, decimals = 1) => {
  const numValue = safeParseFloat(value, 0)
  const numTotal = safeParseFloat(total, 0)

  if (numTotal === 0) {
    return 0
  }

  const percentage = (numValue / numTotal) * 100
  return parseFloat(percentage.toFixed(decimals))
}

/**
 * Arrondit un nombre à un nombre spécifique de décimales
 * @param {number|string} value - Valeur à arrondir
 * @param {number} decimals - Nombre de décimales
 * @returns {number} Valeur arrondie
 */
export const roundTo = (value, decimals = 2) => {
  const num = safeParseFloat(value, 0)
  const multiplier = Math.pow(10, decimals)
  return Math.round(num * multiplier) / multiplier
}

/**
 * Vérifie si une valeur est un entier positif
 * @param {*} value - Valeur à vérifier
 * @returns {boolean} true si entier positif
 */
export const isPositiveInteger = (value) => {
  const num = safeParseInt(value, -1)
  return num >= 0 && Number.isInteger(num)
}
