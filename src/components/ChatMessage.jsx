import AIAvatar from './AIAvatar'
import { COLORS } from '../constants/colors'

function ChatMessage({ message, type = 'ai', timestamp }) {
  const isUser = type === 'user'

  return (
    <div
      className={`flex gap-3 mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
      style={{
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      {/* Avatar IA à gauche */}
      {!isUser && (
        <div className="flex-shrink-0">
          <AIAvatar size="sm" />
        </div>
      )}

      {/* Bulle de message */}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'
        }`}
        style={{
          backgroundColor: isUser ? COLORS.primary.DEFAULT : COLORS.neutral[50],
          color: isUser ? COLORS.white : COLORS.neutral[800],
          boxShadow: isUser
            ? '0 2px 8px rgba(0, 60, 87, 0.15)'
            : '0 2px 8px rgba(0, 0, 0, 0.08)'
        }}
      >
        <p className="text-sm leading-relaxed" style={{ fontFamily: 'Roboto, sans-serif' }}>
          {message}
        </p>
        {timestamp && (
          <p
            className="text-xs mt-1"
            style={{
              color: isUser ? 'rgba(255, 255, 255, 0.7)' : COLORS.neutral[500]
            }}
          >
            {timestamp}
          </p>
        )}
      </div>

      {/* Espace réservé pour alignement */}
      {isUser && <div className="flex-shrink-0 w-10" />}
    </div>
  )
}

export default ChatMessage
