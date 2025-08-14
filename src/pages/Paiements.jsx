import { useState, useEffect } from 'react'
import dataService from '../services/dataService'

function Paiements() {
  const [paiements, setPaiements] = useState([])
  const [locataires, setLocataires] = useState([])
  const [biens, setBiens] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingPaiement, setEditingPaiement] = useState(null)
  
  // Filtres de période - par défaut mois/année courants
  const currentDate = new Date()
  const [filtreAnnee, setFiltreAnnee] = useState(currentDate.getFullYear())
  const [filtreMois, setFiltreMois] = useState(currentDate.getMonth() + 1) // getMonth() retourne 0-11
  const [activeTab, setActiveTab] = useState('paiements') // 'paiements', 'impayes' ou 'reversements'
  
  const [formData, setFormData] = useState({
    locataireId: '',
    mois: '',
    annee: new Date().getFullYear(),
    montantDu: '',
    montantPaye: '',
    datePaiement: '',
    modePaiement: 'especes',
    remarques: ''
  })

  const mois = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]

  const modesPaiement = [
    { value: 'especes', label: 'Espèces' },
    { value: 'virement', label: 'Virement bancaire' },
    { value: 'mobile_money', label: 'Mobile Money' },
    { value: 'cheque', label: 'Chèque' }
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setPaiements(dataService.getPaiements())
    setLocataires(dataService.getLocataires())
    setBiens(dataService.getBiens())
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.locataireId || !formData.mois || !formData.montantDu) {
      alert('Locataire, mois et montant dû sont obligatoires')
      return
    }

    const montantDu = parseFloat(formData.montantDu) || 0
    const montantPaye = parseFloat(formData.montantPaye) || 0
    
    const paiementData = {
      ...formData,
      montantDu,
      montantPaye,
      montantRestant: montantDu - montantPaye,
      statut: montantPaye >= montantDu ? 'paye' : montantPaye > 0 ? 'partiel' : 'impaye'
    }

    if (editingPaiement) {
      dataService.updatePaiement(editingPaiement.id, paiementData)
    } else {
      dataService.addPaiement(paiementData)
    }

    resetForm()
    loadData()
  }

  const resetForm = () => {
    setFormData({
      locataireId: '',
      mois: '',
      annee: new Date().getFullYear(),
      montantDu: '',
      montantPaye: '',
      datePaiement: '',
      modePaiement: 'especes',
      remarques: ''
    })
    setEditingPaiement(null)
    setShowForm(false)
  }

  const handleEdit = (paiement) => {
    setFormData({
      ...paiement,
      datePaiement: paiement.datePaiement ? paiement.datePaiement.split('T')[0] : ''
    })
    setEditingPaiement(paiement)
    setShowForm(true)
  }

  const handleDelete = (paiement) => {
    const locataire = getLocataireInfo(paiement.locataireId)
    if (confirm(`Êtes-vous sûr de vouloir supprimer le paiement de ${locataire.nom} pour ${paiement.mois} ${paiement.annee} ?`)) {
      dataService.deletePaiement(paiement.id)
      loadData()
    }
  }

  const getLocataireInfo = (locataireId) => {
    const locataire = locataires.find(l => l.id === locataireId)
    if (!locataire) return { nom: 'Locataire inconnu', bien: 'Bien inconnu' }
    
    // Utiliser courId au lieu de bienId pour la compatibilité avec le nouveau système
    const bien = biens.find(b => b.id === (locataire.courId || locataire.bienId))
    const bienNom = bien ? (bien.nomCour || `${bien.quartier} ${bien.ville}`) : 'Bien inconnu'
    
    return {
      nom: `${locataire.prenom} ${locataire.nom}`,
      bien: bienNom
    }
  }

  // Fonction pour obtenir les informations du bien pour un locataire (pour l'onglet impayés)
  const getBienInfoForLocataire = (locataire) => {
    if (!locataire.courId) return 'Aucune cour assignée'
    
    const cour = biens.find(b => b.id === locataire.courId)
    if (!cour) return 'Cour inconnue'
    
    const nomCour = cour.nomCour || `${cour.quartier} ${cour.ville}`
    const typeLibelle = cour.type === 'cour_commune' ? 'Cour commune' : 
                       cour.type === 'magasin' ? 'Magasin' : 'Villa'
    
    let info = `${nomCour} - ${typeLibelle}`
    
    if (cour.type === 'cour_commune' && locataire.numeroMaison) {
      info += ` - Maison n°${locataire.numeroMaison}`
    }
    
    return info
  }

  const getStatutBadge = (statut, montantPaye, montantDu) => {
    const status = statut || (montantPaye >= montantDu ? 'paye' : montantPaye > 0 ? 'partiel' : 'impaye')
    
    const colors = {
      'paye': 'bg-green-100 text-green-800',
      'partiel': 'bg-yellow-100 text-yellow-800',
      'impaye': 'bg-red-100 text-red-800'
    }
    
    const labels = {
      'paye': 'Payé',
      'partiel': 'Partiel',
      'impaye': 'Impayé'
    }
    
    return {
      color: colors[status] || colors.impaye,
      label: labels[status] || 'Impayé'
    }
  }

  // Filtrer les paiements par période
  const getPaiementsFiltres = () => {
    return paiements.filter(paiement => {
      // Convertir le nom du mois en numéro si c'est une chaîne
      let paiementMois = paiement.mois
      if (typeof paiementMois === 'string') {
        paiementMois = mois.indexOf(paiement.mois) + 1
      } else {
        paiementMois = parseInt(paiementMois)
      }
      const paiementAnnee = parseInt(paiement.annee)
      return paiementMois === filtreMois && paiementAnnee === filtreAnnee
    })
  }

  // Calculer le total attendu basé sur les maisons occupées pour la période
  const getTotalAttendu = () => {
    let totalAttendu = 0
    
    locataires.forEach(locataire => {
      // Seulement les locataires actifs avec un loyer défini
      if (locataire.statut === 'actif' && locataire.montantLoyer && locataire.courId) {
        const montant = parseFloat(locataire.montantLoyer) || 0
        totalAttendu += montant
      }
    })
    
    return totalAttendu
  }

  // Calculer les totaux pour la période sélectionnée
  const getResumePaiements = () => {
    const paiementsFiltres = getPaiementsFiltres()
    const totalAttendu = getTotalAttendu()
    
    let totalEncaisse = 0
    
    paiementsFiltres.forEach(p => {
      totalEncaisse += p.montantPaye || 0
    })
    
    const totalImpaye = totalAttendu - totalEncaisse

    return { 
      totalAttendu, 
      totalEncaisse, 
      totalImpaye: Math.max(0, totalImpaye) // Pas de montant négatif
    }
  }

  // Obtenir la liste des locataires impayés pour la période
  const getLocatairesImpayes = () => {
    const paiementsFiltres = getPaiementsFiltres()
    
    return locataires.filter(locataire => {
      // Seulement les locataires actifs avec un loyer défini
      if (locataire.statut !== 'actif' || !locataire.montantLoyer || !locataire.courId) {
        return false
      }
      
      // Vérifier s'il y a un paiement complet pour ce locataire pour la période
      const paiementLocataire = paiementsFiltres.find(p => p.locataireId === locataire.id)
      
      if (!paiementLocataire) {
        return true // Aucun paiement = impayé
      }
      
      // Vérifier si le paiement est complet
      const montantDu = parseFloat(locataire.montantLoyer) || 0
      const montantPaye = parseFloat(paiementLocataire.montantPaye) || 0
      
      return montantPaye < montantDu // Paiement partiel ou nul = impayé
    }).map(locataire => {
      // Ajouter les informations de paiement
      const paiementLocataire = paiementsFiltres.find(p => p.locataireId === locataire.id)
      const montantDu = parseFloat(locataire.montantLoyer) || 0
      const montantPaye = paiementLocataire ? parseFloat(paiementLocataire.montantPaye) || 0 : 0
      const montantRestant = montantDu - montantPaye
      
      return {
        ...locataire,
        montantDu,
        montantPaye,
        montantRestant,
        statut: montantPaye === 0 ? 'impaye' : 'partiel'
      }
    })
  }

  // Calculer les reversements pour chaque propriétaire
  const getReversementsProprietaires = () => {
    const paiementsFiltres = getPaiementsFiltres()
    const proprietaires = dataService.getProprietaires()
    
    return proprietaires.map(proprietaire => {
      // Trouver tous les biens de ce propriétaire
      const biensProprietaire = biens.filter(bien => bien.proprietaireId === proprietaire.id)
      
      let montantAReversser = 0
      let montantImpaye = 0
      let totalAttendu = 0
      let detailsBiens = []
      
      biensProprietaire.forEach(bien => {
        // Trouver tous les locataires de ce bien
        const locatairesBien = locataires.filter(loc => 
          loc.courId === bien.id && loc.statut === 'actif' && loc.montantLoyer
        )
        
        locatairesBien.forEach(locataire => {
          const montantDu = parseFloat(locataire.montantLoyer) || 0
          totalAttendu += montantDu
          
          // Trouver le paiement de ce locataire pour la période
          const paiement = paiementsFiltres.find(p => p.locataireId === locataire.id)
          const montantPaye = paiement ? (parseFloat(paiement.montantPaye) || 0) : 0
          
          montantAReversser += montantPaye
          montantImpaye += (montantDu - montantPaye)
          
          // Ajouter aux détails si il y a du mouvement (paiement ou impayé)
          if (montantDu > 0) {
            detailsBiens.push({
              bien: bien,
              locataire: locataire,
              montantDu,
              montantPaye,
              montantImpaye: montantDu - montantPaye
            })
          }
        })
      })
      
      return {
        ...proprietaire,
        montantAReversser,
        montantImpaye: Math.max(0, montantImpaye),
        totalAttendu,
        nombreBiens: biensProprietaire.length,
        detailsBiens: detailsBiens.filter(d => d.montantDu > 0) // Seulement les biens avec des locataires
      }
    }).filter(p => p.totalAttendu > 0) // Seulement les propriétaires avec des revenus attendus
  }

  const resume = getResumePaiements()

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Suivi des Paiements</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            {mois[filtreMois - 1]} {filtreAnnee} - Gérer les paiements de loyers
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
          disabled={locataires.length === 0}
        >
          <span className="mr-2">+</span>
          Nouveau Paiement
        </button>
      </div>

      {/* Filtres de période */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Période:</span>
          </div>
          <div className="flex gap-3">
            <select
              value={filtreMois}
              onChange={(e) => setFiltreMois(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            >
              {mois.map((moisNom, index) => (
                <option key={index + 1} value={index + 1}>
                  {moisNom}
                </option>
              ))}
            </select>
            <select
              value={filtreAnnee}
              onChange={(e) => setFiltreAnnee(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            >
              {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map(annee => (
                <option key={annee} value={annee}>
                  {annee}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              setFiltreMois(currentDate.getMonth() + 1)
              setFiltreAnnee(currentDate.getFullYear())
            }}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
          >
            Mois actuel
          </button>
        </div>
      </div>

      {/* Résumé financier */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Attendu</p>
              <p className="text-2xl font-bold text-blue-600">
                {resume.totalAttendu.toLocaleString()} FCFA
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Basé sur les maisons occupées
              </p>
            </div>
            <div className="text-blue-600 text-3xl">🏠</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Encaissé</p>
              <p className="text-2xl font-bold text-green-600">
                {resume.totalEncaisse.toLocaleString()} FCFA
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Paiements reçus pour {mois[filtreMois - 1]}
              </p>
            </div>
            <div className="text-green-600 text-3xl">💰</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Impayé</p>
              <p className="text-2xl font-bold text-red-600">
                {resume.totalImpaye.toLocaleString()} FCFA
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Attendu - Encaissé
              </p>
            </div>
            <div className="text-red-600 text-3xl">⚠️</div>
          </div>
        </div>
      </div>

      {/* Message si pas de locataires */}
      {locataires.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="text-yellow-600 text-xl mr-3">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Aucun locataire disponible
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Vous devez d'abord enregistrer des locataires avant de pouvoir saisir des paiements.
              </p>
              <div className="mt-2">
                <button
                  onClick={() => window.location.href = '/locataires'}
                  className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200"
                >
                  Aller aux locataires
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-full overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingPaiement ? 'Modifier' : 'Nouveau'} Paiement
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Locataire *
                </label>
                <select
                  value={formData.locataireId}
                  onChange={(e) => {
                    const locataireId = e.target.value
                    const locataire = locataires.find(l => l.id === locataireId)
                    setFormData({
                      ...formData, 
                      locataireId,
                      montantDu: locataire?.montantLoyer || ''
                    })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Sélectionner un locataire</option>
                  {locataires.map(locataire => {
                    const info = getLocataireInfo(locataire.id)
                    return (
                      <option key={locataire.id} value={locataire.id}>
                        {info.nom} - {info.bien}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mois *
                  </label>
                  <select
                    value={formData.mois}
                    onChange={(e) => setFormData({...formData, mois: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Sélectionner un mois</option>
                    {mois.map((m, index) => (
                      <option key={index} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Année *
                  </label>
                  <input
                    type="number"
                    value={formData.annee}
                    onChange={(e) => setFormData({...formData, annee: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    min="2020"
                    max="2030"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Montant dû (FCFA) *
                  </label>
                  <input
                    type="number"
                    value={formData.montantDu}
                    onChange={(e) => setFormData({...formData, montantDu: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Montant payé (FCFA)
                  </label>
                  <input
                    type="number"
                    value={formData.montantPaye}
                    onChange={(e) => setFormData({...formData, montantPaye: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de paiement
                  </label>
                  <input
                    type="date"
                    value={formData.datePaiement}
                    onChange={(e) => setFormData({...formData, datePaiement: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mode de paiement
                  </label>
                  <select
                    value={formData.modePaiement}
                    onChange={(e) => setFormData({...formData, modePaiement: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {modesPaiement.map(mode => (
                      <option key={mode.value} value={mode.value}>
                        {mode.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remarques
                </label>
                <textarea
                  value={formData.remarques}
                  onChange={(e) => setFormData({...formData, remarques: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows="3"
                  placeholder="Notes ou remarques sur le paiement..."
                />
              </div>

              {/* Aperçu du montant restant */}
              {formData.montantDu && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Montant dû:</span>
                      <span className="font-medium">{parseFloat(formData.montantDu || 0).toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Montant payé:</span>
                      <span className="font-medium">{parseFloat(formData.montantPaye || 0).toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between font-medium text-gray-900 border-t pt-2 mt-2">
                      <span>Montant restant:</span>
                      <span className={
                        (parseFloat(formData.montantDu || 0) - parseFloat(formData.montantPaye || 0)) > 0 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }>
                        {Math.max(0, parseFloat(formData.montantDu || 0) - parseFloat(formData.montantPaye || 0)).toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  {editingPaiement ? 'Modifier' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Onglets et contenu */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Onglets */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('paiements')}
              className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'paiements'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tous paiements ({getPaiementsFiltres().length})
            </button>
            <button
              onClick={() => setActiveTab('impayes')}
              className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'impayes'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Impayés ({getLocatairesImpayes().length})
            </button>
            <button
              onClick={() => setActiveTab('reversements')}
              className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'reversements'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Reversements ({getReversementsProprietaires().length})
            </button>
          </nav>
        </div>

        {/* Contenu des onglets */}
        <div>
        {activeTab === 'paiements' && (
          <>
            {getPaiementsFiltres().length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-5xl mb-4">💰</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun paiement pour {mois[filtreMois - 1]} {filtreAnnee}
            </h3>
            <p className="text-gray-600 mb-4">
              Aucun paiement enregistré pour cette période. Ajoutez un paiement ou changez la période.
            </p>
            {locataires.length > 0 && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Nouveau Paiement
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Locataire
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Période
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montants
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mode de paiement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getPaiementsFiltres().map((paiement) => {
                  const locataireInfo = getLocataireInfo(paiement.locataireId)
                  const statut = getStatutBadge(paiement.statut, paiement.montantPaye, paiement.montantDu)
                  
                  return (
                    <tr key={paiement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {locataireInfo.nom}
                        </div>
                        <div className="text-sm text-gray-500">
                          {locataireInfo.bien}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {paiement.mois} {paiement.annee}
                        </div>
                        {paiement.datePaiement && (
                          <div className="text-sm text-gray-500">
                            Payé le {new Date(paiement.datePaiement).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          Dû: {(paiement.montantDu || 0).toLocaleString()} FCFA
                        </div>
                        <div className="text-sm text-gray-900">
                          Payé: {(paiement.montantPaye || 0).toLocaleString()} FCFA
                        </div>
                        {(paiement.montantDu - paiement.montantPaye) > 0 && (
                          <div className="text-sm text-red-600">
                            Restant: {((paiement.montantDu || 0) - (paiement.montantPaye || 0)).toLocaleString()} FCFA
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {modesPaiement.find(m => m.value === paiement.modePaiement)?.label || paiement.modePaiement}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statut.color}`}>
                          {statut.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(paiement)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDelete(paiement)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
            )}
          </>
        )}

        {activeTab === 'impayes' && (
          <>
            {getLocatairesImpayes().length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-5xl mb-4">✅</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun impayé pour {mois[filtreMois - 1]} {filtreAnnee}
                </h3>
                <p className="text-gray-600 mb-4">
                  Tous les locataires ont payé leur loyer pour cette période !
                </p>
              </div>
            ) : (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Locataires impayés - {mois[filtreMois - 1]} {filtreAnnee}
                </h3>
                <div className="space-y-4">
                  {getLocatairesImpayes().map((locataire) => (
                    <div key={locataire.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {locataire.prenom} {locataire.nom}
                          </h4>
                          {locataire.telephone && (
                            <p className="text-sm text-gray-600">📞 {locataire.telephone}</p>
                          )}
                          <p className="text-sm text-gray-600">
                            🏠 {getBienInfoForLocataire(locataire)}
                          </p>
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">Montant dû:</span>
                              <span className="font-medium text-blue-600 ml-1">
                                {locataire.montantDu.toLocaleString()} FCFA
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Montant payé:</span>
                              <span className="font-medium text-green-600 ml-1">
                                {locataire.montantPaye.toLocaleString()} FCFA
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Reste à payer:</span>
                              <span className="font-medium text-red-600 ml-1">
                                {locataire.montantRestant.toLocaleString()} FCFA
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            locataire.statut === 'impaye' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {locataire.statut === 'impaye' ? 'Impayé' : 'Partiel'}
                          </span>
                          <button
                            onClick={() => {
                              // Pré-remplir le formulaire avec les données du locataire
                              setFormData({
                                locataireId: locataire.id,
                                mois: mois[filtreMois - 1],
                                annee: filtreAnnee,
                                montantDu: locataire.montantDu.toString(),
                                montantPaye: '',
                                datePaiement: new Date().toISOString().split('T')[0],
                                modePaiement: 'especes',
                                remarques: ''
                              })
                              setShowForm(true)
                            }}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                          >
                            Enregistrer paiement
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'reversements' && (
          <>
            {getReversementsProprietaires().length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-5xl mb-4">🏦</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun reversement pour {mois[filtreMois - 1]} {filtreAnnee}
                </h3>
                <p className="text-gray-600 mb-4">
                  Aucun propriétaire n'a de revenus locatifs pour cette période.
                </p>
              </div>
            ) : (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Reversements propriétaires - {mois[filtreMois - 1]} {filtreAnnee}
                </h3>
                <div className="space-y-4">
                  {getReversementsProprietaires()
                    .sort((a, b) => b.montantAReversser - a.montantAReversser) // Tri par montant décroissant
                    .map((proprietaire) => (
                    <div key={proprietaire.id} className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {proprietaire.prenom} {proprietaire.nom}
                          </h4>
                          {proprietaire.telephone && (
                            <p className="text-sm text-gray-600">📞 {proprietaire.telephone}</p>
                          )}
                          <p className="text-sm text-gray-600">
                            🏠 {proprietaire.nombreBiens} bien(s) - {proprietaire.detailsBiens.length} locataire(s)
                          </p>
                          
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                            <div className="bg-white p-3 rounded border">
                              <span className="text-gray-600 block">À reverser</span>
                              <span className="font-medium text-green-600 text-lg">
                                {proprietaire.montantAReversser.toLocaleString()} FCFA
                              </span>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <span className="text-gray-600 block">Impayé</span>
                              <span className="font-medium text-red-600 text-lg">
                                {proprietaire.montantImpaye.toLocaleString()} FCFA
                              </span>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <span className="text-gray-600 block">Total attendu</span>
                              <span className="font-medium text-blue-600 text-lg">
                                {proprietaire.totalAttendu.toLocaleString()} FCFA
                              </span>
                            </div>
                          </div>

                          {/* Détails des biens (collapsible) */}
                          {proprietaire.detailsBiens.length > 0 && (
                            <details className="mt-3">
                              <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800">
                                Voir détail des {proprietaire.detailsBiens.length} locataire(s) ▼
                              </summary>
                              <div className="mt-2 space-y-2 pl-4 border-l-2 border-blue-200">
                                {proprietaire.detailsBiens.map((detail, index) => (
                                  <div key={index} className="bg-white p-2 rounded border text-xs">
                                    <div className="font-medium">
                                      {detail.locataire.prenom} {detail.locataire.nom}
                                    </div>
                                    <div className="text-gray-600">
                                      {detail.bien.nomCour || `${detail.bien.quartier} ${detail.bien.ville}`}
                                      {detail.bien.type === 'cour_commune' && detail.locataire.numeroMaison && 
                                        ` - Maison n°${detail.locataire.numeroMaison}`
                                      }
                                    </div>
                                    <div className="flex gap-4 mt-1">
                                      <span>Dû: <strong>{detail.montantDu.toLocaleString()}</strong></span>
                                      <span className="text-green-600">
                                        Payé: <strong>{detail.montantPaye.toLocaleString()}</strong>
                                      </span>
                                      {detail.montantImpaye > 0 && (
                                        <span className="text-red-600">
                                          Impayé: <strong>{detail.montantImpaye.toLocaleString()}</strong>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end space-y-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {proprietaire.montantAReversser > 0 ? 'À reverser' : 'Rien à reverser'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  )
}

export default Paiements