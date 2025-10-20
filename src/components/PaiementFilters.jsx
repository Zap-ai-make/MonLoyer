import { memo } from 'react'
import { MOIS } from '../constants/paiements'

const PaiementFilters = memo(function PaiementFilters({
  filtreMois,
  filtreAnnee,
  onMoisChange,
  onAnneeChange,
  onResetToCurrentMonth
}) {
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  const isCurrentPeriod = filtreMois === currentMonth && filtreAnnee === currentYear
  const isPastPeriod = !isCurrentPeriod

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Période:</span>
          {isPastPeriod && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              📅 Période passée
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <select
            value={filtreMois}
            onChange={(e) => onMoisChange(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          >
            {MOIS.map((moisNom, index) => (
              <option key={index + 1} value={index + 1}>
                {moisNom}
              </option>
            ))}
          </select>
          <select
            value={filtreAnnee}
            onChange={(e) => onAnneeChange(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          >
            {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map(annee => (
              <option key={annee} value={annee}>
                {annee}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={onResetToCurrentMonth}
          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
        >
          Mois actuel
        </button>
      </div>
    </div>
  )
})

export default PaiementFilters
