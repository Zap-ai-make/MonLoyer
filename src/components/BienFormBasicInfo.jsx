// Composant pour les informations de base du bien
function BienFormBasicInfo({ formData, handleChange, proprietaires }) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Propriétaire *
        </label>
        <select
          name="proprietaireId"
          required
          value={formData.proprietaireId}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Sélectionner un propriétaire</option>
          {proprietaires.map(proprietaire => (
            <option key={proprietaire.id} value={proprietaire.id}>
              {proprietaire.nom} {proprietaire.prenom}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de bien *
          </label>
          <select
            name="type"
            required
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="cour_unique">Cour unique (villa)</option>
            <option value="cour_commune">Cour commune</option>
            <option value="magasin">Magasin</option>
          </select>
        </div>

        {formData.type === 'cour_commune' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de maisons *
            </label>
            <input
              type="number"
              name="nombreMaisons"
              min="1"
              max="20"
              required
              value={formData.nombreMaisons}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: 4"
            />
          </div>
        )}

        {formData.type !== 'cour_commune' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de chambres
            </label>
            <input
              type="number"
              name="nombreChambres"
              min="0"
              value={formData.nombreChambres}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: 2"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ville *
          </label>
          <input
            type="text"
            name="ville"
            required
            value={formData.ville}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: Ouagadougou"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quartier
          </label>
          <input
            type="text"
            name="quartier"
            value={formData.quartier}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: Tampouy, Tanghin..."
          />
        </div>
      </div>
    </>
  )
}

export default BienFormBasicInfo
