import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from './LoadingSpinner'

/**
 * Composant pour protéger les routes privées
 * Redirige vers /login si l'utilisateur n'est pas authentifié
 *
 * Si Firebase n'est pas configuré, permet l'accès (mode local)
 */
function PrivateRoute({ children }) {
  const { isAuthenticated, loading, isConfigured } = useAuth()

  // Si Firebase n'est pas configuré, mode local - permettre l'accès
  if (!isConfigured) {
    return children
  }

  // Attendre la vérification de l'authentification
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  // Rediriger vers login si non authentifié
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Afficher le contenu si authentifié
  return children
}

export default PrivateRoute
