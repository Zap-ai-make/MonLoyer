import { useState, useRef, useEffect } from 'react'
import { Upload, FileText, Sparkles, Loader2, Download, Trash2 } from 'lucide-react'
import documentService from '../services/documentService'
import dataService from '../services/dataService'
import { useNotification } from '../contexts/NotificationContext'
import { COLORS } from '../constants/colors'

function DocumentUpload({
  type, // 'mandat', 'titre_propriete', 'contrat_bail'
  ownerType, // 'proprietaire', 'locataire', 'bien'
  ownerId,
  formData,
  additionalData = null,
  onDocumentAdded,
  canGenerate = true, // Si false, seul l'upload est autorisé
  existingDocument = null // Document déjà uploadé/généré
}) {
  const notification = useNotification()
  const fileInputRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [document, setDocument] = useState(existingDocument)
  const [ownerName, setOwnerName] = useState('Non spécifié')

  const typeLabels = {
    mandat: 'Mandat de gestion',
    titre_propriete: 'Titre de propriété',
    contrat_bail: 'Contrat de bail'
  }

  // Récupérer le nom du propriétaire ou du bien
  useEffect(() => {
    if (ownerType === 'bien' && ownerId && ownerId !== 'temp') {
      const bien = dataService.getBiens().find(b => b.id === ownerId)
      if (bien) {
        const proprietaire = dataService.getProprietaires().find(p => p.id === bien.proprietaireId)
        if (proprietaire) {
          setOwnerName(`${proprietaire.nom} ${proprietaire.prenom}`)
        }
      }
    } else if (ownerType === 'proprietaire' && formData) {
      setOwnerName(`${formData.nom || ''} ${formData.prenom || ''}`.trim() || 'Non spécifié')
    } else if (ownerType === 'locataire' && formData) {
      setOwnerName(`${formData.nom || ''} ${formData.prenom || ''}`.trim() || 'Non spécifié')
    }
  }, [ownerType, ownerId, formData])

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Vérifier la taille du fichier (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      notification.error('Le fichier est trop volumineux (max 2MB)')
      return
    }

    // Vérifier le type de fichier
    if (file.type !== 'application/pdf') {
      notification.error('Seuls les fichiers PDF sont acceptés')
      return
    }

    setLoading(true)
    try {
      // Si l'ID n'existe pas encore (temp), on stocke temporairement en base64
      if (!ownerId || ownerId === 'temp') {
        const reader = new FileReader()
        reader.onloadend = () => {
          const tempDoc = {
            id: 'temp_' + Date.now(),
            filename: file.name,
            type: type,
            file: file,
            dataUrl: reader.result,
            generated: false,
            created_at: new Date().toISOString()
          }
          setDocument(tempDoc)
          notification.success('Document prêt à être uploadé')
          onDocumentAdded && onDocumentAdded(tempDoc)
        }
        reader.readAsDataURL(file)
      } else {
        // Si l'ID existe, on upload directement
        const uploadedDoc = await documentService.uploadPdfFile(file, ownerType, ownerId, type)
        setDocument(uploadedDoc)
        notification.success('Document uploadé avec succès')
        onDocumentAdded && onDocumentAdded(uploadedDoc)
      }
    } catch (error) {
      notification.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!formData) {
      notification.error('Les données du formulaire sont requises')
      return
    }

    // Vérifier que l'entité a été sauvegardée (ID réel)
    if (!ownerId || ownerId === 'temp') {
      notification.error('Veuillez d\'abord enregistrer le formulaire avant de générer des documents')
      return
    }

    // Vérifier les champs obligatoires selon le type
    if (type === 'mandat' && (!formData.nom || !formData.prenom)) {
      notification.error('Nom et prénom sont requis pour générer le mandat')
      return
    }

    if (type === 'contrat_bail' && (!formData.nom || !formData.prenom || !formData.montantLoyer)) {
      notification.error('Nom, prénom et montant du loyer sont requis pour générer le contrat')
      return
    }

    setLoading(true)
    try {
      const generatedDoc = await documentService.generateAndSaveDocument(
        type,
        ownerType,
        ownerId,
        formData,
        additionalData
      )
      setDocument(generatedDoc)
      notification.success('Document généré avec succès')
      onDocumentAdded && onDocumentAdded(generatedDoc)
    } catch (error) {
      notification.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (document) {
      documentService.downloadDocument(document.id)
    }
  }

  const handleDelete = () => {
    if (document && window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      documentService.deleteDocument(document.id)
      setDocument(null)
      notification.success('Document supprimé')
      onDocumentAdded && onDocumentAdded(null)
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {typeLabels[type] || 'Document'}
      </label>

      {document ? (
        // Afficher le document existant
        <div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-2 rounded-lg"
          style={{ borderColor: COLORS.primary.DEFAULT, backgroundColor: 'rgba(74, 85, 104, 0.05)' }}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <FileText className="w-8 h-8 flex-shrink-0" style={{ color: COLORS.primary.DEFAULT }} />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm text-gray-900 truncate">{ownerName}</p>
              <p className="text-xs text-gray-500">
                {document.generated ? (
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Généré automatiquement
                  </span>
                ) : (
                  'Uploadé manuellement'
                )}
                {' • '}
                {new Date(document.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={handleDownload}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Télécharger"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="p-2 rounded-lg hover:bg-red-50 transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-5 h-5 text-red-600" />
            </button>
          </div>
        </div>
      ) : (
        // Afficher les boutons d'action
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Bouton Upload */}
            <button
              type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderColor: COLORS.primary.DEFAULT }}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: COLORS.primary.DEFAULT }} />
            ) : (
              <>
                <Upload className="w-5 h-5" style={{ color: COLORS.primary.DEFAULT }} />
                <span className="font-medium text-sm" style={{ color: COLORS.primary.DEFAULT }}>
                  Uploader PDF
                </span>
              </>
            )}
          </button>

          {/* Bouton Générer */}
          {canGenerate && type !== 'titre_propriete' && (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: COLORS.secondary.DEFAULT,
                color: '#FFFFFF'
              }}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span className="font-medium text-sm">Générer</span>
                </>
              )}
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          </div>

          <p className="text-xs text-gray-500">
            {canGenerate && type !== 'titre_propriete'
              ? 'Uploadez un PDF existant ou générez automatiquement le document'
              : 'Seuls les fichiers PDF sont acceptés'
            }
            {' • '}
            <span className="text-orange-600 font-medium">Taille max: 2MB</span>
          </p>
        </div>
      )}
    </div>
  )
}

export default DocumentUpload
