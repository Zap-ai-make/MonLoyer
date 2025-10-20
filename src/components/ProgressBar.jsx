import { useEffect, useState } from 'react'

function ProgressBar({ percentage = 0, height = 12, color = '#00B894', bgColor = '#E9ECEF', showLabel = true, label = '' }) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0)

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
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium" style={{ color: '#6C757D' }}>
            {label || 'Progression'}
          </span>
          <span className="text-sm font-bold" style={{ color, fontFamily: 'Poppins, sans-serif' }}>
            {Math.round(animatedPercentage)}%
          </span>
        </div>
      )}

      <div
        className="w-full rounded-full overflow-hidden"
        style={{
          backgroundColor: bgColor,
          height: `${height}px`
        }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${animatedPercentage}%`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}40`
          }}
        />
      </div>
    </div>
  )
}

export default ProgressBar
