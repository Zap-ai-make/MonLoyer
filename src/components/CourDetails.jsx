import { useState } from 'react'
import dataService from '../services/dataService'
import { formatCurrency } from '../utils/formatters'

function CourDetails({ bien, onUpdate, defaultExpanded = true }) {
  const [showDetails, setShowDetails] = useState(defaultExpanded)

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
    if (confirm(`Êtes-vous sûr de vouloir libérer la maison n°${numeroMaison} ?`)) {
      dataService.libererMaison(bien.id, numeroMaison)
      if (onUpdate) onUpdate()
    }
  }

  return (
    <div>
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mb-3"
      >
        <span className="mr-1">
          {showDetails ? '▼' : '▶'}
        </span>
        {showDetails ? 'Masquer' : 'Voir'} les {bien.maisons.length} maisons
      </button>

      {showDetails && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="mb-4 flex gap-4 text-sm">
            <span className="text-green-600 font-medium">
              🟢 {maisonsLibres} libre(s)
            </span>
            <span className="text-red-600 font-medium">
              🔴 {maisonsOccupees} occupée(s)
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            {bien.maisons.map((maison) => {
              const locataire = getLocataireInfo(maison.locataireId)

              return (
                <div
                  key={maison.id}
                  className={`min-w-[220px] p-3 rounded-lg border-l-4 flex-shrink-0 ${
                    maison.statut === 'libre'
                      ? 'border-green-500 bg-green-50'
                      : 'border-red-500 bg-red-50'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900 text-sm">
                      Maison n°{maison.numeroMaison}
                    </h4>
                    <span className={`inline-block text-xs px-2 py-1 rounded font-medium flex-shrink-0 ${
                      maison.statut === 'libre'
                        ? 'bg-green-200 text-green-900'
                        : 'bg-red-200 text-red-900'
                    }`}>
                      {maison.statut === 'libre' ? 'Libre' : 'Occupée'}
                    </span>
                  </div>

                  <div className="flex gap-2 text-xs text-gray-600 mb-2">
                    {maison.compteurEau && (
                      <span className="block">💧 {maison.compteurEau}</span>
                    )}
                    {maison.compteurElectricite && (
                      <span className="block">⚡ {maison.compteurElectricite}</span>
                    )}
                  </div>

                  {maison.statut === 'occupee' && locataire && (
                    <div className="mt-2 pt-2 border-t border-gray-300">
                      <div className="text-xs space-y-1">
                        <div className="font-semibold">👤 {locataire.prenom} {locataire.nom}</div>
                        {locataire.telephone && (
                          <div className="text-gray-600">📞 {locataire.telephone}</div>
                        )}
                        {locataire.montantLoyer && (
                          <div className="text-green-700 font-bold">
                            {formatCurrency(parseInt(locataire.montantLoyer))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => libererMaison(maison.numeroMaison)}
                        className="mt-2 text-xs text-red-600 hover:text-red-800 underline font-medium"
                      >
                        Libérer
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default CourDetails