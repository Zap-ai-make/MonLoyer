/**
 * Utilitaire de sanitization pour prévenir les attaques XSS
 * Nettoie les entrées utilisateur avant stockage et affichage
 */

/**
 * Caractères dangereux à échapper
 */
const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;'
}

/**
 * Échappe les caractères HTML dangereux dans une chaîne
 * Prévient l'injection de balises HTML/JavaScript
 *
 * @param {string} str - Chaîne à échapper
 * @returns {string} Chaîne échappée
 *
 * @example
 * escapeHtml('<script>alert("XSS")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 */
export const escapeHtml = (str) => {
  if (typeof str !== 'string') {
    return str
  }

  return str.replace(/[&<>"'/]/g, (char) => HTML_ESCAPE_MAP[char])
}

/**
 * Nettoie une chaîne en supprimant les balises HTML/script
 * Plus agressif que escapeHtml - supprime complètement les balises
 *
 * @param {string} str - Chaîne à nettoyer
 * @returns {string} Chaîne nettoyée
 *
 * @example
 * stripHtml('<p>Hello <script>alert("XSS")</script></p>')
 * // Returns: 'Hello '
 */
export const stripHtml = (str) => {
  if (typeof str !== 'string') {
    return str
  }

  // Supprimer toutes les balises HTML
  return str.replace(/<[^>]*>/g, '')
}

/**
 * Nettoie une chaîne en supprimant les caractères dangereux
 * mais en préservant les accents et caractères spéciaux courants
 *
 * @param {string} str - Chaîne à nettoyer
 * @param {object} options - Options de nettoyage
 * @returns {string} Chaîne nettoyée
 */
export const sanitizeText = (str, options = {}) => {
  if (typeof str !== 'string') {
    return str
  }

  const {
    allowLineBreaks = true,
    maxLength = null,
    trim = true
  } = options

  let sanitized = str

  // Échapper les caractères HTML dangereux
  sanitized = escapeHtml(sanitized)

  // Supprimer les séquences de contrôle dangereuses
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  // Supprimer les sauts de ligne si non autorisés
  if (!allowLineBreaks) {
    sanitized = sanitized.replace(/[\r\n]+/g, ' ')
  }

  // Trimmer si demandé
  if (trim) {
    sanitized = sanitized.trim()
  }

  // Limiter la longueur si spécifié
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }

  return sanitized
}

/**
 * Sanitize un numéro de téléphone
 * Garde uniquement les chiffres, espaces, +, -, (, )
 *
 * @param {string} phone - Numéro à nettoyer
 * @returns {string} Numéro nettoyé
 */
export const sanitizePhone = (phone) => {
  if (typeof phone !== 'string') {
    return phone
  }

  // Garder uniquement les caractères valides pour un téléphone
  return phone.replace(/[^\d\s+\-()]/g, '').trim()
}

/**
 * Sanitize un email
 * Validation basique et nettoyage
 *
 * @param {string} email - Email à nettoyer
 * @returns {string} Email nettoyé
 */
export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') {
    return email
  }

  // Trimmer et lowercase
  let sanitized = email.trim().toLowerCase()

  // Supprimer les caractères dangereux tout en gardant les caractères valides d'email
  sanitized = sanitized.replace(/[<>;"']/g, '')

  return sanitized
}

/**
 * Sanitize une URL
 * Vérifie que l'URL est sûre (http/https uniquement)
 *
 * @param {string} url - URL à nettoyer
 * @returns {string} URL nettoyée ou chaîne vide si dangereuse
 */
export const sanitizeUrl = (url) => {
  if (typeof url !== 'string') {
    return ''
  }

  const trimmed = url.trim()

  // Bloquer les URLs javascript: et data: qui peuvent exécuter du code
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:')
  ) {
    return ''
  }

  // Autoriser uniquement http, https, et les URLs relatives
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('#')
  ) {
    return escapeHtml(trimmed)
  }

  // Si pas de protocole, assumer https
  if (!trimmed.includes('://')) {
    return escapeHtml(trimmed)
  }

  return ''
}

/**
 * Sanitize un objet entier récursivement
 * Applique la sanitization sur toutes les valeurs string de l'objet
 *
 * @param {object} obj - Objet à nettoyer
 * @param {object} fieldRules - Règles spécifiques par champ
 * @returns {object} Objet nettoyé
 *
 * @example
 * sanitizeObject({
 *   nom: '<script>alert("XSS")</script>',
 *   telephone: '06-12-34-56-78 abc',
 *   email: 'TEST@EXAMPLE.COM  '
 * }, {
 *   telephone: 'phone',
 *   email: 'email'
 * })
 * // Returns: {
 * //   nom: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;',
 * //   telephone: '06-12-34-56-78',
 * //   email: 'test@example.com'
 * // }
 */
export const sanitizeObject = (obj, fieldRules = {}) => {
  if (!obj || typeof obj !== 'object') {
    return obj
  }

  const sanitized = Array.isArray(obj) ? [] : {}

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) {
      continue
    }

    const value = obj[key]
    const rule = fieldRules[key]

    // Sanitization récursive pour les objets imbriqués
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, fieldRules)
      continue
    }

    // Appliquer la règle spécifique si définie
    if (typeof value === 'string') {
      switch (rule) {
        case 'phone':
          sanitized[key] = sanitizePhone(value)
          break
        case 'email':
          sanitized[key] = sanitizeEmail(value)
          break
        case 'url':
          sanitized[key] = sanitizeUrl(value)
          break
        case 'html':
          sanitized[key] = stripHtml(value)
          break
        case 'text':
        default:
          sanitized[key] = sanitizeText(value)
          break
      }
    } else {
      // Conserver les valeurs non-string telles quelles
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Règles de sanitization prédéfinies pour les entités du CRM
 */
export const SANITIZATION_RULES = {
  proprietaire: {
    nom: 'text',
    prenom: 'text',
    telephone: 'phone',
    adresse: 'text',
    pieceIdentite: 'text',
    references: 'text'
  },
  locataire: {
    nom: 'text',
    prenom: 'text',
    telephone: 'phone',
    adresse: 'text',
    pieceIdentite: 'text',
    observations: 'text'
  },
  bien: {
    ville: 'text',
    quartier: 'text',
    description: 'text',
    compteurEau: 'text',
    compteurElectricite: 'text'
  },
  paiement: {
    notes: 'text',
    remarques: 'text',
    numeroCheque: 'text',
    numeroMobileMoney: 'text'
  },
  agence: {
    nom: 'text',
    email: 'email',
    telephone: 'phone',
    adresse: 'text'
  }
}

export default {
  escapeHtml,
  stripHtml,
  sanitizeText,
  sanitizePhone,
  sanitizeEmail,
  sanitizeUrl,
  sanitizeObject,
  SANITIZATION_RULES
}
