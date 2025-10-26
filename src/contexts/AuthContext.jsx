import { createContext, useContext, useState, useEffect } from 'react'
import authService from '../services/authService'
import dataService from '../services/dataService'
import logger from '../utils/logger'

/**
 * Contexte d'authentification pour gérer l'état global de l'utilisateur
 *
 * Fournit:
 * - user: Utilisateur Firebase actuel
 * - agenceData: Données de l'agence depuis Firestore
 * - loading: État de chargement
 * - isAuthenticated: Boolean si connecté
 * - login, register, logout: Fonctions d'authentification
 */

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [agenceData, setAgenceData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Observer les changements d'authentification
  useEffect(() => {
    if (!authService.isConfigured()) {
      // Firebase non configuré - mode local uniquement
      setUser(null)
      setAgenceData(null)
      setIsAuthenticated(false)
      setLoading(false)
      return
    }

    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        setIsAuthenticated(true)

        // Récupérer les données de l'agence
        try {
          const data = await authService.getCurrentAgenceData()
          setAgenceData(data)
        } catch (error) {
          logger.error('Erreur récupération données agence:', error)
          setAgenceData(null)
        }
      } else {
        setUser(null)
        setAgenceData(null)
        setIsAuthenticated(false)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  /**
   * Connexion d'une agence
   */
  const login = async (email, password) => {
    try {
      setLoading(true)
      const result = await authService.loginAgence(email, password)
      setUser(result.user)
      setAgenceData(result.agenceData)
      setIsAuthenticated(true)
      return result
    } catch (error) {
      logger.error('Erreur connexion:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  /**
   * Inscription d'une nouvelle agence
   */
  const register = async (email, password, agenceInfo) => {
    try {
      setLoading(true)
      const result = await authService.registerAgence(email, password, agenceInfo)
      setUser(result.user)
      setAgenceData(result.agenceData)
      setIsAuthenticated(true)
      return result
    } catch (error) {
      logger.error('Erreur inscription:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  /**
   * Déconnexion
   */
  const logout = async () => {
    try {
      setLoading(true)

      // Nettoyer les données localStorage de l'agence avant de se déconnecter
      dataService.clearCurrentAgenceData()

      // Déconnexion Firebase
      await authService.logoutAgence()

      // Réinitialiser l'état
      setUser(null)
      setAgenceData(null)
      setIsAuthenticated(false)

      // Réinitialiser le préfixe agence
      dataService.setCurrentAgence(null)

    } catch (error) {
      logger.error('Erreur déconnexion:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  /**
   * Rafraîchir les données de l'agence
   */
  const refreshAgenceData = async () => {
    try {
      const data = await authService.getCurrentAgenceData()
      setAgenceData(data)
    } catch (error) {
      logger.error('Erreur rafraîchissement:', error)
      throw error
    }
  }

  const value = {
    user,
    agenceData,
    loading,
    isAuthenticated,
    isConfigured: authService.isConfigured(),
    login,
    register,
    logout,
    refreshAgenceData
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook pour accéder au contexte d'authentification
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider')
  }
  return context
}

export default AuthContext
