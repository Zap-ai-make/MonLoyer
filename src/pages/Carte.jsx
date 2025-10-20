import { useState, useEffect } from 'react'
import { GoogleMap, useLoadScript, Marker, MarkerClusterer } from '@react-google-maps/api'
import dataService from '../services/dataService'
import BienDrawer from '../components/BienDrawer'
import LoadingSpinner from '../components/LoadingSpinner'
import logger from '../utils/logger'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

// Supprimer les avertissements de dépréciation Google Maps dans la console
const originalWarn = logger.warn
logger.warn = (...args) => {
  const message = args[0]?.toString() || ''
  if (message.includes('google.maps.Marker is deprecated') ||
      message.includes('AdvancedMarkerElement')) {
    return
  }
  originalWarn.apply(console, args)
}

function Carte() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    version: "weekly",
  })

  const [biens, setBiens] = useState([])
  const [selectedBien, setSelectedBien] = useState(null)
  const [mapType, setMapType] = useState('hybrid')
  const [map, setMap] = useState(null)

  // Centre par défaut sur Ouagadougou, Burkina Faso
  const [center, setCenter] = useState({ lat: 12.3714, lng: -1.5197 })

  // Fonction pour filtrer les biens avec coordonnées GPS valides
  const filterBiensWithValidCoords = (biens) => {
    return biens.filter(bien => {
      const lat = parseFloat(bien.latitude)
      const lng = parseFloat(bien.longitude)
      return !isNaN(lat) && !isNaN(lng) &&
             lat >= -90 && lat <= 90 &&
             lng >= -180 && lng <= 180
    })
  }

  useEffect(() => {
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
  }, [])

  // Fonction pour ajuster la carte pour afficher tous les biens
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
  }

  const isOccupe = (bien) => {
    // Pour une cour commune, vérifier si au moins une maison est occupée
    if (bien.type === 'cour_commune' && bien.maisons) {
      return bien.maisons.some(maison => maison.statut === 'occupee')
    }

    // Pour un bien simple, vérifier le statut normalisé
    const statutNormalized = bien.statut?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    return statutNormalized === 'occupe' || statutNormalized === 'occupee'
  }

  const getMarkerIcon = (bien) => {
    const occupied = isOccupe(bien)
    const color = occupied ? '#10b981' : '#ef4444' // green-500 : red-500

    // Créer un SVG personnalisé moderne
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
        <path d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 24 16 24s16-15.163 16-24C32 7.163 24.837 0 16 0z"
              fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="16" cy="15" r="6" fill="white" opacity="0.9"/>
        <text x="16" y="19" font-size="12" font-weight="bold" text-anchor="middle" fill="${color}">
          ${occupied ? '✓' : '○'}
        </text>
      </svg>
    `

    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: new window.google.maps.Size(32, 40),
      anchor: new window.google.maps.Point(16, 40)
    }
  }

  const handleBienUpdate = (updatedBien) => {
    if (updatedBien) {
      setBiens(prevBiens =>
        prevBiens.map(b => b.id === updatedBien.id ? updatedBien : b)
      )
    } else {
      // Bien supprimé, recharger
      const data = dataService.getBiens()
      setBiens(filterBiensWithValidCoords(data))
    }
    setSelectedBien(null)
  }

  if (loadError) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">🗺️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Impossible de charger la carte</h2>
          <p className="text-gray-600 mb-6">
            Impossible de charger la carte. Veuillez vérifier votre connexion Internet ou réessayer plus tard.
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

  if (!isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4">
            <LoadingSpinner size="large" />
          </div>
          <p className="text-gray-600">Chargement de la carte...</p>
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
          zoom={13}
          mapTypeId={mapType}
          onLoad={setMap}
          options={{
            // Navigation et contrôles
            zoomControl: true,
            streetViewControl: true,
            mapTypeControl: false,
            fullscreenControl: true,

            // Activer toutes les interactions avec la souris
            draggable: true,
            scrollwheel: true,
            disableDoubleClickZoom: false,

            // Options de navigation
            gestureHandling: 'greedy', // Permet scroll/zoom sans Ctrl

            // Style et UI
            clickableIcons: true,

            // Contrôles de zoom
            zoomControlOptions: {
              position: 9 // RIGHT_TOP
            },

            // Désactiver les avertissements de dépréciation
            mapId: undefined
          }}
        >
          <MarkerClusterer
            options={{
              imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
              gridSize: 60,
              maxZoom: 15
            }}
          >
            {(clusterer) =>
              biens.map((bien) => (
                <Marker
                  key={bien.id}
                  position={{
                    lat: parseFloat(bien.latitude),
                    lng: parseFloat(bien.longitude)
                  }}
                  onClick={() => setSelectedBien(bien)}
                  icon={getMarkerIcon(bien)}
                  title={bien.adresse || bien.nomCour || 'Bien immobilier'}
                  clusterer={clusterer}
                />
              ))
            }
          </MarkerClusterer>
        </GoogleMap>

        {/* Message si aucun bien géolocalisé */}
        {biens.length === 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-8 text-center z-20">
            <div className="text-gray-400 text-5xl mb-4">🗺️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun bien géolocalisé</h3>
            <p className="text-gray-600 text-sm">
              Ajoutez des coordonnées GPS à vos biens pour les voir sur la carte.
            </p>
          </div>
        )}
      </div>

      {/* Modal latéral pour les détails du bien */}
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
