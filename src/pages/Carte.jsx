import { useState, useEffect } from 'react'
import { GoogleMap, useLoadScript } from '@react-google-maps/api'
import dataService from '../services/dataService'
import BienDrawer from '../components/BienDrawer'
import LoadingSpinner from '../components/LoadingSpinner'
import { isOccupe } from '../utils/bienUtils'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

// Centre par défaut sur Ouagadougou, Burkina Faso
const DEFAULT_CENTER = { lat: 12.3714, lng: -1.5197 }
const DEFAULT_ZOOM = 13

function Carte() {
  // Charger l'API Google Maps avec version stable
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    version: "3.55" // Version stable testée
  })

  // States
  const [biens, setBiens] = useState([])
  const [selectedBien, setSelectedBien] = useState(null)
  const [mapType, setMapType] = useState('hybrid')
  const [map, setMap] = useState(null)
  const [center, setCenter] = useState(DEFAULT_CENTER)

  // Charger les biens au montage du composant
  useEffect(() => {
    loadBiens()
  }, [])

  // Références pour les marqueurs natifs
  const [markers, setMarkers] = useState([])

  // Créer les marqueurs natifs quand la carte et les biens sont prêts
  useEffect(() => {
    if (!map || !window.google || biens.length === 0) return

    // Nettoyer les anciens marqueurs
    markers.forEach(marker => marker.setMap(null))

    // Créer les nouveaux marqueurs avec l'API native
    const newMarkers = biens.map((bien) => {
      const lat = parseFloat(bien.latitude)
      const lng = parseFloat(bien.longitude)
      const occupied = isOccupe(bien)

      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: map,
        title: `${bien.adresse || bien.nomCour || 'Bien'} - ${occupied ? 'Occupé' : 'Libre'}`,
        animation: window.google.maps.Animation.DROP,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: occupied ? '#10B981' : '#EF4444',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2
        }
      })

      marker.addListener('click', () => {
        setSelectedBien(bien)
      })

      return marker
    })

    setMarkers(newMarkers)

    // Ajuster la vue pour voir tous les biens
    fitBounds()

    // Cleanup function
    return () => {
      newMarkers.forEach(marker => marker.setMap(null))
    }
  }, [map, biens])

  const loadBiens = () => {
    const data = dataService.getBiens()
    const biensAvecCoords = filterBiensWithValidCoords(data)
    setBiens(biensAvecCoords)

    // Centrer sur le premier bien si disponible
    if (biensAvecCoords.length > 0) {
      const firstBien = biensAvecCoords[0]
      setCenter({
        lat: parseFloat(firstBien.latitude),
        lng: parseFloat(firstBien.longitude)
      })
    }
  }

  const filterBiensWithValidCoords = (biens) => {
    return biens.filter(bien => {
      const lat = parseFloat(bien.latitude)
      const lng = parseFloat(bien.longitude)
      const isValid = !isNaN(lat) && !isNaN(lng) &&
                      lat >= -90 && lat <= 90 &&
                      lng >= -180 && lng <= 180

      if (!isValid && (bien.latitude || bien.longitude)) {
        console.warn(`⚠️ Coordonnées invalides pour ${bien.adresse}:`, {lat, lng})
      }

      return isValid
    })
  }

  const fitBounds = () => {
    if (!map || biens.length === 0) return

    const bounds = new window.google.maps.LatLngBounds()
    biens.forEach(bien => {
      bounds.extend({
        lat: parseFloat(bien.latitude),
        lng: parseFloat(bien.longitude)
      })
    })

    map.fitBounds(bounds)

    // Si un seul bien, ajuster le zoom pour ne pas être trop proche
    if (biens.length === 1) {
      setTimeout(() => map.setZoom(15), 100)
    }
  }

  const handleBienUpdate = (updatedBien) => {
    if (updatedBien) {
      loadBiens()
      setSelectedBien(updatedBien)
    } else {
      setSelectedBien(null)
      loadBiens()
    }
  }

  // Gestion des erreurs de chargement
  if (loadError) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">🗺️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Impossible de charger la carte
          </h2>
          <p className="text-gray-600 mb-6">
            Erreur de chargement de Google Maps. Vérifiez votre connexion Internet.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            🔄 Réessayer
          </button>
        </div>
      </div>
    )
  }

  // Chargement en cours
  if (!isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="text-gray-600 mt-4">Chargement de la carte...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-md p-4 z-20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Carte des Biens</h1>
            <p className="text-sm text-gray-600 mt-1">
              {biens.length} bien{biens.length > 1 ? 's' : ''} géolocalisé{biens.length > 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {/* Sélecteur de type de carte */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setMapType('roadmap')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  mapType === 'roadmap'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Carte
              </button>
              <button
                onClick={() => setMapType('satellite')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  mapType === 'satellite'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Satellite
              </button>
              <button
                onClick={() => setMapType('hybrid')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  mapType === 'hybrid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Hybride
              </button>
            </div>

            {/* Bouton pour voir tous les biens */}
            {biens.length > 1 && (
              <button
                onClick={fitBounds}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                title="Ajuster la vue pour voir tous les biens"
              >
                📍 Voir tout
              </button>
            )}

            {/* Légende */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-gray-700">Libre</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-700">Occupé</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Carte Google Maps */}
      <div className="flex-1 relative">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={center}
          zoom={DEFAULT_ZOOM}
          mapTypeId={mapType}
          onLoad={(mapInstance) => {
            console.log('🗺️ Carte chargée avec succès')
            setMap(mapInstance)
          }}
          options={{
            zoomControl: true,
            streetViewControl: true,
            mapTypeControl: false,
            fullscreenControl: true,
            draggable: true,
            scrollwheel: true,
            disableDoubleClickZoom: false,
            gestureHandling: 'greedy',
            clickableIcons: true,
            zoomControlOptions: {
              position: 9 // RIGHT_TOP
            }
          }}
        >
          {/* Les marqueurs sont maintenant créés via l'API native Google Maps (voir useEffect ci-dessus) */}
        </GoogleMap>

        {/* Message si aucun bien géolocalisé */}
        {biens.length === 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-8 text-center z-20 max-w-md">
            <div className="text-gray-400 text-5xl mb-4">🗺️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun bien géolocalisé
            </h3>
            <p className="text-gray-600 text-sm">
              Ajoutez des coordonnées GPS (latitude/longitude) à vos biens pour les voir apparaître sur la carte.
            </p>
          </div>
        )}
      </div>

      {/* Drawer pour les détails du bien */}
      {selectedBien && (
        <BienDrawer
          bien={selectedBien}
          onClose={() => setSelectedBien(null)}
          onUpdate={handleBienUpdate}
        />
      )}
    </div>
  )
}

export default Carte
