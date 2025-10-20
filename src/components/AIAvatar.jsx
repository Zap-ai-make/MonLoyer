import { COLORS, SHADOWS } from '../constants/colors'

function AIAvatar({ size = 'md', isTyping = false }) {
  const sizes = {
    sm: { avatar: 'w-8 h-8', icon: 'text-base' },
    md: { avatar: 'w-10 h-10', icon: 'text-lg' },
    lg: { avatar: 'w-12 h-12', icon: 'text-xl' }
  }

  const sizeClasses = sizes[size] || sizes.md

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Cercle pulsant en arrière-plan */}
      <div
        className={`absolute ${sizeClasses.avatar} rounded-full`}
        style={{
          backgroundColor: 'rgba(0, 184, 148, 0.2)',
          animation: isTyping ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
        }}
      />

      {/* Avatar principal */}
      <div
        className={`relative ${sizeClasses.avatar} rounded-full flex items-center justify-center`}
        style={{
          backgroundColor: COLORS.secondary.DEFAULT,
          boxShadow: SHADOWS.secondary
        }}
      >
        <span className={sizeClasses.icon} style={{ color: COLORS.white }}>
          🤖
        </span>
      </div>
    </div>
  )
}

export default AIAvatar
