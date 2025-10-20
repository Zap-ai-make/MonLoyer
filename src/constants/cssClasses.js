/**
 * Classes CSS réutilisables pour l'application
 * Centralisation pour maintenir la cohérence du design
 */

// Boutons
const BUTTON_BASE = "px-4 py-2 rounded-lg transition-colors font-medium"

export const BUTTON_PRIMARY = `${BUTTON_BASE} bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md`
export const BUTTON_PRIMARY_GREEN = `${BUTTON_BASE} bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-md`
export const BUTTON_PRIMARY_PURPLE = `${BUTTON_BASE} bg-purple-600 text-white hover:bg-purple-700 shadow-sm hover:shadow-md`
export const BUTTON_SECONDARY = `${BUTTON_BASE} bg-gray-100 text-gray-700 hover:bg-gray-200`
export const BUTTON_DANGER = `${BUTTON_BASE} bg-red-600 text-white hover:bg-red-700`

// Boutons icônes
export const ICON_BUTTON_BASE = "p-2 rounded-lg transition-colors"

// Inputs et formulaires
export const INPUT_BASE = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
export const INPUT_GREEN = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
export const INPUT_PURPLE = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"

export const TEXTAREA_BASE = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"

export const SELECT_BASE = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"

// Labels
export const LABEL_BASE = "block text-sm font-medium text-gray-700 mb-1"

// Cards et containers
export const CARD_BASE = "bg-white rounded-lg shadow-sm border border-gray-200"
export const CARD_HOVER = "transition-all duration-300 hover:shadow-md"

// Modals
export const MODAL_OVERLAY = "fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4"
export const MODAL_CONTAINER = "bg-white rounded-lg shadow-xl w-full max-h-[90vh] overflow-y-auto"

// Badges
export const BADGE_SUCCESS = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
export const BADGE_WARNING = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
export const BADGE_DANGER = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
export const BADGE_INFO = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
