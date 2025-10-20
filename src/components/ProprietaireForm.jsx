import { useState, useEffect } from 'react'
import dataService from '../services/dataService'
import { useNotification } from '../contexts/NotificationContext'
import { useData } from '../contexts/DataContext'
import { useForm } from '../hooks/useForm'
import { sanitizeObject, SANITIZATION_RULES } from '../utils/sanitizer'

function ProprietaireForm({ onClose, onSuccess, editingProprietaire = null }) {
  const notification = useNotification()
  const { refreshEntity } = useData()
  const { formData, handleChange, setFormData } = useForm({
    nom: '',
    prenom: '',
    telephone: '',
    adresse: '',
    pieceIdentite: '',
    references: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editingProprietaire) {
      setFormData({
        nom: editingProprietaire.nom || '',
        prenom: editingProprietaire.prenom || '',
        telephone: editingProprietaire.telephone || '',
        adresse: editingProprietaire.adresse || '',
        pieceIdentite: editingProprietaire.pieceIdentite || '',
        references: editingProprietaire.references || ''
      })
    }
  }, [editingProprietaire, setFormData])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.nom || !formData.prenom) {
      notification.error('Nom et prénom sont obligatoires')
      return
    }

    setLoading(true)
    try {
      // Sanitizer les données avant envoi
      const sanitizedData = sanitizeObject(formData, SANITIZATION_RULES.proprietaire)

      if (editingProprietaire) {
        await dataService.updateProprietaire(editingProprietaire.id, sanitizedData)
        notification.success('Propriétaire modifié avec succès')
      } else {
        await dataService.addProprietaire(sanitizedData)
        notification.success('Propriétaire ajouté avec succès')
      }

      // Invalider le cache et rafraîchir
      dataService.invalidateCache('proprietaires')
      refreshEntity('proprietaires')

      onSuccess && onSuccess()
      onClose()
    } catch (error) {
      notification.error(`Erreur lors de l'enregistrement: ${error.message}`)
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
          Adresse
        </label>
        <textarea
          name="adresse"
          rows="3"
          value={formData.adresse}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Adresse complète"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Numéro d'identité
        </label>
        <input
          type="text"
          name="pieceIdentite"
          value={formData.pieceIdentite}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Numéro de la pièce d'identité"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Références personnelles
        </label>
        <textarea
          name="references"
          rows="2"
          value={formData.references}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Références personnelles ou notes"
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
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors font-medium shadow-sm hover:shadow-md"
        >
          {loading ? 'Enregistrement...' : editingProprietaire ? 'Enregistrer les modifications' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}

export default ProprietaireForm