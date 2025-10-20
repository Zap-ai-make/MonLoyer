import { safeParseFloat } from './numberUtils'

/**
 * Utilitaires pour la gestion des locataires
 */

/**
 * Obtient les informations détaillées d'un bien pour un locataire
 * @param {Object} locataire - Le locataire
 * @param {Array} biens - Liste des biens
 * @returns {string} Information formatée du bien
 */
export const getBienInfoForLocataire = (locataire, biens) => {
  if (!locataire.courId) return 'Aucune cour assignée'

  const cour = biens.find(b => b.id === locataire.courId)
  if (!cour) return 'Cour inconnue'

  const nomCour = cour.nomCour || `${cour.quartier} ${cour.ville}`
  const typeLibelle = cour.type === 'cour_commune' ? 'Cour commune' :
                     cour.type === 'magasin' ? 'Magasin' : 'Villa'

  let info = `${nomCour} - ${typeLibelle}`

  if (cour.type === 'cour_commune' && locataire.numeroMaison) {
    info += ` - Maison n°${locataire.numeroMaison}`
  }

  return info
}

/**
 * Obtient le nom du propriétaire pour le bien d'un locataire
 * @param {string} courId - ID de la cour
 * @param {Array} biens - Liste des biens
 * @param {Array} proprietaires - Liste des propriétaires
 * @returns {string} Nom du propriétaire
 */
export const getProprietaireInfoForLocataire = (courId, biens, proprietaires) => {
  const cour = biens.find(b => b.id === courId)
  if (!cour) return 'Propriétaire inconnu'

  const proprietaire = proprietaires.find(p => p.id === cour.proprietaireId)
  return proprietaire ? `${proprietaire.prenom} ${proprietaire.nom}` : 'Propriétaire inconnu'
}

/**
 * Filtre les locataires par terme de recherche
 * @param {Array} locataires - Liste des locataires
 * @param {string} searchTerm - Terme de recherche
 * @param {Array} biens - Liste des biens
 * @param {Array} proprietaires - Liste des propriétaires
 * @returns {Array} Locataires filtrés
 */
export const filterLocataires = (locataires, searchTerm, biens, proprietaires) => {
  if (!searchTerm?.trim()) return locataires

  const searchLower = searchTerm.toLowerCase()

  return locataires.filter(locataire => {
    const nom = (locataire.nom || '').toLowerCase()
    const prenom = (locataire.prenom || '').toLowerCase()
    const telephone = (locataire.telephone || '').toLowerCase()
    const bienInfo = getBienInfoForLocataire(locataire, biens).toLowerCase()
    const proprietaireInfo = getProprietaireInfoForLocataire(locataire.courId, biens, proprietaires).toLowerCase()

    return nom.includes(searchLower) ||
           prenom.includes(searchLower) ||
           telephone.includes(searchLower) ||
           bienInfo.includes(searchLower) ||
           proprietaireInfo.includes(searchLower)
  })
}

/**
 * Valide les données d'un formulaire de locataire
 * @param {Object} formData - Données du formulaire
 * @param {Object} selectedBien - Bien sélectionné
 * @returns {Object} { isValid: boolean, errors: Array }
 */
export const validateLocataireForm = (formData, selectedBien) => {
  const errors = []

  if (!formData.nom?.trim()) {
    errors.push({ field: 'nom', message: 'Le nom est obligatoire' })
  }

  if (!formData.prenom?.trim()) {
    errors.push({ field: 'prenom', message: 'Le prénom est obligatoire' })
  }

  if (!formData.courId) {
    errors.push({ field: 'courId', message: 'Veuillez sélectionner un bien' })
  }

  if (selectedBien?.type === 'cour_commune' && !formData.numeroMaison) {
    errors.push({ field: 'numeroMaison', message: 'Veuillez sélectionner une maison pour cette cour commune' })
  }

  if (formData.montantLoyer && safeParseFloat(formData.montantLoyer, 0) < 0) {
    errors.push({ field: 'montantLoyer', message: 'Le montant du loyer ne peut pas être négatif' })
  }

  if (formData.caution && safeParseFloat(formData.caution, 0) < 0) {
    errors.push({ field: 'caution', message: 'La caution ne peut pas être négative' })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
