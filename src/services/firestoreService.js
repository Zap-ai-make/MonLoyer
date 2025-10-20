import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebaseConfig'
import logger from '../utils/logger'

/**
 * Service Firestore pour gérer les données du CRM
 *
 * Structure Firestore :
 * agences/{agenceId}/proprietaires/{proprietaireId}
 * agences/{agenceId}/locataires/{locataireId}
 * agences/{agenceId}/biens/{bienId}
 * agences/{agenceId}/paiements/{paiementId}
 * agences/{agenceId}/documents/{documentId}
 */

class FirestoreService {
  /**
   * Ajouter un document dans une collection
   * @param {string} agenceId - ID de l'agence
   * @param {string} collectionName - Nom de la collection (proprietaires, locataires, biens, paiements, documents)
   * @param {Object} data - Données du document (doit contenir data.id)
   * @returns {Promise<string>} - ID du document créé
   */
  async addDocument(agenceId, collectionName, data) {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase n\'est pas configuré')
    }

    try {
      // IMPORTANT: Utiliser l'ID fourni dans data pour synchronisation localStorage <-> Firestore
      if (!data.id) {
        throw new Error('L\'ID du document est requis pour la synchronisation')
      }

      const docRef = doc(db, 'agences', agenceId, collectionName, data.id)
      const docData = {
        ...data,
        dateCreation: serverTimestamp(),
        dateModification: serverTimestamp()
      }

      // Utiliser setDoc au lieu de addDoc pour forcer l'utilisation de l'ID fourni
      await setDoc(docRef, docData)
      logger.info(`Document ajouté dans ${collectionName}:`, data.id)

      return data.id
    } catch (error) {
      logger.error(`Erreur ajout document ${collectionName}:`, error)
      throw new Error(`Erreur lors de l'ajout: ${error.message}`)
    }
  }

  /**
   * Récupérer tous les documents d'une collection
   * @param {string} agenceId - ID de l'agence
   * @param {string} collectionName - Nom de la collection
   * @param {Object} options - Options de tri/filtre {orderByField, orderDirection, filters: [{field, operator, value}]}
   * @returns {Promise<Array>} - Liste des documents avec leur ID
   */
  async getDocuments(agenceId, collectionName, options = {}) {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase n\'est pas configuré')
    }

    try {
      const collectionRef = collection(db, 'agences', agenceId, collectionName)

      // Construire la query avec filtres et tri
      let q = collectionRef

      // Ajouter les filtres
      if (options.filters && Array.isArray(options.filters)) {
        options.filters.forEach(filter => {
          q = query(q, where(filter.field, filter.operator, filter.value))
        })
      }

      // Ajouter le tri
      if (options.orderByField) {
        q = query(q, orderBy(options.orderByField, options.orderDirection || 'asc'))
      }

      const querySnapshot = await getDocs(q)
      const documents = []

      querySnapshot.forEach(doc => {
        documents.push({
          id: doc.id,
          ...doc.data()
        })
      })

      logger.info(`${documents.length} documents récupérés de ${collectionName}`)
      return documents
    } catch (error) {
      logger.error(`Erreur récupération ${collectionName}:`, error)
      throw new Error(`Erreur lors de la récupération: ${error.message}`)
    }
  }

  /**
   * Récupérer un document spécifique par ID
   * @param {string} agenceId - ID de l'agence
   * @param {string} collectionName - Nom de la collection
   * @param {string} documentId - ID du document
   * @returns {Promise<Object|null>} - Document avec son ID ou null
   */
  async getDocument(agenceId, collectionName, documentId) {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase n\'est pas configuré')
    }

    try {
      const docRef = doc(db, 'agences', agenceId, collectionName, documentId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        }
      }

      logger.warn(`Document non trouvé: ${collectionName}/${documentId}`)
      return null
    } catch (error) {
      logger.error(`Erreur récupération document ${collectionName}:`, error)
      throw new Error(`Erreur lors de la récupération: ${error.message}`)
    }
  }

  /**
   * Mettre à jour un document
   * @param {string} agenceId - ID de l'agence
   * @param {string} collectionName - Nom de la collection
   * @param {string} documentId - ID du document
   * @param {Object} data - Nouvelles données (merge)
   * @returns {Promise<void>}
   */
  async updateDocument(agenceId, collectionName, documentId, data) {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase n\'est pas configuré')
    }

    try {
      const docRef = doc(db, 'agences', agenceId, collectionName, documentId)
      const updateData = {
        ...data,
        dateModification: serverTimestamp()
      }

      await updateDoc(docRef, updateData)
      logger.info(`Document mis à jour: ${collectionName}/${documentId}`)
    } catch (error) {
      logger.error(`Erreur mise à jour ${collectionName}:`, error)
      throw new Error(`Erreur lors de la mise à jour: ${error.message}`)
    }
  }

  /**
   * Supprimer un document
   * @param {string} agenceId - ID de l'agence
   * @param {string} collectionName - Nom de la collection
   * @param {string} documentId - ID du document
   * @returns {Promise<void>}
   */
  async deleteDocument(agenceId, collectionName, documentId) {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase n\'est pas configuré')
    }

    try {
      const docRef = doc(db, 'agences', agenceId, collectionName, documentId)
      await deleteDoc(docRef)
      logger.info(`Document supprimé: ${collectionName}/${documentId}`)
    } catch (error) {
      logger.error(`Erreur suppression ${collectionName}:`, error)
      throw new Error(`Erreur lors de la suppression: ${error.message}`)
    }
  }

  /**
   * S'abonner aux changements d'une collection en temps réel
   * @param {string} agenceId - ID de l'agence
   * @param {string} collectionName - Nom de la collection
   * @param {Function} callback - Fonction appelée avec les documents (docs) => {}
   * @param {Object} options - Options de filtrage/tri
   * @returns {Function} - Fonction de désabonnement
   */
  subscribeToCollection(agenceId, collectionName, callback, options = {}) {
    if (!isFirebaseConfigured()) {
      callback([])
      return () => {}
    }

    try {
      const collectionRef = collection(db, 'agences', agenceId, collectionName)

      // Construire la query
      let q = collectionRef

      if (options.filters && Array.isArray(options.filters)) {
        options.filters.forEach(filter => {
          q = query(q, where(filter.field, filter.operator, filter.value))
        })
      }

      if (options.orderByField) {
        q = query(q, orderBy(options.orderByField, options.orderDirection || 'asc'))
      }

      // Écouter les changements en temps réel
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const documents = []
          querySnapshot.forEach(doc => {
            documents.push({
              id: doc.id,
              ...doc.data()
            })
          })

          logger.info(`Mise à jour temps réel: ${documents.length} documents dans ${collectionName}`)
          callback(documents)
        },
        (error) => {
          logger.error(`Erreur abonnement ${collectionName}:`, error)
          callback([])
        }
      )

      return unsubscribe
    } catch (error) {
      logger.error(`Erreur création abonnement ${collectionName}:`, error)
      callback([])
      return () => {}
    }
  }

  /**
   * S'abonner aux changements d'un document spécifique en temps réel
   * @param {string} agenceId - ID de l'agence
   * @param {string} collectionName - Nom de la collection
   * @param {string} documentId - ID du document
   * @param {Function} callback - Fonction appelée avec le document (doc) => {}
   * @returns {Function} - Fonction de désabonnement
   */
  subscribeToDocument(agenceId, collectionName, documentId, callback) {
    if (!isFirebaseConfigured()) {
      callback(null)
      return () => {}
    }

    try {
      const docRef = doc(db, 'agences', agenceId, collectionName, documentId)

      const unsubscribe = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            callback({
              id: docSnap.id,
              ...docSnap.data()
            })
          } else {
            callback(null)
          }
        },
        (error) => {
          logger.error(`Erreur abonnement document ${collectionName}/${documentId}:`, error)
          callback(null)
        }
      )

      return unsubscribe
    } catch (error) {
      logger.error(`Erreur création abonnement document:`, error)
      callback(null)
      return () => {}
    }
  }

  /**
   * Vérifier si Firebase est configuré
   * @returns {boolean}
   */
  isConfigured() {
    return isFirebaseConfigured()
  }
}

export default new FirestoreService()
