/**
 * Logger wrapper pour gérer les logs selon l'environnement
 * En production, les logs peuvent être désactivés ou envoyés à un service externe
 */

const IS_PRODUCTION = import.meta.env.PROD
const IS_DEVELOPMENT = import.meta.env.DEV

class Logger {
  constructor() {
    this.enabled = IS_DEVELOPMENT
    this.sensitivePatterns = [
      /password/gi,
      /token/gi,
      /secret/gi,
      /api[_-]?key/gi,
      /auth/gi,
      /bearer/gi,
      /\b\d{16}\b/g, // Numéros de carte bancaire
      /\b\d{3}-\d{2}-\d{4}\b/g // SSN-like patterns
    ]
    this.logCount = 0
    this.maxLogsPerMinute = 100
    this.lastResetTime = Date.now()
  }

  /**
   * Vérifie le rate limiting
   * @private
   * @returns {boolean} true si autorisé
   */
  checkRateLimit() {
    const now = Date.now()
    if (now - this.lastResetTime > 60000) {
      this.logCount = 0
      this.lastResetTime = now
    }

    if (this.logCount >= this.maxLogsPerMinute) {
      return false
    }

    this.logCount++
    return true
  }

  /**
   * Sanitize les données sensibles avant logging
   * @private
   * @param {any} data - Données à sanitizer
   * @returns {any} Données sanitizées
   */
  sanitize(data) {
    if (typeof data === 'string') {
      let sanitized = data
      this.sensitivePatterns.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '[REDACTED]')
      })
      return sanitized
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized = Array.isArray(data) ? [] : {}
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          // Redact sensitive keys
          if (this.sensitivePatterns.some(p => p.test(key))) {
            sanitized[key] = '[REDACTED]'
          } else {
            sanitized[key] = this.sanitize(data[key])
          }
        }
      }
      return sanitized
    }

    return data
  }

  /**
   * Log d'information - seulement en développement
   * @param {...any} args - Arguments à logger
   */
  log(...args) {
    if (this.enabled && this.checkRateLimit()) {
      const sanitizedArgs = args.map(arg => this.sanitize(arg))
      console.log(...sanitizedArgs)
    }
  }

  /**
   * Log d'information - alias de log()
   * @param {...any} args - Arguments à logger
   */
  info(...args) {
    if (this.enabled && this.checkRateLimit()) {
      const sanitizedArgs = args.map(arg => this.sanitize(arg))
      console.info(...sanitizedArgs)
    }
  }

  /**
   * Log de debug - seulement en développement
   * @param {...any} args - Arguments à logger
   */
  debug(...args) {
    if (this.enabled && this.checkRateLimit()) {
      const sanitizedArgs = args.map(arg => this.sanitize(arg))
      console.debug(...sanitizedArgs)
    }
  }

  /**
   * Log d'avertissement - toujours actif mais rate-limited
   * @param {...any} args - Arguments à logger
   */
  warn(...args) {
    if (this.checkRateLimit()) {
      const sanitizedArgs = args.map(arg => this.sanitize(arg))
      console.warn(...sanitizedArgs)
    }
  }

  /**
   * Log d'erreur - toujours actif avec sanitization
   * En production, pourrait être envoyé à un service de monitoring
   * @param {...any} args - Arguments à logger
   */
  error(...args) {
    if (this.checkRateLimit()) {
      const sanitizedArgs = args.map(arg => this.sanitize(arg))
      console.error(...sanitizedArgs)

      // En production, envoyer l'erreur à un service de monitoring
      if (IS_PRODUCTION) {
        this.sendToMonitoring(sanitizedArgs)
      }
    }
  }

  /**
   * Table - seulement en développement
   * @param {*} data - Données à afficher en table
   */
  table(data) {
    if (this.enabled && console.table) {
      console.table(data)
    }
  }

  /**
   * Grouper les logs - seulement en développement
   * @param {string} label - Label du groupe
   */
  group(label) {
    if (this.enabled && console.group) {
      console.group(label)
    }
  }

  /**
   * Grouper les logs (collapsed) - seulement en développement
   * @param {string} label - Label du groupe
   */
  groupCollapsed(label) {
    if (this.enabled && console.groupCollapsed) {
      console.groupCollapsed(label)
    }
  }

  /**
   * Terminer un groupe de logs
   */
  groupEnd() {
    if (this.enabled && console.groupEnd) {
      console.groupEnd()
    }
  }

  /**
   * Mesurer le temps d'exécution - seulement en développement
   * @param {string} label - Label du timer
   */
  time(label) {
    if (this.enabled && console.time) {
      console.time(label)
    }
  }

  /**
   * Terminer la mesure de temps
   * @param {string} label - Label du timer
   */
  timeEnd(label) {
    if (this.enabled && console.timeEnd) {
      console.timeEnd(label)
    }
  }

  /**
   * Activer ou désactiver le logger
   * Sécurisé: désactivation en production ne peut pas être réactivée
   * @param {boolean} enabled - État du logger
   */
  setEnabled(enabled) {
    // Empêcher réactivation en production pour sécurité
    if (IS_PRODUCTION && enabled) {
      console.warn('Impossible d\'activer les logs en production pour des raisons de sécurité')
      return
    }
    this.enabled = enabled
  }

  /**
   * Envoyer les erreurs à un service de monitoring (placeholder)
   * @private
   * @param {Array} args - Arguments de l'erreur
   */
  sendToMonitoring(args) {
    // Implémentation future pour envoyer les erreurs à Sentry, LogRocket, etc.
    // Example:
    // if (window.Sentry) {
    //   window.Sentry.captureException(new Error(args.join(' ')))
    // }
  }
}

// Instance singleton du logger
const logger = new Logger()

export default logger
