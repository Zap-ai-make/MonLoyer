import { memo } from 'react'
import { Home, Users, User, FileText, Building2 } from 'lucide-react'

const illustrations = {
  proprietaire: Users,
  bien: Home,
  locataire: User,
  paiement: FileText,
  default: Building2
}

const EmptyState = memo(function EmptyState({ type = 'default', title, message, action }) {
  const Icon = illustrations[type] || illustrations.default

  // Messages encourageants par défaut selon le type
  const defaultMessages = {
    proprietaire: 'Commencez par enregistrer vos propriétaires 🚀',
    bien: 'Ajoutez vos biens pour suivre l\'occupation 🚀',
    locataire: 'Enregistrez votre premier locataire et commencez à suivre vos revenus 💡',
    paiement: 'Aucun paiement enregistré pour le moment 📊',
    default: 'Commencez par ajouter des données pour voir vos statistiques ici 📈'
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {/* Illustration SVG */}
      <div
        className="mb-6 p-8 rounded-full"
        style={{ backgroundColor: '#F5F7FA' }}
      >
        <Icon
          className="w-16 h-16"
          style={{ color: '#CED4DA', strokeWidth: 1.5 }}
        />
      </div>

      {/* Titre */}
      <h3
        className="text-xl font-semibold mb-2"
        style={{ color: '#495057', fontFamily: 'Poppins, sans-serif' }}
      >
        {title || 'Aucune donnée'}
      </h3>

      {/* Message encourageant */}
      <p
        className="text-sm mb-6 max-w-md"
        style={{ color: '#6C757D' }}
      >
        {message || defaultMessages[type] || defaultMessages.default}
      </p>

      {/* Action optionnelle */}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105"
          style={{
            backgroundColor: '#00B894',
            color: '#FFFFFF',
            boxShadow: '0 4px 12px rgba(0, 184, 148, 0.3)'
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  )
})

export default EmptyState
