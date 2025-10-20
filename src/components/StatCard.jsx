import { memo } from 'react'
import { COLORS, SHADOWS } from '../constants/colors'
import EmptyState from './EmptyState'
import Tooltip from './Tooltip'

const StatCard = memo(function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  iconBg,
  tooltip,
  badge,
  showProgress,
  progressComponent,
  animationDelay = 0,
  emptyStateType
}) {
  const hasData = typeof value === 'string' ? true : value > 0

  return (
    <div
      className="rounded-2xl p-6 transition-all duration-300 hover:scale-105 cursor-pointer"
      style={{
        backgroundColor: COLORS.white,
        boxShadow: SHADOWS.soft,
        animation: `slideUp 0.6s ease-out ${animationDelay}s backwards`
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = SHADOWS.medium
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = SHADOWS.soft
      }}
    >
      {hasData ? (
        <>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-medium" style={{ color: COLORS.neutral[500] }}>
                  {title}
                </p>
                {tooltip && <Tooltip content={tooltip} position="top" />}
              </div>
              {badge && (
                <div className="mb-2">{badge}</div>
              )}
            </div>
            <div
              className="p-3 rounded-xl transition-transform duration-300 hover:rotate-12"
              style={{ backgroundColor: iconBg }}
            >
              <Icon className="w-7 h-7" style={{ color: iconColor }} />
            </div>
          </div>
          <p
            className="text-4xl font-bold mb-2"
            style={{ color: COLORS.neutral[800], fontFamily: 'Poppins, sans-serif' }}
          >
            {value}
          </p>
          {subtitle && (
            <p className="text-sm mb-3" style={{ color: COLORS.neutral[500] }}>
              {subtitle}
            </p>
          )}
          {showProgress && progressComponent}
        </>
      ) : (
        <EmptyState
          type={emptyStateType || 'default'}
          title={`Aucun ${title.toLowerCase()}`}
          message={`Commencez par ajouter des ${title.toLowerCase()}`}
        />
      )}
    </div>
  )
})

export default StatCard
