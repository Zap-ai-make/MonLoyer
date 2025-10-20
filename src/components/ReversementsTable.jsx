import { memo } from 'react'
import { Printer } from 'lucide-react'
import { ICON_BUTTON_BASE } from '../constants/cssClasses'
import { formatCurrency } from '../utils/formatters'
import Tooltip from './Tooltip'

const ReversementsTable = memo(function ReversementsTable({
  proprietaires,
  onPrintRemittanceReceipt,
  onValidateRemittance
}) {
  if (proprietaires.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-5xl mb-4">🏦</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Aucun reversement
        </h3>
        <p className="text-gray-600 mb-4">
          Aucun propriétaire n'a de revenus locatifs pour cette période.
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
              Propriétaire
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Biens
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total encaissé
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Impayé
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Solde à reverser
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {proprietaires
            .sort((a, b) => b.montantAReversser - a.montantAReversser)
            .map((proprietaire) => (
            <tr key={proprietaire.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {proprietaire.prenom} {proprietaire.nom}
                </div>
                {proprietaire.telephone && (
                  <div className="text-sm text-gray-500">
                    📞 {proprietaire.telephone}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {proprietaire.nombreBiens} bien(s)
                </div>
                <div className="text-xs text-gray-500">
                  {proprietaire.detailsBiens.length} locataire(s)
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-green-600">
                  {formatCurrency(proprietaire.montantAReversser)}
                </div>
                <div className="text-xs text-gray-500">
                  / {formatCurrency(proprietaire.totalAttendu)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-red-600">
                  {formatCurrency(proprietaire.montantImpaye)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-bold text-blue-600">
                  {formatCurrency(proprietaire.montantAReversser)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-2">
                  {proprietaire.montantAReversser > 0 ? (
                    <>
                      <Tooltip content="Imprimer le reçu">
                        <button
                          onClick={() => onPrintRemittanceReceipt(proprietaire)}
                          className={`${ICON_BUTTON_BASE} text-purple-600 hover:bg-purple-50`}
                          aria-label="Imprimer"
                        >
                          <Printer className="w-5 h-5" />
                        </button>
                      </Tooltip>
                      <button
                        onClick={() => onValidateRemittance(proprietaire)}
                        className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 flex items-center gap-1 font-medium"
                      >
                        ✓ Effectuer reversement
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400 italic">
                      Rien à reverser
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
})

export default ReversementsTable
