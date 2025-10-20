import { X, AlertTriangle, Info, CheckCircle, Trash2 } from 'lucide-react'
import { COLORS } from '../constants/colors'

/**
 * Modal universel pour tous les types de dialogues
 * @param {string} variant - Type de modal: 'form' | 'delete' | 'confirm' | 'info' | 'success'
 * @param {boolean} isOpen - État d'ouverture du modal
 * @param {function} onClose - Callback de fermeture
 * @param {function} onConfirm - Callback de confirmation (pour delete/confirm)
 * @param {string} title - Titre du modal
 * @param {string} message - Message/description (optionnel)
 * @param {string} size - Taille: 'sm' | 'md' | 'lg' | 'xl'
 * @param {ReactNode} children - Contenu du modal (pour variant='form')
 * @param {string} confirmText - Texte du bouton de confirmation
 * @param {string} cancelText - Texte du bouton d'annulation
 * @param {boolean} showCloseButton - Afficher le bouton X en haut
 */
function UniversalModal({
  variant = 'form',
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  size = 'md',
  children,
  confirmText,
  cancelText = 'Annuler',
  showCloseButton = true,
  confirmButtonStyle
}) {
  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  }

  const variantConfig = {
    delete: {
      icon: Trash2,
      iconColor: '#E74C3C',
      iconBg: 'rgba(231, 76, 60, 0.1)',
      confirmText: confirmText || 'Supprimer',
      confirmStyle: {
        backgroundColor: '#E74C3C',
        color: '#FFFFFF'
      }
    },
    confirm: {
      icon: AlertTriangle,
      iconColor: '#F39C12',
      iconBg: 'rgba(243, 156, 18, 0.1)',
      confirmText: confirmText || 'Confirmer',
      confirmStyle: {
        backgroundColor: COLORS.primary.DEFAULT,
        color: '#FFFFFF'
      }
    },
    info: {
      icon: Info,
      iconColor: COLORS.primary.DEFAULT,
      iconBg: 'rgba(0, 60, 87, 0.1)',
      confirmText: confirmText || 'OK',
      confirmStyle: {
        backgroundColor: COLORS.primary.DEFAULT,
        color: '#FFFFFF'
      }
    },
    success: {
      icon: CheckCircle,
      iconColor: COLORS.secondary.DEFAULT,
      iconBg: 'rgba(0, 184, 148, 0.1)',
      confirmText: confirmText || 'OK',
      confirmStyle: {
        backgroundColor: COLORS.secondary.DEFAULT,
        color: '#FFFFFF'
      }
    },
    form: {
      confirmText: null,
      confirmStyle: null
    }
  }

  const config = variantConfig[variant] || variantConfig.form
  const Icon = config.icon

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-white rounded-2xl w-full ${sizes[size]} my-4 shadow-2xl border border-gray-100 animate-fadeIn`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="sticky top-0 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-4 sm:px-6 py-5 rounded-t-2xl flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {Icon && (
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: config.iconBg }}
              >
                <Icon className="w-6 h-6" style={{ color: config.iconColor }} />
              </div>
            )}
            <h2 className="text-lg sm:text-xl font-bold" style={{ color: COLORS.primary.DEFAULT }}>
              {title}
            </h2>
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Contenu */}
        <div className="px-4 sm:px-6 py-4 max-h-[calc(90vh-150px)] overflow-y-auto">
          {variant === 'form' ? (
            children
          ) : (
            <div className="text-center py-4">
              {message && (
                <p className="text-gray-700 text-base mb-6">{message}</p>
              )}
              {children}
            </div>
          )}
        </div>

        {/* Footer avec boutons (sauf pour variant='form') */}
        {variant !== 'form' && (
          <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 to-white px-4 sm:px-6 py-4 rounded-b-2xl flex justify-end gap-3 border-t border-gray-200">
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg font-medium transition-all hover:bg-gray-200"
                style={{ backgroundColor: '#E9ECEF', color: '#495057' }}
              >
                {cancelText}
              </button>
            )}
            {onConfirm && (
              <button
                onClick={onConfirm}
                className="px-4 py-2 rounded-lg font-medium transition-all hover:opacity-90"
                style={confirmButtonStyle || config.confirmStyle}
              >
                {config.confirmText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default UniversalModal
