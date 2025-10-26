import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import dataService from '../services/dataService'
import firestoreService from '../services/firestoreService'
import { useAuth } from './AuthContext'
import logger from '../utils/logger'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const { user, isAuthenticated, isConfigured, loading: authLoading } = useAuth()

  const [data, setData] = useState({
    proprietaires: [],
    biens: [],
    locataires: [],
    paiements: [],
    documents: []
  })

  const [loading, setLoading] = useState(true)

  // Charger toutes les données au démarrage
  useEffect(() => {
    // Attendre que AuthProvider soit prêt avant de charger les données
    if (authLoading) {
      return
    }

    const loadData = async () => {
      setLoading(true)
      try {
        // Si l'utilisateur est connecté, définir son agence et charger ses données
        if (isAuthenticated && user?.uid) {
          // Définir l'agence courante
          dataService.setCurrentAgence(user.uid)

          // Si Firebase est configuré, charger depuis Firestore
          if (isConfigured) {
            await dataService.loadFromFirestore(user.uid)
          }
        } else {
          // Mode non connecté - pas de préfixe agence
          dataService.setCurrentAgence(null)
        }

        // Charger depuis localStorage (avec préfixe agence si connecté)
        setData({
          proprietaires: dataService.getProprietaires(),
          biens: dataService.getBiens(),
          locataires: dataService.getLocataires(),
          paiements: dataService.getPaiements(),
          documents: dataService.getDocuments?.() || []
        })

      } catch (error) {
        logger.error('Erreur lors du chargement des données:', { error })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [authLoading, isAuthenticated, user, isConfigured])

  // Rafraîchir une entité spécifique
  const refreshEntity = useCallback((entityType) => {
    const loaders = {
      proprietaires: () => dataService.getProprietaires(),
      biens: () => dataService.getBiens(),
      locataires: () => dataService.getLocataires(),
      paiements: () => dataService.getPaiements(),
      documents: () => dataService.getDocuments?.() || []
    }

    if (loaders[entityType]) {
      // Invalider le cache avant de recharger
      dataService.invalidateCache(entityType)

      const freshData = loaders[entityType]()

      setData(prev => ({
        ...prev,
        [entityType]: freshData
      }))
    }
  }, [])

  // Rafraîchir toutes les données
  const refreshAll = useCallback(async () => {
    setLoading(true)
    try {
      // Toujours charger depuis localStorage (source de vérité)
      setData({
        proprietaires: dataService.getProprietaires(),
        biens: dataService.getBiens(),
        locataires: dataService.getLocataires(),
        paiements: dataService.getPaiements(),
        documents: dataService.getDocuments?.() || []
      })
    } catch (error) {
      logger.error('Erreur lors du rafraîchissement des données:', { error })
    } finally {
      setLoading(false)
    }
  }, [])

  // Ajouter une entité
  const addEntity = useCallback((entityType, entity) => {
    setData(prev => ({
      ...prev,
      [entityType]: [...prev[entityType], entity]
    }))
  }, [])

  // Mettre à jour une entité
  const updateEntity = useCallback((entityType, updatedEntity) => {
    setData(prev => ({
      ...prev,
      [entityType]: prev[entityType].map(item =>
        item.id === updatedEntity.id ? updatedEntity : item
      )
    }))
  }, [])

  // Supprimer une entité
  const deleteEntity = useCallback((entityType, id) => {
    setData(prev => ({
      ...prev,
      [entityType]: prev[entityType].filter(item => item.id !== id)
    }))
  }, [])

  const value = useMemo(() => ({
    ...data,
    loading: authLoading || loading,
    refreshEntity,
    refreshAll,
    addEntity,
    updateEntity,
    deleteEntity
  }), [data, authLoading, loading, refreshEntity, refreshAll, addEntity, updateEntity, deleteEntity])

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData doit être utilisé dans un DataProvider')
  }
  return context
}
