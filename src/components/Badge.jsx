import { memo } from 'react'

const Badge = memo(function Badge({ type = 'success', children, size = 'md', statut }) {
  // Si un statut de bien est fourni, l'utiliser pour déterminer le type
  if (statut) {
    const statutNormalized = statut?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

    switch (statutNormalized) {
      case 'occupe':
      case 'occupee':
        type = 'success'
        children = children || 'Occupé'
        break
      case 'libre':
        type = 'error'
        children = children || 'Libre'
        break
      case 'en_renovation':
        type = 'warning'
        children = children || 'En rénovation'
        break
    }
  }

  const styles = {
    success: {
      bg: 'rgba(0, 184, 148, 0.1)',
      color: '#00B894',
      border: '#00B894'
    },
    warning: {
      bg: 'rgba(243, 156, 18, 0.1)',
      color: '#F39C12',
      border: '#F39C12'
    },
    error: {
      bg: 'rgba(231, 76, 60, 0.1)',
      color: '#E74C3C',
      border: '#E74C3C'
    },
    info: {
      bg: 'rgba(0, 60, 87, 0.1)',
      color: '#003C57',
      border: '#003C57'
    }
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  }

  const style = styles[type] || styles.info

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizes[size]}`}
      style={{
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}20`
      }}
    >
      {children}
    </span>
  )
})

export default Badge
