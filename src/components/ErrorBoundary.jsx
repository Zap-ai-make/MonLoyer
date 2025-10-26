import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'
import logger from '../utils/logger'

/**
 * Error Boundary pour capturer les erreurs React et afficher un fallback UI
 * @see https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error) {
    // Mettre à jour l'état pour afficher le fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Logger l'erreur dans un service de monitoring
    logger.error('ErrorBoundary caught an error:', error, errorInfo)

    // Mettre à jour l'état avec les détails de l'erreur
    this.setState({
      error,
      errorInfo
    })

    // En production, vous pourriez envoyer l'erreur à un service externe
    // if (import.meta.env.PROD) {
    //   this.logErrorToService(error, errorInfo)
    // }
  }

  logErrorToService(error, errorInfo) {
    // Placeholder pour l'envoi d'erreurs à un service externe
    // Exemple: Sentry, LogRocket, etc.
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-8">
            {/* Icône d'erreur */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
            </div>

            {/* Titre */}
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-4">
              Une erreur est survenue
            </h1>

            {/* Message */}
            <p className="text-gray-600 text-center mb-6">
              Nous sommes désolés, une erreur inattendue s'est produite.
              Veuillez réessayer ou recharger la page.
            </p>

            {/* Détails de l'erreur (seulement en développement) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6">
                <details className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                    Détails de l'erreur (développement)
                  </summary>
                  <div className="mt-4 space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-700">Erreur:</p>
                      <pre className="text-xs text-red-600 mt-1 overflow-auto bg-red-50 p-2 rounded">
                        {this.state.error.toString()}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mt-3">Stack trace:</p>
                        <pre className="text-xs text-gray-600 mt-1 overflow-auto bg-gray-100 p-2 rounded max-h-40">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Réessayer
              </button>
              <button
                onClick={this.handleReload}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Recharger la page
              </button>
            </div>

            {/* Lien retour */}
            <div className="mt-6 text-center">
              <a
                href="/"
                className="text-sm text-green-600 hover:text-green-700 hover:underline"
              >
                Retour à l'accueil
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
