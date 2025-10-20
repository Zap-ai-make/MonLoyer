import { z } from 'zod'

/**
 * Schémas de validation Zod pour l'application Woning
 * Centralise toute la logique de validation des données
 */

// ====================  SCHÉMAS COMMUNS ====================

/**
 * Schéma pour un téléphone burkinabè
 * Amélioré pour éviter ReDoS avec limitation de longueur avant regex
 */
const phoneSchema = z.union([
  z.string()
    .max(20, 'Numéro de téléphone trop long')
    .regex(/^[\+]?[\d\s\-()]{8,15}$/, 'Format de téléphone invalide (8-15 chiffres)'),
  z.literal(''),
  z.undefined()
]).optional()

/**
 * Schéma pour un email
 */
const emailSchema = z.union([
  z.string().email('Adresse email invalide'),
  z.literal(''),
  z.undefined()
]).optional()

/**
 * Schéma pour un montant en FCFA
 * Validation stricte - rejette les entrées invalides au lieu de coercion silencieuse
 */
const montantSchema = z.union([
  z.number().nonnegative('Le montant doit être positif'),
  z.string()
    .trim()
    .refine(val => val === '' || !isNaN(parseFloat(val)), {
      message: 'Le montant doit être un nombre valide'
    })
    .transform(val => val === '' ? 0 : parseFloat(val))
    .pipe(z.number().nonnegative('Le montant doit être positif'))
])

// ====================  PROPRIÉTAIRE  ====================

export const ProprietaireSchema = z.object({
  nom: z.string()
    .trim()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne doit pas dépasser 100 caractères'),

  prenom: z.string()
    .trim()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(100, 'Le prénom ne doit pas dépasser 100 caractères'),

  telephone: phoneSchema,

  email: emailSchema,

  adresse: z.string().optional(),

  pieceIdentite: z.string().optional(),

  ifu: z.string().optional(),

  references: z.string().optional()
}).strict()

// ====================  BIEN IMMOBILIER  ====================

export const BienSchema = z.object({
  proprietaireId: z.string()
    .min(1, 'Le propriétaire est obligatoire'),

  type: z.enum(['appartement', 'maison', 'studio', 'bureau', 'commerce', 'terrain', 'cour_commune', 'cour_unique', 'magasin'], {
    errorMap: () => ({ message: 'Type de bien invalide' })
  }),

  adresse: z.string()
    .min(5, 'L\'adresse doit contenir au moins 5 caractères')
    .optional(),

  ville: z.string()
    .min(2, 'La ville doit contenir au moins 2 caractères')
    .optional(),

  commune: z.string().optional(),

  secteur: z.string().optional(),

  quartier: z.string().optional(),

  montantLoyer: montantSchema,

  superficie: z.union([
    z.number().positive('La superficie doit être positive'),
    z.string()
      .trim()
      .transform(val => val.replace(',', '.')) // Remplacer virgule par point
      .refine(val => val === '' || !isNaN(parseFloat(val)), {
        message: 'La superficie doit être un nombre valide'
      })
      .transform(val => val === '' ? undefined : parseFloat(val))
  ]).optional(),

  nombrePieces: z.union([
    z.number().int('Le nombre de pièces doit être un entier').min(0),
    z.string()
      .trim()
      .refine(val => val === '' || (Number.isInteger(Number(val)) && Number(val) >= 0), {
        message: 'Le nombre de pièces doit être un entier positif'
      })
      .transform(val => val === '' ? undefined : parseInt(val, 10))
  ]).optional(),

  nombreChambres: z.union([
    z.number().int('Le nombre de chambres doit être un entier').min(0),
    z.string()
      .trim()
      .refine(val => val === '' || (Number.isInteger(Number(val)) && Number(val) >= 0), {
        message: 'Le nombre de chambres doit être un entier positif'
      })
      .transform(val => val === '' ? undefined : parseInt(val, 10))
  ]).optional(),

  nombreMaisons: z.union([
    z.number().int('Le nombre de maisons doit être un entier').min(1, 'Au moins 1 maison').max(50, 'Maximum 50 maisons'),
    z.string()
      .trim()
      .refine(val => val === '' || (Number.isInteger(Number(val)) && Number(val) >= 1 && Number(val) <= 50), {
        message: 'Le nombre de maisons doit être entre 1 et 50'
      })
      .transform(val => val === '' ? undefined : parseInt(val, 10))
  ]).optional(),

  description: z.string().optional(),

  statut: z.enum(['libre', 'occupé', 'occupée', 'en_renovation'], {
    errorMap: () => ({ message: 'Statut invalide' })
  }).optional(),

  // Coordonnées GPS
  latitude: z.union([
    z.number(),
    z.string()
      .trim()
      .transform(val => val.replace(',', '.')) // Remplacer virgule par point
      .refine(val => val === '' || !isNaN(parseFloat(val)), {
        message: 'La latitude doit être un nombre valide'
      })
      .transform(val => val === '' ? undefined : parseFloat(val))
  ]).optional(),

  longitude: z.union([
    z.number(),
    z.string()
      .trim()
      .transform(val => val.replace(',', '.')) // Remplacer virgule par point
      .refine(val => val === '' || !isNaN(parseFloat(val)), {
        message: 'La longitude doit être un nombre valide'
      })
      .transform(val => val === '' ? undefined : parseFloat(val))
  ]).optional(),

  // Compteurs
  compteurEau: z.string().optional(),
  compteurElectricite: z.string().optional(),

  // Images
  images: z.union([
    z.array(z.string()),
    z.string()
  ]).optional().transform(val => {
    if (Array.isArray(val)) return val
    if (typeof val === 'string' && val) return [val]
    return []
  }),

  // Champs dynamiques pour compteurs (cour commune)
  // Format: compteurEau_1, compteurElectricite_1, etc.
}).catchall(
  z.string().max(100).optional()
).refine(data => {
  // Valider que les champs passthrough sont bien des compteurs
  const allowedPatterns = [/^compteurEau_\d+$/, /^compteurElectricite_\d+$/]
  const extraKeys = Object.keys(data).filter(key =>
    !['proprietaireId', 'type', 'adresse', 'ville', 'commune', 'secteur', 'quartier',
      'montantLoyer', 'superficie', 'nombrePieces', 'nombreChambres', 'nombreMaisons',
      'description', 'statut', 'latitude', 'longitude', 'compteurEau', 'compteurElectricite', 'images'].includes(key)
  )
  return extraKeys.every(key =>
    allowedPatterns.some(pattern => pattern.test(key))
  )
}, {
  message: 'Champs non autorisés détectés. Seuls les compteurs sont permis (compteurEau_X, compteurElectricite_X)'
})

// ====================  LOCATAIRE  ====================

export const LocataireSchema = z.object({
  nom: z.string()
    .trim()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne doit pas dépasser 100 caractères'),

  prenom: z.string()
    .trim()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(100, 'Le prénom ne doit pas dépasser 100 caractères'),

  telephone: phoneSchema,

  courId: z.string()
    .min(1, 'Le bien est obligatoire'),

  numeroMaison: z.union([
    z.number().int('Le numéro de maison doit être un entier').positive('Le numéro de maison doit être positif'),
    z.string()
      .trim()
      .refine(val => val === '' || (Number.isInteger(Number(val)) && Number(val) > 0), {
        message: 'Le numéro de maison doit être un entier positif'
      })
      .transform(val => val === '' ? undefined : parseInt(val, 10))
  ]).optional(),

  montantLoyer: montantSchema.refine(val => val > 0, {
    message: 'Le montant du loyer doit être supérieur à 0'
  }),

  caution: montantSchema.optional(),

  dateEntree: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)')
    .optional()
    .or(z.literal('')),

  pieceIdentite: z.string().optional(),

  profession: z.string().optional(),

  adresse: z.string().optional(),

  observations: z.string().optional(),

  statut: z.enum(['actif', 'inactif', 'archive'], {
    errorMap: () => ({ message: 'Statut invalide' })
  }).optional()
}).strict()

// ====================  PAIEMENT  ====================

export const PaiementSchema = z.object({
  locataireId: z.string()
    .min(1, 'Le locataire est obligatoire'),

  courId: z.string().optional(),

  mois: z.union([
    z.number().int().min(1).max(12),
    z.enum([
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ])
  ], {
    errorMap: () => ({ message: 'Mois invalide' })
  }),

  annee: z.union([
    z.number().int('L\'année doit être un entier'),
    z.string()
      .trim()
      .refine(val => !isNaN(parseInt(val, 10)), {
        message: 'L\'année doit être un nombre valide'
      })
      .transform(val => parseInt(val, 10))
  ])
    .pipe(z.number()
      .int('L\'année doit être un entier')
      .min(2020, 'L\'année doit être >= 2020')
      .refine(val => val <= new Date().getFullYear() + 1, {
        message: 'L\'année ne peut pas être supérieure à l\'année prochaine'
      })
    ),

  montantLoyer: montantSchema.optional(),

  montantPaye: montantSchema,

  montantDu: montantSchema.optional(),

  montantRestant: montantSchema.optional(),

  datePaiement: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}T?/, 'Format de date invalide')
    .optional()
    .or(z.date().transform(d => d.toISOString())),

  methodePaiement: z.enum(['especes', 'virement', 'cheque', 'mobile_money'], {
    errorMap: () => ({ message: 'Mode de paiement invalide' })
  }).optional(),

  modePaiement: z.enum(['especes', 'virement', 'cheque', 'mobile_money'], {
    errorMap: () => ({ message: 'Mode de paiement invalide' })
  }).optional(),

  notes: z.string().optional(),

  remarques: z.string().optional(),

  numeroPaiement: z.string().optional(),

  numeroCheque: z.string().optional(),

  numeroMobileMoney: z.string().optional(),

  statut: z.string().optional(),

  paiementMultiple: z.boolean().optional(),

  moisConcernes: z.array(z.string()).optional(),

  moisIndex: z.number().optional(),

  totalMoisPayes: z.number().optional(),

  montantTotalPaye: montantSchema.optional(),

  indexInGroup: z.number().optional(),

  isPremierDuGroupe: z.boolean().optional(),

  moisDuGroupe: z.array(z.any()).optional(),

  groupeId: z.string().nullable().optional()
}).passthrough()

// ====================  DOCUMENT  ====================

export const DocumentSchema = z.object({
  owner_type: z.enum(['proprietaire', 'locataire', 'bien'], {
    errorMap: () => ({ message: 'Type de propriétaire invalide' })
  }),

  owner_id: z.string()
    .min(1, 'L\'identifiant du propriétaire est obligatoire'),

  type: z.enum(['mandat', 'titre_propriete', 'contrat_bail'], {
    errorMap: () => ({ message: 'Type de document invalide' })
  }),

  filename: z.string()
    .min(1, 'Le nom du fichier est obligatoire'),

  url: z.string()
    .min(1, 'L\'URL du document est obligatoire'),

  generated: z.boolean().default(false)
}).strict()

// ====================  ARCHIVE  ====================

export const ArchiveSchema = z.object({
  type: z.enum(['bien', 'locataire'], {
    errorMap: () => ({ message: 'Type d\'archive invalide' })
  }),

  entityId: z.string()
    .min(1, 'L\'identifiant de l\'entité est obligatoire'),

  entityType: z.string(),

  entityData: z.record(z.any()), // Données de l'entité archivée (clé-valeur)

  reason: z.string().optional(),

  archivedBy: z.string().optional()
}).strict()

// ====================  CONFIGURATION AGENCE  ====================

export const ConfigSchema = z.object({
  agencyName: z.string()
    .min(2, 'Le nom de l\'agence doit contenir au moins 2 caractères'),

  logo: z.string().nullable().optional(),

  ifu: z.string().optional(),

  phone: phoneSchema,

  email: emailSchema,

  address: z.string().optional(),

  city: z.string().optional(),

  country: z.string().optional(),

  website: z.string()
    .url('URL invalide')
    .optional()
    .or(z.literal('')),

  bankAccount: z.string().optional(),

  bankName: z.string().optional(),

  managerName: z.string().optional(),

  managerTitle: z.string().optional(),

  // Champs pour contrat de bail
  nomResponsable: z.string().optional(),
  prenomResponsable: z.string().optional(),
  pieceIdentite: z.string().optional(),
  dateEtablissementPiece: z.string().optional(),
  lieuEtablissementPiece: z.string().optional(),
  bp: z.string().optional(),
  lot: z.string().optional(),
  parcelles: z.string().optional(),
  section: z.string().optional(),
  secteur: z.string().optional(),
  commune: z.string().optional(),
  quartier: z.string().optional(),
  rueNumero: z.string().optional(),
  porteNumero: z.string().optional(),
  profession: z.string().optional(),
  ciDessusDesigne: z.string().optional()
}).strict() // Configuration stricte pour sécurité

// ====================  EXPORTS  ====================

export default {
  ProprietaireSchema,
  BienSchema,
  LocataireSchema,
  PaiementSchema,
  DocumentSchema,
  ArchiveSchema,
  ConfigSchema
}

/**
 * Helper pour valider des données avec gestion d'erreurs
 * @param {z.ZodSchema} schema - Schéma Zod
 * @param {any} data - Données à valider
 * @returns {{ success: boolean, data?: any, errors?: any }}
 */
export const validate = (schema, data) => {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    return { success: false, errors: error.errors }
  }
}

/**
 * Helper pour validation asynchrone avec Promise
 * @param {z.ZodSchema} schema - Schéma Zod
 * @param {any} data - Données à valider
 * @returns {Promise<any>} Données validées ou rejection avec erreurs
 */
export const validateAsync = async (schema, data) => {
  return schema.parseAsync(data)
}
