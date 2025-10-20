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

/**
 * Service d'authentification Firebase pour les agences immobilières
 *
 * Gère:
 * - Inscription des nouvelles agences
 * - Connexion/Déconnexion
 * - Récupération des informations agence
 * - Observer les changements d'état d'authentification
 */

class AuthService {
  /**
   * Inscription d'une nouvelle agence
   * @param {string} email - Email professionnel de l'agence
   * @param {string} password - Mot de passe (min 6 caractères)
   * @param {Object} agenceData - Données de l'agence {nom, telephone, adresse}
   * @returns {Promise<Object>} - User et agenceData
   */
  async registerAgence(email, password, agenceData) {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase n\'est pas configuré. Veuillez ajouter vos clés dans le fichier .env')
    }

    try {
      // 1. Créer le compte utilisateur dans Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      logger.info('Utilisateur Firebase créé:', user.uid)

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
      logger.info('Document agence créé dans Firestore:', user.uid)

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
        'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères',
        'auth/network-request-failed': 'Erreur de connexion. Vérifiez votre connexion Internet'
      }

      throw new Error(errorMessages[error.code] || 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer plus tard.')
    }
  }

  /**
   * Connexion d'une agence existante
   * @param {string} email - Email de l'agence
   * @param {string} password - Mot de passe
   * @returns {Promise<Object>} - User et agenceData
   */
  async loginAgence(email, password) {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase n\'est pas configuré. Veuillez ajouter vos clés dans le fichier .env')
    }

    try {
      // 1. Connexion Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      logger.info('Connexion réussie:', user.uid)

      // 2. Récupérer les données de l'agence depuis Firestore
      const agenceDoc = await getDoc(doc(db, 'agences', user.uid))

      if (!agenceDoc.exists()) {
        throw new Error('Données de l\'agence introuvables')
      }

      return {
        user,
        agenceData: agenceDoc.data()
      }
    } catch (error) {
      logger.error('Erreur lors de la connexion:', error)

      const errorMessages = {
        'auth/invalid-email': 'Adresse email invalide',
        'auth/user-disabled': 'Ce compte a été désactivé',
        'auth/user-not-found': 'Email ou mot de passe incorrect',
        'auth/wrong-password': 'Email ou mot de passe incorrect',
        'auth/invalid-credential': 'Email ou mot de passe incorrect',
        'auth/too-many-requests': 'Trop de tentatives de connexion. Veuillez réessayer plus tard',
        'auth/network-request-failed': 'Erreur de connexion. Vérifiez votre connexion Internet'
      }

      throw new Error(errorMessages[error.code] || 'Une erreur est survenue lors de la connexion. Veuillez réessayer plus tard.')
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
      logger.info('Déconnexion réussie')
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
      logger.info('Mot de passe modifié avec succès')
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
