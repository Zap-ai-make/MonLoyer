import { useState, useEffect } from 'react'
import dataService from '../services/dataService'

function Locataires() {
  const [locataires, setLocataires] = useState([])
  const [biens, setBiens] = useState([])
  const [proprietaires, setProprietaires] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingLocataire, setEditingLocataire] = useState(null)
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    adresse: '',
    pieceIdentite: '',
    bienId: '',
    garant: '',
    references: '',
    dateEntree: '',
    montantLoyer: '',
    statut: 'actif'
  })

  const statutOptions = [
    { value: 'actif', label: 'Actif' },
    { value: 'inactif', label: 'Inactif' },
    { value: 'suspendu', label: 'Suspendu' }
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setLocataires(dataService.getLocataires())
    setBiens(dataService.getBiens())
    setProprietaires(dataService.getProprietaires())
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.nom || !formData.prenom || !formData.bienId) {
      alert('Nom, prénom et bien sont obligatoires')
      return
    }

    if (editingLocataire) {
      dataService.updateLocataire(editingLocataire.id, formData)
    } else {
      dataService.addLocataire(formData)
    }

    resetForm()
    loadData()
  }

  const resetForm = () => {
    setFormData({
      nom: '',
      prenom: '',
      telephone: '',
      adresse: '',
      pieceIdentite: '',
      bienId: '',
      garant: '',
      references: '',
      dateEntree: '',
      montantLoyer: '',
      statut: 'actif'
    })
    setEditingLocataire(null)
    setShowForm(false)
  }

  const handleEdit = (locataire) => {
    setFormData({
      ...locataire,
      dateEntree: locataire.dateEntree ? locataire.dateEntree.split('T')[0] : ''
    })
    setEditingLocataire(locataire)
    setShowForm(true)
  }

  const handleDelete = (locataire) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${locataire.prenom} ${locataire.nom} ?`)) {
      dataService.deleteLocataire(locataire.id)
      loadData()
    }
  }

  const getBienInfo = (bienId) => {
    const bien = biens.find(b => b.id === bienId)
    if (!bien) return 'Bien inconnu'
    
    let info = bien.nomCour || `${bien.quartier} ${bien.ville}`
    if (bien.numeroMaison) {
      info += ` - Maison ${bien.numeroMaison}`
    }
    return info
  }

  const getProprietaireInfo = (bienId) => {
    const bien = biens.find(b => b.id === bienId)
    if (!bien) return 'Propriétaire inconnu'
    
    const proprietaire = proprietaires.find(p => p.id === bien.proprietaireId)
    return proprietaire ? `${proprietaire.prenom} ${proprietaire.nom}` : 'Propriétaire inconnu'
  }

  const getStatutBadge = (statut) => {
    const colors = {
      'actif': 'bg-green-100 text-green-800',
      'inactif': 'bg-gray-100 text-gray-800',
      'suspendu': 'bg-red-100 text-red-800'
    }
    return colors[statut] || colors.inactif
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Locataires</h1>
          <p className="text-gray-600">Gérer les locataires et leurs locations</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center"
          disabled={biens.length === 0}
        >
          <span className="mr-2">+</span>
          Nouveau Locataire
        </button>
      </div>

      {/* Message si pas de biens */}
      {biens.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="text-yellow-600 text-xl mr-3">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Aucun bien disponible
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Vous devez d'abord enregistrer des biens immobiliers avant de pouvoir ajouter des locataires.
              </p>
              <div className="mt-2">
                <button
                  onClick={() => window.location.href = '/biens'}
                  className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200"
                >
                  Aller aux biens
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingLocataire ? 'Modifier' : 'Nouveau'} Locataire
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Informations personnelles */}
              <div className="border-b pb-4">
                <h4 className="font-medium text-gray-900 mb-3">Informations personnelles</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                      Pièce d'identité
                    </label>
                    <input
                      type="text"
                      value={formData.pieceIdentite}
                      onChange={(e) => setFormData({...formData, pieceIdentite: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="CNI, Passeport..."
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={formData.adresse}
                    onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Informations de location */}
              <div className="border-b pb-4">
                <h4 className="font-medium text-gray-900 mb-3">Informations de location</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bien loué *
                  </label>
                  <select
                    value={formData.bienId}
                    onChange={(e) => setFormData({...formData, bienId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Sélectionner un bien</option>
                    {biens.map(bien => (
                      <option key={bien.id} value={bien.id}>
                        {getBienInfo(bien.id)} - {getProprietaireInfo(bien.id)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date d'entrée
                    </label>
                    <input
                      type="date"
                      value={formData.dateEntree}
                      onChange={(e) => setFormData({...formData, dateEntree: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Montant du loyer (FCFA)
                    </label>
                    <input
                      type="number"
                      value={formData.montantLoyer}
                      onChange={(e) => setFormData({...formData, montantLoyer: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Ex: 50000"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <select
                    value={formData.statut}
                    onChange={(e) => setFormData({...formData, statut: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {statutOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Références */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Références et garanties</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Garant
                  </label>
                  <input
                    type="text"
                    value={formData.garant}
                    onChange={(e) => setFormData({...formData, garant: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Nom du garant et contact"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Références
                  </label>
                  <textarea
                    value={formData.references}
                    onChange={(e) => setFormData({...formData, references: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows="3"
                    placeholder="Autres références ou informations importantes..."
                  />
                </div>
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
        {locataires.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-5xl mb-4">👤</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun locataire enregistré</h3>
            <p className="text-gray-600 mb-4">Commencez par enregistrer votre premier locataire</p>
            {biens.length > 0 && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
              >
                Nouveau Locataire
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
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bien loué
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loyer
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
                {locataires.map((locataire) => (
                  <tr key={locataire.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 font-medium">
                            {locataire.prenom?.[0]}{locataire.nom?.[0]}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {locataire.prenom} {locataire.nom}
                          </div>
                          {locataire.pieceIdentite && (
                            <div className="text-sm text-gray-500">
                              {locataire.pieceIdentite}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{locataire.telephone || '-'}</div>
                      <div className="text-sm text-gray-500">{locataire.adresse || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getBienInfo(locataire.bienId)}</div>
                      <div className="text-sm text-gray-500">{getProprietaireInfo(locataire.bienId)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {locataire.montantLoyer ? `${parseInt(locataire.montantLoyer).toLocaleString()} FCFA` : '-'}
                      </div>
                      {locataire.dateEntree && (
                        <div className="text-sm text-gray-500">
                          Depuis le {new Date(locataire.dateEntree).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatutBadge(locataire.statut)}`}>
                        {locataire.statut || 'actif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(locataire)}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(locataire)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Locataires