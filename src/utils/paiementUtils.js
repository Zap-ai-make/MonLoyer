import { safeParseFloat } from './numberUtils'
import { MOIS } from '../constants/paiements'

/**
 * Utilitaires pour la gestion des paiements
 * Fonctions de calcul et validation pour les paiements de loyers
 */

/**
 * Récupère les indices des mois déjà payés pour un locataire et une année donnés
 * @param {string} locataireId - ID du locataire
 * @param {number} annee - Année concernée
 * @param {Array} paiements - Liste de tous les paiements
 * @returns {Array<number>} - Indices des mois déjà payés (0-11)
 */
export const getMoisDejaPayes = (locataireId, annee, paiements) => {
  const moisPayes = new Set()

  paiements
    .filter(p => p.locataireId === locataireId && parseInt(p.annee) === parseInt(annee))
    .forEach(paiement => {
      if (paiement.paiementMultiple && paiement.moisDuGroupe) {
        // Paiement multiple : ajouter tous les mois du groupe
        paiement.moisDuGroupe.forEach(moisNom => {
          const moisIndex = MOIS.indexOf(moisNom)
          if (moisIndex !== -1) moisPayes.add(moisIndex)
        })
      } else if (typeof paiement.mois === 'number') {
        // Paiement simple avec index (0-11)
        moisPayes.add(paiement.mois)
      } else if (typeof paiement.mois === 'string') {
        // Paiement simple avec nom de mois
        const moisIndex = MOIS.indexOf(paiement.mois)
        if (moisIndex !== -1) moisPayes.add(moisIndex)
      } else if (paiement.mois >= 1 && paiement.mois <= 12) {
        // Paiement avec numéro de mois (1-12)
        moisPayes.add(paiement.mois - 1)
      }
    })

  return Array.from(moisPayes)
}

/**
 * Détermine si un mois doit être désactivé dans le formulaire
 * Un mois est désactivé si :
 * 1. Il est déjà payé
 * 2. Il est antérieur à la date de création du locataire
 * @param {number} moisIndex - Index du mois (0-11)
 * @param {number} annee - Année concernée
 * @param {string} locataireId - ID du locataire
 * @param {Array} paiements - Liste de tous les paiements
 * @param {Array} locataires - Liste de tous les locataires
 * @returns {Object} { disabled: boolean, reason: string }
 */
export const isMoisDisabled = (moisIndex, annee, locataireId, paiements, locataires) => {
  if (!locataireId) {
    return { disabled: false, reason: '' }
  }

  // Vérifier si le mois est déjà payé
  const moisDejaPayes = getMoisDejaPayes(locataireId, annee, paiements)
  if (moisDejaPayes.includes(moisIndex)) {
    return { disabled: true, reason: '✓ Mois déjà payé' }
  }

  // Vérifier si le mois est antérieur à la date de création du locataire
  const locataire = locataires.find(l => l.id === locataireId)
  if (locataire && locataire.dateCreation) {
    const dateCreation = new Date(locataire.dateCreation)
    const moisCreation = dateCreation.getMonth()
    const anneeCreation = dateCreation.getFullYear()

    // Si l'année du formulaire est antérieure à l'année de création
    if (annee < anneeCreation) {
      return { disabled: true, reason: 'Avant enregistrement' }
    }

    // Si même année, vérifier le mois
    if (annee === anneeCreation && moisIndex < moisCreation) {
      return { disabled: true, reason: 'Avant enregistrement' }
    }
  }

  return { disabled: false, reason: '' }
}

/**
 * Calcule le montant total payé par un locataire pour une période donnée
 * @param {Array} paiementsLocataire - Liste des paiements du locataire (déjà filtrés par période)
 * @returns {number} Montant total payé
 */
export const calculateMontantTotalPaye = (paiementsLocataire) => {
  let montantTotal = 0

  paiementsLocataire.forEach(paiement => {
    // Compter le montantPaye de chaque paiement
    // Si les paiements sont déjà filtrés par période, montantPaye contient la portion correcte
    montantTotal += safeParseFloat(paiement.montantPaye, 0)
  })

  return montantTotal
}

/**
 * Valide les données du formulaire de paiement
 * @param {Object} formData - Données du formulaire
 * @param {Array} existingPaiements - Liste des paiements existants (optionnel)
 * @returns {Object} { isValid: boolean, errors: Array }
 */
export const validatePaiementForm = (formData, existingPaiements = []) => {
  const errors = []

  if (!formData.locataireId) {
    errors.push({
      field: 'locataireId',
      message: 'Veuillez sélectionner un locataire'
    })
  }

  if (formData.moisSelectionnes.length === 0) {
    errors.push({
      field: 'moisSelectionnes',
      message: 'Veuillez sélectionner au moins un mois'
    })
  }

  const montantPaye = safeParseFloat(formData.montantPaye, 0)
  if (montantPaye <= 0) {
    errors.push({
      field: 'montantPaye',
      message: 'Le montant payé doit être supérieur à 0 FCFA'
    })
  }

  const montantDu = safeParseFloat(formData.montantDu, 0)
  if (montantDu <= 0) {
    errors.push({
      field: 'montantDu',
      message: 'Le montant dû doit être supérieur à 0 FCFA'
    })
  }

  // Validation mode chèque
  if (formData.modePaiement === 'cheque' && !formData.numeroCheque?.trim()) {
    errors.push({
      field: 'numeroCheque',
      message: 'Veuillez entrer le numéro de chèque'
    })
  }

  // Validation mode mobile money
  if (formData.modePaiement === 'mobile_money' && !formData.numeroMobileMoney?.trim()) {
    errors.push({
      field: 'numeroMobileMoney',
      message: 'Veuillez entrer le numéro de paiement Mobile Money'
    })
  }

  // Validation des doublons de paiements et des mois désactivés
  if (formData.locataireId && formData.annee && formData.moisSelectionnes.length > 0) {
    const moisDejaPayes = getMoisDejaPayes(formData.locataireId, formData.annee, existingPaiements)
    const moisEnDouble = formData.moisSelectionnes.filter(moisIndex => moisDejaPayes.includes(moisIndex))

    if (moisEnDouble.length > 0) {
      const moisNoms = moisEnDouble.map(index => MOIS[index]).join(', ')
      errors.push({
        field: 'moisSelectionnes',
        message: `Les mois suivants sont déjà payés : ${moisNoms}`
      })
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Crée les objets de paiements pour un paiement groupé multi-mois
 * @param {Object} formData - Données du formulaire
 * @param {Array} mois - Liste des noms de mois
 * @returns {Array} Liste des paiements à créer
 */
export const createGroupedPayments = (formData, mois) => {
  const groupeId = Date.now().toString() + Math.random().toString(36).substring(2, 9)
  const montantPaye = safeParseFloat(formData.montantPaye, 0)
  const montantDu = safeParseFloat(formData.montantDu, 0)
  const montantParMois = montantPaye / formData.moisSelectionnes.length
  const montantDuParMois = montantDu / formData.moisSelectionnes.length

  return formData.moisSelectionnes.map((moisIndex, indexInGroup) => ({
    locataireId: formData.locataireId,
    mois: mois[moisIndex],
    moisIndex: moisIndex + 1,
    annee: formData.annee,
    montantDu: montantDuParMois,
    montantPaye: montantParMois,
    montantRestant: montantDuParMois - montantParMois,
    statut: montantParMois >= montantDuParMois ? 'paye' : 'partiel',
    datePaiement: formData.datePaiement,
    modePaiement: formData.modePaiement,
    numeroCheque: formData.numeroCheque,
    numeroMobileMoney: formData.numeroMobileMoney,
    remarques: formData.remarques,
    // Informations pour groupement multi-mois
    paiementMultiple: formData.moisSelectionnes.length > 1,
    groupeId: formData.moisSelectionnes.length > 1 ? groupeId : null,
    totalMoisPayes: formData.moisSelectionnes.length,
    montantTotalPaye: montantPaye,
    indexInGroup,
    isPremierDuGroupe: indexInGroup === 0,
    moisDuGroupe: formData.moisSelectionnes.map(i => mois[i])
  }))
}

/**
 * Filtre les paiements par période (mois/année)
 * @param {Array} paiements - Liste de tous les paiements
 * @param {number} filtreMois - Mois à filtrer (1-12)
 * @param {number} filtreAnnee - Année à filtrer
 * @param {Array} mois - Liste des noms de mois
 * @returns {Array} Paiements filtrés
 */
export const filterPaiementsByPeriod = (paiements, filtreMois, filtreAnnee, mois) => {
  return paiements.filter(paiement => {
    // Utiliser moisIndex si disponible, sinon convertir le nom du mois
    let paiementMois = paiement.moisIndex
    if (!paiementMois && typeof paiement.mois === 'string') {
      paiementMois = mois.indexOf(paiement.mois) + 1
    } else if (!paiementMois) {
      paiementMois = parseInt(paiement.mois)
    }

    const paiementAnnee = parseInt(paiement.annee)
    return paiementMois === filtreMois && paiementAnnee === filtreAnnee
  })
}

/**
 * Calcule le total attendu basé sur les locataires actifs
 * @param {Array} locataires - Liste des locataires
 * @returns {number} Total attendu
 */
export const calculateTotalAttendu = (locataires) => {
  let totalAttendu = 0

  locataires.forEach(locataire => {
    // Seulement les locataires actifs avec un loyer défini
    if (locataire.statut === 'actif' && locataire.montantLoyer && locataire.courId) {
      const montant = parseFloat(locataire.montantLoyer) || 0
      totalAttendu += montant
    }
  })

  return totalAttendu
}

/**
 * Calcule le total encaissé pour une période donnée
 * @param {Array} paiementsFiltres - Paiements de la période (déjà filtrés par mois/année)
 * @returns {number} Total encaissé
 */
export const calculateTotalEncaisse = (paiementsFiltres) => {
  let totalEncaisse = 0

  paiementsFiltres.forEach(p => {
    // Compter le montantPaye de chaque paiement
    // Pour les paiements groupés, montantPaye représente la portion du mois concerné
    // Pour les paiements simples, montantPaye représente le montant total
    totalEncaisse += parseFloat(p.montantPaye) || 0
  })

  return totalEncaisse
}

/**
 * Calcule le résumé des paiements pour une période
 * @param {Array} paiementsFiltres - Paiements de la période
 * @param {Array} locataires - Liste des locataires
 * @returns {Object} { totalAttendu, totalEncaisse, totalImpaye }
 */
export const calculateResumePaiements = (paiementsFiltres, locataires) => {
  const totalAttendu = calculateTotalAttendu(locataires)
  const totalEncaisse = calculateTotalEncaisse(paiementsFiltres)
  const totalImpaye = totalAttendu - totalEncaisse

  return {
    totalAttendu,
    totalEncaisse,
    totalImpaye: Math.max(0, totalImpaye) // Pas de montant négatif
  }
}

/**
 * Calcule les informations de paiement pour un locataire
 * @param {Object} locataire - Le locataire
 * @param {Array} paiementsFiltres - Paiements de la période
 * @returns {Object} { montantDu, montantPaye, montantRestant, statut }
 */
export const calculateLocatairePaiementInfo = (locataire, paiementsFiltres) => {
  const paiementsLocataire = paiementsFiltres.filter(p => p.locataireId === locataire.id)
  const montantTotalPaye = calculateMontantTotalPaye(paiementsLocataire)
  const montantDu = parseFloat(locataire.montantLoyer) || 0
  const montantRestant = montantDu - montantTotalPaye

  return {
    montantDu,
    montantPaye: montantTotalPaye,
    montantRestant,
    statut: montantTotalPaye === 0 ? 'impaye' : montantTotalPaye < montantDu ? 'partiel' : 'paye'
  }
}

/**
 * Obtient la liste des locataires impayés pour la période
 * @param {Array} paiementsFiltres - Paiements de la période
 * @param {Array} locataires - Liste des locataires
 * @returns {Array} Locataires impayés avec leurs montants
 */
export const getLocatairesImpayes = (paiementsFiltres, locataires) => {
  return locataires
    .filter(locataire => {
      // Seulement les locataires actifs avec un loyer défini
      if (locataire.statut !== 'actif' || !locataire.montantLoyer || !locataire.courId) {
        return false
      }

      // Calculer le montant total payé
      const { montantPaye, montantDu } = calculateLocatairePaiementInfo(locataire, paiementsFiltres)
      return montantPaye < montantDu // Paiement partiel ou nul = impayé
    })
    .map(locataire => {
      const paiementInfo = calculateLocatairePaiementInfo(locataire, paiementsFiltres)
      return {
        ...locataire,
        ...paiementInfo
      }
    })
}
