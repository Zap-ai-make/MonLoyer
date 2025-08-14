import { useState, useEffect } from 'react'
import dataService from '../services/dataService'

function Proprietaires() {
  const [proprietaires, setProprietaires] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingProprietaire, setEditingProprietaire] = useState(null)
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    adresse: '',
    pieceIdentite: '',
    references: ''
  })

  useEffect(() => {
    loadProprietaires()
  }, [])

  const loadProprietaires = () => {
    setProprietaires(dataService.getProprietaires())
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.nom || !formData.prenom) {
      alert('Nom et prénom sont obligatoires')
      return
    }

    if (editingProprietaire) {
      dataService.updateProprietaire(editingProprietaire.id, formData)
    } else {
      dataService.addProprietaire(formData)
    }

    resetForm()
    loadProprietaires()
  }

  const resetForm = () => {
    setFormData({
      nom: '',
      prenom: '',
      telephone: '',
      adresse: '',
      pieceIdentite: '',
      references: ''
    })
    setEditingProprietaire(null)
    setShowForm(false)
  }

  const handleEdit = (proprietaire) => {
    setFormData(proprietaire)
    setEditingProprietaire(proprietaire)
    setShowForm(true)
  }

  const handleDelete = (proprietaire) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${proprietaire.prenom} ${proprietaire.nom} ?`)) {
      dataService.deleteProprietaire(proprietaire.id)
      loadProprietaires()
    }
  }

  const getBiensCount = (proprietaireId) => {
    return dataService.getBiensByProprietaire(proprietaireId).length
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Propriétaires</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">Gérer les propriétaires de biens immobiliers</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
        >
          <span className="mr-2">+</span>
          Nouveau Propriétaire
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-full overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingProprietaire ? 'Modifier' : 'Nouveau'} Propriétaire
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="CNI, Passeport..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  value={formData.adresse}
                  onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Références (personnes à contacter)
                </label>
                <textarea
                  value={formData.references}
                  onChange={(e) => setFormData({...formData, references: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Noms et contacts des références..."
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingProprietaire ? 'Modifier' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Liste des propriétaires */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {proprietaires.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-5xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun propriétaire</h3>
            <p className="text-gray-600 mb-4">Commencez par enregistrer votre premier propriétaire</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Nouveau Propriétaire
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Propriétaire
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Biens
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {proprietaires.map((proprietaire) => (
                  <tr key={proprietaire.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {proprietaire.prenom?.[0]}{proprietaire.nom?.[0]}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {proprietaire.prenom} {proprietaire.nom}
                          </div>
                          {proprietaire.pieceIdentite && (
                            <div className="text-sm text-gray-500">
                              {proprietaire.pieceIdentite}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{proprietaire.telephone || '-'}</div>
                      <div className="text-sm text-gray-500">{proprietaire.adresse || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getBiensCount(proprietaire.id)} bien(s)
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(proprietaire)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(proprietaire)}
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

export default Proprietaires