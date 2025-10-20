import { useState, useCallback } from 'react'

/**
 * Hook personnalisé pour gérer les formulaires
 * Élimine la duplication du pattern formData + handleChange
 *
 * @param {Object} initialValues - Valeurs initiales du formulaire
 * @returns {Object} - { formData, handleChange, setFormData, resetForm }
 *
 * @example
 * const { formData, handleChange, resetForm } = useForm({
 *   nom: '',
 *   prenom: '',
 *   email: ''
 * })
 */
export const useForm = (initialValues = {}) => {
  const [formData, setFormData] = useState(initialValues)

  /**
   * Gère le changement d'un champ du formulaire
   * Supporte les inputs standards et les custom events
   */
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }, [])

  /**
   * Réinitialise le formulaire aux valeurs initiales
   */
  const resetForm = useCallback(() => {
    setFormData(initialValues)
  }, [initialValues])

  /**
   * Met à jour plusieurs champs à la fois
   */
  const updateFields = useCallback((fields) => {
    setFormData(prev => ({
      ...prev,
      ...fields
    }))
  }, [])

  /**
   * Met à jour un seul champ programmatiquement
   */
  const setField = useCallback((name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }, [])

  /**
   * Obtient la valeur d'un champ
   */
  const getField = useCallback((name) => {
    return formData[name]
  }, [formData])

  /**
   * Vérifie si le formulaire a des changements par rapport aux valeurs initiales
   */
  const hasChanges = useCallback(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialValues)
  }, [formData, initialValues])

  return {
    formData,
    handleChange,
    setFormData,
    resetForm,
    updateFields,
    setField,
    getField,
    hasChanges
  }
}

export default useForm
