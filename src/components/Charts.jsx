import { memo, useState, lazy, Suspense } from 'react'
import { formatCurrency } from '../utils/formatters'

// Lazy load recharts pour réduire le bundle initial et éviter les conflits de chargement
const PieChart = lazy(() => import('recharts').then(module => ({ default: module.PieChart })))
const Pie = lazy(() => import('recharts').then(module => ({ default: module.Pie })))
const Cell = lazy(() => import('recharts').then(module => ({ default: module.Cell })))
const BarChart = lazy(() => import('recharts').then(module => ({ default: module.BarChart })))
const Bar = lazy(() => import('recharts').then(module => ({ default: module.Bar })))
const XAxis = lazy(() => import('recharts').then(module => ({ default: module.XAxis })))
const YAxis = lazy(() => import('recharts').then(module => ({ default: module.YAxis })))
const CartesianGrid = lazy(() => import('recharts').then(module => ({ default: module.CartesianGrid })))
const Tooltip = lazy(() => import('recharts').then(module => ({ default: module.Tooltip })))
const ResponsiveContainer = lazy(() => import('recharts').then(module => ({ default: module.ResponsiveContainer })))
const Legend = lazy(() => import('recharts').then(module => ({ default: module.Legend })))

// Composant de chargement pour les graphiques
const ChartLoader = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
)

// Graphique camembert pour taux d'occupation
export const OccupancyPieChart = memo(function OccupancyPieChart({ occupees, libres }) {
  const data = [
    { name: 'Occupées', value: occupees, color: '#1ABC9C' },
    { name: 'Libres', value: libres, color: '#E9ECEF' }
  ]

  const total = occupees + libres
  const percentage = total > 0 ? Math.round((occupees / total) * 100) : 0

  return (
    <div className="relative">
      <Suspense fallback={<ChartLoader />}>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #E9ECEF',
                borderRadius: '8px',
                padding: '8px 12px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </Suspense>

      {/* Texte central */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-3xl font-display font-bold text-primary">
          {percentage}%
        </div>
        <div className="text-sm text-neutral-600">
          d'occupation
        </div>
      </div>
    </div>
  )
})

// Graphique histogramme pour revenus mensuels avec légende claire et sélecteur de période
export const MonthlyRevenueChart = memo(function MonthlyRevenueChart({ data, showPeriodSelector = false, onPeriodChange, defaultPeriod = 30 }) {
  // Format: [{ mois: 'Jan', montant: 1500000, attendu: 2000000 }]
  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriod)

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period)
    if (onPeriodChange) {
      onPeriodChange(period)
    }
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      // Utiliser les données directement du payload pour éviter tout problème de synchronisation
      const currentData = payload[0].payload
      return (
        <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-3">
          <p className="font-medium mb-2" style={{ color: '#003C57', fontFamily: 'Poppins, sans-serif' }}>
            {currentData.mois}
          </p>
          <p className="text-sm flex items-center gap-2 mb-1" style={{ color: '#00B894' }}>
            <span className="font-semibold">✅ Reçu:</span>
            <span className="font-bold">{formatCurrency(currentData.montant || 0)}</span>
          </p>
          <p className="text-sm flex items-center gap-2" style={{ color: '#6C757D' }}>
            <span className="font-semibold">💵 Attendu:</span>
            <span className="font-bold">{formatCurrency(currentData.attendu || 0)}</span>
          </p>
          {currentData.montant > 0 && currentData.attendu > 0 && (
            <p className="text-xs mt-2 pt-2 border-t border-gray-200" style={{ color: '#6C757D' }}>
              Taux: {Math.round((currentData.montant / currentData.attendu) * 100)}%
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div>
      {/* En-tête avec légende et sélecteur de période */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        {/* Légende */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#00B894' }} />
            <span className="text-sm font-medium" style={{ color: '#6C757D' }}>
              ✅ Reçu
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#E9ECEF' }} />
            <span className="text-sm font-medium" style={{ color: '#6C757D' }}>
              💵 Attendu
            </span>
          </div>
        </div>

        {/* Sélecteur de période (optionnel) */}
        {showPeriodSelector && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePeriodChange(7)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                selectedPeriod === 7
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              7 jours
            </button>
            <button
              onClick={() => handlePeriodChange(30)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                selectedPeriod === 30
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              30 jours
            </button>
            <button
              onClick={() => handlePeriodChange(90)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                selectedPeriod === 90
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              90 jours
            </button>
          </div>
        )}
      </div>

      <Suspense fallback={<ChartLoader />}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" />
            <XAxis
              dataKey="mois"
              tick={{ fill: '#6C757D', fontSize: 12 }}
              axisLine={{ stroke: '#E9ECEF' }}
            />
            <YAxis
              tick={{ fill: '#6C757D', fontSize: 12 }}
              axisLine={{ stroke: '#E9ECEF' }}
              tickFormatter={(value) => `${(value / 1000)}k`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 184, 148, 0.1)' }} />
            <Bar
              dataKey="montant"
              name="✅ Reçu"
              fill="#00B894"
              radius={[8, 8, 0, 0]}
              animationBegin={0}
              animationDuration={800}
            />
            <Bar
              dataKey="attendu"
              name="💵 Attendu"
              fill="#E9ECEF"
              radius={[8, 8, 0, 0]}
              animationBegin={200}
              animationDuration={800}
            />
          </BarChart>
        </ResponsiveContainer>
      </Suspense>
    </div>
  )
})

// Mini graphique sparkline pour évolution
export const SparklineChart = memo(function SparklineChart({ data, color = '#1ABC9C' }) {
  return (
    <Suspense fallback={<ChartLoader />}>
      <ResponsiveContainer width="100%" height={60}>
        <BarChart data={data}>
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Suspense>
  )
})
