import storageWrapper from '../utils/storageWrapper'
import { generateArchiveId } from '../utils/idGenerator'
import logger from '../utils/logger'
import firestoreService from './firestoreService'
import { shouldUseFirebase, getCurrentAgenceId, cleanForFirestore } from '../utils/firebaseHelpers'

class ArchiveService {
  constructor() {
    this.storageKeys = {
      archivedPayments: 'woning_archived_payments',
      archivedRemittances: 'woning_archived_remittances',
      lastArchiveCheck: 'woning_last_archive_check'
    }
    this.initializeArchives()
  }

  initializeArchives() {
    // Initialiser les archives si elles n'existent pas
    Object.values(this.storageKeys).forEach(key => {
      const existing = storageWrapper.getItem(key, null)
      if (existing === null) {
        if (key.includes('last_archive_check')) {
          storageWrapper.setItem(key, { lastCheck: null, lastArchiveDate: null })
        } else {
          storageWrapper.setItem(key, [])
        }
      }
    })
  }

  // Synchroniser une archive vers Firestore
  async syncArchiveToFirestore(collection, action, id = null, data = null) {
    if (!shouldUseFirebase()) return

    try {
      const agenceId = getCurrentAgenceId()
      if (!agenceId) return

      // Nettoyer les données avant envoi
      const cleanData = data ? cleanForFirestore(data) : null

      switch (action) {
        case 'add':
          await firestoreService.addDocument(agenceId, collection, { ...cleanData, id })
          break
        case 'update':
          await firestoreService.updateDocument(agenceId, collection, id, cleanData)
          break
        case 'delete':
          await firestoreService.deleteDocument(agenceId, collection, id)
          break
      }
    } catch (error) {
      logger.error(`Erreur sync Firestore archive ${collection}:`, error)
    }
  }

  // Vérifier si c'est le premier du mois et archiver automatiquement
  checkAndArchiveIfNeeded() {
    const now = new Date()
    const today = now.toISOString().split('T')[0] // YYYY-MM-DD
    const isFirstOfMonth = now.getDate() === 1

    const checkData = storageWrapper.getItem(this.storageKeys.lastArchiveCheck, {})
    const lastArchiveDate = checkData.lastArchiveDate

    // Archiver si :
    // 1. C'est le premier du mois ET
    // 2. On n'a pas encore archivé ce mois-ci
    if (isFirstOfMonth && lastArchiveDate !== today) {
      this.archiveCompletedMonth()

      // Mettre à jour la date de dernière vérification
      storageWrapper.setItem(this.storageKeys.lastArchiveCheck, {
        lastCheck: today,
        lastArchiveDate: today
      })
    }
  }

  // Archiver tous les paiements du mois précédent
  async archiveCompletedMonth() {
    try {
      // Importer dynamiquement le dataService
      const { default: dataService } = await import('./dataService')

      const now = new Date()
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const monthKey = this.getMonthKey(lastMonth)

      const allPayments = dataService.getPaiements()
      const paymentsByMonth = this.groupPaymentsByMonth(allPayments)

      if (paymentsByMonth[monthKey] && paymentsByMonth[monthKey].length > 0) {
        this.archivePaymentsForMonth(monthKey, paymentsByMonth[monthKey])
      }
    } catch (error) {
      logger.error('Erreur lors de l\'archivage automatique du mois:', error)
    }
  }

  // Grouper les paiements par mois
  groupPaymentsByMonth(payments) {
    const grouped = {}
    
    payments.forEach(payment => {
      const monthKey = `${payment.annee}-${String(payment.moisIndex || this.getMonthIndex(payment.mois)).padStart(2, '0')}`
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = []
      }
      
      grouped[monthKey].push(payment)
    })
    
    return grouped
  }

  // Obtenir l'index du mois à partir du nom
  getMonthIndex(monthName) {
    const mois = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ]
    return mois.indexOf(monthName) + 1
  }

  // Obtenir la clé du mois (YYYY-MM)
  getMonthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  }

  // Archiver les paiements d'un mois spécifique
  archivePaymentsForMonth(monthKey, payments) {
    const archives = this.getArchivedPayments()
    
    const monthArchive = {
      id: generateArchiveId(),
      monthKey,
      monthLabel: this.getMonthLabel(monthKey),
      archivedDate: new Date().toISOString(),
      payments: payments.map(payment => ({
        ...payment,
        archivedAt: new Date().toISOString()
      })),
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, p) => {
        // Éviter les doublons pour les paiements groupés
        if (p.paiementMultiple && p.groupeId) {
          const groupesTraites = new Set()
          if (!groupesTraites.has(p.groupeId)) {
            groupesTraites.add(p.groupeId)
            return sum + (p.montantTotalPaye || p.montantPaye || 0)
          }
          return sum
        } else {
          return sum + (p.montantPaye || 0)
        }
      }, 0)
    }
    
    // Éviter les doublons
    const existingIndex = archives.findIndex(arch => arch.monthKey === monthKey)
    if (existingIndex >= 0) {
      archives[existingIndex] = monthArchive
    } else {
      archives.push(monthArchive)
    }
    
    // Trier par date décroissante
    archives.sort((a, b) => new Date(b.archivedDate) - new Date(a.archivedDate))

    storageWrapper.setItem(this.storageKeys.archivedPayments, archives)

    // Synchroniser avec Firestore en arrière-plan
    this.syncArchiveToFirestore('archives_paiements', existingIndex >= 0 ? 'update' : 'add', monthArchive.id, monthArchive)
  }

  // Valider et archiver un reversement
  validateAndArchiveRemittance(proprietaire, periode, paiements) {
    try {
  
      
      const archives = this.getArchivedRemittances()
      
      const montantBrut = proprietaire.montantAReversser || 0
      const commission = montantBrut * 0.1 // 10% de commission
      const montantNet = montantBrut * 0.9
      
      const remittanceArchive = {
        id: generateArchiveId(),
        proprietaireId: proprietaire.id,
        proprietaireNom: `${proprietaire.prenom} ${proprietaire.nom}`,
        periode,
        validatedDate: new Date().toISOString(),
        montantReverse: montantBrut,
        commission: commission,
        montantNet: montantNet,
        paiements: paiements.map(payment => ({
          ...payment,
          archivedAt: new Date().toISOString()
        })),
        totalPaiements: paiements.length,
        statut: 'valide'
      }
      
      
      archives.push(remittanceArchive)
      
      // Trier par date décroissante
      archives.sort((a, b) => new Date(b.validatedDate) - new Date(a.validatedDate))

      storageWrapper.setItem(this.storageKeys.archivedRemittances, archives)

      // Synchroniser avec Firestore en arrière-plan
      this.syncArchiveToFirestore('archives_reversements', 'add', remittanceArchive.id, remittanceArchive)

      // Vérifier que la sauvegarde a fonctionné
      const savedArchives = this.getArchivedRemittances()

      return remittanceArchive
    } catch (error) {
      logger.error('Erreur validateAndArchiveRemittance:', error)
      throw error
    }
  }

  // Obtenir le label du mois
  getMonthLabel(monthKey) {
    const [year, month] = monthKey.split('-')
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ]
    return `${monthNames[parseInt(month) - 1]} ${year}`
  }

  // Récupérer les archives de paiements
  getArchivedPayments() {
    return storageWrapper.getItem(this.storageKeys.archivedPayments, [])
  }

  // Récupérer les archives de reversements
  getArchivedRemittances() {
    return storageWrapper.getItem(this.storageKeys.archivedRemittances, [])
  }

  // Obtenir les statistiques d'archives
  getArchiveStats() {
    const paymentArchives = this.getArchivedPayments()
    const remittanceArchives = this.getArchivedRemittances()
    
    const totalArchivedPayments = paymentArchives.reduce((sum, arch) => sum + arch.totalPayments, 0)
    const totalArchivedAmount = paymentArchives.reduce((sum, arch) => sum + arch.totalAmount, 0)
    const totalRemittances = remittanceArchives.length
    const totalRemittanceAmount = remittanceArchives.reduce((sum, arch) => sum + arch.montantReverse, 0)
    
    return {
      paymentArchives: paymentArchives.length,
      totalArchivedPayments,
      totalArchivedAmount,
      remittanceArchives: totalRemittances,
      totalRemittanceAmount,
      lastArchiveDate: paymentArchives.length > 0 ? paymentArchives[0].archivedDate : null
    }
  }

  // Rechercher dans les archives
  searchArchives(searchTerm, type = 'all') {
    const results = []
    
    if (type === 'all' || type === 'payments') {
      const paymentArchives = this.getArchivedPayments()
      paymentArchives.forEach(archive => {
        archive.payments.forEach(payment => {
          if (this.matchesSearch(payment, searchTerm)) {
            results.push({
              type: 'payment',
              archive: archive.monthLabel,
              data: payment
            })
          }
        })
      })
    }
    
    if (type === 'all' || type === 'remittances') {
      const remittanceArchives = this.getArchivedRemittances()
      remittanceArchives.forEach(archive => {
        if (this.matchesSearch(archive, searchTerm)) {
          results.push({
            type: 'remittance',
            archive: archive.periode,
            data: archive
          })
        }
      })
    }
    
    return results
  }

  // Vérifier si un élément correspond à la recherche
  matchesSearch(item, searchTerm) {
    const term = searchTerm.toLowerCase()
    const searchableText = JSON.stringify(item).toLowerCase()
    return searchableText.includes(term)
  }

  // Exporter les archives
  exportArchives(type = 'all') {
    const data = {}
    
    if (type === 'all' || type === 'payments') {
      data.payments = this.getArchivedPayments()
    }
    
    if (type === 'all' || type === 'remittances') {
      data.remittances = this.getArchivedRemittances()
    }
    
    const dataStr = JSON.stringify(data, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `woning_archives_${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }
}

export default new ArchiveService()