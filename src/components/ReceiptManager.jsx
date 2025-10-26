import { useState, useEffect } from 'react'
import { Upload, Download, FileText, Check, AlertCircle, Loader } from 'lucide-react'
import paiementReceiptService from '../services/paiementReceiptService'
import Tooltip from './Tooltip'

function ReceiptManager({ paiement, locataire, bien, onReceiptSaved }) {
  const [receiptURL, setReceiptURL] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  // Charger l'URL du reçu au montage
  useEffect(() => {
    loadReceiptURL()
  }, [paiement.id])

  const loadReceiptURL = async () => {
    try {
      const url = await paiementReceiptService.getReceiptURL(paiement.id)
      setReceiptURL(url)
    } catch (err) {
      setError('Erreur chargement reçu')
    }
  }

  const handleGenerateAndSave = async () => {
    setLoading(true)
    setError(null)

    try {
      const url = await paiementReceiptService.generateAndSaveReceipt(paiement, locataire, bien)
      setReceiptURL(url)

      if (onReceiptSaved) {
        onReceiptSaved(paiement.id, url)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUploadManual = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const url = await paiementReceiptService.uploadManualReceipt(paiement.id, file)

      setReceiptURL(url)

      if (onReceiptSaved) {
        onReceiptSaved(paiement.id, url)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  if (receiptURL) {
    return (
      <div className="flex items-center gap-2">
        <Tooltip content="Télécharger le reçu">
          <a
            href={receiptURL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Reçu
          </a>
        </Tooltip>

        <Tooltip content="Remplacer le reçu">
          <label className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors cursor-pointer">
            <Upload className="w-3 h-3" />
            {uploading ? <Loader className="w-3 h-3 animate-spin" /> : 'Remplacer'}
            <input
              type="file"
              accept="application/pdf"
              onChange={handleUploadManual}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </Tooltip>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Tooltip content="Générer et sauvegarder le reçu">
        <button
          onClick={handleGenerateAndSave}
          disabled={loading}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader className="w-3 h-3 animate-spin" />
              Génération...
            </>
          ) : (
            <>
              <FileText className="w-3 h-3" />
              Générer
            </>
          )}
        </button>
      </Tooltip>

      <Tooltip content="Uploader un reçu scanné">
        <label className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors cursor-pointer">
          {uploading ? (
            <>
              <Loader className="w-3 h-3 animate-spin" />
              Upload...
            </>
          ) : (
            <>
              <Upload className="w-3 h-3" />
              Upload
            </>
          )}
          <input
            type="file"
            accept="application/pdf"
            onChange={handleUploadManual}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </Tooltip>

      {error && (
        <Tooltip content={error}>
          <AlertCircle className="w-4 h-4 text-red-500" />
        </Tooltip>
      )}
    </div>
  )
}

export default ReceiptManager
