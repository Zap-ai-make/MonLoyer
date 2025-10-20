import { useState, useEffect } from 'react'
import { X, MapPin, DollarSign, User, Phone, Home, Edit2, Save, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import dataService from '../services/dataService'
import { useNavigate } from 'react-router-dom'
import Badge from './Badge'

function BienDrawer({ bien, onClose, onUpdate, isEditing = false }) {
  const navigate = useNavigate()
  const [proprietaire, setProprietaire] = useState(null)
  const [locataires, setLocataires] = useState([])
  const [editMode, setEditMode] = useState(isEditing)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [formData, setFormData] = useState({
    ville: '',
    adresse: '',
    montantLoyer: '',
    statut: 'libre',
    proprietaireId: ''
  })

  useEffect(() => {
    if (bien) {
      // Charger le propriétaire
      const prop = dataService.getProprietaires().find(p => p.id === bien.proprietaireId)
      setProprietaire(prop)

      // Charger les locataires
      const locs = dataService.getLocatairesByCour(bien.id)
      setLocataires(locs)

      // Initialiser le formulaire
      setFormData({
        ville: bien.ville || '',
        adresse: bien.adresse || '',
        montantLoyer: bien.montantLoyer || '',
        statut: bien.statut || 'libre',
        proprietaireId: bien.proprietaireId || ''
      })
    }
  }, [bien])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSave = () => {
    const updated = dataService.updateBien(bien.id, formData)
    if (updated) {
      onUpdate && onUpdate(updated)
      setEditMode(false)
    }
  }

  const handleDelete = () => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ce bien ?\n\n${bien.adresse || 'Bien sans adresse'}`)) {
      dataService.deleteBien(bien.id)
      onUpdate && onUpdate(null)
      onClose()
    }
  }


  const getTypeLabel = (type) => {
    switch (type) {
      case 'cour_unique':
        return 'Cour unique (villa)'
      case 'cour_commune':
        return 'Cour commune'
      case 'magasin':
        return 'Magasin'
      default:
        return type
    }
  }

  if (!bien) return null

  return (
    <>
      {/* Overlay très léger pour laisser la carte visible */}
      <div
        className="fixed inset-0 bg-black bg-opacity-10 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full w-full md:w-[35%] bg-white shadow-2xl z-50 overflow-y-auto"
        style={{
          animation: 'slideIn 0.3s ease-out'
        }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Détails du bien</h2>
            <p className="text-sm text-gray-600 mt-1">{getTypeLabel(bien.type)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Photos du bien avec carrousel */}
          {bien.images && bien.images.length > 0 ? (
            <div className="relative">
              <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
                <img
                  src={bien.images[currentImageIndex]}
                  alt={`Bien ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Contrôles du carrousel si plusieurs images */}
              {bien.images.length > 1 && (
                <>
                  {/* Boutons précédent/suivant */}
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? bien.images.length - 1 : prev - 1))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev === bien.images.length - 1 ? 0 : prev + 1))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>

                  {/* Indicateurs de pagination */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                    {bien.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentImageIndex
                            ? 'bg-white w-6'
                            : 'bg-white/50 hover:bg-white/75'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Compteur d'images */}
                  <div className="absolute top-3 right-3 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {currentImageIndex + 1} / {bien.images.length}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="aspect-video bg-gradient-to-br from-green-100 to-blue-100 rounded-xl flex items-center justify-center">
              <Home className="w-20 h-20 text-green-600 opacity-50" />
            </div>
          )}

          {/* Statut */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            {editMode ? (
              <select
                name="statut"
                value={formData.statut}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="libre">Libre</option>
                <option value="occupé">Occupé</option>
                <option value="en_renovation">En rénovation</option>
              </select>
            ) : (
              <div><Badge statut={bien.statut} /></div>
            )}
          </div>

          {/* Ville */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Ville
            </label>
            {editMode ? (
              <input
                type="text"
                name="ville"
                value={formData.ville}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ville du bien"
              />
            ) : (
              <p className="text-gray-900">{bien.ville || bien.adresse || 'Non renseignée'}</p>
            )}
          </div>

          {/* Quartier */}
          {bien.quartier && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quartier</label>
              <p className="text-gray-900">{bien.quartier}</p>
            </div>
          )}

          {/* Loyer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Loyer mensuel
            </label>
            {editMode ? (
              <input
                type="number"
                name="montantLoyer"
                value={formData.montantLoyer}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Montant en FCFA"
              />
            ) : (
              <p className="text-2xl font-bold text-green-600">
                {parseInt(bien.montantLoyer || 0).toLocaleString('fr-FR')} FCFA
              </p>
            )}
          </div>

          {/* Propriétaire */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Propriétaire
            </label>
            {proprietaire ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-gray-900">
                  {proprietaire.prenom} {proprietaire.nom}
                </p>
                {proprietaire.telephone && (
                  <p className="text-sm text-gray-600 mt-1 flex items-center">
                    <Phone className="w-3 h-3 mr-1" />
                    {proprietaire.telephone}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Non renseigné</p>
            )}
          </div>

          {/* Locataires */}
          {locataires.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Locataires ({locataires.length})
              </label>
              <div className="space-y-2">
                {locataires.map(locataire => (
                  <div key={locataire.id} className="bg-gray-50 rounded-lg p-3">
                    <p className="font-medium text-gray-900">
                      {locataire.prenom} {locataire.nom}
                    </p>
                    {locataire.numeroMaison && (
                      <p className="text-xs text-gray-600">Maison {locataire.numeroMaison}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {bien.description && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <p className="text-gray-900 text-sm leading-relaxed">{bien.description}</p>
            </div>
          )}

          {/* Coordonnées GPS */}
          {bien.latitude && bien.longitude && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Coordonnées GPS</label>
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                <p>Latitude: {bien.latitude}</p>
                <p>Longitude: {bien.longitude}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer avec boutons d'action */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 space-y-3">
          {editMode ? (
            <>
              <button
                onClick={handleSave}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Save className="w-5 h-5" />
                Sauvegarder
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Annuler
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditMode(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Edit2 className="w-5 h-5" />
                Modifier
              </button>
              <button
                onClick={() => navigate('/biens')}
                className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Voir la fiche complète
              </button>
            </>
          )}

          <button
            onClick={handleDelete}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
          >
            <Trash2 className="w-5 h-5" />
            Supprimer le bien
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  )
}

export default BienDrawer
