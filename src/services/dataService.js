// Service pour gérer les données du CRM via localStorage
class DataService {
  constructor() {
    this.storageKeys = {
      proprietaires: 'crm_proprietaires',
      biens: 'crm_biens', 
      locataires: 'crm_locataires',
      paiements: 'crm_paiements'
    }
    this.initializeData()
  }

  initializeData() {
    // Initialiser les données si elles n'existent pas
    Object.values(this.storageKeys).forEach(key => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify([]))
      }
    })
  }

  // Méthodes génériques
  getData(type) {
    return JSON.parse(localStorage.getItem(this.storageKeys[type]) || '[]')
  }

  setData(type, data) {
    localStorage.setItem(this.storageKeys[type], JSON.stringify(data))
  }

  generateId() {
    return Date.now().toString() + Math.random().toString(36).substring(2, 9)
  }

  // PROPRIETAIRES
  getProprietaires() {
    return this.getData('proprietaires')
  }

  addProprietaire(proprietaire) {
    const proprietaires = this.getProprietaires()
    const newProprietaire = {
      id: this.generateId(),
      ...proprietaire,
      dateCreation: new Date().toISOString()
    }
    proprietaires.push(newProprietaire)
    this.setData('proprietaires', proprietaires)
    return newProprietaire
  }

  updateProprietaire(id, proprietaire) {
    const proprietaires = this.getProprietaires()
    const index = proprietaires.findIndex(p => p.id === id)
    if (index !== -1) {
      proprietaires[index] = { ...proprietaires[index], ...proprietaire }
      this.setData('proprietaires', proprietaires)
      return proprietaires[index]
    }
    return null
  }

  deleteProprietaire(id) {
    const proprietaires = this.getProprietaires()
    const filtered = proprietaires.filter(p => p.id !== id)
    this.setData('proprietaires', filtered)
    return true
  }

  // BIENS
  getBiens() {
    return this.getData('biens')
  }

  getBiensByProprietaire(proprietaireId) {
    return this.getBiens().filter(bien => bien.proprietaireId === proprietaireId)
  }

  addBien(bien) {
    const biens = this.getBiens()
    const newBien = {
      id: this.generateId(),
      ...bien,
      dateCreation: new Date().toISOString()
    }

    // Si c'est une cour commune, générer les maisons
    if (bien.type === 'cour_commune' && bien.nombreMaisons) {
      newBien.maisons = []
      for (let i = 1; i <= parseInt(bien.nombreMaisons); i++) {
        newBien.maisons.push({
          id: this.generateId(),
          numeroMaison: i,
          compteurEau: bien[`compteurEau_${i}`] || '',
          compteurElectricite: bien[`compteurElectricite_${i}`] || '',
          statut: 'libre', // libre ou occupee
          locataireId: null
        })
      }
      // Nettoyer les champs temporaires
      Object.keys(bien).forEach(key => {
        if (key.startsWith('compteurEau_') || key.startsWith('compteurElectricite_')) {
          delete newBien[key]
        }
      })
    }

    biens.push(newBien)
    this.setData('biens', biens)
    return newBien
  }

  updateBien(id, bien) {
    const biens = this.getBiens()
    const index = biens.findIndex(b => b.id === id)
    if (index !== -1) {
      biens[index] = { ...biens[index], ...bien }
      this.setData('biens', biens)
      return biens[index]
    }
    return null
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
    const maison = maisons.find(m => m.numeroMaison === numeroMaison)
    return maison ? maison.statut === 'occupee' : false
  }

  assignerLocataireToMaison(courId, numeroMaison, locataireId) {
    const biens = this.getBiens()
    const bienIndex = biens.findIndex(b => b.id === courId)
    
    if (bienIndex !== -1 && biens[bienIndex].maisons) {
      const maisonIndex = biens[bienIndex].maisons.findIndex(m => m.numeroMaison === numeroMaison)
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
      const maisonIndex = biens[bienIndex].maisons.findIndex(m => m.numeroMaison === numeroMaison)
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
    const locataires = this.getLocataires()
    const newLocataire = {
      id: this.generateId(),
      ...locataire,
      dateCreation: new Date().toISOString(),
      statut: 'actif'
    }

    // Si c'est une cour commune avec numéro de maison, assigner la maison
    if (locataire.courId && locataire.numeroMaison) {
      const success = this.assignerLocataireToMaison(locataire.courId, locataire.numeroMaison, newLocataire.id)
      if (!success) {
        throw new Error('Impossible d\'assigner la maison - elle est peut-être déjà occupée')
      }
    }

    locataires.push(newLocataire)
    this.setData('locataires', locataires)
    return newLocataire
  }

  updateLocataire(id, locataire) {
    const locataires = this.getLocataires()
    const index = locataires.findIndex(l => l.id === id)
    if (index !== -1) {
      locataires[index] = { ...locataires[index], ...locataire }
      this.setData('locataires', locataires)
      return locataires[index]
    }
    return null
  }

  deleteLocataire(id) {
    const locataires = this.getLocataires()
    const locataire = locataires.find(l => l.id === id)
    
    // Libérer la maison si c'est une cour commune
    if (locataire && locataire.courId && locataire.numeroMaison) {
      this.libererMaison(locataire.courId, locataire.numeroMaison)
    }
    
    const filtered = locataires.filter(l => l.id !== id)
    this.setData('locataires', filtered)
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
    const paiements = this.getPaiements()
    const newPaiement = {
      id: this.generateId(),
      ...paiement,
      datePaiement: paiement.datePaiement || new Date().toISOString()
    }
    paiements.push(newPaiement)
    this.setData('paiements', paiements)
    return newPaiement
  }

  updatePaiement(id, paiement) {
    const paiements = this.getPaiements()
    const index = paiements.findIndex(p => p.id === id)
    if (index !== -1) {
      paiements[index] = { ...paiements[index], ...paiement }
      this.setData('paiements', paiements)
      return paiements[index]
    }
    return null
  }

  deletePaiement(id) {
    const paiements = this.getPaiements()
    const filtered = paiements.filter(p => p.id !== id)
    this.setData('paiements', filtered)
    return true
  }

  // STATISTIQUES AVANCÉES
  getStatistiques() {
    const proprietaires = this.getProprietaires()
    const biens = this.getBiens()
    const locataires = this.getLocataires()
    const paiements = this.getPaiements()
    
    const locatairesActifs = locataires.filter(l => l.statut === 'actif')
    
    // Calculer le nombre total de maisons/unités locables
    let totalUnites = 0
    let unitesOccupees = 0
    
    biens.forEach(bien => {
      if (bien.type === 'cour_commune' && bien.maisons) {
        totalUnites += bien.maisons.length
        unitesOccupees += bien.maisons.filter(m => m.statut === 'occupee').length
      } else {
        totalUnites += 1
        // Vérifier si cette unité simple est occupée
        const locataireDeceUni = locatairesActifs.find(l => l.courId === bien.id)
        if (locataireDeceUni) {
          unitesOccupees += 1
        }
      }
    })

    // Statistiques du mois courant
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()
    const moisNoms = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ]
    
    const paiementsMoisCourant = paiements.filter(p => {
      let paiementMois = p.mois
      if (typeof paiementMois === 'string') {
        paiementMois = moisNoms.indexOf(p.mois) + 1
      }
      return parseInt(paiementMois) === currentMonth && parseInt(p.annee) === currentYear
    })

    const revenusMoisCourant = paiementsMoisCourant.reduce((sum, p) => sum + (p.montantPaye || 0), 0)
    
    // Calculer le total attendu ce mois
    const totalAttenduMoisCourant = locatairesActifs.reduce((sum, l) => sum + (parseFloat(l.montantLoyer) || 0), 0)
    
    // Calculer les impayés (locataires qui n'ont pas payé ce mois)
    const locatairesImpayes = locatairesActifs.filter(locataire => {
      const aPaye = paiementsMoisCourant.find(p => p.locataireId === locataire.id)
      if (!aPaye) return true
      const montantDu = parseFloat(locataire.montantLoyer) || 0
      const montantPaye = parseFloat(aPaye.montantPaye) || 0
      return montantPaye < montantDu
    })

    const tauxRecouvrement = totalAttenduMoisCourant > 0 ? 
      Math.round((revenusMoisCourant / totalAttenduMoisCourant) * 100) : 100

    return {
      totalProprietaires: proprietaires.length,
      totalBiens: biens.length,
      totalLocataires: locataires.length,
      locatairesActifs: locatairesActifs.length,
      totalUnites,
      unitesOccupees,
      tauxOccupation: totalUnites > 0 ? Math.round((unitesOccupees / totalUnites) * 100) : 0,
      
      // Statistiques financières
      revenusMoisCourant,
      totalAttenduMoisCourant,
      montantEnAttente: Math.max(0, totalAttenduMoisCourant - revenusMoisCourant),
      tauxRecouvrement,
      
      // Alertes
      alertesImpayes: locatairesImpayes.length,
      
      // Données du mois
      moisCourant: moisNoms[currentMonth - 1],
      anneeCourante: currentYear
    }
  }
}

export default new DataService()