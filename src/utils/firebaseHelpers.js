import authService from '../services/authService'

/**
 * Utilitaires Firebase partagés pour éviter la duplication de code
 * Utilisé par dataService, archiveService et documentService
 */

/**
 * Vérifier si Firebase est configuré et l'utilisateur est connecté
 * @returns {boolean}
 */
export const shouldUseFirebase = () => {
  return authService.isConfigured() && authService.isAuthenticated()
}

/**
 * Récupérer l'ID de l'agence de l'utilisateur connecté
 * @returns {string|null} - agenceId ou null si non connecté
 */
export const getCurrentAgenceId = () => {
  if (!shouldUseFirebase()) return null

  const user = authService.getCurrentUser()
  return user?.uid || null
}

/**
 * Nettoyer les données pour Firestore
 * Supprime les undefined, fonctions et gère les objets imbriqués
 * Retire dateCreation et dateModification car gérés par serverTimestamp()
 * @param {Object} data - Données à nettoyer
 * @returns {Object} - Données nettoyées
 */
export const cleanForFirestore = (data) => {
  if (data === null || data === undefined) return null

  const cleaned = {}

  // Champs à exclure car gérés automatiquement par Firestore
  const excludedFields = ['dateCreation', 'dateModification']

  for (const [key, value] of Object.entries(data)) {
    // Ignorer undefined, fonctions et champs exclus
    if (value === undefined || typeof value === 'function' || excludedFields.includes(key)) continue

    // Garder null tel quel
    if (value === null) {
      cleaned[key] = null
      continue
    }

    // Gérer les objets et arrays récursivement
    if (typeof value === 'object' && !Array.isArray(value)) {
      cleaned[key] = cleanForFirestore(value)
    } else if (Array.isArray(value)) {
      cleaned[key] = value.map(item =>
        typeof item === 'object' && item !== null ? cleanForFirestore(item) : item
      )
    } else {
      cleaned[key] = value
    }
  }

  return cleaned
}

/**
 * Convertir un data URL (base64) en Blob
 * Utilisé pour les uploads de fichiers vers Cloud Storage
 * @param {string} dataURL - Data URL (format: data:mime;base64,...)
 * @returns {Blob}
 */
export const dataURLtoBlob = (dataURL) => {
  const arr = dataURL.split(',')
  const mime = arr[0].match(/:(.*?);/)[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }

  return new Blob([u8arr], { type: mime })
}

/**
 * Créer un objet File à partir d'un Blob
 * @param {Blob} blob - Blob à convertir
 * @param {string} filename - Nom du fichier
 * @param {string} mimeType - Type MIME
 * @returns {File}
 */
export const blobToFile = (blob, filename, mimeType) => {
  return new File([blob], filename, { type: mimeType })
}

export default {
  shouldUseFirebase,
  getCurrentAgenceId,
  cleanForFirestore,
  dataURLtoBlob,
  blobToFile
}
