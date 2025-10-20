import { useState, useEffect } from 'react'
import dataService from '../services/dataService'
import documentService from '../services/documentService'
import { useNotification } from '../contexts/NotificationContext'
import { useData } from '../contexts/DataContext'
import DocumentUpload from './DocumentUpload'
import logger from '../utils/logger'
import { useForm } from '../hooks/useForm'
import { sanitizeObject, SANITIZATION_RULES } from '../utils/sanitizer'

function LocataireForm({ editingLocataire = null, onClose, onSuccess }) {
  const notification = useNotification()
  const { refreshEntity } = useData()
  const [biens, setBiens] = useState([])
  const [selectedBien, setSelectedBien] = useState(null)
  const [maisonsLibres, setMaisonsLibres] = useState([])
  const { formData, handleChange: baseHandleChange, setFormData, updateFields } = useForm({
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
  const [locataireId, setLocataireId] = useState(null)
  const [contratDoc, setContratDoc] = useState(null)

  useEffect(() => {
    // Charger uniquement les biens disponibles pour un nouveau locataire
    if (!editingLocataire) {
      setBiens(dataService.getBiensDisponibles())
    } else {
      // En mode édition, charger tous les biens
      setBiens(dataService.getBiens())
    }
  }, [editingLocataire])

  useEffect(() => {
    if (editingLocataire) {
      setFormData({
        nom: editingLocataire.nom || '',
        prenom: editingLocataire.prenom || '',
        telephone: editingLocataire.telephone || '',
        adresse: editingLocataire.adresse || '',
        pieceIdentite: editingLocataire.pieceIdentite || '',
        courId: editingLocataire.courId || '',
        numeroMaison: editingLocataire.numeroMaison || '',
        montantLoyer: editingLocataire.montantLoyer || '',
        dateEntree: editingLocataire.dateEntree || '',
        caution: editingLocataire.caution || '',
        observations: editingLocataire.observations || ''
      })
      setLocataireId(editingLocataire.id)

      // Charger les documents existants
      const docs = documentService.getDocumentsByOwner('locataire', editingLocataire.id)
      const contrat = docs.find(d => d.type === 'contrat_bail')
      setContratDoc(contrat || null)

      // Charger le bien et les maisons si nécessaire
      if (editingLocataire.courId) {
        const bien = biens.find(b => b.id === editingLocataire.courId)
        setSelectedBien(bien)

        if (bien?.type === 'cour_commune') {
          const libres = dataService.getMaisonsLibresByCour(editingLocataire.courId)
          // Ajouter la maison actuelle du locataire
          const maisonsActuelles = dataService.getMaisonsByCour(editingLocataire.courId)
          const maisonActuelle = maisonsActuelles.find(m => m.numeroMaison === editingLocataire.numeroMaison)
          if (maisonActuelle && !libres.find(m => m.id === maisonActuelle.id)) {
            libres.push(maisonActuelle)
          }
          setMaisonsLibres(libres)
        }
      }
    }
  }, [editingLocataire, biens])

  const handleChange = (e) => {
    const { name, value } = e.target

    // Appeler le handleChange de base du hook
    baseHandleChange(e)

    if (name === 'courId') {
      const bien = biens.find(b => b.id === value)
      setSelectedBien(bien)

      if (bien?.type === 'cour_commune') {
        const libres = dataService.getMaisonsLibresByCour(value)
        setMaisonsLibres(libres)
        updateFields({
          numeroMaison: '',
          montantLoyer: bien.montantLoyer || ''
        })
      } else {
        setMaisonsLibres([])
        updateFields({
          numeroMaison: '',
          montantLoyer: bien?.montantLoyer || ''
        })
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.nom || !formData.prenom || !formData.courId) {
      notification.error('Nom, prénom et bien sont obligatoires')
      return
    }

    if (selectedBien?.type === 'cour_commune' && !formData.numeroMaison) {
      notification.error('Veuillez sélectionner une maison pour cette cour commune')
      return
    }

    setLoading(true)
    try {
      // Sanitizer les données avant envoi
      const sanitizedData = sanitizeObject(formData, SANITIZATION_RULES.locataire)

      let savedLocataire
      if (editingLocataire) {
        savedLocataire = await dataService.updateLocataire(editingLocataire.id, sanitizedData)
        notification.success('Locataire modifié avec succès')
      } else {
        savedLocataire = await dataService.addLocataire(sanitizedData)
        notification.success('Locataire ajouté')

        // Upload du contrat temporaire OU génération automatique
        if (contratDoc && contratDoc.id.startsWith('temp_')) {
          try {
            await documentService.uploadPdfFile(contratDoc.file, 'locataire', savedLocataire.id, 'contrat_bail')
          } catch (error) {
            logger.error('Erreur upload contrat:', error)
          }
        } else if (!contratDoc) {
          try {
            const bienData = dataService.getBiens().find(b => b.id === savedLocataire.courId)
            await documentService.generateAndSaveDocument(
              'contrat_bail',
              'locataire',
              savedLocataire.id,
              savedLocataire,
              bienData
            )
          } catch (docError) {
            logger.error('Erreur génération contrat:', docError)
          }
        }
      }

      // Invalider le cache et rafraîchir
      dataService.invalidateCache('locataires')
      dataService.invalidateCache('biens') // Rafraîchir aussi les biens car le statut peut changer
      refreshEntity('locataires')
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
            Montant du loyer (FCFA) *
          </label>
          <input
            type="number"
            name="montantLoyer"
            min="0"
            required
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
          Numéro d'identité
        </label>
        <input
          type="text"
          name="pieceIdentite"
          value={formData.pieceIdentite}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Numéro CNIB ou passeport"
        />
      </div>

      {/* Section Contrat de bail */}
      {!editingLocataire && (
        <div className="pt-6 mt-6 border-t-2 border-gray-200 space-y-5">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">Contrat de bail</h3>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-800 mb-3">
              {contratDoc
                ? '✓ Contrat uploadé. Un contrat ne sera pas généré automatiquement.'
                : '⚠️ Si aucun contrat n\'est uploadé, un contrat sera généré automatiquement lors de l\'enregistrement.'}
            </p>

            <DocumentUpload
              type="contrat_bail"
              ownerType="locataire"
              ownerId={locataireId || 'temp'}
              formData={formData}
              canGenerate={false}
              existingDocument={contratDoc}
              onDocumentAdded={(doc) => setContratDoc(doc)}
            />
          </div>
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
          className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-300 transition-colors font-medium shadow-sm hover:shadow-md"
        >
          {loading ? 'Enregistrement...' : editingLocataire ? 'Enregistrer les modifications' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}

export default LocataireForm