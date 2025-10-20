import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { COLORS } from '../constants/colors'
import Logo from '../components/Logo'
import LoadingSpinner from '../components/LoadingSpinner'

function Login() {
  const navigate = useNavigate()
  const { login, isConfigured } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('') // Effacer l'erreur lors de la modification
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation
    if (!formData.email || !formData.password) {
      setError('Veuillez remplir tous les champs')
      setLoading(false)
      return
    }

    try {
      await login(formData.email, formData.password)
      // Rediriger vers le dashboard après connexion réussie
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Si Firebase n'est pas configuré, rediriger vers dashboard (mode local)
  if (!isConfigured) {
    navigate('/dashboard', { replace: true })
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #003C57 0%, #00B894 100%)'
    }}>
      <div className="w-full max-w-md">
        {/* Card de connexion */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo et titre */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo size="large" />
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: COLORS.primary.DEFAULT }}>
              Connexion
            </h1>
            <p className="text-gray-600">
              Accédez à votre espace de travail
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Message d'erreur */}
            {error && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline-block mr-2" />
                Adresse email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="exemple@agence.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={loading}
                required
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline-block mr-2" />
                Mot de passe
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={loading}
                required
              />
            </div>

            {/* Bouton connexion */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-medium text-white transition-all flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: loading ? '#6B7280' : `linear-gradient(135deg, ${COLORS.primary.DEFAULT} 0%, ${COLORS.secondary.DEFAULT} 100%)`
              }}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="small" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Se connecter
                </>
              )}
            </button>
          </form>

          {/* Lien vers inscription */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Vous n'avez pas encore de compte ?{' '}
              <Link
                to="/register"
                className="font-medium hover:underline"
                style={{ color: COLORS.secondary.DEFAULT }}
              >
                Créer un compte
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-white text-sm">
          <p>© 2025 Woning - Gestion immobilière simplifiée</p>
        </div>
      </div>
    </div>
  )
}

export default Login
