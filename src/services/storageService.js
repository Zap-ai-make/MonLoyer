import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll
} from 'firebase/storage'
import { storage, isFirebaseConfigured } from '../firebaseConfig'
import logger from '../utils/logger'

/**
 * Service Cloud Storage pour gérer les fichiers du CRM
 *
 * Structure Storage :
 * agences/{agenceId}/proprietaires/{proprietaireId}/mandat_gestion.pdf
 * agences/{agenceId}/proprietaires/{proprietaireId}/titre_propriete.pdf
 * agences/{agenceId}/locataires/{locataireId}/contrat.pdf
 * agences/{agenceId}/paiements/{paiementId}/recu.pdf
 */

class StorageService {
  /**
   * Uploader un fichier avec progression
   * @param {string} agenceId - ID de l'agence
   * @param {string} path - Chemin dans Storage (ex: "proprietaires/123/mandat.pdf")
   * @param {File} file - Fichier à uploader
   * @param {Function} onProgress - Callback pour progression (percentage) => {}
   * @returns {Promise<string>} - URL de téléchargement du fichier
   */
  async uploadFile(agenceId, path, file, onProgress = null) {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase n\'est pas configuré')
    }

    if (!file) {
      throw new Error('Aucun fichier fourni')
    }

    try {
      // Construire le chemin complet
      const fullPath = `agences/${agenceId}/${path}`
      const storageRef = ref(storage, fullPath)

      // Créer l'upload avec métadonnées
      const metadata = {
        contentType: file.type,
        customMetadata: {
          uploadedAt: new Date().toISOString(),
          originalName: file.name
        }
      }

      const uploadTask = uploadBytesResumable(storageRef, file, metadata)

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Calculer et notifier la progression
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100

            if (onProgress) {
              onProgress(progress)
            }
          },
          (error) => {
            // Gérer les erreurs
            logger.error('Erreur upload fichier:', error)

            const errorMessages = {
              'storage/unauthorized': 'Non autorisé à uploader ce fichier',
              'storage/canceled': 'Upload annulé',
              'storage/unknown': 'Erreur inconnue lors de l\'upload'
            }

            reject(new Error(errorMessages[error.code] || `Erreur upload: ${error.message}`))
          },
          async () => {
            // Upload terminé avec succès
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
              resolve(downloadURL)
            } catch (error) {
              logger.error('Erreur récupération URL:', error)
              reject(new Error(`Erreur récupération URL: ${error.message}`))
            }
          }
        )
      })
    } catch (error) {
      logger.error('Erreur upload fichier:', error)
      throw new Error(`Erreur lors de l'upload: ${error.message}`)
    }
  }

  /**
   * Récupérer l'URL de téléchargement d'un fichier
   * @param {string} agenceId - ID de l'agence
   * @param {string} path - Chemin dans Storage
   * @returns {Promise<string>} - URL de téléchargement
   */
  async getFileURL(agenceId, path) {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase n\'est pas configuré')
    }

    try {
      const fullPath = `agences/${agenceId}/${path}`
      const storageRef = ref(storage, fullPath)
      const url = await getDownloadURL(storageRef)

      return url
    } catch (error) {
      logger.error('Erreur récupération URL:', error)

      if (error.code === 'storage/object-not-found') {
        throw new Error('Fichier introuvable')
      }

      throw new Error(`Erreur récupération URL: ${error.message}`)
    }
  }

  /**
   * Supprimer un fichier
   * @param {string} agenceId - ID de l'agence
   * @param {string} path - Chemin dans Storage
   * @returns {Promise<void>}
   */
  async deleteFile(agenceId, path) {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase n\'est pas configuré')
    }

    try {
      const fullPath = `agences/${agenceId}/${path}`
      const storageRef = ref(storage, fullPath)
      await deleteObject(storageRef)

    } catch (error) {
      logger.error('Erreur suppression fichier:', error)

      if (error.code === 'storage/object-not-found') {
        return // Ne pas lancer d'erreur si le fichier n'existe pas
      }

      throw new Error(`Erreur suppression: ${error.message}`)
    }
  }

  /**
   * Lister tous les fichiers d'un dossier
   * @param {string} agenceId - ID de l'agence
   * @param {string} folderPath - Chemin du dossier
   * @returns {Promise<Array>} - Liste des fichiers {name, fullPath, url}
   */
  async listFiles(agenceId, folderPath) {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase n\'est pas configuré')
    }

    try {
      const fullPath = `agences/${agenceId}/${folderPath}`
      const folderRef = ref(storage, fullPath)
      const result = await listAll(folderRef)

      const files = await Promise.all(
        result.items.map(async (itemRef) => {
          try {
            const url = await getDownloadURL(itemRef)
            return {
              name: itemRef.name,
              fullPath: itemRef.fullPath,
              url
            }
          } catch (error) {
            logger.error(`Erreur récupération URL pour ${itemRef.name}:`, error)
            return {
              name: itemRef.name,
              fullPath: itemRef.fullPath,
              url: null
            }
          }
        })
      )

      return files
    } catch (error) {
      logger.error('Erreur listage fichiers:', error)
      throw new Error(`Erreur listage: ${error.message}`)
    }
  }

  /**
   * Upload multiple fichiers en parallèle
   * @param {string} agenceId - ID de l'agence
   * @param {Array} uploads - [{path, file}, ...]
   * @param {Function} onProgress - Callback pour progression globale
   * @returns {Promise<Array>} - URLs de téléchargement
   */
  async uploadMultipleFiles(agenceId, uploads, onProgress = null) {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase n\'est pas configuré')
    }

    try {
      const totalFiles = uploads.length
      let completedFiles = 0

      const uploadPromises = uploads.map(async (upload) => {
        const url = await this.uploadFile(agenceId, upload.path, upload.file, (fileProgress) => {
          if (onProgress) {
            const overallProgress = ((completedFiles + fileProgress / 100) / totalFiles) * 100
            onProgress(overallProgress)
          }
        })

        completedFiles++

        if (onProgress) {
          onProgress((completedFiles / totalFiles) * 100)
        }

        return url
      })

      const urls = await Promise.all(uploadPromises)

      return urls
    } catch (error) {
      logger.error('Erreur upload multiple:', error)
      throw new Error(`Erreur upload multiple: ${error.message}`)
    }
  }

  /**
   * Générer un nom de fichier unique
   * @param {string} originalName - Nom original du fichier
   * @returns {string} - Nom unique (timestamp_randomId_originalName)
   */
  generateUniqueFileName(originalName) {
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 9)
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_')
    return `${timestamp}_${randomId}_${sanitizedName}`
  }

  /**
   * Valider un fichier avant upload
   * @param {File} file - Fichier à valider
   * @param {Object} options - {maxSize: bytes, allowedTypes: ['application/pdf', 'image/jpeg']}
   * @returns {Object} - {valid: boolean, error: string}
   */
  validateFile(file, options = {}) {
    const maxSize = options.maxSize || 10 * 1024 * 1024 // 10MB par défaut
    const allowedTypes = options.allowedTypes || [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    // Vérifier la taille
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `Fichier trop volumineux (max ${(maxSize / 1024 / 1024).toFixed(2)}MB)`
      }
    }

    // Vérifier le type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`
      }
    }

    return { valid: true, error: null }
  }

  /**
   * Vérifier si Firebase est configuré
   * @returns {boolean}
   */
  isConfigured() {
    return isFirebaseConfigured()
  }
}

export default new StorageService()
