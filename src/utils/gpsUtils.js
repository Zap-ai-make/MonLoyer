/**
 * Utilitaires pour la gestion des coordonnées GPS
 * Extraction depuis liens Google Maps, validation, formatage
 */

/**
 * Extrait les coordonnées GPS depuis un lien Google Maps
 * Supporte plusieurs formats de liens
 *
 * @param {string} link - Lien Google Maps
 * @returns {Object|null} - { latitude, longitude } ou null si échec
 *
 * @example
 * extractCoordinatesFromLink('https://maps.google.com/?q=12.3714,-1.5197')
 * // => { latitude: '12.3714', longitude: '-1.5197' }
 */
export const extractCoordinatesFromLink = (link) => {
  if (!link || typeof link !== 'string') {
    return null
  }

  // Patterns pour différents formats de liens Google Maps
  const patterns = [
    // Format 1: @12.3714,-1.5197 (après @)
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
    // Format 2: !3d12.3714!4d-1.5197
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
    // Format 3: q=12.3714,-1.5197
    /q=(-?\d+\.\d+),(-?\d+\.\d+)/,
    // Format 4: place/@12.3714,-1.5197
    /place\/@(-?\d+\.\d+),(-?\d+\.\d+)/,
    // Format 5: ll=12.3714,-1.5197
    /ll=(-?\d+\.\d+),(-?\d+\.\d+)/
  ]

  for (const pattern of patterns) {
    const match = link.match(pattern)
    if (match) {
      return {
        latitude: match[1],
        longitude: match[2]
      }
    }
  }

  return null
}

/**
 * Vérifie si un lien est un lien Google Maps court (goo.gl)
 * @param {string} link - Lien à vérifier
 * @returns {boolean}
 */
export const isShortGoogleMapsLink = (link) => {
  return link && (
    link.includes('goo.gl') ||
    link.includes('maps.app.goo.gl')
  )
}

/**
 * Vérifie si un lien est un lien Google Maps valide
 * @param {string} link - Lien à vérifier
 * @returns {boolean}
 */
export const isGoogleMapsLink = (link) => {
  return link && (
    link.includes('google.com/maps') ||
    link.includes('maps.google.com') ||
    isShortGoogleMapsLink(link)
  )
}

/**
 * Valide des coordonnées GPS
 * @param {number|string} latitude - Latitude
 * @param {number|string} longitude - Longitude
 * @returns {boolean}
 */
export const validateCoordinates = (latitude, longitude) => {
  const lat = parseFloat(latitude)
  const lng = parseFloat(longitude)

  return !isNaN(lat) &&
         !isNaN(lng) &&
         lat >= -90 &&
         lat <= 90 &&
         lng >= -180 &&
         lng <= 180
}

/**
 * Formate les coordonnées pour affichage
 * @param {number|string} latitude - Latitude
 * @param {number|string} longitude - Longitude
 * @param {number} precision - Nombre de décimales (défaut: 6)
 * @returns {string}
 */
export const formatCoordinates = (latitude, longitude, precision = 6) => {
  const lat = parseFloat(latitude).toFixed(precision)
  const lng = parseFloat(longitude).toFixed(precision)
  return `${lat}, ${lng}`
}

/**
 * Génère un lien Google Maps depuis des coordonnées
 * @param {number|string} latitude - Latitude
 * @param {number|string} longitude - Longitude
 * @returns {string}
 */
export const generateGoogleMapsLink = (latitude, longitude) => {
  return `https://www.google.com/maps?q=${latitude},${longitude}`
}

/**
 * Calcule la distance entre deux points GPS (en km)
 * Utilise la formule de Haversine
 *
 * @param {number} lat1 - Latitude du point 1
 * @param {number} lon1 - Longitude du point 1
 * @param {number} lat2 - Latitude du point 2
 * @param {number} lon2 - Longitude du point 2
 * @returns {number} - Distance en kilomètres
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371 // Rayon de la Terre en km

  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return Math.round(distance * 100) / 100 // Arrondi à 2 décimales
}

/**
 * Convertit des degrés en radians
 */
function toRad(degrees) {
  return degrees * (Math.PI / 180)
}

/**
 * Parse les coordonnées depuis différents formats
 * @param {string} input - Coordonnées sous forme de string
 * @returns {Object|null} - { latitude, longitude } ou null
 *
 * @example
 * parseCoordinates('12.3714, -1.5197')
 * parseCoordinates('12.3714,-1.5197')
 * parseCoordinates('lat: 12.3714, lng: -1.5197')
 */
export const parseCoordinates = (input) => {
  if (!input) return null

  // Nettoyer l'input
  const cleaned = input.replace(/lat:|lng:|latitude:|longitude:/gi, '').trim()

  // Essayer de split par virgule
  const parts = cleaned.split(',').map(p => p.trim())

  if (parts.length === 2) {
    const lat = parseFloat(parts[0])
    const lng = parseFloat(parts[1])

    if (validateCoordinates(lat, lng)) {
      return { latitude: lat, longitude: lng }
    }
  }

  return null
}

/**
 * Obtient la position actuelle de l'utilisateur
 * @returns {Promise<{latitude: number, longitude: number}>}
 */
export const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('La géolocalisation n\'est pas supportée par ce navigateur'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
      },
      (error) => {
        reject(error)
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    )
  })
}
