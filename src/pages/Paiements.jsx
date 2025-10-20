import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import dataService from '../services/dataService'
import receiptService from '../services/receiptService'
import archiveService from '../services/archiveService'
import ValidationMessage from '../components/ValidationMessage'
import UniversalModal from '../components/UniversalModal'
import PaiementTable from '../components/PaiementTable'
import PaiementFilters from '../components/PaiementFilters'
import PaiementStats from '../components/PaiementStats'
import ImpayesTable from '../components/ImpayesTable'
import ReversementsTable from '../components/ReversementsTable'
import { useNotification } from '../contexts/NotificationContext'
import { MOIS, MODES_PAIEMENT, STATUT_COLORS, STATUT_LABELS } from '../constants/paiements'
import { formatCurrency } from '../utils/formatters'
import {
  validatePaiementForm,
  createGroupedPayments,
  filterPaiementsByPeriod,
  calculateResumePaiements,
  getLocatairesImpayes as calculateLocatairesImpayes,
  getMoisDejaPayes,
  isMoisDisabled
} from '../utils/paiementUtils'
import { BUTTON_PRIMARY_GREEN, BUTTON_SECONDARY, BUTTON_DANGER, ICON_BUTTON_BASE } from '../constants/cssClasses'

// Alias pour cohérence avec le design de cette page
const BUTTON_PRIMARY = BUTTON_PRIMARY_GREEN

function Paiements() {
  const navigate = useNavigate()
  const notification = useNotification()
  const [paiements, setPaiements] = useState([])
  const [locataires, setLocataires] = useState([])
  const [biens, setBiens] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingPaiement, setEditingPaiement] = useState(null)
  const [deleteModal, setDeleteModal] = useState({ show: false, paiement: null })
  const [confirmRemittanceModal, setConfirmRemittanceModal] = useState({ show: false, proprietaire: null, periode: null, paiements: [] })
  const [confirmArchivesModal, setConfirmArchivesModal] = useState(false)
  const [validationErrors, setValidationErrors] = useState([])

  // Filtres de période - par défaut mois/année courants
  const currentDate = new Date()
  const [filtreAnnee, setFiltreAnnee] = useState(currentDate.getFullYear())
  const [filtreMois, setFiltreMois] = useState(currentDate.getMonth() + 1) // getMonth() retourne 0-11
  const [activeTab, setActiveTab] = useState('paiements') // 'paiements', 'impayes' ou 'reversements'

  const [formData, setFormData] = useState({
    locataireId: '',
    moisSelectionnes: [currentDate.getMonth()], // Mois courant présélectionné
    annee: new Date().getFullYear(),
    montantDu: '',
    montantPaye: '',
    datePaiement: new Date().toISOString().split('T')[0], // Date du jour
    modePaiement: 'especes',
    numeroCheque: '',
    numeroMobileMoney: '',
    remarques: ''
  })

  useEffect(() => {
    loadData()
    // Vérifier si on doit archiver automatiquement
    archiveService.checkAndArchiveIfNeeded()
  }, [])

  const loadData = () => {
    setPaiements(dataService.getPaiements())
    setLocataires(dataService.getLocataires())
    setBiens(dataService.getBiens())
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validation du formulaire avec vérification des doublons
    const validation = validatePaiementForm(formData, paiements)
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      return
    }

    // Réinitialiser les erreurs
    setValidationErrors([])

    try {
      // Créer les paiements groupés
      const paiementsToCreate = createGroupedPayments(formData, MOIS)
      const paiementsCreated = []

      // Enregistrer chaque paiement
      paiementsToCreate.forEach(paiementData => {
        if (editingPaiement && formData.moisSelectionnes.length === 1) {
          // Mode édition pour un seul mois
          const updated = dataService.updatePaiement(editingPaiement.id, paiementData)
          if (updated) {
            paiementsCreated.push(updated)
          }
        } else {
          // Nouveau paiement ou paiement multiple
          const created = dataService.addPaiement(paiementData)
          if (created) {
            paiementsCreated.push(created)
          }
        }
      })

      if (paiementsCreated.length === 0) {
        throw new Error('Aucun paiement n\'a pu être créé')
      }

      notification.success(`Paiement enregistré avec succès pour ${paiementsCreated.length} mois !`)
      resetForm()
      loadData()
    } catch (error) {
      setValidationErrors([{
        field: 'general',
        message: `Erreur lors de l'enregistrement: ${error.message}`
      }])
    }
  }

  const resetForm = () => {
    const now = new Date()
    setFormData({
      locataireId: '',
      moisSelectionnes: [now.getMonth()], // Mois courant
      annee: now.getFullYear(),
      montantDu: '',
      montantPaye: '',
      datePaiement: now.toISOString().split('T')[0], // Date du jour
      modePaiement: 'especes',
      numeroCheque: '',
      numeroMobileMoney: '',
      remarques: ''
    })
    setEditingPaiement(null)
    setShowForm(false)
    setValidationErrors([])
  }

  const handleEdit = useCallback((paiement) => {
    // Trouver l'index du mois pour la compatibilité
    const moisIndex = MOIS.findIndex(m => m === paiement.mois)

    setFormData({
      ...paiement,
      moisSelectionnes: moisIndex >= 0 ? [moisIndex] : [],
      datePaiement: paiement.datePaiement ? paiement.datePaiement.split('T')[0] : '',
      numeroCheque: paiement.numeroCheque || '',
      numeroMobileMoney: paiement.numeroMobileMoney || ''
    })
    setEditingPaiement(paiement)
    setShowForm(true)
    setValidationErrors([])
  }, [])

  // Fonction pour gérer la sélection/désélection des mois
  const handleMoisToggle = useCallback((moisIndex) => {
    setFormData(prev => {
      // Vérifier si le mois est désactivé
      const moisStatus = isMoisDisabled(moisIndex, prev.annee, prev.locataireId, paiements, locataires)
      if (moisStatus.disabled) {
        return prev // Ne rien faire si le mois est désactivé
      }

      const nouveauxMois = prev.moisSelectionnes.includes(moisIndex)
        ? prev.moisSelectionnes.filter(m => m !== moisIndex)
        : [...prev.moisSelectionnes, moisIndex].sort((a, b) => a - b)

      // Recalculer le montant dû total si un locataire est sélectionné
      let nouveauMontantDu = prev.montantDu
      if (prev.locataireId && nouveauxMois.length > 0) {
        const locataire = locataires.find(l => l.id === prev.locataireId)
        if (locataire && locataire.montantLoyer) {
          nouveauMontantDu = (parseFloat(locataire.montantLoyer) * nouveauxMois.length).toString()
        }
      }

      return {
        ...prev,
        moisSelectionnes: nouveauxMois,
        montantDu: nouveauMontantDu
      }
    })
  }, [locataires, paiements])

  const handleDelete = useCallback((paiement) => {
    setDeleteModal({ show: true, paiement })
  }, [])

  const confirmDelete = useCallback(() => {
    if (deleteModal.paiement) {
      dataService.deletePaiement(deleteModal.paiement.id)
      loadData()
      setDeleteModal({ show: false, paiement: null })
    }
  }, [deleteModal.paiement])

  const cancelDelete = useCallback(() => {
    setDeleteModal({ show: false, paiement: null })
  }, [])

  const getLocataireInfo = (locataireId) => {
    const locataire = locataires.find(l => l.id === locataireId)
    if (!locataire) return { nom: 'Locataire inconnu', bien: 'Bien inconnu' }

    const bien = biens.find(b => b.id === (locataire.courId || locataire.bienId))
    const bienNom = bien ? (bien.nomCour || `${bien.quartier} ${bien.ville}`) : 'Bien inconnu'

    return {
      nom: `${locataire.prenom} ${locataire.nom}`,
      bien: bienNom
    }
  }

  // Optimisation: Mémoriser les paiements filtrés
  const paiementsFiltres = useMemo(() =>
    filterPaiementsByPeriod(paiements, filtreMois, filtreAnnee, MOIS),
    [paiements, filtreMois, filtreAnnee]
  )

  // Optimisation: Mémoriser le résumé des paiements
  const resume = useMemo(() =>
    calculateResumePaiements(paiementsFiltres, locataires),
    [paiementsFiltres, locataires]
  )

  // Optimisation: Mémoriser les locataires impayés
  const locatairesImpayes = useMemo(() =>
    calculateLocatairesImpayes(paiementsFiltres, locataires),
    [paiementsFiltres, locataires]
  )

  // Fonction legacy pour compatibilité (sera utilisée dans les composants non refactorisés)
  const getPaiementsFiltres = useCallback(() => paiementsFiltres, [paiementsFiltres])
  const getResumePaiements = useCallback(() => resume, [resume])
  const getLocatairesImpayes = useCallback(() => locatairesImpayes, [locatairesImpayes])

  // Calculer les reversements pour chaque propriétaire - Mémorisé pour performance
  const reversementsProprietaires = useMemo(() => {
    const paiementsFiltres = getPaiementsFiltres()
    const proprietaires = dataService.getProprietaires()
    const periode = `${MOIS[filtreMois - 1]} ${filtreAnnee}`

    // Récupérer les reversements déjà archivés pour cette période
    const archivedRemittances = archiveService.getArchivedRemittances()
    const archivedForCurrentPeriod = archivedRemittances.filter(archive =>
      archive.periode === periode
    )


    return proprietaires.map(proprietaire => {
      // Trouver tous les biens de ce propriétaire
      const biensProprietaire = biens.filter(bien => bien.proprietaireId === proprietaire.id)
      
      let montantAReversser = 0
      let montantImpaye = 0
      let totalAttendu = 0
      let detailsBiens = []
      
      biensProprietaire.forEach(bien => {
        // Trouver tous les locataires de ce bien
        const locatairesBien = locataires.filter(loc => 
          loc.courId === bien.id && loc.statut === 'actif' && loc.montantLoyer
        )
        
        locatairesBien.forEach(locataire => {
          const montantDu = parseFloat(locataire.montantLoyer) || 0
          totalAttendu += montantDu
          
          // Calculer le montant total payé par ce locataire pour cette période
          const paiementsLocataire = paiementsFiltres.filter(p => p.locataireId === locataire.id)
          let montantTotalPaye = 0

          paiementsLocataire.forEach(paiement => {
            // Compter le montantPaye de chaque paiement (déjà la portion correcte pour le mois)
            montantTotalPaye += parseFloat(paiement.montantPaye) || 0
          })
          
          montantAReversser += montantTotalPaye
          montantImpaye += (montantDu - montantTotalPaye)
          
          // Ajouter aux détails si il y a du mouvement (paiement ou impayé)
          if (montantDu > 0) {
            detailsBiens.push({
              bien: bien,
              locataire: locataire,
              montantDu,
              montantPaye: montantTotalPaye,
              montantImpaye: montantDu - montantTotalPaye
            })
          }
        })
      })
      
      // Vérifier si ce propriétaire a déjà un reversement archivé pour cette période
      const dejaArchive = archivedForCurrentPeriod.some(archive => 
        archive.proprietaireId === proprietaire.id
      )
      
      
      // Si déjà archivé, ne pas afficher de montant à reverser
      if (dejaArchive) {
        montantAReversser = 0
      }
      
      return {
        ...proprietaire,
        montantAReversser,
        montantImpaye: Math.max(0, montantImpaye),
        totalAttendu,
        nombreBiens: biensProprietaire.length,
        detailsBiens: detailsBiens.filter(d => d.montantDu > 0) // Seulement les biens avec des locataires
      }
    }).filter(p => p.totalAttendu > 0) // Seulement les propriétaires avec des revenus attendus
  }, [paiementsFiltres, biens, locataires, filtreMois, filtreAnnee, getPaiementsFiltres])

  // Fonction pour imprimer un reçu de paiement - Mémorisé
  const handlePrintPaymentReceipt = useCallback((paiement) => {
    const locataire = locataires.find(l => l.id === paiement.locataireId)
    const bien = biens.find(b => b.id === (locataire?.courId || locataire?.bienId))
    
    if (locataire && bien) {
      if (paiement.paiementMultiple) {
        // Pour les paiements multiples, créer un reçu groupé
        const paiementFormate = {
          ...paiement,
          montant: paiement.montantTotalPaye || (paiement.montantPaye * paiement.totalMoisPayes),
          moisConcerne: paiement.moisDuGroupe?.join(', ') || `${paiement.mois} et ${paiement.totalMoisPayes - 1} autre(s) mois`,
          modePaiement: MODES_PAIEMENT.find(m => m.value === paiement.modePaiement)?.label || paiement.modePaiement,
          notes: paiement.remarques,
          isPaiementMultiple: true,
          nombreMois: paiement.totalMoisPayes,
          montantParMois: paiement.montantPaye
        }
        
        receiptService.printPaymentReceipt(paiementFormate, locataire, bien)
      } else {
        // Pour les paiements simples
        const paiementFormate = {
          ...paiement,
          montant: paiement.montantPaye || 0,
          moisConcerne: `${paiement.mois} ${paiement.annee}`,
          modePaiement: MODES_PAIEMENT.find(m => m.value === paiement.modePaiement)?.label || paiement.modePaiement,
          notes: paiement.remarques
        }
        
        receiptService.printPaymentReceipt(paiementFormate, locataire, bien)
      }
    }
  }, [locataires, biens])

  // Fonction pour imprimer un reçu de reversement
  const handlePrintRemittanceReceipt = (proprietaire) => {
    const paiementsFiltres = getPaiementsFiltres()
    
    // Créer la liste des paiements pour ce propriétaire
    const paiementsProprietaire = []
    
    proprietaire.detailsBiens.forEach(detail => {
      if (detail.montantPaye > 0) {
        const paiement = paiementsFiltres.find(p => p.locataireId === detail.locataire.id)
        if (paiement) {
          paiementsProprietaire.push({
            ...paiement,
            montant: detail.montantPaye,
            locataireNom: `${detail.locataire.prenom} ${detail.locataire.nom}`,
            bienNom: detail.bien.nomCour || `${detail.bien.quartier} ${detail.bien.ville}`
          })
        }
      }
    })
    
    const periode = `${MOIS[filtreMois - 1]} ${filtreAnnee}`
    receiptService.printRemittanceReceipt(paiementsProprietaire, proprietaire, periode)
  }

  // Fonction pour valider et archiver un reversement
  const handleValidateRemittance = (proprietaire) => {
    try {
      
      // Vérifier si archiveService est bien importé
      if (!archiveService) {
        notification.error('Erreur: Service d\'archivage non disponible')
        return
      }
      
      const paiementsFiltres = getPaiementsFiltres()
      const periode = `${MOIS[filtreMois - 1]} ${filtreAnnee}`
      
      
      // Créer la liste des paiements pour ce propriétaire
      const paiementsProprietaire = []
      
      proprietaire.detailsBiens.forEach(detail => {
        if (detail.montantPaye > 0) {
          const paiement = paiementsFiltres.find(p => p.locataireId === detail.locataire.id)
          if (paiement) {
            paiementsProprietaire.push({
              ...paiement,
              montant: detail.montantPaye,
              locataireNom: `${detail.locataire.prenom} ${detail.locataire.nom}`,
              bienNom: detail.bien.nomCour || `${detail.bien.quartier} ${detail.bien.ville}`
            })
          }
        }
      })
      
      
      if (paiementsProprietaire.length === 0) {
        notification.warning('Aucun paiement à reverser pour ce propriétaire.')
        return
      }

      // Ouvrir le modal de confirmation
      setConfirmRemittanceModal({
        show: true,
        proprietaire,
        periode,
        paiements: paiementsProprietaire
      })
    } catch (error) {
      notification.error(`Erreur lors de la validation du reversement: ${error.message}`)
    }
  }

  // Fonction confirmée après modal
  const confirmRemittance = useCallback(() => {
    try {
      const { proprietaire, periode, paiements: paiementsProprietaire } = confirmRemittanceModal

      // Archiver le reversement
      const archived = archiveService.validateAndArchiveRemittance(proprietaire, periode, paiementsProprietaire)

      if (!archived) {
        notification.error('Erreur: L\'archive n\'a pas pu être créée')
        return
      }

      // Message de succès avec notification
      notification.success(`Reversement validé et archivé avec succès ! Montant net: ${formatCurrency(archived.montantNet)}`)

      // Recharger les données pour mettre à jour l'affichage
      loadData()

      // Fermer le modal de reversement
      setConfirmRemittanceModal({ show: false, proprietaire: null, periode: null, paiements: [] })

      // Ouvrir le modal pour demander si on veut voir les archives
      setConfirmArchivesModal(true)
    } catch (error) {
      notification.error(`Erreur lors de la confirmation du reversement: ${error.message}`)
    }
  }, [confirmRemittanceModal, loadData, navigate, notification])

  return (
    <div className="dashboard-background">
      <div className="max-w-[1920px] mx-auto space-y-6 p-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Suivi des Paiements</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            {MOIS[filtreMois - 1]} {filtreAnnee} - Gérer les paiements de loyers
            {(filtreMois === currentDate.getMonth() + 1 && filtreAnnee === currentDate.getFullYear()) && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-2">
                🟢 Mois actuel
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className={`${BUTTON_PRIMARY} flex items-center`}
          disabled={locataires.length === 0}
        >
          <span className="mr-2">+</span>
          Nouveau Paiement
        </button>
      </div>

      {/* Filtres de période */}
      <PaiementFilters
        filtreMois={filtreMois}
        filtreAnnee={filtreAnnee}
        onMoisChange={setFiltreMois}
        onAnneeChange={setFiltreAnnee}
        onResetToCurrentMonth={() => {
          setFiltreMois(currentDate.getMonth() + 1)
          setFiltreAnnee(currentDate.getFullYear())
        }}
      />

      {/* Résumé financier */}
      <PaiementStats resume={resume} filtreMois={filtreMois} />

      {/* Message si pas de locataires */}
      {locataires.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="text-yellow-600 text-xl mr-3">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Aucun locataire disponible
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Vous devez d'abord enregistrer des locataires avant de pouvoir saisir des paiements.
              </p>
              <div className="mt-2">
                <button
                  onClick={() => navigate('/locataires')}
                  className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200"
                >
                  Aller aux locataires
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingPaiement ? 'Modifier' : 'Nouveau'} Paiement
            </h3>

            <ValidationMessage errors={validationErrors} />

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Locataire *
                </label>
                <select
                  value={formData.locataireId}
                  onChange={(e) => {
                    const locataireId = e.target.value
                    const locataire = locataires.find(l => l.id === locataireId)
                    const montantMensuel = parseFloat(locataire?.montantLoyer) || 0

                    // Nettoyer les mois sélectionnés en enlevant ceux qui sont désactivés
                    const moisValides = formData.moisSelectionnes.filter(moisIndex => {
                      const moisStatus = isMoisDisabled(moisIndex, formData.annee, locataireId, paiements, locataires)
                      return !moisStatus.disabled
                    })

                    const montantTotal = montantMensuel * Math.max(1, moisValides.length)
                    setFormData({
                      ...formData,
                      locataireId,
                      moisSelectionnes: moisValides,
                      montantDu: montantTotal.toString()
                    })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Sélectionner un locataire</option>
                  {locataires.map(locataire => {
                    const info = getLocataireInfo(locataire.id)
                    return (
                      <option key={locataire.id} value={locataire.id}>
                        {info.nom} - {info.bien}
                      </option>
                    )
                  })}
                </select>
              </div>

              {/* Sélection des mois */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mois concernés *
                  {formData.moisSelectionnes.length > 0 && (
                    <span className="text-green-600 ml-2">
                      ({formData.moisSelectionnes.length} mois sélectionné{formData.moisSelectionnes.length > 1 ? 's' : ''})
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-2">
                  {MOIS.map((moisNom, index) => {
                    // Vérifier si le mois doit être désactivé
                    const moisStatus = isMoisDisabled(index, formData.annee, formData.locataireId, paiements, locataires)

                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => !moisStatus.disabled && handleMoisToggle(index)}
                        disabled={moisStatus.disabled}
                        title={moisStatus.disabled ? moisStatus.reason : "Cliquer pour sélectionner"}
                        className={`px-3 py-2 text-xs rounded-md border transition-colors ${
                          moisStatus.disabled
                            ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed opacity-60'
                            : formData.moisSelectionnes.includes(index)
                            ? 'bg-green-100 border-green-500 text-green-700'
                            : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {moisStatus.reason.startsWith('✓') && '✓ '}{moisNom.slice(0, 3)}
                      </button>
                    )
                  })}
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Sélectionner les 3 prochains mois à partir du mois courant (seulement les valides)
                      const currentMonth = new Date().getMonth()
                      const prochainsMois = Array.from({length: 3}, (_, i) => (currentMonth + i) % 12)
                        .filter(moisIndex => {
                          const moisStatus = isMoisDisabled(moisIndex, formData.annee, formData.locataireId, paiements, locataires)
                          return !moisStatus.disabled
                        })

                      setFormData(prev => ({
                        ...prev,
                        moisSelectionnes: prochainsMois,
                        montantDu: prev.locataireId ?
                          (parseFloat(locataires.find(l => l.id === prev.locataireId)?.montantLoyer || 0) * prochainsMois.length).toString() :
                          prev.montantDu
                      }))
                    }}
                    className="px-3 py-1 bg-blue-50 text-blue-600 rounded text-xs hover:bg-blue-100"
                  >
                    3 prochains mois
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({...prev, moisSelectionnes: []}))}
                    className="px-3 py-1 bg-gray-50 text-gray-600 rounded text-xs hover:bg-gray-100"
                  >
                    Effacer
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Année *
                </label>
                <input
                  type="number"
                  value={formData.annee}
                  onChange={(e) => {
                    const nouvelleAnnee = parseInt(e.target.value)

                    // Nettoyer les mois sélectionnés en enlevant ceux qui deviennent désactivés avec la nouvelle année
                    const moisValides = formData.moisSelectionnes.filter(moisIndex => {
                      const moisStatus = isMoisDisabled(moisIndex, nouvelleAnnee, formData.locataireId, paiements, locataires)
                      return !moisStatus.disabled
                    })

                    const locataire = locataires.find(l => l.id === formData.locataireId)
                    const montantMensuel = parseFloat(locataire?.montantLoyer) || 0
                    const montantTotal = montantMensuel * Math.max(1, moisValides.length)

                    setFormData({
                      ...formData,
                      annee: nouvelleAnnee,
                      moisSelectionnes: moisValides,
                      montantDu: montantTotal.toString()
                    })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  min="2020"
                  max="2030"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Montant dû (FCFA) *
                  </label>
                  <input
                    type="number"
                    value={formData.montantDu}
                    onChange={(e) => setFormData({...formData, montantDu: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Montant payé (FCFA) *
                  </label>
                  <input
                    type="number"
                    value={formData.montantPaye}
                    onChange={(e) => setFormData({...formData, montantPaye: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Entrer le montant payé"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de paiement
                  </label>
                  <input
                    type="date"
                    value={formData.datePaiement}
                    onChange={(e) => setFormData({...formData, datePaiement: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mode de paiement
                  </label>
                  <select
                    value={formData.modePaiement}
                    onChange={(e) => setFormData({...formData, modePaiement: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {MODES_PAIEMENT.map(mode => (
                      <option key={mode.value} value={mode.value}>
                        {mode.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Champ numéro de chèque (conditionnel) */}
              {formData.modePaiement === 'cheque' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numéro de chèque *
                  </label>
                  <input
                    type="text"
                    value={formData.numeroCheque}
                    onChange={(e) => setFormData({...formData, numeroCheque: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Numéro du chèque"
                    required
                  />
                </div>
              )}

              {/* Champ numéro Mobile Money (conditionnel) */}
              {formData.modePaiement === 'mobile_money' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numéro de paiement Mobile Money *
                  </label>
                  <input
                    type="text"
                    value={formData.numeroMobileMoney}
                    onChange={(e) => setFormData({...formData, numeroMobileMoney: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Numéro de transaction Mobile Money"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remarques
                </label>
                <textarea
                  value={formData.remarques}
                  onChange={(e) => setFormData({...formData, remarques: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows="3"
                  placeholder="Notes ou remarques sur le paiement..."
                />
              </div>

              {/* Aperçu du paiement */}
              {(formData.montantDu || formData.moisSelectionnes.length > 0) && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Aperçu du paiement</h4>
                  <div className="text-sm text-gray-600">
                    {formData.moisSelectionnes.length > 0 && (
                      <div className="flex justify-between mb-1">
                        <span>Mois sélectionnés:</span>
                        <span className="font-medium">
                          {formData.moisSelectionnes.map(i => MOIS[i].slice(0, 3)).join(', ')} ({formData.moisSelectionnes.length})
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between mb-1">
                      <span>Montant dû total:</span>
                      <span className="font-medium">{formatCurrency(formData.montantDu || 0)}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span>Montant payé total:</span>
                      <span className="font-medium">{formatCurrency(formData.montantPaye || 0)}</span>
                    </div>
                    {formData.moisSelectionnes.length > 1 && formData.montantPaye > 0 && (
                      <div className="flex justify-between mb-1 text-blue-600">
                        <span>Par mois:</span>
                        <span className="font-medium">
                          {formatCurrency(parseFloat(formData.montantPaye) / formData.moisSelectionnes.length)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium text-gray-900 border-t pt-2 mt-2">
                      <span>Montant restant:</span>
                      <span className={
                        (parseFloat(formData.montantDu || 0) - parseFloat(formData.montantPaye || 0)) > 0 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }>
                        {formatCurrency(Math.max(0, parseFloat(formData.montantDu || 0) - parseFloat(formData.montantPaye || 0)))}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className={BUTTON_SECONDARY}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className={BUTTON_PRIMARY}
                >
                  {editingPaiement ? 'Modifier' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Onglets et contenu */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Onglets */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('paiements')}
              className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'paiements'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tous paiements ({getPaiementsFiltres().length})
            </button>
            <button
              onClick={() => setActiveTab('impayes')}
              className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'impayes'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Impayés ({getLocatairesImpayes().length})
            </button>
            <button
              onClick={() => setActiveTab('reversements')}
              className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'reversements'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Reversements ({reversementsProprietaires.length})
            </button>
            <button
              onClick={() => setActiveTab('archives')}
              className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'archives'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Archives 🗄️
            </button>
          </nav>
        </div>

        {/* Contenu des onglets */}
        <div>
        {activeTab === 'paiements' && (
          <PaiementTable
            paiements={getPaiementsFiltres()}
            locataires={locataires}
            biens={biens}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPrintReceipt={handlePrintPaymentReceipt}
            filtreMois={filtreMois}
            filtreAnnee={filtreAnnee}
          />
        )}

        {activeTab === 'impayes' && (
          <ImpayesTable
            locatairesImpayes={getLocatairesImpayes()}
            biens={biens}
            filtreMois={filtreMois}
            filtreAnnee={filtreAnnee}
            onPaymentClick={(locataire) => {
              setFormData({
                locataireId: locataire.id,
                moisSelectionnes: [filtreMois - 1],
                annee: filtreAnnee,
                montantDu: locataire.montantDu.toString(),
                montantPaye: '',
                datePaiement: new Date().toISOString().split('T')[0],
                modePaiement: 'especes',
                numeroCheque: '',
                numeroMobileMoney: '',
                remarques: ''
              })
              setShowForm(true)
            }}
          />
        )}

        {activeTab === 'reversements' && (
          <ReversementsTable
            proprietaires={reversementsProprietaires}
            onPrintRemittanceReceipt={handlePrintRemittanceReceipt}
            onValidateRemittance={handleValidateRemittance}
          />
        )}

        {activeTab === 'archives' && (
          <div className="p-6">
            <div className="text-center py-12">
              <div className="text-gray-400 text-5xl mb-4">🗄️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Archives des Paiements et Reversements
              </h3>
              <p className="text-gray-600 mb-4">
                L'onglet Archives complet est disponible dans une page dédiée pour une meilleure expérience.
              </p>
              <button
                onClick={() => navigate('/archives')}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 inline-flex items-center gap-2"
              >
                🗄️ Aller aux Archives complètes
              </button>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fadeIn">
            <div className="flex flex-col items-center text-center">
              {/* Icône d'avertissement */}
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>

              {/* Titre */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Confirmer la suppression
              </h3>

              {/* Message */}
              <p className="text-gray-600 mb-6">
                Êtes-vous sûr de vouloir supprimer le paiement de{' '}
                <span className="font-semibold text-gray-900">
                  {deleteModal.paiement && getLocataireInfo(deleteModal.paiement.locataireId).nom}
                </span>
                {' '}pour{' '}
                <span className="font-semibold text-gray-900">
                  {deleteModal.paiement?.mois} {deleteModal.paiement?.annee}
                </span>
                {' '}?
                <br />
                <span className="text-sm text-red-600 mt-2 block">
                  Cette action est irréversible.
                </span>
              </p>

              {/* Boutons */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={cancelDelete}
                  className={`flex-1 ${BUTTON_SECONDARY}`}
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDelete}
                  className={`flex-1 ${BUTTON_DANGER}`}
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation du reversement */}
      {confirmRemittanceModal.show && confirmRemittanceModal.proprietaire && (
        <UniversalModal
          variant="confirm"
          isOpen={confirmRemittanceModal.show}
          onClose={() => setConfirmRemittanceModal({ show: false, proprietaire: null, periode: null, paiements: [] })}
          onConfirm={confirmRemittance}
          title="Confirmer le reversement"
          message={`Confirmer le reversement de ${formatCurrency(confirmRemittanceModal.proprietaire.montantAReversser)} à ${confirmRemittanceModal.proprietaire.prenom} ${confirmRemittanceModal.proprietaire.nom} pour ${confirmRemittanceModal.periode} ?\n\nCommission (10%): ${formatCurrency(confirmRemittanceModal.proprietaire.montantAReversser * 0.1)}\nMontant net: ${formatCurrency(confirmRemittanceModal.proprietaire.montantAReversser * 0.9)}`}
          confirmText="Valider le reversement"
          cancelText="Annuler"
        />
      )}

      {/* Modal pour voir les archives */}
      <UniversalModal
        variant="info"
        isOpen={confirmArchivesModal}
        onClose={() => setConfirmArchivesModal(false)}
        onConfirm={() => navigate('/archives')}
        title="Reversement archivé"
        message="Le reversement a été validé et archivé avec succès.\n\nVoulez-vous consulter les archives maintenant ?"
        confirmText="Voir les archives"
        cancelText="Fermer"
      />
      </div>
    </div>
  )
}

export default Paiements