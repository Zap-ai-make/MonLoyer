import { useState, useEffect } from 'react'
import dataService from '../services/dataService'

function BienForm({ onClose, onSuccess }) {
  const [proprietaires, setProprietaires] = useState([])
  const [formData, setFormData] = useState({
    proprietaireId: '',
    type: 'appartement',
    adresse: '',
    quartier: '',
    nombreChambres: '',
    description: '',
    montantLoyer: '',
    nombreMaisons: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setProprietaires(dataService.getProprietaires())
  }, [])

  const handleChange = (e) => {
    const value = e.target.value
    setFormData({
      ...formData,
      [e.target.name]: value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.proprietaireId || !formData.adresse || !formData.montantLoyer) {
      alert('Propriétaire, adresse et montant du loyer sont obligatoires')
      return
    }

    setLoading(true)
    try {
      await dataService.addBien(formData)
      onSuccess && onSuccess()
      onClose()
    } catch {
      alert('Erreur lors de l\'enregistrement')
    } finally {
      setLoading(false)
    }
  }

  const renderMaisonsFields = () => {
    if (formData.type !== 'cour_commune') return null
    
    const nombreMaisons = parseInt(formData.nombreMaisons) || 0
    if (nombreMaisons === 0) return null

    const maisons = []
    for (let i = 1; i <= nombreMaisons; i++) {
      maisons.push(
        <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
          <h4 className="col-span-full text-sm font-medium text-gray-700">Maison {i}</h4>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Compteur Eau
            </label>
            <input
              type="text"
              name={`compteurEau_${i}`}
              value={formData[`compteurEau_${i}`] || ''}
              onChange={handleChange}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              placeholder={`N° compteur eau maison ${i}`}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Compteur Électricité
            </label>
            <input
              type="text"
              name={`compteurElectricite_${i}`}
              value={formData[`compteurElectricite_${i}`] || ''}
              onChange={handleChange}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              placeholder={`N° compteur électricité maison ${i}`}
            />
          </div>
        </div>
      )
    }
    return maisons
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Propriétaire *
        </label>
        <select
          name="proprietaireId"
          required
          value={formData.proprietaireId}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Sélectionner un propriétaire</option>
          {proprietaires.map(proprietaire => (
            <option key={proprietaire.id} value={proprietaire.id}>
              {proprietaire.nom} {proprietaire.prenom}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de bien *
          </label>
          <select
            name="type"
            required
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="appartement">Appartement</option>
            <option value="maison">Maison</option>
            <option value="studio">Studio</option>
            <option value="cour_commune">Cour commune</option>
            <option value="commerce">Commerce</option>
          </select>
        </div>

        {formData.type === 'cour_commune' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de maisons *
            </label>
            <input
              type="number"
              name="nombreMaisons"
              min="1"
              max="20"
              required
              value={formData.nombreMaisons}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: 4"
            />
          </div>
        )}

        {formData.type !== 'cour_commune' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de chambres
            </label>
            <input
              type="number"
              name="nombreChambres"
              min="0"
              value={formData.nombreChambres}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: 2"
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Adresse *
        </label>
        <input
          type="text"
          name="adresse"
          required
          value={formData.adresse}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Adresse complète du bien"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Quartier
        </label>
        <input
          type="text"
          name="quartier"
          value={formData.quartier}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Nom du quartier"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Montant du loyer (FCFA) *
        </label>
        <input
          type="number"
          name="montantLoyer"
          required
          min="0"
          value={formData.montantLoyer}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Ex: 50000"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          name="description"
          rows="3"
          value={formData.description}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Description du bien (optionnel)"
        />
      </div>

      {/* Champs pour les maisons de la cour commune */}
      {formData.type === 'cour_commune' && formData.nombreMaisons && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Configuration des maisons</h3>
          {renderMaisonsFields()}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}

export default BienForm