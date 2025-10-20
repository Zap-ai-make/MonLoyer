import { safeParseFloat, formatCurrency } from './numberUtils'

/**
 * Formateurs utilitaires pour Woning
 */

// Ré-exporter formatCurrency de numberUtils pour compatibilité
export { formatCurrency }

// Formater un pourcentage
export const formatPercentage = (value, decimals = 0) => {
  const numValue = safeParseFloat(value, 0)
  return `${numValue.toFixed(decimals)}%`
}

// Formater une date
export const formatDate = (date, options = {}) => {
  if (!(date instanceof Date)) {
    date = new Date(date)
  }
  return date.toLocaleDateString('fr-FR', options)
}

// Formater une heure
export const formatTime = (date) => {
  if (!(date instanceof Date)) {
    date = new Date(date)
  }
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

// Obtenir le nom du mois
export const getMonthName = (monthIndex) => {
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]
  return months[monthIndex] || ''
}

// Obtenir le nom du mois court
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
