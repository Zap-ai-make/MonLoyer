import logger from './logger'

/**
 * Gestionnaire d'erreurs centralisé pour l'application Woning
 * Fournit une gestion cohérente des erreurs avec logging et notifications utilisateur
 */

class ErrorHandler {
  constructor() {
    this.notificationService = null
  }

  /**
   * Initialiser avec le service de notification
   * @param {Object} notificationService - Service de notification (depuis NotificationContext)
   */
  setNotificationService(notificationService) {
    this.notificationService = notificationService
  }

  /**
   * Gérer une erreur de manière centralisée
   * @param {Error} error - L'erreur à gérer
   * @param {string} context - Le contexte où l'erreur s'est produite (ex: "Dashboard.loadData")
   * @param {string} userMessage - Message à afficher à l'utilisateur (optionnel)
   * @param {Object} options - Options supplémentaires
   * @param {boolean} options.showNotification - Afficher une notification (défaut: true)
   * @param {boolean} options.logError - Logger l'erreur (défaut: true)
   * @param {Object} options.metadata - Métadonnées supplémentaires pour le logging
   */
  handle(error, context, userMessage = null, options = {}) {
    const {
      showNotification = true,
      logError = true,
      metadata = {}
    } = options

    // 1. Logger l'erreur pour le debugging
    if (logError) {
      logger.error(`[${context}]`, {
        message: error.message,
        stack: error.stack,
        ...metadata
      })
    }

    // 2. Notifier l'utilisateur si un service de notification est disponible
    if (showNotification && this.notificationService) {
      const message = userMessage || this.getDefaultMessage(error)
      this.notificationService.error(message)
    }

    // 3. En production, on pourrait envoyer à un service de monitoring (Sentry, etc.)
    // if (import.meta.env.PROD) {
    //   this.sendToMonitoring(error, context, metadata)
    // }

    return error
  }

  /**
   * Gérer une erreur de validation
   * @param {Error} validationError - Erreur de validation Zod
   * @param {string} context - Contexte de la validation
   */
  handleValidation(validationError, context) {
    logger.warn(`[${context}] Erreur de validation:`, validationError.errors)

    if (this.notificationService) {
      // Formater les erreurs de validation pour l'utilisateur
      const firstError = validationError.errors[0]
      const message = `${firstError.path.join('.')}: ${firstError.message}`
      this.notificationService.error(message)
    }

    return validationError
  }

  /**
   * Wrapper pour les opérations asynchrones
   * Simplifie la gestion d'erreurs dans les try/catch
   * @param {Function} asyncFn - Fonction asynchrone à exécuter
   * @param {string} context - Contexte de l'opération
   * @param {string} userMessage - Message utilisateur en cas d'erreur
   * @returns {Promise<any>} Résultat de la fonction ou null en cas d'erreur
   */
  async wrap(asyncFn, context, userMessage = null) {
    try {
      return await asyncFn()
    } catch (error) {
      this.handle(error, context, userMessage)
      return null
    }
  }

  /**
   * Obtenir un message d'erreur par défaut basé sur le type d'erreur
   * @param {Error} error - L'erreur
   * @returns {string} Message utilisateur
   */
  getDefaultMessage(error) {
    // Erreurs réseau
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return 'Erreur de connexion. Veuillez vérifier votre connexion internet.'
    }

    // Erreurs de validation
    if (error.name === 'ZodError') {
      return 'Les données fournies sont invalides.'
    }

    // Erreurs de stockage
    if (error.message.includes('localStorage') || error.message.includes('storage')) {
      return 'Erreur de sauvegarde des données. Veuillez vérifier l\'espace disponible.'
    }

    // Message générique
    return 'Une erreur est survenue. Veuillez réessayer.'
  }

  /**
   * Méthode pour envoyer les erreurs à un service de monitoring
   * @param {Error} error - L'erreur
   * @param {string} context - Contexte
   * @param {Object} metadata - Métadonnées
   */
  sendToMonitoring(error, context, metadata) {
    // TODO: Implémenter l'envoi vers Sentry, LogRocket, etc.
    // Exemple:
    // Sentry.captureException(error, {
    //   tags: { context },
    //   extra: metadata
    // })
  }
}

// Instance singleton
const errorHandler = new ErrorHandler()

export default errorHandler

/**
 * Helper pour utiliser dans les composants React
 * Usage:
 *
 * import { useErrorHandler } from '@/utils/errorHandler'
 *
 * function MyComponent() {
 *   const handleError = useErrorHandler()
 *
 *   const loadData = async () => {
 *     try {
 *       const data = await fetchData()
 *     } catch (error) {
 *       handleError(error, 'MyComponent.loadData', 'Impossible de charger les données')
 *     }
 *   }
 * }
 */
export const useErrorHandler = () => {
  return (error, context, userMessage, options) => {
    return errorHandler.handle(error, context, userMessage, options)
  }
}
