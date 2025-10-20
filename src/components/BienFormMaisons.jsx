// Composant pour les compteurs des maisons (cour commune)
function BienFormMaisons({ formData, handleChange }) {
  if (formData.type !== 'cour_commune') return null

  const nombreMaisons = parseInt(formData.nombreMaisons) || 0
  if (nombreMaisons === 0) return null

  const maisons = []
  for (let i = 1; i <= nombreMaisons; i++) {
    maisons.push(
      <div key={i} className="bg-white border border-green-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
            {i}
          </div>
          <h4 className="text-sm font-semibold text-gray-800">Maison {i}</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              💧 Compteur Eau
            </label>
            <input
              type="text"
              name={`compteurEau_${i}`}
              value={formData[`compteurEau_${i}`] || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder={`N° compteur eau`}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              ⚡ Compteur Électricité
            </label>
            <input
              type="text"
              name={`compteurElectricite_${i}`}
              value={formData[`compteurElectricite_${i}`] || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder={`N° compteur électricité`}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-green-600 text-lg">🏘️</span>
          <h3 className="text-base font-semibold text-green-900">Configuration des maisons</h3>
        </div>
        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
          {formData.nombreMaisons} maison{parseInt(formData.nombreMaisons) > 1 ? 's' : ''}
        </span>
      </div>
      <div className="space-y-4">
        {maisons}
      </div>
    </div>
  )
}

export default BienFormMaisons
