import { useState, useCallback } from 'react'
import logger from '../utils/logger'

/**
 * useFormValidation - Hook pour gérer la validation de formulaires avec Zod
 *
 * @param {Object} schema - Schema Zod pour la validation
 * @param {Object} initialValues - Valeurs initiales du formulaire
 * @param {Function} onSubmit - Callback de soumission réussie
 *
 * @returns {Object} {
 *   values: Object - Valeurs actuelles du formulaire
 *   errors: Object - Erreurs de validation
 *   touched: Object - Champs qui ont été touchés
 *   isSubmitting: Boolean - État de soumission
 *   isValid: Boolean - Formulaire valide
 *   handleChange: Function - Gérer le changement d'un champ
 *   handleBlur: Function - Gérer la perte de focus d'un champ
 *   handleSubmit: Function - Gérer la soumission du formulaire
 *   setFieldValue: Function - Définir la valeur d'un champ
 *   setFieldError: Function - Définir l'erreur d'un champ
 *   resetForm: Function - Réinitialiser le formulaire
 *   validateField: Function - Valider un champ spécifique
 * }
 */
export function useFormValidation(schema, initialValues = {}, onSubmit) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Valider un champ spécifique
  const validateField = useCallback((fieldName, fieldValue) => {
    if (!schema) return null

    try {
      // Valider le champ individuel avec Zod
      const fieldSchema = schema.shape[fieldName]
      if (fieldSchema) {
        fieldSchema.parse(fieldValue)
        return null
      }
    } catch (error) {
      if (error.errors && error.errors[0]) {
        return error.errors[0].message
      }
      return 'Erreur de validation'
    }
  }, [schema])

  // Valider tout le formulaire
  const validateForm = useCallback(() => {
    if (!schema) return true

    try {
      schema.parse(values)
      setErrors({})
      return true
    } catch (error) {
      if (error.errors) {
        const newErrors = {}
        error.errors.forEach(err => {
          const path = err.path.join('.')
          newErrors[path] = err.message
        })
        setErrors(newErrors)
      }
      return false
    }
  }, [schema, values])

  // Gérer le changement d'un champ
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target
    const fieldValue = type === 'checkbox' ? checked : value

    setValues(prev => ({
      ...prev,
      [name]: fieldValue
    }))

    // Valider le champ si déjà touché
    if (touched[name]) {
      const error = validateField(name, fieldValue)
      setErrors(prev => ({
        ...prev,
        [name]: error
      }))
    }
  }, [touched, validateField])

  // Gérer la perte de focus
  const handleBlur = useCallback((e) => {
    const { name, value } = e.target

    setTouched(prev => ({
      ...prev,
      [name]: true
    }))

    // Valider le champ
    const error = validateField(name, value)
    setErrors(prev => ({
      ...prev,
      [name]: error
    }))
  }, [validateField])

  // Définir la valeur d'un champ
  const setFieldValue = useCallback((fieldName, value) => {
    setValues(prev => ({
      ...prev,
      [fieldName]: value
    }))

    // Valider le champ si déjà touché
    if (touched[fieldName]) {
      const error = validateField(fieldName, value)
      setErrors(prev => ({
        ...prev,
        [fieldName]: error
      }))
    }
  }, [touched, validateField])

  // Définir l'erreur d'un champ
  const setFieldError = useCallback((fieldName, error) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }))
  }, [])

  // Gérer la soumission du formulaire
  const handleSubmit = useCallback(async (e) => {
    if (e) {
      e.preventDefault()
    }

    // Marquer tous les champs comme touchés
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {})
    setTouched(allTouched)

    // Valider le formulaire
    const isValid = validateForm()

    if (isValid && onSubmit) {
      setIsSubmitting(true)
      try {
        await onSubmit(values)
      } catch (error) {
        logger.error('Erreur de soumission:', error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }, [values, validateForm, onSubmit])

  // Réinitialiser le formulaire
  const resetForm = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  // Vérifier si le formulaire est valide
  const isValid = Object.keys(errors).length === 0 && Object.keys(touched).length > 0

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    resetForm,
    validateField
  }
}
