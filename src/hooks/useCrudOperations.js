import { useState, useCallback } from 'react'
import { useData } from '../contexts/DataContext'
import dataService from '../services/dataService'
import logger from '../utils/logger'

/**
 * Hook réutilisable pour gérer les opérations CRUD standard
 * @param {string} entityType - Type d'entité (proprietaires, biens, locataires, paiements)
 * @returns {object} État et fonctions pour gérer les opérations CRUD
 */
export function useCrudOperations(entityType) {
  const { refreshEntity } = useData()
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deleteModal, setDeleteModal] = useState({ show: false, item: null })

  // Ouvrir le formulaire en mode création
  const openCreateForm = useCallback(() => {
    setEditingItem(null)
    setShowForm(true)
  }, [])

  // Ouvrir le formulaire en mode édition
  const openEditForm = useCallback((item) => {
    setEditingItem(item)
    setShowForm(true)
  }, [])

  // Fermer le formulaire
  const closeForm = useCallback(() => {
    setShowForm(false)
    setEditingItem(null)
  }, [])

  // Ouvrir le modal de confirmation de suppression
  const openDeleteModal = useCallback((item) => {
    setDeleteModal({ show: true, item })
  }, [])

  // Fermer le modal de suppression
  const closeDeleteModal = useCallback(() => {
    setDeleteModal({ show: false, item: null })
  }, [])

  // Confirmer la suppression
  const confirmDelete = useCallback(() => {
    if (!deleteModal.item) return

    const serviceMethods = {
      proprietaires: 'deleteProprietaire',
      biens: 'deleteBien',
      locataires: 'deleteLocataire',
      paiements: 'deletePaiement',
      documents: 'deleteDocument'
    }

    const method = serviceMethods[entityType]
    if (method && dataService[method]) {
      dataService[method](deleteModal.item.id)
      refreshEntity(entityType)
      closeDeleteModal()
      return true
    }
    return false
  }, [deleteModal.item, entityType, refreshEntity, closeDeleteModal])

  // Sauvegarder (créer ou mettre à jour)
  const handleSave = useCallback((data) => {
    const serviceMethods = {
      proprietaires: { add: 'addProprietaire', update: 'updateProprietaire' },
      biens: { add: 'addBien', update: 'updateBien' },
      locataires: { add: 'addLocataire', update: 'updateLocataire' },
      paiements: { add: 'addPaiement', update: 'updatePaiement' }
    }

    const methods = serviceMethods[entityType]
    if (!methods) return false

    try {
      if (editingItem) {
        // Mode édition
        dataService[methods.update](editingItem.id, data)
      } else {
        // Mode création
        dataService[methods.add](data)
      }
      refreshEntity(entityType)
      closeForm()
      return true
    } catch (error) {
      logger.error(`Erreur lors de la sauvegarde de ${entityType}:`, error)
      return false
    }
  }, [editingItem, entityType, refreshEntity, closeForm])

  return {
    // État
    showForm,
    editingItem,
    deleteModal,
    isEditing: !!editingItem,

    // Fonctions
    openCreateForm,
    openEditForm,
    closeForm,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
    handleSave
  }
}
