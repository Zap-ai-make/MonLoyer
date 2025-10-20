import { useState, useEffect } from 'react'
import dataService from '../services/dataService'
import documentService from '../services/documentService'
import { useNotification } from '../contexts/NotificationContext'
import { useData } from '../contexts/DataContext'
import logger from '../utils/logger'
import { useForm } from '../hooks/useForm'
import { sanitizeObject, SANITIZATION_RULES } from '../utils/sanitizer'
import BienFormBasicInfo from './BienFormBasicInfo'
import BienFormGPS from './BienFormGPS'
import BienFormImages from './BienFormImages'
import BienFormMaisons from './BienFormMaisons'
import BienFormDocuments from './BienFormDocuments'

// Formulaire d'ajout/modification de bien avec coordonnées GPS
function BienForm({ editingBien = null, onClose, onSuccess }) {
  const notification = useNotification()
  const { refreshEntity } = useData()
  const [proprietaires, setProprietaires] = useState([])
  const { formData, handleChange, setFormData, updateFields } = useForm({
    proprietaireId: '',
    type: 'cour_unique',
    ville: '',
    quartier: '',
    nombreChambres: '',
    description: '',
    montantLoyer: '',
    nombreMaisons: '',
    latitude: '',
    longitude: '',
    compteurEau: '',
    compteurElectricite: '',
    images: [] // Tableau pour stocker les images
  })
  const [loading, setLoading] = useState(false)
  const [mandatDoc, setMandatDoc] = useState(null)
  const [titreDoc, setTitreDoc] = useState(null)
  const [bienId, setBienId] = useState(null)

  useEffect(() => {
    setProprietaires(dataService.getProprietaires())
  }, [])

  useEffect(() => {
    if (editingBien) {
      const newFormData = {
        proprietaireId: editingBien.proprietaireId || '',
        type: editingBien.type || 'cour_unique',
        ville: editingBien.ville || editingBien.adresse || '',
        quartier: editingBien.quartier || '',
        nombreChambres: editingBien.nombreChambres || '',
        description: editingBien.description || '',
        montantLoyer: editingBien.montantLoyer || '',
        nombreMaisons: editingBien.nombreMaisons || '',
        latitude: editingBien.latitude || '',
        longitude: editingBien.longitude || '',
        compteurEau: editingBien.compteurEau || '',
        compteurElectricite: editingBien.compteurElectricite || '',
      }

      // Charger les compteurs des maisons pour cour commune
      if (editingBien.type === 'cour_commune' && editingBien.maisons) {
        editingBien.maisons.forEach((maison, index) => {
          const maisonNum = index + 1
          newFormData[`compteurEau_${maisonNum}`] = maison.compteurEau || ''
          newFormData[`compteurElectricite_${maisonNum}`] = maison.compteurElectricite || ''
        })
      }

      setFormData(newFormData)
      setBienId(editingBien.id)

      // Charger les documents existants
      const docs = documentService.getDocumentsByOwner('bien', editingBien.id)
      const mandat = docs.find(d => d.type === 'mandat')
      const titre = docs.find(d => d.type === 'titre_propriete')
      setMandatDoc(mandat || null)
      setTitreDoc(titre || null)
    }
  }, [editingBien])

  // handleChange est maintenant fourni par useForm hook

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.proprietaireId || !formData.ville || !formData.montantLoyer) {
      notification.error('Propriétaire, ville et montant du loyer sont obligatoires')
      return
    }

    setLoading(true)
    try {
      // Sanitizer les données avant envoi
      const sanitizedData = sanitizeObject(formData, SANITIZATION_RULES.bien)

      let savedBien
      if (editingBien) {
        savedBien = await dataService.updateBien(editingBien.id, sanitizedData)
        notification.success('Bien modifié avec succès')
      } else {
        savedBien = await dataService.addBien(sanitizedData)
        notification.success('Bien ajouté avec succès')

        // Upload des documents temporaires
        if (mandatDoc && mandatDoc.id.startsWith('temp_')) {
          try {
            await documentService.uploadPdfFile(mandatDoc.file, 'bien', savedBien.id, 'mandat')
          } catch (error) {
            logger.error('Erreur upload mandat:', { error, bienId: savedBien.id })
          }
        }
        if (titreDoc && titreDoc.id.startsWith('temp_')) {
          try {
            await documentService.uploadPdfFile(titreDoc.file, 'bien', savedBien.id, 'titre_propriete')
          } catch (error) {
            logger.error('Erreur upload titre:', { error, bienId: savedBien.id })
          }
        }
      }

      // Invalider le cache et rafraîchir
      dataService.invalidateCache('biens')
      refreshEntity('biens')

      onSuccess && onSuccess()
      onClose()
    } catch (error) {
      notification.error(`Erreur lors de l'enregistrement: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="p-6">
      {/* En-tête du formulaire */}
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">
          {editingBien ? 'Modifier le Bien' : 'Nouveau Bien'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {editingBien ? 'Modifier les informations du bien immobilier' : 'Enregistrer un nouveau bien immobilier'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <BienFormBasicInfo
          formData={formData}
          handleChange={handleChange}
          proprietaires={proprietaires}
        />

        <BienFormGPS
          formData={formData}
          setFormData={setFormData}
        />

        <BienFormImages
          formData={formData}
          setFormData={setFormData}
        />

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

      {/* Compteurs (seulement pour cour_unique et magasin) */}
      {formData.type !== 'cour_commune' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              💧 Compteur Eau
            </label>
            <input
              type="text"
              name="compteurEau"
              value={formData.compteurEau}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="N° compteur eau"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ⚡ Compteur Électricité
            </label>
            <input
              type="text"
              name="compteurElectricite"
              value={formData.compteurElectricite}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="N° compteur électricité"
            />
          </div>
        </div>
      )}

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

      <BienFormMaisons
        formData={formData}
        handleChange={handleChange}
      />

      <BienFormDocuments
        bienId={bienId}
        formData={formData}
        mandatDoc={mandatDoc}
        setMandatDoc={setMandatDoc}
        titreDoc={titreDoc}
        setTitreDoc={setTitreDoc}
      />

        <div className="flex gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300 transition-colors font-medium shadow-sm hover:shadow-md"
          >
            {loading ? 'Enregistrement...' : editingBien ? 'Enregistrer les modifications' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default BienForm