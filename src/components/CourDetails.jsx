import { useState } from 'react'
import dataService from '../services/dataService'

function CourDetails({ bien, onUpdate }) {
  const [showDetails, setShowDetails] = useState(false)
  
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
    <div className="mt-3">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center text-sm text-blue-600 hover:text-blue-800"
      >
        <span className="mr-1">
          {showDetails ? '▼' : '▶'}
        </span>
        Voir les {bien.maisons.length} maisons
      </button>

      {showDetails && (
        <div className="mt-3 p-4 bg-gray-50 rounded-lg">
          <div className="mb-3 flex gap-4 text-sm">
            <span className="text-green-600 font-medium">
              🟢 {maisonsLibres} libre(s)
            </span>
            <span className="text-red-600 font-medium">
              🔴 {maisonsOccupees} occupée(s)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {bien.maisons.map((maison) => {
              const locataire = getLocataireInfo(maison.locataireId)
              
              return (
                <div
                  key={maison.id}
                  className={`p-3 rounded-lg border-2 ${
                    maison.statut === 'libre' 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium text-gray-900">
                      Maison n°{maison.numeroMaison}
                    </h4>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded block ${
                        maison.statut === 'libre' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {maison.statut === 'libre' ? 'Libre' : 'Occupée'}
                      </span>
                      {maison.statut === 'occupee' && locataire && locataire.montantLoyer && (
                        <div className="text-xs text-green-600 font-medium mt-0.5">
                          {parseInt(locataire.montantLoyer).toLocaleString()} FCFA
                        </div>
                      )}
                    </div>
                  </div>

                  {maison.compteurEau && (
                    <div className="text-xs text-gray-600">
                      💧 Eau: {maison.compteurEau}
                    </div>
                  )}
                  {maison.compteurElectricite && (
                    <div className="text-xs text-gray-600">
                      ⚡ Électricité: {maison.compteurElectricite}
                    </div>
                  )}

                  {maison.statut === 'occupee' && locataire && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="text-xs text-gray-700">
                        <strong>👤 {locataire.prenom} {locataire.nom}</strong>
                      </div>
                      {locataire.telephone && (
                        <div className="text-xs text-gray-600">
                          📞 {locataire.telephone}
                        </div>
                      )}
                      <button
                        onClick={() => libererMaison(maison.numeroMaison)}
                        className="mt-1 text-xs text-red-600 hover:text-red-800 underline"
                      >
                        Libérer maison
                      </button>
                    </div>
                  )}

                  {maison.statut === 'libre' && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="text-xs text-green-600">
                        ✅ Disponible pour location
                      </div>
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