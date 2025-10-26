import { memo } from 'react'
import { MOIS } from '../constants/paiements'
import { formatCurrency } from '../utils/formatters'

const PaiementStats = memo(function PaiementStats({ resume, filtreMois }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Attendu</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(resume.totalAttendu)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Basé sur les maisons occupées
            </p>
          </div>
          <div className="text-blue-600 text-3xl">💵</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Encaissé</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(resume.totalEncaisse)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Paiements reçus pour {MOIS[filtreMois - 1]}
            </p>
          </div>
          <div className="text-green-600 text-3xl">💰</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Impayé</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(resume.totalImpaye)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Attendu - Encaissé
            </p>
          </div>
          <div className="text-red-600 text-3xl">⚠️</div>
        </div>
      </div>
    </div>
  )
})

export default PaiementStats
