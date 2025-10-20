import { memo } from 'react'
import { ICON_BUTTON_BASE } from '../constants/cssClasses'
import { formatCurrency } from '../utils/formatters'
import Tooltip from './Tooltip'

const ImpayesTable = memo(function ImpayesTable({
  locatairesImpayes,
  biens,
  filtreMois,
  filtreAnnee,
  onPaymentClick
}) {
  const getBienInfoForLocataire = (locataire) => {
    if (!locataire.courId) return 'Aucune cour assignée'

    const cour = biens.find(b => b.id === locataire.courId)
    if (!cour) return 'Cour inconnue'

    const nomCour = cour.nomCour || `${cour.quartier} ${cour.ville}`
    const typeLibelle = cour.type === 'cour_commune' ? 'Cour commune' :
                       cour.type === 'magasin' ? 'Magasin' : 'Villa'

    let info = `${nomCour} - ${typeLibelle}`

    if (cour.type === 'cour_commune' && locataire.numeroMaison) {
      info += ` - Maison n°${locataire.numeroMaison}`
    }

    return info
  }

  if (locatairesImpayes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-5xl mb-4">✅</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Aucun impayé
        </h3>
        <p className="text-gray-600 mb-4">
          Tous les locataires ont payé leur loyer pour cette période !
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Locataire
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Bien loué
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Montant en retard
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Statut
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions rapides
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {locatairesImpayes.map((locataire) => (
            <tr key={locataire.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {locataire.prenom} {locataire.nom}
                </div>
                {locataire.telephone && (
                  <div className="text-sm text-gray-500">
                    📞 {locataire.telephone}
                  </div>
                )}
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">
                  {getBienInfoForLocataire(locataire)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm">
                  <div className="font-medium text-red-600">
                    {formatCurrency(locataire.montantRestant)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Payé: {formatCurrency(locataire.montantPaye)} / {formatCurrency(locataire.montantDu)}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  locataire.statut === 'impaye'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {locataire.statut === 'impaye' ? '🔴 Impayé' : '🟠 Partiel'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-2">
                  {locataire.telephone && (
                    <Tooltip content="📞 Contacter">
                      <a
                        href={`tel:${locataire.telephone}`}
                        className={`${ICON_BUTTON_BASE} text-blue-600 hover:bg-blue-50`}
                        aria-label="Contacter"
                      >
                        <span className="text-xl">📞</span>
                      </a>
                    </Tooltip>
                  )}
                  <Tooltip content="Enregistrer paiement">
                    <button
                      onClick={() => onPaymentClick(locataire, filtreMois, filtreAnnee)}
                      className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 flex items-center gap-1"
                    >
                      💰 Paiement
                    </button>
                  </Tooltip>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
})

export default ImpayesTable
