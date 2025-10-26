/**
 * Icône FCFA personnalisée pour remplacer DollarSign
 * @param {string} className - Classes CSS pour le styling
 * @param {number} size - Taille de l'icône (défaut: 24)
 */
function FCFAIcon({ className = '', size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* F stylisé */}
      <path
        d="M7 4V20M7 4H15M7 12H13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* CFA petit */}
      <g transform="translate(12, 14) scale(0.5)">
        <text
          x="0"
          y="8"
          fontFamily="Arial, sans-serif"
          fontSize="12"
          fontWeight="bold"
          fill="currentColor"
        >
          CFA
        </text>
      </g>
    </svg>
  )
}

export default FCFAIcon
