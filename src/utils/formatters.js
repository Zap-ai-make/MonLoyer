import { safeParseFloat, formatCurrency } from './numberUtils'

/**
 * Formateurs utilitaires pour Woning.cloud
 * Fonctions de formatage pour dates, heures, pourcentages et devises
 */

// Ré-exporter formatCurrency de numberUtils pour compatibilité
export { formatCurrency }

/**
 * Formate un nombre en pourcentage
 * @param {number|string} value - Valeur à formatter
 * @param {number} decimals - Nombre de décimales (défaut: 0)
 * @returns {string} Valeur formatée avec symbole % (ex: "75%")
 * @example
 * formatPercentage(75.5, 1) // "75.5%"
 * formatPercentage(100) // "100%"
 */
export const formatPercentage = (value, decimals = 0) => {
  const numValue = safeParseFloat(value, 0)
  return `${numValue.toFixed(decimals)}%`
}

/**
 * Formate une date au format français
 * @param {Date|string} date - Date à formatter
 * @param {Object} options - Options de formatage (optionnel)
 * @returns {string} Date formatée (ex: "23/01/2025")
 * @example
 * formatDate(new Date()) // "23/01/2025"
 * formatDate("2025-01-23") // "23/01/2025"
 */
export const formatDate = (date, options = {}) => {
  if (!(date instanceof Date)) {
    date = new Date(date)
  }
  return date.toLocaleDateString('fr-FR', options)
}

/**
 * Formate une heure au format français
 * @param {Date|string} date - Date/heure à formatter
 * @returns {string} Heure formatée (ex: "14:30")
 * @example
 * formatTime(new Date()) // "14:30"
 */
export const formatTime = (date) => {
  if (!(date instanceof Date)) {
    date = new Date(date)
  }
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Obtient le nom complet du mois en français
 * @param {number} monthIndex - Index du mois (0-11)
 * @returns {string} Nom du mois (ex: "Janvier")
 * @example
 * getMonthName(0) // "Janvier"
 * getMonthName(11) // "Décembre"
 */
export const getMonthName = (monthIndex) => {
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]
  return months[monthIndex] || ''
}

/**
 * Obtient le nom court du mois en français
 * @param {number} monthIndex - Index du mois (0-11)
 * @returns {string} Nom court du mois (ex: "Jan")
 * @example
 * getShortMonthName(0) // "Jan"
 * getShortMonthName(11) // "Déc"
 */
export const getShortMonthName = (monthIndex) => {
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
  return months[monthIndex] || ''
}

export default {
  formatCurrency,
  formatPercentage,
  formatDate,
  formatTime,
  getMonthName,
  getShortMonthName
}
