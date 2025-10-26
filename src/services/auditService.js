/**
 * Service d'audit pour enregistrer les opérations critiques
 * Permet la traçabilité des actions sensibles (suppressions, modifications de paiements, etc.)
 * Conforme aux exigences GDPR Article 30 (registre des traitements)
 */

import logger from '../utils/logger'
import storageWrapper from '../utils/storageWrapper'
import firestoreService from './firestoreService'
import { shouldUseFirebase, getCurrentAgenceId } from '../utils/firebaseHelpers'

// Types d'événements d'audit
export const AUDIT_EVENTS = {
  // Authentification
  LOGIN_SUCCESS: 'auth.login.success',
  LOGIN_FAILED: 'auth.login.failed',
  LOGOUT: 'auth.logout',
  PASSWORD_CHANGED: 'auth.password.changed',

  // Propriétaires
  OWNER_CREATED: 'owner.created',
  OWNER_UPDATED: 'owner.updated',
  OWNER_DELETED: 'owner.deleted',

  // Locataires
  TENANT_CREATED: 'tenant.created',
  TENANT_UPDATED: 'tenant.updated',
  TENANT_DELETED: 'tenant.deleted',
  TENANT_EVICTED: 'tenant.evicted',

  // Biens
  PROPERTY_CREATED: 'property.created',
  PROPERTY_UPDATED: 'property.updated',
  PROPERTY_DELETED: 'property.deleted',

  // Paiements (très sensible)
  PAYMENT_CREATED: 'payment.created',
  PAYMENT_UPDATED: 'payment.updated',
  PAYMENT_DELETED: 'payment.deleted',
  PAYMENT_REFUNDED: 'payment.refunded',

  // Documents
  DOCUMENT_UPLOADED: 'document.uploaded',
  DOCUMENT_DELETED: 'document.deleted',
  DOCUMENT_DOWNLOADED: 'document.downloaded',

  // Données
  DATA_EXPORTED: 'data.exported',
  DATA_IMPORTED: 'data.imported',
  DATA_DELETED: 'data.deleted',

  // Sécurité
  SECURITY_RATE_LIMIT_TRIGGERED: 'security.rate_limit.triggered',
  SECURITY_SUSPICIOUS_ACTIVITY: 'security.suspicious_activity'
}

// Niveaux de sévérité
export const AUDIT_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical'
}

class AuditService {
  constructor() {
    this.storageKey = 'audit_logs'
    this.maxLogsInMemory = 1000 // Garder les 1000 derniers logs en local
    this.retentionDays = 90 // Conserver les logs 90 jours (GDPR)
  }

  /**
   * Enregistrer un événement d'audit
   * @param {string} eventType - Type d'événement (AUDIT_EVENTS)
   * @param {Object} data - Données contextuelles
   * @param {string} severity - Niveau de sévérité (AUDIT_SEVERITY)
   * @param {string} userId - ID de l'utilisateur (optionnel)
   */
  async log(eventType, data = {}, severity = AUDIT_SEVERITY.INFO, userId = null) {
    try {
      const auditEntry = {
        id: this.generateAuditId(),
        eventType,
        severity,
        timestamp: new Date().toISOString(),
        userId: userId || 'anonymous',
        agenceId: getCurrentAgenceId() || 'local',
        data: this.sanitizeData(data),
        userAgent: navigator.userAgent,
        ip: 'client-side', // IP réelle disponible seulement côté serveur
        sessionId: this.getSessionId()
      }

      // Enregistrer en local
      await this.saveToLocalStorage(auditEntry)

      // Enregistrer dans Firestore si disponible
      if (shouldUseFirebase()) {
        await this.saveToFirestore(auditEntry)
      }

      // Logger selon la sévérité
      if (severity === AUDIT_SEVERITY.CRITICAL) {
        logger.warn(`[AUDIT CRITICAL] ${eventType}:`, data)
      } else if (severity === AUDIT_SEVERITY.WARNING) {
        logger.warn(`[AUDIT WARNING] ${eventType}:`, data)
      } else {
        logger.info(`[AUDIT] ${eventType}:`, data)
      }

      return auditEntry
    } catch (error) {
      logger.error('Erreur lors de l\'enregistrement de l\'audit:', error)
      // Ne pas bloquer l'application si l'audit échoue
      return null
    }
  }

  /**
   * Générer un ID unique pour l'audit
   */
  generateAuditId() {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Obtenir ou créer un ID de session
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('audit_session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('audit_session_id', sessionId)
    }
    return sessionId
  }

  /**
   * Sanitize sensitive data before logging
   */
  sanitizeData(data) {
    const sanitized = { ...data }

    // Masquer les mots de passe
    if (sanitized.password) {
      sanitized.password = '***REDACTED***'
    }

    // Masquer les tokens
    if (sanitized.token) {
      sanitized.token = '***REDACTED***'
    }

    // Masquer les numéros de carte de crédit (si jamais utilisés)
    if (sanitized.cardNumber) {
      sanitized.cardNumber = '***REDACTED***'
    }

    // Masquer partiellement les numéros de téléphone
    if (sanitized.telephone && typeof sanitized.telephone === 'string') {
      const tel = sanitized.telephone
      if (tel.length > 6) {
        sanitized.telephone = tel.slice(0, 3) + '****' + tel.slice(-2)
      }
    }

    return sanitized
  }

  /**
   * Sauvegarder l'audit en localStorage
   */
  async saveToLocalStorage(auditEntry) {
    try {
      const logs = storageWrapper.getItem(this.storageKey, [])

      // Ajouter le nouveau log
      logs.push(auditEntry)

      // Limiter le nombre de logs en mémoire
      if (logs.length > this.maxLogsInMemory) {
        // Garder les plus récents
        logs.splice(0, logs.length - this.maxLogsInMemory)
      }

      storageWrapper.setItem(this.storageKey, logs)
    } catch (error) {
      logger.error('Erreur sauvegarde audit localStorage:', error)
    }
  }

  /**
   * Sauvegarder l'audit dans Firestore
   */
  async saveToFirestore(auditEntry) {
    try {
      const agenceId = getCurrentAgenceId()
      if (!agenceId) return

      await firestoreService.addDocument(agenceId, 'audit_logs', auditEntry)
    } catch (error) {
      logger.error('Erreur sauvegarde audit Firestore:', error)
    }
  }

  /**
   * Récupérer les logs d'audit avec filtres
   * @param {Object} filters - {eventType, startDate, endDate, severity, userId}
   * @returns {Array} - Liste des logs d'audit
   */
  getLogs(filters = {}) {
    try {
      let logs = storageWrapper.getItem(this.storageKey, [])

      // Appliquer les filtres
      if (filters.eventType) {
        logs = logs.filter(log => log.eventType === filters.eventType)
      }

      if (filters.severity) {
        logs = logs.filter(log => log.severity === filters.severity)
      }

      if (filters.userId) {
        logs = logs.filter(log => log.userId === filters.userId)
      }

      if (filters.startDate) {
        const startDate = new Date(filters.startDate)
        logs = logs.filter(log => new Date(log.timestamp) >= startDate)
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate)
        logs = logs.filter(log => new Date(log.timestamp) <= endDate)
      }

      // Trier par date décroissante (plus récent en premier)
      logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

      return logs
    } catch (error) {
      logger.error('Erreur lors de la récupération des logs:', error)
      return []
    }
  }

  /**
   * Nettoyer les anciens logs (GDPR compliance)
   */
  cleanOldLogs() {
    try {
      const logs = storageWrapper.getItem(this.storageKey, [])
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays)

      const recentLogs = logs.filter(log => {
        return new Date(log.timestamp) > cutoffDate
      })

      if (recentLogs.length < logs.length) {
        storageWrapper.setItem(this.storageKey, recentLogs)
        logger.info(`Nettoyage audit: ${logs.length - recentLogs.length} logs supprimés`)
      }
    } catch (error) {
      logger.error('Erreur lors du nettoyage des logs:', error)
    }
  }

  /**
   * Obtenir des statistiques sur les audits
   */
  getStats() {
    try {
      const logs = storageWrapper.getItem(this.storageKey, [])

      const stats = {
        total: logs.length,
        bySeverity: {},
        byEventType: {},
        last24Hours: 0,
        last7Days: 0
      }

      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      logs.forEach(log => {
        // Par sévérité
        stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1

        // Par type d'événement
        stats.byEventType[log.eventType] = (stats.byEventType[log.eventType] || 0) + 1

        // Compteurs temporels
        const logDate = new Date(log.timestamp)
        if (logDate > oneDayAgo) {
          stats.last24Hours++
        }
        if (logDate > sevenDaysAgo) {
          stats.last7Days++
        }
      })

      return stats
    } catch (error) {
      logger.error('Erreur lors du calcul des statistiques:', error)
      return {}
    }
  }

  /**
   * Exporter les logs d'audit (GDPR Article 20 - droit à la portabilité)
   * @param {string} format - 'json' ou 'csv'
   * @returns {string} - Données exportées
   */
  exportLogs(format = 'json') {
    try {
      const logs = this.getLogs()

      if (format === 'csv') {
        // Export CSV
        const headers = ['ID', 'Date/Heure', 'Type d\'événement', 'Sévérité', 'Utilisateur', 'Données']
        const rows = logs.map(log => [
          log.id,
          new Date(log.timestamp).toLocaleString('fr-FR'),
          log.eventType,
          log.severity,
          log.userId,
          JSON.stringify(log.data)
        ])

        const csv = [headers, ...rows]
          .map(row => row.map(cell => `"${cell}"`).join(','))
          .join('\n')

        return csv
      } else {
        // Export JSON
        return JSON.stringify(logs, null, 2)
      }
    } catch (error) {
      logger.error('Erreur lors de l\'export des logs:', error)
      return null
    }
  }
}

// Singleton instance
const auditService = new AuditService()

// Nettoyer les anciens logs au démarrage (chaque 7 jours)
const lastCleanup = localStorage.getItem('audit_last_cleanup')
const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
if (!lastCleanup || parseInt(lastCleanup) < sevenDaysAgo) {
  auditService.cleanOldLogs()
  localStorage.setItem('audit_last_cleanup', Date.now().toString())
}

export default auditService
