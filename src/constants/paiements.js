/**
 * Constantes pour le module de paiements
 */

export const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

export const MODES_PAIEMENT = [
  { value: 'especes', label: 'Espèces' },
  { value: 'virement', label: 'Virement bancaire' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'cheque', label: 'Chèque' }
]

export const STATUT_PAIEMENT = {
  PAYE: 'paye',
  PARTIEL: 'partiel',
  IMPAYE: 'impaye'
}

export const STATUT_COLORS = {
  [STATUT_PAIEMENT.PAYE]: 'bg-green-100 text-green-800',
  [STATUT_PAIEMENT.PARTIEL]: 'bg-yellow-100 text-yellow-800',
  [STATUT_PAIEMENT.IMPAYE]: 'bg-red-100 text-red-800'
}

export const STATUT_LABELS = {
  [STATUT_PAIEMENT.PAYE]: 'Payé',
  [STATUT_PAIEMENT.PARTIEL]: 'Partiel',
  [STATUT_PAIEMENT.IMPAYE]: 'Impayé'
}
