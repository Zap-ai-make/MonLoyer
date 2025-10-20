import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { generateNotificationId } from '../utils/idGenerator'
import errorHandler from '../utils/errorHandler'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }, [])

  // Utiliser useRef pour éviter les dépendances circulaires (optimisation)
  const removeNotificationRef = useRef(removeNotification)
  useEffect(() => {
    removeNotificationRef.current = removeNotification
  }, [removeNotification])

  const addNotification = useCallback(({ type = 'info', message, duration = 4000 }) => {
    const id = generateNotificationId()

    const notification = {
      id,
      type, // 'success', 'error', 'warning', 'info'
      message,
      duration
    }

    setNotifications(prev => [...prev, notification])

    // Auto-dismiss si duration > 0 (utilise ref pour éviter recréations)
    if (duration > 0) {
      setTimeout(() => {
        removeNotificationRef.current(id)
      }, duration)
    }

    return id
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  // Créer les méthodes helper dans le Provider
  const success = useCallback((message, duration) => {
    return addNotification({ type: 'success', message, duration })
  }, [addNotification])

  const error = useCallback((message, duration) => {
    return addNotification({ type: 'error', message, duration })
  }, [addNotification])

  const warning = useCallback((message, duration) => {
    return addNotification({ type: 'warning', message, duration })
  }, [addNotification])

  const info = useCallback((message, duration) => {
    return addNotification({ type: 'info', message, duration })
  }, [addNotification])

  // Initialiser errorHandler avec le service de notification
  useEffect(() => {
    errorHandler.setNotificationService({
      success,
      error,
      warning,
      info
    })
  }, [success, error, warning, info])

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAll,
      success,
      error,
      warning,
      info
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)

  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }

  const { success, error, warning, info, removeNotification, clearAll } = context

  return {
    success,
    error,
    warning,
    info,
    remove: removeNotification,
    clearAll
  }
}

export default NotificationContext
