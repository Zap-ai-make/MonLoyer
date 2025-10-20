import { memo } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCurrency } from '../utils/formatters'

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

// Graphique histogramme pour revenus mensuels avec légende claire
export const MonthlyRevenueChart = memo(function MonthlyRevenueChart({ data }) {
  // Format: [{ mois: 'Jan', montant: 1500000, attendu: 2000000 }]

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-neutral-200 rounded-lg shadow-soft p-3">
          <p className="font-medium mb-1" style={{ color: '#003C57', fontFamily: 'Poppins, sans-serif' }}>
            {payload[0].payload.mois}
          </p>
          <p className="text-sm flex items-center gap-2" style={{ color: '#00B894' }}>
            ✅ Reçu: {formatCurrency(payload[0].value)}
          </p>
          {payload[1] && (
            <p className="text-sm flex items-center gap-2" style={{ color: '#6C757D' }}>
              💵 Attendu: {formatCurrency(payload[1].value)}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div>
      {/* Légende claire avec emojis */}
      <div className="flex items-center justify-center gap-6 mb-4">
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
          <Tooltip content={<CustomTooltip />} />
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
    </div>
  )
})

// Mini graphique sparkline pour évolution
export const SparklineChart = memo(function SparklineChart({ data, color = '#1ABC9C' }) {
  return (
    <ResponsiveContainer width="100%" height={60}>
      <BarChart data={data}>
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
})
