// Configuration centralisée de l'application

export const APP_CONFIG = {
  // Intervalles de rafraîchissement (en millisecondes)
  INTERVALS: {
    STATS_REFRESH: 30000, // 30 secondes
    DATE_CHECK: 3600000, // 1 heure
    CACHE_TIMEOUT: 5000 // 5 secondes
  },

  // Tailles de modals
  MODAL_SIZES: {
    SMALL: 'sm',
    MEDIUM: 'md',
    LARGE: 'lg',
    EXTRA_LARGE: 'xl'
  },

  // Délais d'animation
  ANIMATION: {
    SLIDE_UP_DELAY: 0.1, // Secondes entre chaque carte
    FADE_DURATION: 300, // ms
    HOVER_DURATION: 200 // ms
  },

  // Pagination
  PAGINATION: {
    ITEMS_PER_PAGE: 10,
    MAX_PAGES_DISPLAYED: 5
  },

  // Formats
  DATE_FORMAT: 'fr-FR',
  CURRENCY: 'FCFA'
}

export const MESSAGES = {
  // Confirmations
  DELETE_CONFIRM: 'Êtes-vous sûr de vouloir supprimer cet élément ?',
  DELETE_WARNING: 'Cette action est irréversible.',
  UNSAVED_CHANGES: 'Vous avez des modifications non sauvegardées.',

  // Succès
  SUCCESS_CREATE: 'Élément créé avec succès',
  SUCCESS_UPDATE: 'Élément mis à jour avec succès',
  SUCCESS_DELETE: 'Élément supprimé avec succès',

  // Erreurs
  ERROR_LOAD: 'Erreur lors du chargement des données',
  ERROR_SAVE: 'Erreur lors de la sauvegarde',
  ERROR_DELETE: 'Erreur lors de la suppression',
  ERROR_NETWORK: 'Erreur de connexion',

  // États vides
  NO_RESULTS: 'Aucun résultat trouvé',
  NO_DATA: 'Aucune donnée disponible',
  NO_PROPRIETAIRES: 'Aucun propriétaire enregistré',
  NO_BIENS: 'Aucun bien immobilier',
  NO_LOCATAIRES: 'Aucun locataire',
  NO_PAIEMENTS: 'Aucun paiement',
  NO_DOCUMENTS: 'Aucun document',

  // Actions
  ADD: 'Ajouter',
  EDIT: 'Modifier',
  DELETE: 'Supprimer',
  SAVE: 'Enregistrer',
  CANCEL: 'Annuler',
  CONFIRM: 'Confirmer',
  CLOSE: 'Fermer',
  SEARCH: 'Rechercher',
  FILTER: 'Filtrer',
  EXPORT: 'Exporter',
  IMPORT: 'Importer',
  DOWNLOAD: 'Télécharger',
  UPLOAD: 'Upload'
}

export const STATUSES = {
  LOCATAIRE: {
    ACTIF: 'actif',
    INACTIF: 'inactif',
    EN_RETARD: 'en_retard'
  },
  BIEN: {
    LIBRE: 'libre',
    OCCUPE: 'occupé',
    EN_TRAVAUX: 'en_travaux'
  },
  PAIEMENT: {
    PAYE: 'payé',
    EN_ATTENTE: 'en_attente',
    EN_RETARD: 'en_retard'
  }
}

export const DOCUMENT_TYPES = {
  MANDAT: 'mandat',
  TITRE_PROPRIETE: 'titre_propriete',
  CONTRAT_BAIL: 'contrat_bail'
}

export const DOCUMENT_LABELS = {
  [DOCUMENT_TYPES.MANDAT]: 'Mandat de gestion',
  [DOCUMENT_TYPES.TITRE_PROPRIETE]: 'Titre de propriété',
  [DOCUMENT_TYPES.CONTRAT_BAIL]: 'Contrat de bail'
}
