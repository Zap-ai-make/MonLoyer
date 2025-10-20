import storageWrapper from '../utils/storageWrapper'
import { generateId } from '../utils/idGenerator'
import { ProprietaireSchema, BienSchema, LocataireSchema, PaiementSchema } from '../utils/validation/schemas'
import statsService from './statsService'
import logger from '../utils/logger'
import firestoreService from './firestoreService'
import { shouldUseFirebase, getCurrentAgenceId, cleanForFirestore } from '../utils/firebaseHelpers'

// Service hybride : localStorage (synchrone) + Firestore (async en arrière-plan)
class DataService {
  constructor() {
    this.storageKeys = {
      proprietaires: 'crm_proprietaires',
      biens: 'crm_biens',
      locataires: 'crm_locataires',
      paiements: 'crm_paiements'
    }
    // Cache en mémoire pour éviter les lectures répétées
    this.cache = new Map()
    this.cacheTimeout = 30000 // 30 secondes (optimisé pour réduire les accès localStorage)
    this.currentAgenceId = null
  }

  /**
   * Définir l'agence courante pour isoler les données
   * @param {string} agenceId - ID de l'agence
   */
  setCurrentAgence(agenceId) {
    this.currentAgenceId = agenceId
    storageWrapper.setAgencePrefix(agenceId)
    this.cache.clear() // Vider le cache lors du changement d'agence
    this.initializeData()
  }

  /**
   * Nettoyer toutes les données de l'agence courante
   */
  clearCurrentAgenceData() {
    storageWrapper.clearAgenceData()
    this.cache.clear()
  }

  /**
   * Charger les données depuis Firestore pour l'agence courante
   */
  async loadFromFirestore(agenceId) {
    if (!shouldUseFirebase()) return

    try {
      logger.info('Chargement des données depuis Firestore pour l\'agence:', agenceId)

      const [proprietaires, biens, locataires, paiements] = await Promise.all([
        firestoreService.getDocuments(agenceId, 'proprietaires'),
        firestoreService.getDocuments(agenceId, 'biens'),
        firestoreService.getDocuments(agenceId, 'locataires'),
        firestoreService.getDocuments(agenceId, 'paiements')
      ])

      // Sauvegarder dans localStorage
      this.setData('proprietaires', proprietaires || [])
      this.setData('biens', biens || [])
      this.setData('locataires', locataires || [])
      this.setData('paiements', paiements || [])

      logger.info('Données chargées depuis Firestore avec succès')
    } catch (error) {
      logger.error('Erreur lors du chargement depuis Firestore:', error)
      // Ne pas bloquer l'app - on continue avec localStorage vide
    }
  }

  // Synchroniser avec Firestore en arrière-plan (ne bloque pas)
  async syncToFirestore(collection, action, id = null, data = null) {
    if (!shouldUseFirebase()) return

    try {
      const agenceId = getCurrentAgenceId()
      if (!agenceId) return

      // Nettoyer les données avant envoi
      const cleanData = data ? cleanForFirestore(data) : null

      switch (action) {
        case 'add':
          await firestoreService.addDocument(agenceId, collection, { ...cleanData, id })
          logger.info(`${collection} synchronisé (add) vers Firestore:`, id)
          break
        case 'update':
          await firestoreService.updateDocument(agenceId, collection, id, cleanData)
          logger.info(`${collection} synchronisé (update) vers Firestore:`, id)
          break
        case 'delete':
          await firestoreService.deleteDocument(agenceId, collection, id)
          logger.info(`${collection} synchronisé (delete) vers Firestore:`, id)
          break
      }
    } catch (error) {
      logger.error(`Erreur sync Firestore ${collection}:`, error?.message || error)
      // Ne pas bloquer l'app si Firestore échoue
    }
  }

  initializeData() {
    // Initialiser les données si elles n'existent pas
    Object.values(this.storageKeys).forEach(key => {
      const existing = storageWrapper.getItem(key, null)
      if (existing === null) {
        storageWrapper.setItem(key, [])
      }
    })
  }

  // Méthodes génériques avec cache
  getData(type) {
    const cached = this.cache.get(type)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }

    const data = storageWrapper.getItem(this.storageKeys[type], [])
    this.cache.set(type, { data, timestamp: Date.now() })
    return data
  }

  setData(type, data) {
    // Invalider le cache lors de l'écriture
    this.cache.delete(type)
    return storageWrapper.setItem(this.storageKeys[type], data)
  }

  invalidateCache(type) {
    if (type) {
      this.cache.delete(type)
    } else {
      this.cache.clear()
    }
  }

  // PROPRIETAIRES
  getProprietaires() {
    return this.getData('proprietaires')
  }

  addProprietaire(proprietaire) {
    try {
      // Valider les données avec Zod
      const validated = ProprietaireSchema.parse(proprietaire)

      const proprietaires = this.getProprietaires()
      const newProprietaire = {
        id: generateId(),
        ...validated,
        dateCreation: new Date().toISOString()
      }
      proprietaires.push(newProprietaire)
      this.setData('proprietaires', proprietaires)
      logger.info('Propriétaire ajouté:', newProprietaire.id)

      // Synchroniser avec Firestore en arrière-plan
      this.syncToFirestore('proprietaires', 'add', newProprietaire.id, validated)

      return newProprietaire
    } catch (error) {
      logger.error('Erreur validation propriétaire:', error)
      throw error
    }
  }

  updateProprietaire(id, proprietaire) {
    try {
      // Validation partielle (permet champs manquants)
      const validated = ProprietaireSchema.partial().parse(proprietaire)

      const proprietaires = this.getProprietaires()
      const index = proprietaires.findIndex(p => p.id === id)
      if (index !== -1) {
        proprietaires[index] = { ...proprietaires[index], ...validated }
        this.setData('proprietaires', proprietaires)
        logger.info('Propriétaire mis à jour:', id)

        // Synchroniser avec Firestore en arrière-plan (envoyer l'objet complet pour validation)
        this.syncToFirestore('proprietaires', 'update', id, proprietaires[index])

        return proprietaires[index]
      }
      return null
    } catch (error) {
      logger.error('Erreur validation propriétaire:', error)
      throw error
    }
  }

  deleteProprietaire(id) {
    const proprietaires = this.getProprietaires()
    const filtered = proprietaires.filter(p => p.id !== id)
    this.setData('proprietaires', filtered)

    // Synchroniser avec Firestore en arrière-plan
    this.syncToFirestore('proprietaires', 'delete', id)

    return true
  }

  // BIENS
  getBiens() {
    return this.getData('biens')
  }

  getBiensByProprietaire(proprietaireId) {
    return this.getBiens().filter(bien => bien.proprietaireId === proprietaireId)
  }

  // Obtenir les biens disponibles pour location
  getBiensDisponibles() {
    const biens = this.getBiens()
    const locataires = this.getLocataires().filter(l => l.statut === 'actif')

    return biens.filter(bien => {
      // Pour une cour commune, vérifier s'il reste des maisons libres
      if (bien.type === 'cour_commune' && bien.maisons) {
        return bien.maisons.some(maison => maison.statut === 'libre')
      }

      // Pour un bien simple, vérifier qu'il n'a pas de locataire actif
      const statutNormalized = bien.statut?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      return statutNormalized !== 'occupe' && statutNormalized !== 'occupee'
    })
  }

  addBien(bien) {
    try {
      // Créer une copie propre des données sans les champs temporaires pour la validation
      const dataToValidate = { ...bien }

      // Nettoyer les champs temporaires avant validation
      Object.keys(dataToValidate).forEach(key => {
        if (key.startsWith('compteurEau_') || key.startsWith('compteurElectricite_')) {
          delete dataToValidate[key]
        }
      })

      // Valider les données avec Zod
      const validated = BienSchema.parse(dataToValidate)

      const biens = this.getBiens()
      const newBien = {
        id: generateId(),
        ...validated,
        statut: validated.statut || 'libre', // libre, occupé, en_renovation
        dateCreation: new Date().toISOString()
      }

      // Si c'est une cour commune, générer les maisons
      if (validated.type === 'cour_commune' && validated.nombreMaisons) {
        newBien.maisons = []
        for (let i = 1; i <= parseInt(validated.nombreMaisons); i++) {
          newBien.maisons.push({
            id: generateId(),
            numeroMaison: i,
            compteurEau: bien[`compteurEau_${i}`] || '',
            compteurElectricite: bien[`compteurElectricite_${i}`] || '',
            statut: 'libre', // libre ou occupee
            locataireId: null
          })
        }
      }

      biens.push(newBien)
      this.setData('biens', biens)
      logger.info('Bien ajouté:', newBien.id)

      // Synchroniser avec Firestore en arrière-plan (passer l'objet complet)
      this.syncToFirestore('biens', 'add', newBien.id, newBien)

      return newBien
    } catch (error) {
      logger.error('Erreur validation bien:', error)
      throw error
    }
  }

  updateBien(id, bien) {
    try {
      // Créer une copie propre des données sans les champs temporaires pour la validation
      const dataToValidate = { ...bien }

      // Nettoyer les champs temporaires avant validation
      Object.keys(dataToValidate).forEach(key => {
        if (key.startsWith('compteurEau_') || key.startsWith('compteurElectricite_')) {
          delete dataToValidate[key]
        }
      })

      // Validation partielle (permet champs manquants)
      const validated = BienSchema.partial().parse(dataToValidate)

      const biens = this.getBiens()
      const index = biens.findIndex(b => b.id === id)
      if (index !== -1) {
        const existingBien = biens[index]

        // Si c'est une cour commune, mettre à jour les maisons
        if (existingBien.type === 'cour_commune' && validated.nombreMaisons) {
          const newMaisons = []
          for (let i = 1; i <= parseInt(validated.nombreMaisons); i++) {
            // Garder les données existantes de la maison si elle existe
            const existingMaison = existingBien.maisons?.find(m => m.numeroMaison === i)
            newMaisons.push({
              id: existingMaison?.id || generateId(),
              numeroMaison: i,
              compteurEau: bien[`compteurEau_${i}`] || existingMaison?.compteurEau || '',
              compteurElectricite: bien[`compteurElectricite_${i}`] || existingMaison?.compteurElectricite || '',
              statut: existingMaison?.statut || 'libre',
              locataireId: existingMaison?.locataireId || null
            })
          }
          validated.maisons = newMaisons
        }

        biens[index] = { ...existingBien, ...validated }
        this.setData('biens', biens)
        logger.info('Bien mis à jour:', id)

        // Synchroniser avec Firestore en arrière-plan (passer l'objet complet)
        this.syncToFirestore('biens', 'update', id, biens[index])

        return biens[index]
      }
      return null
    } catch (error) {
      logger.error('Erreur validation bien:', error)
      throw error
    }
  }

  deleteBien(id) {
    // Supprimer d'abord tous les locataires associés à ce bien
    const locataires = this.getLocataires()
    const locatairesFiltered = locataires.filter(locataire => locataire.courId !== id)
    this.setData('locataires', locatairesFiltered)

    // Ensuite supprimer le bien
    const biens = this.getBiens()
    const filtered = biens.filter(b => b.id !== id)
    this.setData('biens', filtered)

    // Synchroniser avec Firestore en arrière-plan
    this.syncToFirestore('biens', 'delete', id)

    return true
  }

  // GESTION DES MAISONS DANS LES COURS COMMUNES
  getMaisonsLibresByCour(courId) {
    const bien = this.getBiens().find(b => b.id === courId)
    if (!bien || !bien.maisons) return []
    return bien.maisons.filter(maison => maison.statut === 'libre')
  }

  getMaisonsByCour(courId) {
    const bien = this.getBiens().find(b => b.id === courId)
    if (!bien || !bien.maisons) return []
    return bien.maisons
  }

  getMaisonById(courId, maisonId) {
    const maisons = this.getMaisonsByCour(courId)
    return maisons.find(m => m.id === maisonId)
  }

  isMaisonOccupee(courId, numeroMaison) {
    const maisons = this.getMaisonsByCour(courId)
    const maison = maisons.find(m => m.numeroMaison === parseInt(numeroMaison))
    return maison ? maison.statut === 'occupee' : false
  }

  assignerLocataireToMaison(courId, numeroMaison, locataireId) {
    const biens = this.getBiens()
    const bienIndex = biens.findIndex(b => b.id === courId)

    if (bienIndex !== -1 && biens[bienIndex].maisons) {
      const maisonIndex = biens[bienIndex].maisons.findIndex(m => m.numeroMaison === parseInt(numeroMaison))
      if (maisonIndex !== -1) {
        biens[bienIndex].maisons[maisonIndex].statut = 'occupee'
        biens[bienIndex].maisons[maisonIndex].locataireId = locataireId
        this.setData('biens', biens)
        return true
      }
    }
    return false
  }

  libererMaison(courId, numeroMaison) {
    const biens = this.getBiens()
    const bienIndex = biens.findIndex(b => b.id === courId)

    if (bienIndex !== -1 && biens[bienIndex].maisons) {
      const maisonIndex = biens[bienIndex].maisons.findIndex(m => m.numeroMaison === parseInt(numeroMaison))
      if (maisonIndex !== -1) {
        biens[bienIndex].maisons[maisonIndex].statut = 'libre'
        biens[bienIndex].maisons[maisonIndex].locataireId = null
        this.setData('biens', biens)
        return true
      }
    }
    return false
  }

  // LOCATAIRES
  getLocataires() {
    return this.getData('locataires')
  }

  getLocatairesByBien(bienId) {
    return this.getLocataires().filter(locataire => locataire.bienId === bienId)
  }

  getLocatairesByCour(courId) {
    return this.getLocataires().filter(locataire => locataire.courId === courId)
  }

  addLocataire(locataire) {
    try {
      // Valider les données avec Zod
      const validated = LocataireSchema.parse(locataire)

      const locataires = this.getLocataires()
      const newLocataire = {
        id: generateId(),
        ...validated,
        dateCreation: new Date().toISOString(),
        statut: 'actif'
      }

      // Si c'est une cour commune avec numéro de maison, assigner la maison
      if (validated.courId && validated.numeroMaison) {
        // Convertir numeroMaison en nombre pour la comparaison
        const numeroMaisonInt = parseInt(validated.numeroMaison)
        newLocataire.numeroMaison = numeroMaisonInt
        const success = this.assignerLocataireToMaison(validated.courId, numeroMaisonInt, newLocataire.id)
        if (!success) {
          throw new Error('Impossible d\'assigner la maison - elle est peut-être déjà occupée')
        }
      } else if (validated.courId) {
        // Pour un bien simple, marquer le bien comme occupé
        const biens = this.getBiens()
        const bienIndex = biens.findIndex(b => b.id === validated.courId)
        if (bienIndex !== -1) {
          biens[bienIndex].statut = 'occupé'
          this.setData('biens', biens)
        }
      }

      locataires.push(newLocataire)
      this.setData('locataires', locataires)
      logger.info('Locataire ajouté:', newLocataire.id)

      // Synchroniser avec Firestore en arrière-plan (passer l'objet complet)
      this.syncToFirestore('locataires', 'add', newLocataire.id, newLocataire)

      return newLocataire
    } catch (error) {
      logger.error('Erreur validation locataire:', error)
      throw error
    }
  }

  updateLocataire(id, locataire) {
    try {
      // Validation partielle (permet champs manquants)
      const validated = LocataireSchema.partial().parse(locataire)

      const locataires = this.getLocataires()
      const index = locataires.findIndex(l => l.id === id)
      if (index !== -1) {
        locataires[index] = { ...locataires[index], ...validated }
        this.setData('locataires', locataires)
        logger.info('Locataire mis à jour:', id)

        // Synchroniser avec Firestore en arrière-plan (passer l'objet complet)
        this.syncToFirestore('locataires', 'update', id, locataires[index])

        return locataires[index]
      }
      return null
    } catch (error) {
      logger.error('Erreur validation locataire:', error)
      throw error
    }
  }

  deleteLocataire(id) {
    const locataires = this.getLocataires()
    const locataire = locataires.find(l => l.id === id)

    // Libérer la maison si c'est une cour commune
    if (locataire && locataire.courId && locataire.numeroMaison) {
      this.libererMaison(locataire.courId, locataire.numeroMaison)
    } else if (locataire && locataire.courId) {
      // Pour un bien simple, marquer le bien comme libre
      const biens = this.getBiens()
      const bienIndex = biens.findIndex(b => b.id === locataire.courId)
      if (bienIndex !== -1) {
        biens[bienIndex].statut = 'libre'
        this.setData('biens', biens)
      }
    }

    const filtered = locataires.filter(l => l.id !== id)
    this.setData('locataires', filtered)

    // Synchroniser avec Firestore en arrière-plan
    this.syncToFirestore('locataires', 'delete', id)

    return true
  }

  // PAIEMENTS
  getPaiements() {
    return this.getData('paiements')
  }

  getPaiementsByLocataire(locataireId) {
    return this.getPaiements().filter(paiement => paiement.locataireId === locataireId)
  }

  addPaiement(paiement) {
    try {
      // Valider les données avec Zod
      const validated = PaiementSchema.parse(paiement)

      const paiements = this.getPaiements()
      const newPaiement = {
        id: generateId(),
        ...validated,
        datePaiement: validated.datePaiement || new Date().toISOString()
      }
      paiements.push(newPaiement)
      this.setData('paiements', paiements)
      logger.info('Paiement ajouté:', newPaiement.id)

      // Synchroniser avec Firestore en arrière-plan (passer l'objet complet)
      this.syncToFirestore('paiements', 'add', newPaiement.id, newPaiement)

      return newPaiement
    } catch (error) {
      logger.error('Erreur validation paiement:', error)
      throw error
    }
  }

  updatePaiement(id, paiement) {
    try {
      // Validation partielle (permet champs manquants)
      const validated = PaiementSchema.partial().parse(paiement)

      const paiements = this.getPaiements()
      const index = paiements.findIndex(p => p.id === id)
      if (index !== -1) {
        paiements[index] = { ...paiements[index], ...validated }
        this.setData('paiements', paiements)
        logger.info('Paiement mis à jour:', id)

        // Synchroniser avec Firestore en arrière-plan (passer l'objet complet)
        this.syncToFirestore('paiements', 'update', id, paiements[index])

        return paiements[index]
      }
      return null
    } catch (error) {
      logger.error('Erreur validation paiement:', error)
      throw error
    }
  }

  deletePaiement(id) {
    const paiements = this.getPaiements()
    const filtered = paiements.filter(p => p.id !== id)
    this.setData('paiements', filtered)

    // Synchroniser avec Firestore en arrière-plan
    this.syncToFirestore('paiements', 'delete', id)

    return true
  }

  // STATISTIQUES AVANCÉES - Délégué à statsService
  getStatistiques() {
    const proprietaires = this.getProprietaires()
    const biens = this.getBiens()
    const locataires = this.getLocataires()
    const paiements = this.getPaiements()

    return statsService.getStatistiquesGlobales(
      proprietaires,
      biens,
      locataires,
      paiements
    )
  }
}

export default new DataService()