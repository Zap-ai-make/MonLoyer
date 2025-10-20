import { useEffect, useState } from 'react'
import { COLORS } from '../constants/colors'

function CircularProgress({ percentage = 0, size = 160, strokeWidth = 12, color = COLORS.secondary.DEFAULT, label = '' }) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0)

  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (animatedPercentage / 100) * circumference

  useEffect(() => {
    // Animation progressive de 0 à percentage
    let current = 0
    const increment = percentage / 60 // 60 frames pour atteindre la valeur
    const timer = setInterval(() => {
      current += increment
      if (current >= percentage) {
        setAnimatedPercentage(percentage)
        clearInterval(timer)
      } else {
        setAnimatedPercentage(current)
      }
    }, 16) // ~60fps

    return () => clearInterval(timer)
  }, [percentage])

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Cercle de fond */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E9ECEF"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Cercle de progression */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.3s ease',
            filter: 'drop-shadow(0 0 6px rgba(26, 188, 156, 0.3))'
          }}
        />
      </svg>

      {/* Texte central */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold" style={{ color, fontFamily: 'Poppins, sans-serif' }}>
          {Math.round(animatedPercentage)}%
        </span>
        {label && (
          <span className="text-sm mt-1" style={{ color: '#6C757D' }}>
            {label}
          </span>
        )}
      </div>
    </div>
  )
}

export default CircularProgress
