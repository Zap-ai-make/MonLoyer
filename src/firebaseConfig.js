import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import logger from './utils/logger'

/**
 * Configuration Firebase pour Woning CRM
 *
 * INSTRUCTIONS POUR CONFIGURATION:
 * 1. Allez sur https://console.firebase.google.com/
 * 2. Sélectionnez votre projet
 * 3. Cliquez sur l'icône Web (</>) pour ajouter une application
 * 4. Copiez les valeurs de firebaseConfig ici
 * 5. Ou créez un fichier .env avec les variables ci-dessous
 */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
}

// Vérifier si Firebase est configuré
const isFirebaseConfigured = () => {
  return Object.values(firebaseConfig).every(value => value !== "")
}

// Initialiser Firebase seulement si configuré
let app = null
let auth = null
let db = null
let storage = null

if (isFirebaseConfigured()) {
  try {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
    storage = getStorage(app)
  } catch (error) {
    logger.error('Erreur Firebase:', error)
  }
}

export { auth, db, storage, isFirebaseConfigured }
export default app
