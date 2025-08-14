import { useState, useEffect } from 'react'
import dataService from '../services/dataService'

function LocatairesSimple() {
  const [locataires, setLocataires] = useState([])
  const [biens, setBiens] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingLocataire, setEditingLocataire] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    courId: '', // Remplace bienId
    numeroMaison: '', // Nouvelle propriété pour cours communes
    montantLoyer: ''
  })
  
  const [proprietaires, setProprietaires] = useState([])
  const [maisonsLibres, setMaisonsLibres] = useState([])

  useEffect(() => {
    try {
      setLocataires(dataService.getLocataires())
      setBiens(dataService.getBiens())
      setProprietaires(dataService.getProprietaires())
    } catch {
      alert('Erreur lors du chargement des données')
    }
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    try {
      if (!formData.nom || !formData.prenom || !formData.courId) {
        alert('Nom, prénom et cour sont obligatoires')
        return
      }

      // Vérifier si c'est une cour commune qui nécessite une maison
      const cour = biens.find(b => b.id === formData.courId)
      if (cour?.type === 'cour_commune' && !formData.numeroMaison) {
        alert('Vous devez sélectionner une maison pour cette cour commune')
        return
      }

      if (editingLocataire) {
        dataService.updateLocataire(editingLocataire.id, formData)
      } else {
        dataService.addLocataire(formData)
      }
      
      setLocataires(dataService.getLocataires())
      setBiens(dataService.getBiens()) // Recharger pour mettre à jour les statuts
      resetForm()
    } catch (error) {
      // Erreur déjà gérée par l'alert ci-dessous
      alert('Erreur lors de l\'enregistrement du locataire: ' + error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      nom: '',
      prenom: '',
      telephone: '',
      courId: '',
      numeroMaison: '',
      montantLoyer: ''
    })
    setMaisonsLibres([])
    setEditingLocataire(null)
    setShowForm(false)
  }

  // Gérer le changement de cour
  const handleCourChange = (courId) => {
    setFormData({...formData, courId, numeroMaison: ''})
    
    if (courId) {
      const cour = biens.find(b => b.id === courId)
      if (cour?.type === 'cour_commune') {
        const maisons = dataService.getMaisonsLibresByCour(courId)
        setMaisonsLibres(maisons)
      } else {
        setMaisonsLibres([])
      }
    } else {
      setMaisonsLibres([])
    }
  }

  const getBienInfo = (locataire) => {
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

  const getProprietaireInfo = (courId) => {
    const cour = biens.find(b => b.id === courId)
    if (!cour) return 'Propriétaire inconnu'
    
    const proprietaire = proprietaires.find(p => p.id === cour.proprietaireId)
    return proprietaire ? `${proprietaire.prenom} ${proprietaire.nom}` : 'Propriétaire inconnu'
  }

  // Fonction pour modifier un locataire
  const handleEdit = (locataire) => {
    setFormData({
      nom: locataire.nom,
      prenom: locataire.prenom,
      telephone: locataire.telephone || '',
      courId: locataire.courId,
      numeroMaison: locataire.numeroMaison || '',
      montantLoyer: locataire.montantLoyer || ''
    })
    
    // Charger les maisons disponibles pour cette cour
    if (locataire.courId) {
      const cour = biens.find(b => b.id === locataire.courId)
      if (cour?.type === 'cour_commune') {
        const maisons = dataService.getMaisonsLibresByCour(locataire.courId)
        // Ajouter la maison actuellement occupée par ce locataire
        const maisonsActuelle = dataService.getMaisonsByCour(locataire.courId)
        const maisonActuelle = maisonsActuelle.find(m => m.numeroMaison === locataire.numeroMaison)
        if (maisonActuelle) {
          maisons.push(maisonActuelle)
        }
        setMaisonsLibres(maisons)
      }
    }
    
    setEditingLocataire(locataire)
    setShowForm(true)
  }

  // Fonction pour supprimer un locataire
  const handleDelete = (locataire) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le locataire ${locataire.prenom} ${locataire.nom} ?`)) {
      try {
        dataService.deleteLocataire(locataire.id)
        setLocataires(dataService.getLocataires())
        setBiens(dataService.getBiens()) // Recharger pour mettre à jour les statuts
      } catch {
        // Erreur déjà gérée par l'alert ci-dessous
        alert('Erreur lors de la suppression du locataire')
      }
    }
  }

  // Fonction de recherche/filtrage
  const filteredLocataires = locataires.filter(locataire => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    const nom = (locataire.nom || '').toLowerCase()
    const prenom = (locataire.prenom || '').toLowerCase()
    const telephone = (locataire.telephone || '').toLowerCase()
    const bienInfo = getBienInfo(locataire).toLowerCase()
    const proprietaireInfo = getProprietaireInfo(locataire.courId).toLowerCase()
    
    return nom.includes(searchLower) || 
           prenom.includes(searchLower) || 
           telephone.includes(searchLower) ||
           bienInfo.includes(searchLower) ||
           proprietaireInfo.includes(searchLower)
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Locataires</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">Gérer les locataires</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
        >
          + Nouveau Locataire
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Rechercher par nom, prénom, téléphone, propriétaire ou type de propriété..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
          />
          {searchTerm && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                onClick={() => setSearchTerm('')}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
        {searchTerm && (
          <div className="mt-2 text-sm text-gray-600">
            {filteredLocataires.length} résultat(s) trouvé(s) pour "{searchTerm}"
          </div>
        )}
      </div>

      {/* Formulaire simplifié */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-full overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingLocataire ? 'Modifier' : 'Nouveau'} Locataire
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom *
                </label>
                <input
                  type="text"
                  value={formData.prenom}
                  onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom *
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({...formData, nom: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cour / Bien *
                </label>
                <select
                  value={formData.courId}
                  onChange={(e) => handleCourChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Sélectionner une cour/bien</option>
                  {biens.map(bien => (
                    <option key={bien.id} value={bien.id}>
                      {bien.nomCour || `${bien.quartier} ${bien.ville}`} - {bien.type === 'cour_commune' ? 'Cour commune' : bien.type === 'magasin' ? 'Magasin' : 'Villa'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sélection de maison pour cours communes */}
              {formData.courId && biens.find(b => b.id === formData.courId)?.type === 'cour_commune' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maison dans la cour *
                  </label>
                  {maisonsLibres.length === 0 ? (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                      ⚠️ Aucune maison libre dans cette cour
                    </div>
                  ) : (
                    <select
                      value={formData.numeroMaison}
                      onChange={(e) => setFormData({...formData, numeroMaison: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    >
                      <option value="">Sélectionner une maison</option>
                      {maisonsLibres.map(maison => (
                        <option key={maison.id} value={maison.numeroMaison}>
                          Maison n°{maison.numeroMaison}
                          {(maison.compteurEau || maison.compteurElectricite) && 
                            ` (${maison.compteurEau ? `Eau: ${maison.compteurEau}` : ''}${maison.compteurEau && maison.compteurElectricite ? ', ' : ''}${maison.compteurElectricite ? `Élec: ${maison.compteurElectricite}` : ''})`
                          }
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Affichage du propriétaire */}
              {formData.courId && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="text-sm text-blue-800">
                    <strong>Propriétaire:</strong> {getProprietaireInfo(formData.courId)}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant du loyer (FCFA)
                </label>
                <input
                  type="number"
                  value={formData.montantLoyer}
                  onChange={(e) => setFormData({...formData, montantLoyer: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

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
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  {editingLocataire ? 'Modifier' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Liste des locataires */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredLocataires.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-5xl mb-4">👤</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Aucun résultat trouvé' : 'Aucun locataire'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? `Aucun locataire ne correspond à "${searchTerm}"` 
                : 'Ajoutez votre premier locataire'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
              >
                Nouveau Locataire
              </button>
            )}
          </div>
        ) : (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Liste des locataires</h3>
            <div className="space-y-4">
              {filteredLocataires.map((locataire) => (
                <div key={locataire.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {locataire.prenom} {locataire.nom}
                      </h4>
                      {locataire.telephone && (
                        <p className="text-sm text-gray-600">📞 {locataire.telephone}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        🏠 {getBienInfo(locataire)}
                      </p>
                      <p className="text-sm text-gray-600">
                        👤 Propriétaire: {getProprietaireInfo(locataire.courId)}
                      </p>
                      {locataire.montantLoyer && (
                        <p className="text-sm text-gray-600">
                          💰 {parseInt(locataire.montantLoyer).toLocaleString()} FCFA/mois
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Actif
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(locataire)}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(locataire)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LocatairesSimple