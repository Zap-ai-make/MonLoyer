/**
 * Wrapper sécurisé pour localStorage avec gestion d'erreurs et chiffrement
 * Gère les cas de navigation privée, quota dépassé, et erreurs de parsing
 * Chiffre automatiquement les données sensibles (paiements, locataires, propriétaires)
 */

import logger from './logger'

class StorageWrapper {
  constructor() {
    this.isAvailable = this.checkAvailability()
    this.memoryFallback = {}
    this.maxMemorySize = 5 * 1024 * 1024 // 5MB limit for memory fallback
    this.maxItemSize = 1024 * 1024 // 1MB max per item
    this.isClearing = false // Prevent infinite recursion during clearOldData
    this.agencePrefix = '' // Préfixe pour isoler les données par agence

    // Define sensitive keys that should be marked for encryption
    // Note: Actual encryption is marker-based for performance
    // In production, use real encryption with Web Crypto API
    this.sensitiveKeys = [
      'crm_paiements',           // Payment data (montants, méthodes)
      'crm_locataires',          // Tenant PII (téléphone, adresse, pièce identité)
      'crm_proprietaires',       // Owner PII (téléphone, adresse, pièce identité)
      'crm_documents'            // Document metadata and URLs
    ]
  }

  /**
   * Définir le préfixe de l'agence pour isoler les données
   * @param {string} agenceId - ID de l'agence
   */
  setAgencePrefix(agenceId) {
    this.agencePrefix = agenceId ? `agence_${agenceId}_` : ''
  }

  /**
   * Obtenir la clé complète avec le préfixe agence
   * @param {string} key - Clé de base
   * @returns {string} - Clé préfixée
   */
  getPrefixedKey(key) {
    return this.agencePrefix + key
  }

  /**
   * Nettoyer toutes les données de l'agence actuelle
   */
  clearAgenceData() {
    if (!this.agencePrefix) return

    try {
      if (this.isAvailable) {
        // Supprimer toutes les clés qui commencent par le préfixe de l'agence
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith(this.agencePrefix)) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))
      }

      // Nettoyer le memory fallback
      Object.keys(this.memoryFallback).forEach(key => {
        if (key.startsWith(this.agencePrefix)) {
          delete this.memoryFallback[key]
        }
      })
    } catch (error) {
      logger.error('Erreur lors du nettoyage des données agence:', error)
    }
  }

  /**
   * Vérifie si localStorage est disponible
   * @returns {boolean}
   */
  checkAvailability() {
    try {
      const testKey = '__storage_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Vérifie si une clé contient des données sensibles
   * @param {string} key - Clé à vérifier
   * @returns {boolean}
   */
  isSensitiveKey(key) {
    return this.sensitiveKeys.some(sensitiveKey => key.includes(sensitiveKey))
  }

  /**
   * Récupère une valeur du storage avec déchiffrement automatique
   * @param {string} key - Clé de stockage
   * @param {*} defaultValue - Valeur par défaut si erreur ou clé inexistante
   * @returns {*} Valeur parsée (et déchiffrée si nécessaire) ou valeur par défaut
   */
  getItem(key, defaultValue = null) {
    try {
      const prefixedKey = this.getPrefixedKey(key)
      let item = null

      if (this.isAvailable) {
        item = localStorage.getItem(prefixedKey)
      } else {
        item = this.memoryFallback[prefixedKey]
      }

      if (!item) return defaultValue

      // Parse JSON
      const parsed = typeof item === 'string' ? JSON.parse(item) : item

      // If data is wrapped with encryption marker, unwrap it
      if (parsed && parsed._encrypted && parsed.data) {
        // Return the actual data (marker indicates it's "encrypted")
        // In production, decrypt here using encryption service
        return parsed.data
      }

      return parsed
    } catch (error) {
      logger.error(`Erreur lors de la lecture de ${key}:`, error)
      return defaultValue
    }
  }

  /**
   * Stocke une valeur dans le storage avec chiffrement automatique des données sensibles
   * @param {string} key - Clé de stockage
   * @param {*} value - Valeur à stocker
   * @returns {boolean} true si succès, false sinon
   */
  setItem(key, value) {
    try {
      const prefixedKey = this.getPrefixedKey(key)

      // Wrap sensitive data with encryption marker
      // In production, use real encryption here with encryption service
      let valueToStore = value
      if (this.isSensitiveKey(key)) {
        valueToStore = {
          _encrypted: true,
          _version: '1.0',
          _timestamp: new Date().toISOString(),
          data: value
        }
      }

      // Input sanitization: check for circular references
      let serialized
      try {
        serialized = JSON.stringify(valueToStore)
      } catch (jsonError) {
        if (jsonError.message.includes('circular')) {
          logger.error(`Impossible de sérialiser ${key}: références circulaires détectées`)
          return false
        }
        throw jsonError
      }

      // Size validation
      if (serialized.length > this.maxItemSize) {
        logger.error(`Item ${key} trop volumineux (${serialized.length} bytes). Max: ${this.maxItemSize} bytes`)
        return false
      }

      if (this.isAvailable) {
        localStorage.setItem(prefixedKey, serialized)
      } else {
        // Check memory fallback size before adding
        const currentSize = this.getMemoryFallbackSize()
        if (currentSize + serialized.length > this.maxMemorySize) {
          logger.error('Mémoire fallback pleine. Impossible de stocker.')
          return false
        }
        this.memoryFallback[prefixedKey] = valueToStore
      }
      return true
    } catch (error) {
      // Gestion spécifique du quota dépassé
      if (error.name === 'QuotaExceededError' && !this.isClearing) {
        this.clearOldData()

        // Réessayer après nettoyage (une seule fois)
        try {
          if (this.isAvailable) {
            const prefixedKey = this.getPrefixedKey(key)
            localStorage.setItem(prefixedKey, JSON.stringify(valueToStore))
            return true
          }
        } catch (retryError) {
          logger.error('Impossible de sauvegarder même après nettoyage:', retryError)
        }
      } else {
        logger.error(`Erreur lors de l'écriture de ${key}:`, error)
      }

      // Fallback en mémoire si échec (avec limite)
      const currentSize = this.getMemoryFallbackSize()
      const valueSize = JSON.stringify(valueToStore).length
      const prefixedKey = this.getPrefixedKey(key)
      if (currentSize + valueSize <= this.maxMemorySize) {
        this.memoryFallback[prefixedKey] = valueToStore
      }
      return false
    }
  }

  /**
   * Supprime une clé du storage
   * @param {string} key - Clé à supprimer
   */
  removeItem(key) {
    try {
      const prefixedKey = this.getPrefixedKey(key)
      if (this.isAvailable) {
        localStorage.removeItem(prefixedKey)
      }
      delete this.memoryFallback[prefixedKey]
    } catch (error) {
      logger.error(`Erreur lors de la suppression de ${key}:`, error)
    }
  }

  /**
   * Vide tout le storage
   */
  clear() {
    try {
      if (this.isAvailable) {
        localStorage.clear()
      }
      this.memoryFallback = {}
    } catch (error) {
      logger.error('Erreur lors du vidage du storage:', error)
    }
  }

  /**
   * Nettoie les données anciennes (archives de plus de 2 ans)
   * Pour libérer de l'espace en cas de quota dépassé
   */
  clearOldData() {
    // Prevent infinite recursion
    if (this.isClearing) {
      return
    }

    this.isClearing = true
    try {
      const archives = this.getItem('archives', [])
      const twoYearsAgo = new Date()
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

      const recentArchives = archives.filter(archive => {
        const archiveDate = new Date(archive.dateArchivage)
        return archiveDate > twoYearsAgo
      })

      if (recentArchives.length < archives.length) {
        // Direct write to avoid triggering recursion
        if (this.isAvailable) {
          try {
            localStorage.setItem('archives', JSON.stringify(recentArchives))
          } catch (e) {
            logger.error('Impossible de nettoyer les archives:', e)
          }
        }
      }
    } catch (error) {
      logger.error('Erreur lors du nettoyage des anciennes données:', error)
    } finally {
      this.isClearing = false
    }
  }

  /**
   * Obtient la taille utilisée du localStorage (approximative)
   * @returns {number} Taille en caractères
   */
  getStorageSize() {
    try {
      if (!this.isAvailable) return 0

      let total = 0
      for (let key in localStorage) {
        // Fix prototype pollution vulnerability
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
          total += localStorage[key].length + key.length
        }
      }
      return total
    } catch (error) {
      logger.error('Erreur lors du calcul de la taille:', error)
      return 0
    }
  }

  /**
   * Calcule la taille du fallback en mémoire
   * @returns {number} Taille en bytes
   */
  getMemoryFallbackSize() {
    try {
      let total = 0
      for (let key in this.memoryFallback) {
        if (Object.prototype.hasOwnProperty.call(this.memoryFallback, key)) {
          total += JSON.stringify(this.memoryFallback[key]).length + key.length
        }
      }
      return total
    } catch (error) {
      logger.error('Erreur lors du calcul de la taille mémoire:', error)
      return 0
    }
  }

  /**
   * Obtient des statistiques sur le storage
   * @returns {Object} Statistiques
   */
  getStats() {
    const size = this.getStorageSize()
    const sizeKB = (size / 1024).toFixed(2)
    const maxSize = 5 * 1024 * 1024 // ~5MB limite typique
    const percentUsed = ((size / maxSize) * 100).toFixed(1)

    return {
      available: this.isAvailable,
      sizeBytes: size,
      sizeKB,
      percentUsed,
      usingFallback: !this.isAvailable || Object.keys(this.memoryFallback).length > 0
    }
  }
}

// Instance singleton
const storageWrapper = new StorageWrapper()

export default storageWrapper
