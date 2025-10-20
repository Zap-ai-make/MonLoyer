/**
 * Utilitaires pour la gestion des images
 * Compression, validation, redimensionnement
 */

/**
 * Compresse une image en réduisant sa taille et sa qualité
 * @param {File} file - Fichier image à compresser
 * @param {number} maxWidth - Largeur maximale en pixels (défaut: 800)
 * @param {number} quality - Qualité de compression 0-1 (défaut: 0.7)
 * @returns {Promise<string>} - Image compressée en base64
 */
export const compressImage = (file, maxWidth = 800, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Redimensionner si nécessaire
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        // Convertir en base64 avec compression
        canvas.toBlob(
          (blob) => {
            const blobReader = new FileReader()
            blobReader.onloadend = () => resolve(blobReader.result)
            blobReader.onerror = reject
            blobReader.readAsDataURL(blob)
          },
          'image/jpeg',
          quality
        )
      }

      img.onerror = () => reject(new Error('Impossible de charger l\'image'))
      img.src = e.target.result
    }

    reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'))
    reader.readAsDataURL(file)
  })
}

/**
 * Compresse plusieurs images en parallèle
 * @param {File[]} files - Tableau de fichiers images
 * @param {number} maxWidth - Largeur maximale
 * @param {number} quality - Qualité de compression
 * @returns {Promise<string[]>} - Tableau d'images compressées en base64
 */
export const compressImages = async (files, maxWidth = 800, quality = 0.7) => {
  const compressionPromises = files.map(file => compressImage(file, maxWidth, quality))
  return Promise.all(compressionPromises)
}

/**
 * Valide qu'un fichier est une image
 * @param {File} file - Fichier à valider
 * @returns {boolean} - true si c'est une image
 */
export const isImageFile = (file) => {
  return file && file.type.startsWith('image/')
}

/**
 * Valide la taille d'un fichier image
 * @param {File} file - Fichier à valider
 * @param {number} maxSizeInMB - Taille maximale en MB
 * @returns {boolean} - true si la taille est valide
 */
export const isValidImageSize = (file, maxSizeInMB = 10) => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024
  return file && file.size <= maxSizeInBytes
}

/**
 * Obtient les dimensions d'une image
 * @param {File} file - Fichier image
 * @returns {Promise<{width: number, height: number}>} - Dimensions
 */
export const getImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => resolve({ width: img.width, height: img.height })
      img.onerror = reject
      img.src = e.target.result
    }

    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Convertit une URL data en Blob
 * @param {string} dataUrl - URL data (base64)
 * @returns {Blob} - Blob
 */
export const dataUrlToBlob = (dataUrl) => {
  const arr = dataUrl.split(',')
  const mime = arr[0].match(/:(.*?);/)[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }

  return new Blob([u8arr], { type: mime })
}

/**
 * Estime la taille d'une image base64 en bytes
 * @param {string} base64String - String base64
 * @returns {number} - Taille en bytes
 */
export const getBase64Size = (base64String) => {
  const stringLength = base64String.length - 'data:image/png;base64,'.length
  return 4 * Math.ceil(stringLength / 3) * 0.5624896334383812
}

/**
 * Formate la taille en unité lisible
 * @param {number} bytes - Taille en bytes
 * @returns {string} - Taille formatée (ex: "1.5 MB")
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
