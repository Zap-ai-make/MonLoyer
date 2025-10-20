import { useContext } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import NotificationContext from '../contexts/NotificationContext'

function NotificationContainer() {
  const { notifications, removeNotification } = useContext(NotificationContext)

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />
      case 'error':
        return <AlertCircle className="w-5 h-5" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />
      case 'info':
      default:
        return <Info className="w-5 h-5" />
    }
  }

  const getStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-green-50 border-green-200',
          icon: 'text-green-600',
          text: 'text-green-800',
          button: 'text-green-600 hover:text-green-800'
        }
      case 'error':
        return {
          container: 'bg-red-50 border-red-200',
          icon: 'text-red-600',
          text: 'text-red-800',
          button: 'text-red-600 hover:text-red-800'
        }
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200',
          icon: 'text-yellow-600',
          text: 'text-yellow-800',
          button: 'text-yellow-600 hover:text-yellow-800'
        }
      case 'info':
      default:
        return {
          container: 'bg-blue-50 border-blue-200',
          icon: 'text-blue-600',
          text: 'text-blue-800',
          button: 'text-blue-600 hover:text-blue-800'
        }
    }
  }

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-md">
      {notifications.map((notification) => {
        const styles = getStyles(notification.type)
        return (
          <div
            key={notification.id}
            className={`${styles.container} border rounded-lg shadow-lg p-4 flex items-start gap-3 animate-slideInRight`}
            role="alert"
            aria-live="assertive"
          >
            <div className={styles.icon}>
              {getIcon(notification.type)}
            </div>
            <div className={`flex-1 ${styles.text} text-sm font-medium`}>
              {notification.message}
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className={`${styles.button} transition-colors`}
              aria-label="Fermer la notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default NotificationContainer
