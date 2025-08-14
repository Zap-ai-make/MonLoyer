import { useState, useEffect } from 'react'
import dataService from '../services/dataService'

function LocataireForm({ onClose, onSuccess }) {
  const [biens, setBiens] = useState([])
  const [selectedBien, setSelectedBien] = useState(null)
  const [maisonsLibres, setMaisonsLibres] = useState([])
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    adresse: '',
    pieceIdentite: '',
    courId: '',
    numeroMaison: '',
    montantLoyer: '',
    dateEntree: '',
    caution: '',
    observations: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setBiens(dataService.getBiens())
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })

    if (name === 'courId') {
      const bien = biens.find(b => b.id === value)
      setSelectedBien(bien)
      
      if (bien?.type === 'cour_commune') {
        const libres = dataService.getMaisonsLibresByCour(value)
        setMaisonsLibres(libres)
        setFormData(prev => ({
          ...prev,
          numeroMaison: '',
          montantLoyer: bien.montantLoyer || ''
        }))
      } else {
        setMaisonsLibres([])
        setFormData(prev => ({
          ...prev,
          numeroMaison: '',
          montantLoyer: bien?.montantLoyer || ''
        }))
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.nom || !formData.prenom || !formData.courId) {
      alert('Nom, prénom et bien sont obligatoires')
      return
    }

    if (selectedBien?.type === 'cour_commune' && !formData.numeroMaison) {
      alert('Veuillez sélectionner une maison pour cette cour commune')
      return
    }

    setLoading(true)
    try {
      await dataService.addLocataire(formData)
      onSuccess && onSuccess()
      onClose()
    } catch (error) {
      alert('Erreur lors de l\'enregistrement: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom *
          </label>
          <input
            type="text"
            name="nom"
            required
            value={formData.nom}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nom de famille"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prénom *
          </label>
          <input
            type="text"
            name="prenom"
            required
            value={formData.prenom}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Prénom"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Téléphone
        </label>
        <input
          type="tel"
          name="telephone"
          value={formData.telephone}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Numéro de téléphone"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Bien à louer *
        </label>
        <select
          name="courId"
          required
          value={formData.courId}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Sélectionner un bien</option>
          {biens.map(bien => (
            <option key={bien.id} value={bien.id}>
              {bien.adresse} - {bien.type} ({bien.montantLoyer} FCFA)
            </option>
          ))}
        </select>
      </div>

      {selectedBien?.type === 'cour_commune' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Maison dans la cour *
          </label>
          <select
            name="numeroMaison"
            required
            value={formData.numeroMaison}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Sélectionner une maison</option>
            {maisonsLibres.map(maison => (
              <option key={maison.id} value={maison.numeroMaison}>
                Maison {maison.numeroMaison}
              </option>
            ))}
          </select>
          {maisonsLibres.length === 0 && formData.courId && (
            <p className="text-sm text-red-600 mt-1">Aucune maison disponible dans cette cour</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Montant du loyer (FCFA)
          </label>
          <input
            type="number"
            name="montantLoyer"
            min="0"
            value={formData.montantLoyer}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Montant mensuel"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date d'entrée
          </label>
          <input
            type="date"
            name="dateEntree"
            value={formData.dateEntree}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Caution (FCFA)
        </label>
        <input
          type="number"
          name="caution"
          min="0"
          value={formData.caution}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Montant de la caution"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Adresse personnelle
        </label>
        <textarea
          name="adresse"
          rows="2"
          value={formData.adresse}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Adresse de résidence"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Pièce d'identité
        </label>
        <input
          type="text"
          name="pieceIdentite"
          value={formData.pieceIdentite}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Type et numéro de pièce"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Observations
        </label>
        <textarea
          name="observations"
          rows="2"
          value={formData.observations}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Notes particulières"
        />
      </div>

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

export default LocataireForm