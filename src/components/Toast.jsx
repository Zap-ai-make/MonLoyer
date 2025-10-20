import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { COLORS } from '../constants/colors'

function Toast({ message, type = 'success', onClose, duration = 3000, showConfetti = false }) {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true)
        setTimeout(onClose, 300) // Attendre la fin de l'animation
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const icons = {
    success: <CheckCircle className="w-6 h-6" />,
    error: <XCircle className="w-6 h-6" />,
    info: <Info className="w-6 h-6" />,
    warning: <AlertTriangle className="w-6 h-6" />
  }

  const styles = {
    success: { backgroundColor: COLORS.secondary.DEFAULT, color: COLORS.white },
    error: { backgroundColor: COLORS.error.DEFAULT, color: COLORS.white },
    info: { backgroundColor: COLORS.primary.DEFAULT, color: COLORS.white },
    warning: { backgroundColor: COLORS.warning.DEFAULT, color: COLORS.white }
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
      }`}
      style={{
        animation: isExiting ? 'none' : 'slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <div
        className="rounded-xl p-4 pr-12 flex items-center gap-3 min-w-[300px] max-w-md"
        style={{
          ...styles[type],
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div className="flex-shrink-0 animate-scale-in">
          {icons[type]}
          {showConfetti && type === 'success' && (
            <span className="ml-2 text-xl animate-bounce">🎉</span>
          )}
        </div>
        <p className="flex-1 font-medium" style={{ fontFamily: 'Roboto, sans-serif' }}>
          {message}
        </p>
        <button
          onClick={() => {
            setIsExiting(true)
            setTimeout(onClose, 300)
          }}
          className="absolute top-2 right-2 p-1.5 rounded-lg transition-all duration-200 hover:scale-110"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default Toast
