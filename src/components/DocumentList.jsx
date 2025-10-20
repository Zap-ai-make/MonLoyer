import { useState, useEffect } from 'react'
import { FileText, Download, Trash2, Sparkles, Upload } from 'lucide-react'
import documentService from '../services/documentService'
import { useNotification } from '../contexts/NotificationContext'
import { COLORS } from '../constants/colors'

function DocumentList({ ownerType, ownerId, showTitle = true }) {
  const notification = useNotification()
  const [documents, setDocuments] = useState([])

  useEffect(() => {
    loadDocuments()
  }, [ownerType, ownerId])

  const loadDocuments = () => {
    if (ownerId) {
      const docs = documentService.getDocumentsByOwner(ownerType, ownerId)
      setDocuments(docs)
    }
  }

  const handleDownload = (documentId) => {
    try {
      documentService.downloadDocument(documentId)
    } catch (error) {
      notification.error('Erreur lors du téléchargement')
    }
  }

  const handleDelete = (documentId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      documentService.deleteDocument(documentId)
      notification.success('Document supprimé')
      loadDocuments()
    }
  }

  const getTypeLabel = (type) => {
    const labels = {
      mandat: 'Mandat de gestion',
      titre_propriete: 'Titre de propriété',
      contrat_bail: 'Contrat de bail'
    }
    return labels[type] || type
  }

  if (!ownerId) {
    return null
  }

  return (
    <div className="space-y-4">
      {showTitle && (
        <h3 className="text-lg font-semibold text-gray-900">Documents associés</h3>
      )}

      {documents.length === 0 ? (
        <div className="text-center py-8 px-4 border-2 border-dashed border-gray-300 rounded-lg">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-500 text-sm">Aucun document enregistré</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
              style={{ borderColor: COLORS.border }}
            >
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: 'rgba(74, 85, 104, 0.1)' }}
                >
                  <FileText className="w-6 h-6" style={{ color: COLORS.primary.DEFAULT }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {getTypeLabel(doc.type)}
                    </h4>
                    {doc.generated ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: COLORS.secondary.light,
                          color: COLORS.secondary.DEFAULT
                        }}
                      >
                        <Sparkles className="w-3 h-3" />
                        Généré
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: 'rgba(74, 85, 104, 0.1)',
                          color: COLORS.primary.DEFAULT
                        }}
                      >
                        <Upload className="w-3 h-3" />
                        Uploadé
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 truncate">{doc.filename}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Créé le {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleDownload(doc.id)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Télécharger"
                >
                  <Download className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-5 h-5 text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DocumentList
