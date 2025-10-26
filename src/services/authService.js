import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '../firebaseConfig'
import logger from '../utils/logger'
import rateLimiter from '../utils/rateLimiter'

/**
 * Service d'authentification Firebase pour les agences immobilières
 *
 * Gère:
 * - Inscription des nouvelles agences avec politique de mot de passe renforcée
 * - Connexion/Déconnexion avec limitation de débit (rate limiting)
 * - Récupération des informations agence
 * - Observer les changements d'état d'authentification
 * - Protection contre les attaques par force brute
 */

class AuthService {
  /**
   * Valider la force du mot de passe
   * @param {string} password - Mot de passe à valider
   * @returns {Object} - { isValid: boolean, message: string }
   */
  validatePasswordStrength(password) {
    // Minimum 12 caractères
    if (password.length < 12) {
      return {
        isValid: false,
        message: 'Le mot de passe doit contenir au moins 12 caractères'
      }
    }

    // Au moins une majuscule
    if (!/[A-Z]/.test(password)) {
      return {
        isValid: false,
        message: 'Le mot de passe doit contenir au moins une lettre majuscule'
      }
    }

    // Au moins une minuscule
    if (!/[a-z]/.test(password)) {
      return {
        isValid: false,
        message: 'Le mot de passe doit contenir au moins une lettre minuscule'
      }
    }

    // Au moins un chiffre
    if (!/[0-9]/.test(password)) {
      return {
        isValid: false,
        message: 'Le mot de passe doit contenir au moins un chiffre'
      }
    }

    // Au moins un caractère spécial
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/;']/.test(password)) {
      return {
        isValid: false,
        message: 'Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*...)'
      }
    }

    // Pas de mots de passe courants
    const commonPasswords = [
      'password123', 'administrator', '12345678901', 'qwertyuiop',
      'motdepasse123', 'administrateur', 'bienvenue123'
    ]

    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      return {
        isValid: false,
        message: 'Ce mot de passe est trop courant. Choisissez un mot de passe plus sécurisé'
      }
    }

    return {
      isValid: true,
      message: 'Mot de passe accepté'
    }
  }
  /**
   * Inscription d'une nouvelle agence
   * @param {string} email - Email professionnel de l'agence
   * @param {string} password - Mot de passe (min 12 caractères avec complexité)
   * @param {Object} agenceData - Données de l'agence {nom, telephone, adresse}
   * @returns {Promise<Object>} - User et agenceData
   */
  async registerAgence(email, password, agenceData) {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase n\'est pas configuré. Veuillez ajouter vos clés dans le fichier .env')
    }

    // Valider la force du mot de passe
    const passwordValidation = this.validatePasswordStrength(password)
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.message)
    }

    try {
      // 1. Créer le compte utilisateur dans Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // 2. Mettre à jour le profil avec le nom de l'agence
      await updateProfile(user, {
        displayName: agenceData.nom
      })

      // 3. Créer le document agence dans Firestore
      const agenceDoc = {
        nom: agenceData.nom,
        email: email,
        telephone: agenceData.telephone || '',
        adresse: agenceData.adresse || '',
        logoURL: agenceData.logoURL || '',
        date_creation: new Date().toISOString(),
        uid: user.uid
      }

      await setDoc(doc(db, 'agences', user.uid), agenceDoc)

      return {
        user,
        agenceData: agenceDoc
      }
    } catch (error) {
      logger.error('Erreur lors de l\'inscription:', error)

      // Messages d'erreur en français (masquer Firebase)
      const errorMessages = {
        'auth/email-already-in-use': 'Cette adresse email est déjà utilisée',
        'auth/invalid-email': 'Adresse email invalide',
        'auth/operation-not-allowed': 'Cette opération n\'est pas autorisée actuellement',
        'auth/weak-password': 'Le mot de passe ne respecte pas les critères de sécurité requis',
        'auth/network-request-failed': 'Erreur de connexion. Vérifiez votre connexion Internet'
      }

      throw new Error(errorMessages[error.code] || 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer plus tard.')
    }
  }

  /**
   * Connexion d'une agence existante avec limitation de débit
   * @param {string} email - Email de l'agence
   * @param {string} password - Mot de passe
   * @returns {Promise<Object>} - User et agenceData
   */
  async loginAgence(email, password) {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase n\'est pas configuré. Veuillez ajouter vos clés dans le fichier .env')
    }

    // Vérifier la limitation de débit AVANT la tentative de connexion
    const rateCheck = rateLimiter.checkLimit(email)
    if (rateCheck.isLocked) {
      logger.warn(`Login attempt blocked for ${email} - rate limit exceeded`)
      throw new Error(rateCheck.message)
    }

    try {
      // 1. Connexion Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // 2. Récupérer les données de l'agence depuis Firestore
      const agenceDoc = await getDoc(doc(db, 'agences', user.uid))

      if (!agenceDoc.exists()) {
        throw new Error('Identifiants invalides')
      }

      // Connexion réussie - réinitialiser le compteur
      rateLimiter.reset(email)

      return {
        user,
        agenceData: agenceDoc.data()
      }
    } catch (error) {
      logger.error('Erreur lors de la connexion:', error)

      // Enregistrer la tentative échouée pour rate limiting
      // Seulement pour les erreurs d'authentification, pas les erreurs réseau
      const authErrors = [
        'auth/invalid-email',
        'auth/user-not-found',
        'auth/wrong-password',
        'auth/invalid-credential',
        'auth/user-disabled'
      ]

      if (authErrors.includes(error.code)) {
        const updatedLimit = rateLimiter.recordFailedAttempt(email)

        if (updatedLimit.isLocked) {
          throw new Error(updatedLimit.message)
        } else if (updatedLimit.remainingAttempts !== undefined) {
          throw new Error(`Identifiants invalides. ${updatedLimit.remainingAttempts} tentative(s) restante(s) avant verrouillage temporaire.`)
        }
      }

      // Messages d'erreur génériques pour éviter l'énumération d'utilisateurs
      const errorMessages = {
        'auth/invalid-email': 'Identifiants invalides',
        'auth/user-disabled': 'Ce compte a été désactivé. Contactez le support.',
        'auth/user-not-found': 'Identifiants invalides',
        'auth/wrong-password': 'Identifiants invalides',
        'auth/invalid-credential': 'Identifiants invalides',
        'auth/too-many-requests': 'Trop de tentatives. Veuillez réessayer plus tard',
        'auth/network-request-failed': 'Erreur de connexion. Vérifiez votre connexion Internet'
      }

      throw new Error(errorMessages[error.code] || 'Une erreur est survenue. Veuillez réessayer.')
    }
  }

  /**
   * Déconnexion de l'agence
   * @returns {Promise<void>}
   */
  async logoutAgence() {
    if (!isFirebaseConfigured()) {
      return // Pas d'erreur si Firebase n'est pas configuré
    }

    try {
      await signOut(auth)
    } catch (error) {
      logger.error('Erreur lors de la déconnexion:', error)
      throw new Error('Une erreur est survenue lors de la déconnexion. Veuillez réessayer.')
    }
  }

  /**
   * Récupérer l'utilisateur actuellement connecté
   * @returns {User|null} - Utilisateur Firebase ou null
   */
  getCurrentUser() {
    if (!isFirebaseConfigured()) {
      return null
    }
    return auth.currentUser
  }

  /**
   * Récupérer les données de l'agence actuelle depuis Firestore
   * @returns {Promise<Object|null>} - Données de l'agence ou null
   */
  async getCurrentAgenceData() {
    if (!isFirebaseConfigured()) {
      return null
    }

    const user = this.getCurrentUser()
    if (!user) {
      return null
    }

    try {
      const agenceDoc = await getDoc(doc(db, 'agences', user.uid))
      if (agenceDoc.exists()) {
        return agenceDoc.data()
      }
      return null
    } catch (error) {
      logger.error('Erreur lors de la récupération des données agence:', error)
      return null
    }
  }

  /**
   * Observer les changements d'état d'authentification
   * @param {Function} callback - Fonction appelée lors des changements (user) => {}
   * @returns {Function} - Fonction de désinscription
   */
  onAuthStateChanged(callback) {
    if (!isFirebaseConfigured()) {
      callback(null)
      return () => {} // Retourner une fonction vide
    }

    return onAuthStateChanged(auth, callback)
  }

  /**
   * Vérifier si un utilisateur est connecté
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.getCurrentUser()
  }

  /**
   * Vérifier si Firebase est configuré
   * @returns {boolean}
   */
  isConfigured() {
    return isFirebaseConfigured()
  }

  /**
   * Modifier le mot de passe de l'utilisateur
   * @param {string} currentPassword - Mot de passe actuel
   * @param {string} newPassword - Nouveau mot de passe
   * @returns {Promise<void>}
   */
  async changePassword(currentPassword, newPassword) {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase n\'est pas configuré')
    }

    const user = this.getCurrentUser()
    if (!user || !user.email) {
      throw new Error('Aucun utilisateur connecté')
    }

    try {
      // 1. Réauthentifier l'utilisateur avec son mot de passe actuel
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)

      // 2. Mettre à jour le mot de passe
      await updatePassword(user, newPassword)
    } catch (error) {
      logger.error('Erreur lors du changement de mot de passe:', error)

      const errorMessages = {
        'auth/wrong-password': 'Le mot de passe actuel est incorrect',
        'auth/invalid-credential': 'Le mot de passe actuel est incorrect',
        'auth/weak-password': 'Le nouveau mot de passe doit contenir au moins 6 caractères',
        'auth/requires-recent-login': 'Veuillez vous reconnecter puis réessayer',
        'auth/too-many-requests': 'Trop de tentatives. Veuillez réessayer plus tard',
        'auth/network-request-failed': 'Erreur de connexion. Vérifiez votre connexion Internet'
      }

      throw new Error(errorMessages[error.code] || 'Une erreur est survenue lors du changement de mot de passe')
    }
  }
}

export default new AuthService()
