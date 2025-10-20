import { useState, useEffect } from 'react'
import dataService from '../services/dataService'
import { useData } from '../contexts/DataContext'
import { useForm } from '../hooks/useForm'
import { sanitizeObject, SANITIZATION_RULES } from '../utils/sanitizer'

function PaiementForm({ onClose, onSuccess }) {
  const { refreshEntity } = useData()
  const [locataires, setLocataires] = useState([])
  const { formData, handleChange: baseHandleChange, updateFields } = useForm({
    locataireId: '',
    courId: '',
    mois: '',
    annee: '',
    montantPaye: '',
    datePaiement: '',
    methodePaiement: 'especes',
    notes: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()

    setLocataires(dataService.getLocataires().filter(l => l.statut === 'actif'))
    updateFields({
      mois: currentMonth.toString(),
      annee: currentYear.toString(),
      datePaiement: currentDate.toISOString().split('T')[0]
    })
  }, [updateFields])

  const moisNoms = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]

  const handleChange = (e) => {
    const { name, value } = e.target

    // Appeler le handleChange de base du hook
    baseHandleChange(e)

    // Auto-remplir le montant et le courId si un locataire est sélectionné
    if (name === 'locataireId') {
      const locataire = locataires.find(l => l.id === value)
      if (locataire) {
        updateFields({
          montantPaye: locataire.montantLoyer || '',
          courId: locataire.courId || ''
        })
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.locataireId || !formData.montantPaye || !formData.mois || !formData.annee) {
      alert('Locataire, montant, mois et année sont obligatoires')
      return
    }

    setLoading(true)
    try {
      // Récupérer le locataire pour le montantLoyer et courId
      const locataire = locataires.find(l => l.id === formData.locataireId)

      if (!locataire) {
        alert('Locataire introuvable')
        setLoading(false)
        return
      }

      const paiementData = {
        ...formData,
        courId: formData.courId || locataire.courId,
        montantLoyer: locataire?.montantLoyer || formData.montantPaye,
        montantPaye: parseFloat(formData.montantPaye),
        mois: parseInt(formData.mois),
        annee: parseInt(formData.annee)
      }

      // Sanitizer les données avant envoi
      const sanitizedData = sanitizeObject(paiementData, SANITIZATION_RULES.paiement)

      await dataService.addPaiement(sanitizedData)

      // Invalider le cache et rafraîchir
      dataService.invalidateCache('paiements')
      refreshEntity('paiements')

      onSuccess && onSuccess()
      onClose()
    } catch (error) {
      alert(`Erreur lors de l'enregistrement: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getLocataireInfo = (locataireId) => {
    const locataire = locataires.find(l => l.id === locataireId)
    if (!locataire) return ''
    
    const bien = dataService.getBiens().find(b => b.id === locataire.courId)
    if (!bien) return `${locataire.nom} ${locataire.prenom}`
    
    if (bien.type === 'cour_commune' && locataire.numeroMaison) {
      return `${locataire.nom} ${locataire.prenom} - ${bien.adresse} (Maison ${locataire.numeroMaison})`
    }
    
    return `${locataire.nom} ${locataire.prenom} - ${bien.adresse}`
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Locataire *
        </label>
        <select
          name="locataireId"
          required
          value={formData.locataireId}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Sélectionner un locataire</option>
          {locataires.map(locataire => (
            <option key={locataire.id} value={locataire.id}>
              {getLocataireInfo(locataire.id)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mois *
          </label>
          <select
            name="mois"
            required
            value={formData.mois}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {moisNoms.map((mois, index) => (
              <option key={index} value={(index + 1).toString()}>
                {mois}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Année *
          </label>
          <select
            name="annee"
            required
            value={formData.annee}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {[2024, 2025, 2026].map(annee => (
              <option key={annee} value={annee.toString()}>
                {annee}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Montant payé (FCFA) *
          </label>
          <input
            type="number"
            name="montantPaye"
            required
            min="0"
            step="0.01"
            value={formData.montantPaye}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Montant en FCFA"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date de paiement
          </label>
          <input
            type="date"
            name="datePaiement"
            value={formData.datePaiement}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Méthode de paiement
        </label>
        <select
          name="methodePaiement"
          value={formData.methodePaiement}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="especes">Espèces</option>
          <option value="cheque">Chèque</option>
          <option value="virement">Virement</option>
          <option value="mobile_money">Mobile Money</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          name="notes"
          rows="3"
          value={formData.notes}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Notes particulières sur ce paiement"
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

export default PaiementForm