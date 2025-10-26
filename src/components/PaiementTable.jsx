import { memo, useState, useMemo } from 'react'
import { Edit2, Trash2, Printer } from 'lucide-react'
import { MOIS, MODES_PAIEMENT, STATUT_COLORS, STATUT_LABELS } from '../constants/paiements'
import { ICON_BUTTON_BASE } from '../constants/cssClasses'
import { formatCurrency } from '../utils/formatters'
import Tooltip from './Tooltip'
import ReceiptManager from './ReceiptManager'

const PaiementTable = memo(function PaiementTable({
  paiements,
  locataires,
  biens,
  onEdit,
  onDelete,
  onPrintReceipt,
  filtreMois,
  filtreAnnee
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const getLocataireInfo = (locataireId) => {
    const locataire = locataires.find(l => l.id === locataireId)
    if (!locataire) return { nom: 'Locataire inconnu', bien: 'Bien inconnu' }

    const bien = biens.find(b => b.id === (locataire.courId || locataire.bienId))
    const bienNom = bien ? (bien.nomCour || `${bien.quartier} ${bien.ville}`) : 'Bien inconnu'

    return {
      nom: `${locataire.prenom} ${locataire.nom}`,
      bien: bienNom
    }
  }

  const getStatutBadge = (statut, montantPaye, montantDu) => {
    const status = statut || (montantPaye >= montantDu ? 'paye' : montantPaye > 0 ? 'partiel' : 'impaye')

    return {
      color: STATUT_COLORS[status] || STATUT_COLORS.impaye,
      label: STATUT_LABELS[status] || 'Impayé'
    }
  }

  // Pagination
  const paginatedPaiements = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return paiements.slice(startIndex, endIndex)
  }, [paiements, currentPage])

  const totalPages = Math.ceil(paiements.length / itemsPerPage)

  if (paiements.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-5xl mb-4">💰</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Aucun paiement pour {MOIS[filtreMois - 1]} {filtreAnnee}
        </h3>
        <p className="text-gray-600 mb-4">
          Aucun paiement enregistré pour cette période. Ajoutez un paiement ou changez la période.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Locataire
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Période
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date de paiement
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Montant Attendu
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Montant Payé
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mode de paiement
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reçu
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedPaiements.map((paiement) => {
            const locataireInfo = getLocataireInfo(paiement.locataireId)
            const statut = getStatutBadge(paiement.statut, paiement.montantPaye, paiement.montantDu)
            const locataire = locataires.find(l => l.id === paiement.locataireId)
            const bien = biens.find(b => b.id === (locataire?.courId || locataire?.bienId))

            return (
              <tr key={paiement.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {locataireInfo.nom}
                  </div>
                  <div className="text-sm text-gray-500">
                    {locataireInfo.bien}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {paiement.paiementMultiple ? (
                      <div className="flex items-center gap-2">
                        <span>{paiement.moisDuGroupe?.[0] || paiement.mois}</span>
                        {paiement.totalMoisPayes > 1 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            +{paiement.totalMoisPayes - 1} mois
                          </span>
                        )}
                      </div>
                    ) : (
                      `${typeof paiement.mois === 'number' ? MOIS[paiement.mois] : paiement.mois} ${paiement.annee}`
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {paiement.datePaiement && (
                    <div className="text-sm text-gray-900">
                      {new Date(paiement.datePaiement).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {paiement.paiementMultiple && !paiement.isPremierDuGroupe ? (
                    <div className="text-xs text-gray-400 italic">
                      Voir paiement groupé ↑
                    </div>
                  ) : (
                    <div className="text-sm text-gray-900 font-medium">
                      {paiement.paiementMultiple
                        ? formatCurrency(paiement.montantDu * paiement.totalMoisPayes || 0)
                        : formatCurrency(paiement.montantDu || 0)
                      }
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {paiement.paiementMultiple && !paiement.isPremierDuGroupe ? (
                    <div className="text-xs text-gray-400 italic">
                      Voir paiement groupé ↑
                    </div>
                  ) : (
                    <div>
                      <div className="text-sm text-gray-900 font-medium">
                        {paiement.paiementMultiple
                          ? formatCurrency(paiement.montantTotalPaye || 0)
                          : formatCurrency(paiement.montantPaye || 0)
                        }
                      </div>
                      {((paiement.paiementMultiple
                        ? (paiement.montantDu * paiement.totalMoisPayes) - paiement.montantTotalPaye
                        : paiement.montantDu - paiement.montantPaye) > 0) && (
                        <div className="text-xs text-red-600">
                          Reste: {formatCurrency(paiement.paiementMultiple
                            ? ((paiement.montantDu * paiement.totalMoisPayes) - paiement.montantTotalPaye)
                            : (paiement.montantDu - paiement.montantPaye)
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {paiement.modePaiement === 'especes' && <span className="text-lg">💵</span>}
                    {paiement.modePaiement === 'mobile_money' && <span className="text-lg">📲</span>}
                    {paiement.modePaiement === 'cheque' && <span className="text-lg">💳</span>}
                    {paiement.modePaiement === 'virement' && <span className="text-lg">🏦</span>}
                    <div>
                      <div className="text-sm text-gray-900">
                        {MODES_PAIEMENT.find(m => m.value === paiement.modePaiement)?.label || paiement.modePaiement}
                      </div>
                      {paiement.numeroCheque && (
                        <div className="text-xs text-gray-500">
                          N° {paiement.numeroCheque}
                        </div>
                      )}
                      {paiement.numeroMobileMoney && (
                        <div className="text-xs text-gray-500">
                          N° {paiement.numeroMobileMoney}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statut.color}`}>
                    {statut.label}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <ReceiptManager
                    paiement={paiement}
                    locataire={locataire}
                    bien={bien}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <Tooltip content="📄 Reçu PDF">
                      <button
                        onClick={() => onPrintReceipt(paiement)}
                        className={`${ICON_BUTTON_BASE} text-purple-600 hover:bg-purple-50`}
                        aria-label="Reçu PDF"
                      >
                        <Printer className="w-5 h-5" />
                      </button>
                    </Tooltip>
                    <Tooltip content="Modifier">
                      <button
                        onClick={() => onEdit(paiement)}
                        className={`${ICON_BUTTON_BASE} text-blue-600 hover:bg-blue-50`}
                        aria-label="Modifier"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                    </Tooltip>
                    <Tooltip content="Supprimer">
                      <button
                        onClick={() => onDelete(paiement)}
                        className={`${ICON_BUTTON_BASE} text-red-600 hover:bg-red-50`}
                        aria-label="Supprimer"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </Tooltip>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>

    {/* Pagination */}
    {totalPages > 1 && (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Affichage de <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> à{' '}
              <span className="font-medium">{Math.min(currentPage * itemsPerPage, paiements.length)}</span> sur{' '}
              <span className="font-medium">{paiements.length}</span> résultats
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Précédent</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                </svg>
              </button>
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      currentPage === page
                        ? 'z-10 bg-green-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                    }`}
                  >
                    {page}
                  </button>
                )
              })}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Suivant</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    )}
    </div>
  )
})

export default PaiementTable
