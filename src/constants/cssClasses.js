/**
 * Classes CSS réutilisables pour l'application Woning.cloud
 * Centralisation pour maintenir la cohérence du design
 *
 * Charte graphique principale: Vert (#10b981 / green-600)
 */

// ===== BOUTONS =====
const BUTTON_BASE = "px-4 py-2 rounded-lg transition-colors font-medium"

/** Bouton primaire bleu - Usage: Actions secondaires, anciens flows */
export const BUTTON_PRIMARY = `${BUTTON_BASE} bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md`

/** Bouton primaire VERT - Usage: Actions principales (harmonisé avec la charte) */
export const BUTTON_PRIMARY_GREEN = `${BUTTON_BASE} bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-md`

/** Bouton secondaire gris - Usage: Annulation, actions secondaires */
export const BUTTON_SECONDARY = `${BUTTON_BASE} bg-gray-100 text-gray-700 hover:bg-gray-200`

/** Bouton danger rouge - Usage: Suppressions, actions destructives */
export const BUTTON_DANGER = `${BUTTON_BASE} bg-red-600 text-white hover:bg-red-700`

// ===== BOUTONS ICÔNES =====
/** Bouton icône de base - Usage: Actions iconiques (éditer, supprimer, etc.) */
export const ICON_BUTTON_BASE = "p-2 rounded-lg transition-colors"

// ===== INPUTS ET FORMULAIRES =====
/** Input de base avec focus bleu - Usage: Formulaires génériques */
export const INPUT_BASE = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"

/** Input avec focus vert - Usage: Formulaires principaux (harmonisé) */
export const INPUT_GREEN = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"

/** Textarea de base - Usage: Champs de texte multilignes */
export const TEXTAREA_BASE = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"

/** Select de base - Usage: Listes déroulantes */
export const SELECT_BASE = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"

// ===== LABELS =====
/** Label de formulaire - Usage: Labels des champs de formulaire */
export const LABEL_BASE = "block text-sm font-medium text-gray-700 mb-1"

// ===== CARDS ET CONTAINERS =====
/** Card de base - Usage: Containers de contenu */
export const CARD_BASE = "bg-white rounded-lg shadow-sm border border-gray-200"

/** Card avec effet hover - Usage: Cards cliquables */
export const CARD_HOVER = "transition-all duration-300 hover:shadow-md"

// ===== MODALS =====
/** Overlay de modal - Usage: Fond sombre derrière les modals */
export const MODAL_OVERLAY = "fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4"

/** Container de modal - Usage: Contenu principal du modal */
export const MODAL_CONTAINER = "bg-white rounded-lg shadow-xl w-full max-h-[90vh] overflow-y-auto"

// ===== BADGES =====
/** Badge succès vert - Usage: États positifs, validations */
export const BADGE_SUCCESS = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"

/** Badge avertissement jaune - Usage: Alertes, avertissements */
export const BADGE_WARNING = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"

/** Badge danger rouge - Usage: Erreurs, états critiques */
export const BADGE_DANGER = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"

/** Badge info bleu - Usage: Informations neutres */
export const BADGE_INFO = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
