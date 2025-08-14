import React, { useState, useEffect } from 'react'
import dataService from '../services/dataService'
import CourDetails from '../components/CourDetails'

function Biens() {
  const [biens, setBiens] = useState([])
  const [proprietaires, setProprietaires] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingBien, setEditingBien] = useState(null)
  const [formData, setFormData] = useState({
    proprietaireId: '',
    type: 'cour_unique',
    nomCour: '',
    quartier: '',
    ville: '',
    numeroMaison: '',
    compteurEau: '',
    compteurElectricite: '',
    description: '',
    nombreMaisons: 1
  })
  
  const [maisonsData, setMaisonsData] = useState({})

  const typesBien = [
    { value: 'cour_unique', label: 'Cour unique (villa)' },
    { value: 'cour_commune', label: 'Cour commune' },
    { value: 'magasin', label: 'Magasin' }
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setBiens(dataService.getBiens())
    setProprietaires(dataService.getProprietaires())
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.proprietaireId || !formData.quartier || !formData.ville) {
      alert('Propriétaire, quartier et ville sont obligatoires')
      return
    }

    // Préparer les données avec les informations des maisons pour cour commune
    const dataToSave = { ...formData }
    if (formData.type === 'cour_commune') {
      // Ajouter les données des maisons
      Object.keys(maisonsData).forEach(key => {
        dataToSave[key] = maisonsData[key]
      })
    }

    if (editingBien) {
      dataService.updateBien(editingBien.id, dataToSave)
    } else {
      dataService.addBien(dataToSave)
    }

    resetForm()
    loadData()
  }

  const resetForm = () => {
    setFormData({
      proprietaireId: '',
      type: 'cour_unique',
      nomCour: '',
      quartier: '',
      ville: '',
      numeroMaison: '',
      compteurEau: '',
      compteurElectricite: '',
      description: '',
      nombreMaisons: 1
    })
    setMaisonsData({})
    setEditingBien(null)
    setShowForm(false)
  }

  // Gérer le changement du nombre de maisons
  const handleNombreMaisonsChange = (nombre) => {
    const nouveauNombre = parseInt(nombre) || 1
    setFormData({...formData, nombreMaisons: nouveauNombre})
    
    // Générer les champs pour les maisons
    const newMaisonsData = {}
    for (let i = 1; i <= nouveauNombre; i++) {
      newMaisonsData[`compteurEau_${i}`] = maisonsData[`compteurEau_${i}`] || ''
      newMaisonsData[`compteurElectricite_${i}`] = maisonsData[`compteurElectricite_${i}`] || ''
    }
    setMaisonsData(newMaisonsData)
  }

  const handleMaisonDataChange = (key, value) => {
    setMaisonsData({...maisonsData, [key]: value})
  }

  const handleEdit = (bien) => {
    setFormData(bien)
    setEditingBien(bien)
    setShowForm(true)
  }

  const handleDelete = (bien) => {
    const proprietaire = proprietaires.find(p => p.id === bien.proprietaireId)
    const proprietaireNom = proprietaire ? `${proprietaire.prenom} ${proprietaire.nom}` : 'Propriétaire inconnu'
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer ce bien de ${proprietaireNom} ?`)) {
      dataService.deleteBien(bien.id)
      loadData()
    }
  }

  const getProprietaireNom = (proprietaireId) => {
    const proprietaire = proprietaires.find(p => p.id === proprietaireId)
    return proprietaire ? `${proprietaire.prenom} ${proprietaire.nom}` : 'Propriétaire inconnu'
  }

  const getLocatairesCount = (courId) => {
    return dataService.getLocatairesByCour(courId).length
  }

  const getTypeLabel = (type) => {
    const typeObj = typesBien.find(t => t.value === type)
    return typeObj ? typeObj.label : type
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Biens Immobiliers</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">Gérer les cours, maisons et magasins</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
          disabled={proprietaires.length === 0}
        >
          <span className="mr-2">+</span>
          Nouveau Bien
        </button>
      </div>

      {/* Message si pas de propriétaires */}
      {proprietaires.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="text-yellow-600 text-xl mr-3">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Aucun propriétaire enregistré
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Vous devez d'abord enregistrer au moins un propriétaire avant de pouvoir ajouter des biens.
              </p>
              <div className="mt-2">
                <button
                  onClick={() => window.location.href = '/proprietaires'}
                  className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200"
                >
                  Aller aux propriétaires
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
              {editingBien ? 'Modifier' : 'Nouveau'} Bien Immobilier
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Propriétaire *
                </label>
                <select
                  value={formData.proprietaireId}
                  onChange={(e) => setFormData({...formData, proprietaireId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Sélectionner un propriétaire</option>
                  {proprietaires.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.prenom} {p.nom} {p.telephone && `- ${p.telephone}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de bien *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {typesBien.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Section spécifique aux cours communes */}
              {formData.type === 'cour_commune' && (
                <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                  <h4 className="font-medium text-blue-900 mb-3">Configuration de la cour commune</h4>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de maisons dans la cour *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={formData.nombreMaisons}
                      onChange={(e) => handleNombreMaisonsChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Compteurs pour chaque maison */}
                  <div className="space-y-4">
                    <h5 className="font-medium text-gray-700">Compteurs par maison :</h5>
                    {Array.from({length: formData.nombreMaisons}, (_, i) => i + 1).map(numeroMaison => (
                      <div key={numeroMaison} className="border border-gray-200 rounded p-3 bg-white">
                        <h6 className="font-medium text-gray-600 mb-2">Maison n°{numeroMaison}</h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Compteur d'eau
                            </label>
                            <input
                              type="text"
                              value={maisonsData[`compteurEau_${numeroMaison}`] || ''}
                              onChange={(e) => handleMaisonDataChange(`compteurEau_${numeroMaison}`, e.target.value)}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="N° compteur eau"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Compteur d'électricité
                            </label>
                            <input
                              type="text"
                              value={maisonsData[`compteurElectricite_${numeroMaison}`] || ''}
                              onChange={(e) => handleMaisonDataChange(`compteurElectricite_${numeroMaison}`, e.target.value)}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="N° compteur électricité"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de la cour
                  </label>
                  <input
                    type="text"
                    value={formData.nomCour}
                    onChange={(e) => setFormData({...formData, nomCour: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Ex: Cour Palmiers"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numéro de maison
                  </label>
                  <input
                    type="text"
                    value={formData.numeroMaison}
                    onChange={(e) => setFormData({...formData, numeroMaison: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Ex: Maison 1, A, B..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quartier *
                  </label>
                  <input
                    type="text"
                    value={formData.quartier}
                    onChange={(e) => setFormData({...formData, quartier: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ville *
                  </label>
                  <input
                    type="text"
                    value={formData.ville}
                    onChange={(e) => setFormData({...formData, ville: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              {/* Compteurs pour cours unique et magasin seulement */}
              {formData.type !== 'cour_commune' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Numéro compteur d'eau
                    </label>
                    <input
                      type="text"
                      value={formData.compteurEau}
                      onChange={(e) => setFormData({...formData, compteurEau: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Numéro compteur d'électricité
                    </label>
                    <input
                      type="text"
                      value={formData.compteurElectricite}
                      onChange={(e) => setFormData({...formData, compteurElectricite: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows="3"
                  placeholder="Description du bien, équipements..."
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
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  {editingBien ? 'Modifier' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Liste des biens */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {biens.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-5xl mb-4">🏠</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun bien enregistré</h3>
            <p className="text-gray-600 mb-4">Commencez par enregistrer votre premier bien immobilier</p>
            {proprietaires.length > 0 && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Nouveau Bien
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bien
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Propriétaire
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Localisation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Compteurs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Locataires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {biens.map((bien) => (
                  <React.Fragment key={bien.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 text-lg">
                              {bien.type === 'magasin' ? '🏪' : '🏠'}
                            </span>
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {bien.nomCour || `${getTypeLabel(bien.type)}`}
                            </div>
                            <div className="text-sm text-gray-500">
                              {bien.numeroMaison && `Maison ${bien.numeroMaison} - `}
                              {getTypeLabel(bien.type)}
                            </div>
                            {bien.type === 'cour_commune' && bien.maisons && (
                              <div className="text-xs text-blue-600 mt-1">
                                {bien.maisons.length} maisons - {bien.maisons.filter(m => m.statut === 'libre').length} libre(s)
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getProprietaireNom(bien.proprietaireId)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{bien.quartier}</div>
                      <div className="text-sm text-gray-500">{bien.ville}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {bien.type === 'cour_commune' ? (
                        <div className="text-xs text-gray-600">
                          Voir détails des maisons
                        </div>
                      ) : (
                        <>
                          <div>💧 {bien.compteurEau || '-'}</div>
                          <div>⚡ {bien.compteurElectricite || '-'}</div>
                        </>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {getLocatairesCount(bien.id)} locataire(s)
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(bien)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(bien)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Ligne de détails pour les cours communes */}
                  {bien.type === 'cour_commune' && bien.maisons && (
                    <tr>
                      <td colSpan="6" className="px-6 py-0">
                        <CourDetails bien={bien} onUpdate={loadData} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Biens