/**
 * Point d'entrée centralisé pour tous les hooks personnalisés
 * Permet des imports simplifiés: import { useForm } from '../hooks'
 */

export { useForm } from './useForm'
export { useCrudOperations } from './useCrudOperations'
export { useFormValidation } from './useFormValidation'
export { useTimestamp } from './useTimestamp'

// Export par défaut d'un objet avec tous les hooks
export default {
  useForm,
  useCrudOperations,
  useFormValidation,
  useTimestamp
}
