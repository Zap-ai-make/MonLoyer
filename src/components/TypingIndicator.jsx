import { COLORS } from '../constants/colors'

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-2 px-4">
      <div
        className="w-2 h-2 rounded-full"
        style={{
          backgroundColor: COLORS.neutral[500],
          animation: 'bounce 1.4s infinite ease-in-out both',
          animationDelay: '0s'
        }}
      />
      <div
        className="w-2 h-2 rounded-full"
        style={{
          backgroundColor: COLORS.neutral[500],
          animation: 'bounce 1.4s infinite ease-in-out both',
          animationDelay: '0.2s'
        }}
      />
      <div
        className="w-2 h-2 rounded-full"
        style={{
          backgroundColor: COLORS.neutral[500],
          animation: 'bounce 1.4s infinite ease-in-out both',
          animationDelay: '0.4s'
        }}
      />
    </div>
  )
}

export default TypingIndicator
