import { compressImages } from '../utils/imageUtils'
import { useNotification } from '../contexts/NotificationContext'
import logger from '../utils/logger'

// Composant pour la section images du bien
function BienFormImages({ formData, setFormData }) {
  const notification = useNotification()

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    const currentImages = formData.images || []

    if (files.length + currentImages.length > 3) {
      notification.error('Vous ne pouvez ajouter que 3 images maximum')
      return
    }

    try {
      const compressedImages = await compressImages(files, 800, 0.7)

      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...compressedImages]
      }))

      notification.success(`${compressedImages.length} image(s) ajoutée(s)`)
    } catch (error) {
      notification.error('Erreur lors de la compression des images')
      logger.error('Erreur compression images:', { error })
    }
  }

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
      <div className="flex items-start gap-2 mb-3">
        <div className="text-purple-600 mt-0.5">📷</div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-purple-900 mb-1">Images du bien (jusqu'à 3)</h3>
          <p className="text-xs text-purple-700">
            Ces images seront affichées sur la carte Google Maps
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {(!formData.images || formData.images.length < 3) && (
          <div>
            <label className="block w-full cursor-pointer">
              <div className="border-2 border-dashed border-purple-300 rounded-lg p-4 hover:border-purple-500 hover:bg-purple-100 transition-colors text-center">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="text-purple-600">
                  <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-medium">Cliquez pour ajouter des images</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG jusqu'à 10MB</p>
                </div>
              </div>
            </label>
          </div>
        )}

        {formData.images && formData.images.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {formData.images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image}
                  alt={`Bien ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default BienFormImages
