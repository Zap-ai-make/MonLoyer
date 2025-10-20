import { COLORS } from '../constants/colors'

function QuickSuggestions({ onSelect }) {
  const suggestions = [
    { id: 1, text: "Résumé de mes finances", icon: "📊" },
    { id: 2, text: "Lister mes locataires en retard", icon: "🏠" },
    { id: 3, text: "Prévoir mes revenus du mois prochain", icon: "📅" }
  ]

  return (
    <div className="flex flex-wrap gap-2 mb-3 px-4">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.id}
          onClick={() => onSelect(suggestion.text)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105"
          style={{
            backgroundColor: COLORS.neutral[50],
            color: COLORS.primary.DEFAULT,
            border: `1px solid ${COLORS.neutral[100]}`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.neutral[100]
            e.currentTarget.style.borderColor = COLORS.secondary.DEFAULT
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.neutral[50]
            e.currentTarget.style.borderColor = COLORS.neutral[100]
          }}
        >
          <span>{suggestion.icon}</span>
          <span>{suggestion.text}</span>
        </button>
      ))}
    </div>
  )
}

export default QuickSuggestions
