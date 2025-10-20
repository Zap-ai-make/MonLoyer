import { useState } from 'react'
import { extractCoordinatesFromLink, isShortGoogleMapsLink } from '../utils/gpsUtils'
import { useNotification } from '../contexts/NotificationContext'

// Composant pour la section GPS du bien
function BienFormGPS({ formData, setFormData }) {
  const notification = useNotification()
  const [gpsInputMethod, setGpsInputMethod] = useState('manual')
  const [mapsLink, setMapsLink] = useState('')

  const handleExtractCoordinates = (link) => {
    try {
      if (isShortGoogleMapsLink(link)) {
        notification.info('Détection de lien court... Veuillez coller le lien complet après ouverture dans Google Maps')
        return false
      }

      const coords = extractCoordinatesFromLink(link)

      if (coords) {
        setFormData(prev => ({
          ...prev,
          latitude: coords.latitude,
          longitude: coords.longitude
        }))
        notification.success('Coordonnées extraites avec succès!')
        return true
      } else {
        notification.error('Impossible d\'extraire les coordonnées. Ouvrez le lien dans Google Maps, puis copiez l\'URL complète de la barre d\'adresse.')
        return false
      }
    } catch (error) {
      notification.error('Erreur lors de l\'extraction des coordonnées')
      return false
    }
  }

  const handleMapsLinkPaste = (e) => {
    const link = e.target.value
    setMapsLink(link)
    if (link && (link.includes('google.com/maps') || link.includes('goo.gl') || link.includes('maps.app.goo.gl'))) {
      handleExtractCoordinates(link)
    }
  }

  const handleManualChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start gap-2 mb-3">
        <div className="text-blue-600 mt-0.5">📍</div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-blue-900 mb-1">Localisation GPS (optionnel)</h3>
          <p className="text-xs text-blue-700">
            Collez un lien Google Maps ou entrez les coordonnées manuellement
          </p>
        </div>
      </div>

      {/* Toggle entre méthodes */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setGpsInputMethod('link')}
          className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
            gpsInputMethod === 'link'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          🔗 Lien Google Maps
        </button>
        <button
          type="button"
          onClick={() => setGpsInputMethod('manual')}
          className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
            gpsInputMethod === 'manual'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          ✍️ Manuel
        </button>
      </div>

      {gpsInputMethod === 'link' ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lien de localisation Google Maps
          </label>
          <input
            type="text"
            value={mapsLink}
            onChange={handleMapsLinkPaste}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Collez le lien Google Maps ici..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Ex: https://maps.google.com/?q=12.3714,-1.5197
          </p>
          {formData.latitude && formData.longitude && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
              ✓ Coordonnées extraites: {formData.latitude}, {formData.longitude}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Latitude
            </label>
            <input
              type="number"
              name="latitude"
              step="any"
              value={formData.latitude}
              onChange={handleManualChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: 12.3714"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Longitude
            </label>
            <input
              type="number"
              name="longitude"
              step="any"
              value={formData.longitude}
              onChange={handleManualChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: -1.5247 (Ouagadougou)"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default BienFormGPS
