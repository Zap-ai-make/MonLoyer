import { AlertCircle } from 'lucide-react'

/**
 * Composant pour afficher les erreurs de validation
 * @param {Object} props
 * @param {Array} props.errors - Liste des erreurs { field, message }
 */
function ValidationMessage({ errors }) {
  if (!errors || errors.length === 0) return null

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 animate-fadeIn">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-red-800 mb-2">
            Erreurs de validation
          </h4>
          <ul className="space-y-1.5">
            {errors.map((error, idx) => (
              <li key={idx} className="text-sm text-red-700 flex items-start">
                <span className="mr-2">•</span>
                <span>{error.message}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ValidationMessage
