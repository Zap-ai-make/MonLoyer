/**
 * Utilitaires pour la gestion des biens immobiliers
 */

import { TYPES_BIEN_MAP } from '../constants/biens'
import { safeParseFloat, safeParseInt } from './numberUtils'

/**
 * Obtient le libellé d'un type de bien
 * @param {string} type - Type du bien (cour_unique, cour_commune, magasin)
 * @returns {string} Libellé du type
 */
export const getTypeLabel = (type) => {
  return TYPES_BIEN_MAP[type] || type
}

/**
 * Compte le nombre de locataires pour un bien donné
 * @param {string} courId - ID du bien
 * @param {Array} locataires - Liste de tous les locataires
 * @returns {number} Nombre de locataires
 */
export const getLocatairesCount = (courId, locataires) => {
  return locataires.filter(loc => loc.courId === courId && loc.statut === 'actif').length
}

/**
 * Obtient le nom du propriétaire d'un bien
 * @param {string} proprietaireId - ID du propriétaire
 * @param {Array} proprietaires - Liste des propriétaires
 * @returns {string} Nom complet du propriétaire
 */
export const getProprietaireNom = (proprietaireId, proprietaires) => {
  const proprietaire = proprietaires.find(p => p.id === proprietaireId)
  return proprietaire ? `${proprietaire.prenom} ${proprietaire.nom}` : 'Propriétaire inconnu'
}

/**
 * Détermine si un bien est occupé
 * @param {Object} bien - Objet bien immobilier
 * @returns {boolean} True si le bien est occupé
 */
export const isOccupe = (bien) => {
  // Pour une cour commune, vérifier si au moins une maison est occupée
  if (bien.type === 'cour_commune' && bien.maisons) {
    return bien.maisons.some(maison => maison.statut === 'occupee')
  }

  // Pour un bien simple, vérifier le statut normalisé
  const statutNormalized = bien.statut?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  return statutNormalized === 'occupe' || statutNormalized === 'occupee'
}

/**
 * Valide les données d'un formulaire de bien
 * @param {Object} formData - Données du formulaire
 * @returns {Object} { isValid: boolean, errors: Array }
 */
export const validateBienForm = (formData) => {
  const errors = []

  if (!formData.proprietaireId) {
    errors.push({ field: 'proprietaireId', message: 'Veuillez sélectionner un propriétaire' })
  }

  if (!formData.type) {
    errors.push({ field: 'type', message: 'Veuillez sélectionner le type de bien' })
  }

  if (!formData.ville?.trim()) {
    errors.push({ field: 'ville', message: 'La ville est obligatoire' })
  }

  if (!formData.montantLoyer || safeParseFloat(formData.montantLoyer, 0) <= 0) {
    errors.push({ field: 'montantLoyer', message: 'Le montant du loyer doit être supérieur à 0' })
  }

  if (formData.type === 'cour_commune') {
    const nombreMaisons = safeParseInt(formData.nombreMaisons, 0)
    if (nombreMaisons < 1 || nombreMaisons > 20) {
      errors.push({ field: 'nombreMaisons', message: 'Le nombre de maisons doit être entre 1 et 20' })
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
