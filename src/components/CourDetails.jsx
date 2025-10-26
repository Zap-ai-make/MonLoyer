import { useState } from 'react'
import { Home, Droplet, Zap, User, Phone, CheckCircle } from 'lucide-react'
import FCFAIcon from './icons/FCFAIcon'
import dataService from '../services/dataService'
import { formatCurrency } from '../utils/formatters'
import { useNotification } from '../contexts/NotificationContext'

function CourDetails({ bien, onUpdate, defaultExpanded = true }) {
  const [showDetails, setShowDetails] = useState(defaultExpanded)
  const notification = useNotification()

  if (!bien.maisons || bien.type !== 'cour_commune') {
    return null
  }

  const maisonsLibres = bien.maisons.filter(m => m.statut === 'libre').length
  const maisonsOccupees = bien.maisons.filter(m => m.statut === 'occupee').length

  const getLocataireInfo = (locataireId) => {
    if (!locataireId) return null
    const locataires = dataService.getLocataires()
    return locataires.find(l => l.id === locataireId)
  }

  const libererMaison = (numeroMaison) => {
    if (confirm(`Êtes-vous sûr de vouloir libérer la maison n°${numeroMaison} ?\n\nLe locataire sera automatiquement marqué comme inactif.`)) {
      const success = dataService.libererMaison(bien.id, numeroMaison)
      if (success) {
        notification.success(`Maison n°${numeroMaison} libérée avec succès`)
        if (onUpdate) onUpdate()
      } else {
        notification.error('Erreur lors de la libération de la maison')
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* En-tête avec statistiques */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <Home className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {bien.maisons.length} Maisons
              </h3>
              <p className="text-sm text-gray-600">Cour commune</p>
            </div>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-4 py-2 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors shadow-sm border border-blue-100"
          >
            {showDetails ? 'Masquer' : 'Afficher'} détails
          </button>
        </div>

        {/* Statistiques */}
        <div className="mt-4 flex gap-3">
          <div className="flex-1 bg-white rounded-lg p-3 border border-green-100">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-700">{maisonsLibres}</p>
                <p className="text-xs text-gray-600">Libre{maisonsLibres > 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
          <div className="flex-1 bg-white rounded-lg p-3 border border-red-100">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-700">{maisonsOccupees}</p>
                <p className="text-xs text-gray-600">Occupée{maisonsOccupees > 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des maisons */}
      {showDetails && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bien.maisons.map((maison) => {
            const locataire = getLocataireInfo(maison.locataireId)
            const isLibre = maison.statut === 'libre'

            return (
              <div
                key={maison.id}
                className={`rounded-xl p-4 border-2 transition-all duration-300 hover:shadow-lg ${
                  isLibre
                    ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50'
                    : 'border-red-200 bg-gradient-to-br from-red-50 to-rose-50'
                }`}
              >
                {/* En-tête de la carte */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${isLibre ? 'bg-green-100' : 'bg-red-100'}`}>
                      <Home className={`w-5 h-5 ${isLibre ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">
                        Maison {maison.numeroMaison}
                      </h4>
                    </div>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold shadow-sm ${
                    isLibre
                      ? 'bg-green-500 text-white'
                      : 'bg-red-500 text-white'
                  }`}>
                    {isLibre ? '✓ Libre' : '● Occupée'}
                  </span>
                </div>

                {/* Compteurs */}
                {(maison.compteurEau || maison.compteurElectricite) && (
                  <div className="bg-white/60 rounded-lg p-3 mb-3 space-y-1">
                    {maison.compteurEau && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Droplet className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">Eau:</span>
                        <span>{maison.compteurEau}</span>
                      </div>
                    )}
                    {maison.compteurElectricite && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span className="font-medium">Élec:</span>
                        <span>{maison.compteurElectricite}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Informations du locataire */}
                {!isLibre && locataire ? (
                  <div className="bg-white/80 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-600" />
                      <span className="font-semibold text-gray-900">
                        {locataire.prenom} {locataire.nom}
                      </span>
                    </div>
                    {locataire.telephone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{locataire.telephone}</span>
                      </div>
                    )}
                    {locataire.montantLoyer && (
                      <div className="flex items-center gap-2 text-sm">
                        <FCFAIcon size={16} className="text-green-600" />
                        <span className="font-bold text-green-700">
                          {formatCurrency(parseInt(locataire.montantLoyer))}
                        </span>
                      </div>
                    )}

                    {/* Bouton Libérer amélioré */}
                    <button
                      onClick={() => libererMaison(maison.numeroMaison)}
                      className="mt-3 w-full px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      🔓 Libérer cette maison
                    </button>
                  </div>
                ) : (
                  <div className="bg-white/80 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-500 italic">Aucun locataire</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CourDetails