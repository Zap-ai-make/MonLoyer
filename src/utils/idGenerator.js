/**
 * Générateur d'IDs unique centralisé pour l'application Woning
 * Remplace les multiples implémentations dispersées dans le code
 */

import logger from './logger'

/**
 * Génère une chaîne aléatoire cryptographiquement sécurisée
 * @param {number} length - Longueur souhaitée
 * @returns {string} Chaîne aléatoire
 */
const generateSecureRandom = (length = 8) => {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(36).padStart(2, '0'))
      .join('')
      .substring(0, length)
  }
  // Fallback pour environnements sans crypto API (très rare)
  logger.warn('crypto.getRandomValues non disponible, utilisation de Math.random() (moins sécurisé)')
  return Math.random().toString(36).substring(2, 2 + length)
}

/**
 * Génère un ID unique basé sur timestamp + random cryptographiquement sécurisé
 * @param {string} prefix - Préfixe optionnel pour l'ID (ex: 'arch', 'doc', 'notif')
 * @returns {string} ID unique
 *
 * @example
 * generateId()              // "1704967890123abc7def2"
 * generateId('arch')        // "arch_1704967890123_abc7def2"
 * generateId('doc')         // "doc_1704967890123_xyz5ghi8"
 */
export const generateId = (prefix = '') => {
  const timestamp = Date.now()
  const random = generateSecureRandom(10) // Plus long pour réduire risque collision

  if (prefix) {
    return `${prefix}_${timestamp}_${random}`
  }

  return `${timestamp}${random}`
}

/**
 * Génère un ID pour les archives
 * @returns {string} ID au format "arch_timestamp_random"
 */
export const generateArchiveId = () => {
  return generateId('arch')
}

/**
 * Génère un ID pour les documents
 * @returns {string} ID au format "doc_timestamp_random"
 */
export const generateDocumentId = () => {
  return generateId('doc')
}

/**
 * Génère un ID pour les notifications
 * @returns {string} ID au format "notif_timestamp_random"
 */
export const generateNotificationId = () => {
  return generateId('notif')
}

/**
 * Génère un ID pour les groupes de paiements multiples
 * @returns {string} ID au format "group_timestamp_random"
 */
export const generateGroupId = () => {
  return generateId('group')
}

/**
 * Vérifie si un ID est valide (contient timestamp et partie aléatoire)
 * @param {string} id - ID à vérifier
 * @returns {boolean} true si valide
 */
export const isValidId = (id) => {
  if (!id || typeof id !== 'string') return false

  // Sans préfixe: doit contenir au moins 13 caractères (timestamp + random)
  // Avec préfixe: format "prefix_timestamp_random"
  if (id.includes('_')) {
    const parts = id.split('_')
    return parts.length >= 3 && !isNaN(parts[1])
  }

  return id.length >= 13
}

export default {
  generateId,
  generateArchiveId,
  generateDocumentId,
  generateNotificationId,
  generateGroupId,
  isValidId
}
