import { memo } from 'react'

/**
 * Carte d'action rapide cliquable avec animation hover
 */
const ActionCard = memo(function ActionCard({
  icon: Icon,
  title,
  description,
  onClick,
  color = '#003C57',
  bgColor = 'rgba(0, 60, 87, 0.1)'
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center p-5 rounded-2xl transition-all duration-300 hover:scale-105"
      style={{
        border: '2px dashed #CED4DA',
        backgroundColor: 'transparent'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color
        e.currentTarget.style.backgroundColor = `${bgColor}`
        e.currentTarget.style.boxShadow = `0 4px 12px ${color}26`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#CED4DA'
        e.currentTarget.style.backgroundColor = 'transparent'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div
        className="p-3 rounded-xl mr-3 group-hover:scale-110 transition-transform"
        style={{ backgroundColor: bgColor }}
      >
        <Icon className="w-7 h-7" style={{ color }} />
      </div>
      <div className="text-left">
        <p className="font-bold mb-1" style={{ color: '#212529', fontFamily: 'Poppins, sans-serif' }}>
          {title}
        </p>
        <p className="text-sm" style={{ color: '#6C757D' }}>
          {description}
        </p>
      </div>
    </button>
  )
})

export default ActionCard
