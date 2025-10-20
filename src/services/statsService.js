import { MOIS } from '../constants/paiements'
import { safeParseFloat } from '../utils/numberUtils'
import logger from '../utils/logger'

/**
 * Service centralisé pour tous les calculs statistiques de l'application Woning
 * Évite la duplication de logique entre dataService, Dashboard, et Paiements
 */

class StatsService {
  /**
   * Calcule les statistiques globales de l'application
   * @param {Array} proprietaires - Liste des propriétaires
   * @param {Array} biens - Liste des biens
   * @param {Array} locataires - Liste des locataires
   * @param {Array} paiements - Liste des paiements
   * @returns {Object} Statistiques complètes
   */
  getStatistiquesGlobales(proprietaires, biens, locataires, paiements) {
    const locatairesActifs = locataires.filter(l => l.statut === 'actif')

    // Statistiques d'occupation
    const occupation = this.calculateOccupation(biens, locatairesActifs)

    // Statistiques financières du mois courant
    const financier = this.calculateStatistiquesFinancieres(locatairesActifs, paiements)

    // Données mensuelles pour graphiques (6 derniers mois)
    const monthlyData = this.calculateMonthlyData(paiements, locatairesActifs)

    return {
      totalProprietaires: proprietaires.length,
      totalBiens: biens.length,
      totalLocataires: locataires.length,
      locatairesActifs: locatairesActifs.length,
      ...occupation,
      ...financier,

      // Données du mois
      moisCourant: MOIS[financier.currentMonth - 1],
      anneeCourante: financier.currentYear,

      // Données pour graphiques
      monthlyData
    }
  }

  /**
   * Calcule les statistiques d'occupation des biens
   * @param {Array} biens - Liste des biens
   * @param {Array} locatairesActifs - Liste des locataires actifs
   * @returns {Object} { totalUnites, unitesOccupees, tauxOccupation }
   */
  calculateOccupation(biens, locatairesActifs) {
    let totalUnites = 0
    let unitesOccupees = 0

    biens.forEach(bien => {
      if (bien.type === 'cour_commune' && bien.maisons) {
        // Cour commune: compter chaque maison
        totalUnites += bien.maisons.length
        unitesOccupees += bien.maisons.filter(m => m.statut === 'occupee').length
      } else {
        // Bien simple: 1 unité
        totalUnites += 1
        const estOccupe = locatairesActifs.some(l => l.bienId === bien.id || l.courId === bien.id)
        if (estOccupe) {
          unitesOccupees += 1
        }
      }
    })

    const tauxOccupation = totalUnites > 0
      ? Math.round((unitesOccupees / totalUnites) * 100)
      : 0

    return {
      totalUnites,
      unitesOccupees,
      tauxOccupation
    }
  }

  /**
   * Calcule les statistiques financières pour le mois courant
   * @param {Array} locatairesActifs - Liste des locataires actifs
   * @param {Array} paiements - Liste de tous les paiements
   * @returns {Object} Statistiques financières
   */
  calculateStatistiquesFinancieres(locatairesActifs, paiements) {
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()

    // Filtrer les paiements du mois courant
    const paiementsMoisCourant = this.filterPaiementsByMonth(paiements, currentMonth, currentYear)

    // Calculer les revenus perçus
    const revenusMoisCourant = paiementsMoisCourant.reduce(
      (sum, p) => sum + safeParseFloat(p.montantPaye, 0),
      0
    )

    // Calculer le montant attendu (somme des loyers de tous les locataires actifs)
    const totalAttenduMoisCourant = locatairesActifs.reduce(
      (sum, l) => sum + safeParseFloat(l.montantLoyer, 0),
      0
    )

    // Identifier les locataires impayés
    const locatairesImpayes = this.getLocatairesImpayes(
      locatairesActifs,
      paiementsMoisCourant
    )

    // Calculer le taux de recouvrement
    const tauxRecouvrement = totalAttenduMoisCourant > 0
      ? Math.round((revenusMoisCourant / totalAttenduMoisCourant) * 100)
      : 100

    return {
      currentMonth,
      currentYear,
      revenusMoisCourant,
      totalAttenduMoisCourant,
      montantEnAttente: Math.max(0, totalAttenduMoisCourant - revenusMoisCourant),
      tauxRecouvrement,
      alertesImpayes: locatairesImpayes.length,
      locatairesImpayes // Ajout pour utilisation ailleurs
    }
  }

  /**
   * Filtre les paiements pour un mois et une année donnés
   * @param {Array} paiements - Liste des paiements
   * @param {number} mois - Mois (1-12)
   * @param {number} annee - Année (ex: 2025)
   * @returns {Array} Paiements filtrés
   */
  filterPaiementsByMonth(paiements, mois, annee) {
    return paiements.filter(p => {
      let paiementMois = p.mois

      // Convertir nom de mois en numéro si nécessaire
      if (typeof paiementMois === 'string') {
        const moisIndex = MOIS.indexOf(p.mois)
        // Gérer les mois invalides
        if (moisIndex === -1) {
          logger.warn(`Mois invalide détecté: "${p.mois}" pour paiement ID: ${p.id}`)
          return false
        }
        paiementMois = moisIndex + 1
      }

      return parseInt(paiementMois) === mois && parseInt(p.annee) === annee
    })
  }

  /**
   * Identifie les locataires qui n'ont pas payé (ou partiellement) pour le mois courant
   * Optimisé: O(n+m) au lieu de O(n*m)
   * @param {Array} locatairesActifs - Liste des locataires actifs
   * @param {Array} paiementsMoisCourant - Paiements du mois courant
   * @returns {Array} Locataires impayés
   */
  getLocatairesImpayes(locatairesActifs, paiementsMoisCourant) {
    // Index paiements par locataireId pour recherche O(1)
    const paiementsIndex = new Map()
    paiementsMoisCourant.forEach(p => {
      paiementsIndex.set(p.locataireId, p)
    })

    // Filtrer locataires impayés en O(n)
    return locatairesActifs.filter(locataire => {
      const paiement = paiementsIndex.get(locataire.id)

      // Aucun paiement trouvé
      if (!paiement) return true

      // Paiement partiel
      const montantDu = safeParseFloat(locataire.montantLoyer, 0)
      const montantPaye = safeParseFloat(paiement.montantPaye, 0)

      return montantPaye < montantDu
    })
  }

  /**
   * Calcule les reversements dus aux propriétaires
   * @param {Array} proprietaires - Liste des propriétaires
   * @param {Array} biens - Liste des biens
   * @param {Array} locataires - Liste des locataires
   * @param {Array} paiements - Liste des paiements (filtrés par période)
   * @param {number} tauxCommission - Taux de commission en % (défaut: 10%)
   * @returns {Array} Reversements par propriétaire
   */
  calculateReversementsProprietaires(
    proprietaires,
    biens,
    locataires,
    paiements,
    tauxCommission = 10
  ) {
    // 1. Indexer les données pour performance O(n) au lieu de O(n³)
    const biensParProprietaire = this.groupBy(biens, 'proprietaireId')
    const locatairesParBien = this.groupBy(locataires, 'courId')
    const paiementsParLocataire = this.groupBy(paiements, 'locataireId')

    // 2. Calculer pour chaque propriétaire
    return proprietaires.map(proprietaire => {
      const mesBiens = biensParProprietaire[proprietaire.id] || []
      let montantTotal = 0
      let montantCommission = 0

      mesBiens.forEach(bien => {
        const mesLocataires = locatairesParBien[bien.id] || []

        mesLocataires.forEach(locataire => {
          const paiementsLocataire = paiementsParLocataire[locataire.id] || []

          // Gérer les paiements multiples (éviter double comptage)
          const groupesTraites = new Set()

          paiementsLocataire.forEach(paiement => {
            let montantPaye = safeParseFloat(paiement.montantPaye, 0)

            // Paiement multiple: compter une seule fois par groupe
            if (paiement.paiementMultiple && paiement.groupeId) {
              if (groupesTraites.has(paiement.groupeId)) {
                return // Déjà compté
              }
              groupesTraites.add(paiement.groupeId)
            }

            montantTotal += montantPaye
          })
        })
      })

      // Calculer la commission
      montantCommission = (montantTotal * tauxCommission) / 100

      return {
        proprietaire,
        montantTotal,
        montantCommission,
        montantNet: montantTotal - montantCommission,
        nombreBiens: mesBiens.length
      }
    }).filter(r => r.montantTotal > 0) // Ne garder que les propriétaires avec paiements
  }

  /**
   * Calcule le résumé des paiements pour une période donnée
   * @param {Array} paiements - Paiements de la période
   * @param {Array} locataires - Liste de tous les locataires
   * @returns {Object} Résumé
   */
  calculateResumePaiements(paiements, locataires) {
    const groupesTraites = new Set()
    let montantTotalPercu = 0
    let nombrePaiements = 0

    paiements.forEach(paiement => {
      // Gérer paiements multiples
      if (paiement.paiementMultiple && paiement.groupeId) {
        if (groupesTraites.has(paiement.groupeId)) {
          return
        }
        groupesTraites.add(paiement.groupeId)
      }

      montantTotalPercu += safeParseFloat(paiement.montantPaye, 0)
      nombrePaiements++
    })

    // Calculer le montant attendu (tous les locataires actifs)
    const locatairesActifs = locataires.filter(l => l.statut === 'actif')
    const montantAttendu = locatairesActifs.reduce(
      (sum, l) => sum + safeParseFloat(l.montantLoyer, 0),
      0
    )

    return {
      montantTotalPercu,
      montantAttendu,
      montantEnAttente: Math.max(0, montantAttendu - montantTotalPercu),
      nombrePaiements,
      nombreLocatairesActifs: locatairesActifs.length
    }
  }

  /**
   * Utilitaire pour grouper un tableau d'objets par clé
   * @param {Array} array - Tableau d'objets
   * @param {string} key - Clé de regroupement
   * @returns {Object} Objets groupés
   * @private
   */
  groupBy(array, key) {
    return array.reduce((result, item) => {
      const groupKey = item[key]
      if (!result[groupKey]) {
        result[groupKey] = []
      }
      result[groupKey].push(item)
      return result
    }, {})
  }

  /**
   * Calcule les statistiques par mois sur une année
   * @param {Array} paiements - Liste de tous les paiements
   * @param {number} annee - Année concernée
   * @returns {Array} Stats mensuelles [{ mois, montant, attendu }, ...]
   */
  getStatistiquesMensuelles(paiements, locatairesActifs, annee) {
    return MOIS.map((nomMois, index) => {
      const numeroMois = index + 1
      const paiementsMois = this.filterPaiementsByMonth(paiements, numeroMois, annee)

      const montant = paiementsMois.reduce(
        (sum, p) => sum + safeParseFloat(p.montantPaye, 0),
        0
      )

      const attendu = locatairesActifs.reduce(
        (sum, l) => sum + safeParseFloat(l.montantLoyer, 0),
        0
      )

      return {
        mois: nomMois,
        montant,
        attendu,
        ecart: attendu - montant
      }
    })
  }

  /**
   * Calcule les données mensuelles pour les 6 derniers mois
   * @param {Array} paiements - Liste de tous les paiements
   * @param {Array} locatairesActifs - Liste des locataires actifs
   * @returns {Object} Données par mois indexées 0-11
   */
  calculateMonthlyData(paiements, locatairesActifs) {
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() // 0-11

    const monthlyData = {}

    // Calculer les données pour les 6 derniers mois
    for (let i = 5; i >= 0; i--) {
      const targetMonth = currentMonth - i
      const targetYear = currentYear + Math.floor(targetMonth / 12)
      const adjustedMonth = ((targetMonth % 12) + 12) % 12
      const monthNumber = adjustedMonth + 1 // 1-12 pour filterPaiementsByMonth

      // Filtrer les paiements de ce mois
      const paiementsMois = this.filterPaiementsByMonth(paiements, monthNumber, targetYear)

      // Calculer le montant reçu pour ce mois
      const montant = paiementsMois.reduce(
        (sum, p) => sum + safeParseFloat(p.montantPaye, 0),
        0
      )

      // Le montant attendu est la somme des loyers de tous les locataires actifs
      const attendu = locatairesActifs.reduce(
        (sum, l) => sum + safeParseFloat(l.montantLoyer, 0),
        0
      )

      monthlyData[adjustedMonth] = {
        montant,
        attendu
      }
    }

    return monthlyData
  }
}

export default new StatsService()
