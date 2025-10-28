// import html2pdf from 'html2pdf.js' // DÉSACTIVÉ TEMPORAIREMENT - incompatible avec Vite
import receiptService from './receiptService'
import storageService from './storageService'
import { getCurrentAgenceId } from '../utils/firebaseHelpers'
import logger from '../utils/logger'

/**
 * Service pour gérer les reçus de paiement dans Firebase Storage
 *
 * Structure Storage :
 * agences/{agenceId}/paiements/{paiementId}/recu.pdf
 */

class PaiementReceiptService {
  /**
   * Générer et sauvegarder un reçu de paiement en PDF dans Firebase Storage
   * @param {Object} paiement - Données du paiement
   * @param {Object} locataire - Données du locataire
   * @param {Object} bien - Données du bien
   * @returns {Promise<string>} - URL du reçu sauvegardé
   */
  async generateAndSaveReceipt(paiement, locataire, bien) {
    try {
      // Générer le HTML du reçu
      const htmlContent = receiptService.generatePaymentReceipt(paiement, locataire, bien)

      // Créer un élément temporaire pour la conversion
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = htmlContent
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      document.body.appendChild(tempDiv)

      // Récupérer l'élément receipt
      const receiptElement = tempDiv.querySelector('.receipt')

      if (!receiptElement) {
        throw new Error('Élément receipt introuvable dans le HTML généré')
      }

      // Options pour html2pdf
      const opt = {
        margin: 10,
        filename: `recu-${paiement.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }

      // Convertir en PDF Blob
      // TEMPORAIREMENT DÉSACTIVÉ - html2pdf incompatible avec Vite
      throw new Error('Génération automatique de reçu temporairement indisponible. Utilisez l\'upload manuel.')
      // const pdfBlob = await html2pdf().set(opt).from(receiptElement).outputPdf('blob')

      // Nettoyer l'élément temporaire
      document.body.removeChild(tempDiv)

      // Créer un objet File à partir du Blob
      const pdfFile = new File([pdfBlob], `recu-${paiement.id}.pdf`, {
        type: 'application/pdf'
      })

      // Uploader vers Firebase Storage
      const agenceId = getCurrentAgenceId()
      if (!agenceId) {
        throw new Error('Agence non identifiée')
      }

      const storagePath = `paiements/${paiement.id}/recu.pdf`
      const downloadURL = await storageService.uploadFile(agenceId, storagePath, pdfFile)

      logger.info(`Reçu sauvegardé pour paiement ${paiement.id}:`, downloadURL)
      return downloadURL
    } catch (error) {
      logger.error('Erreur génération/sauvegarde reçu:', error)
      throw new Error(`Impossible de générer le reçu: ${error.message}`)
    }
  }

  /**
   * Uploader un reçu manuel (fichier PDF scanné)
   * @param {string} paiementId - ID du paiement
   * @param {File} file - Fichier PDF
   * @param {Function} onProgress - Callback progression
   * @returns {Promise<string>} - URL du fichier uploadé
   */
  async uploadManualReceipt(paiementId, file, onProgress = null) {
    try {
      // Vérifier que c'est un PDF
      if (file.type !== 'application/pdf') {
        throw new Error('Le fichier doit être au format PDF')
      }

      // Vérifier la taille (max 5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        throw new Error('Le fichier ne doit pas dépasser 5 MB')
      }

      const agenceId = getCurrentAgenceId()
      if (!agenceId) {
        throw new Error('Agence non identifiée')
      }

      const storagePath = `paiements/${paiementId}/recu.pdf`
      const downloadURL = await storageService.uploadFile(agenceId, storagePath, file, onProgress)

      logger.info(`Reçu manuel uploadé pour paiement ${paiementId}:`, downloadURL)
      return downloadURL
    } catch (error) {
      logger.error('Erreur upload reçu manuel:', error)
      throw error
    }
  }

  /**
   * Supprimer un reçu de paiement
   * @param {string} paiementId - ID du paiement
   * @returns {Promise<void>}
   */
  async deleteReceipt(paiementId) {
    try {
      const agenceId = getCurrentAgenceId()
      if (!agenceId) {
        throw new Error('Agence non identifiée')
      }

      const storagePath = `paiements/${paiementId}/recu.pdf`
      await storageService.deleteFile(agenceId, storagePath)

      logger.info(`Reçu supprimé pour paiement ${paiementId}`)
    } catch (error) {
      // Si le fichier n'existe pas, ne pas lancer d'erreur
      if (error.code === 'storage/object-not-found') {
        logger.warn(`Reçu introuvable pour paiement ${paiementId}`)
        return
      }
      logger.error('Erreur suppression reçu:', error)
      throw error
    }
  }

  /**
   * Récupérer l'URL d'un reçu existant
   * @param {string} paiementId - ID du paiement
   * @returns {Promise<string|null>} - URL du reçu ou null
   */
  async getReceiptURL(paiementId) {
    try {
      const agenceId = getCurrentAgenceId()
      if (!agenceId) {
        return null
      }

      const storagePath = `paiements/${paiementId}/recu.pdf`
      const url = await storageService.getFileURL(agenceId, storagePath)
      return url
    } catch (error) {
      // Si le fichier n'existe pas, retourner null
      if (error.code === 'storage/object-not-found') {
        return null
      }
      logger.error('Erreur récupération URL reçu:', error)
      return null
    }
  }

  /**
   * Vérifier si un reçu existe pour un paiement
   * @param {string} paiementId - ID du paiement
   * @returns {Promise<boolean>}
   */
  async hasReceipt(paiementId) {
    const url = await this.getReceiptURL(paiementId)
    return url !== null
  }
}

export default new PaiementReceiptService()
