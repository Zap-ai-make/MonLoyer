import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit2, Trash2 } from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { useCrudOperations } from '../hooks/useCrudOperations'
import Tooltip from '../components/Tooltip'
import ProprietaireForm from '../components/ProprietaireForm'
import UniversalModal from '../components/UniversalModal'
import DataTable from '../components/DataTable'
import { BUTTON_PRIMARY_GREEN, ICON_BUTTON_BASE } from '../constants/cssClasses'
import { formatDate } from '../utils/formatters'

function Proprietaires() {
  const { proprietaires, biens, locataires, paiements } = useData()
  const navigate = useNavigate()

  const {
    showForm,
    editingItem: editingProprietaire,
    deleteModal,
    openCreateForm,
    openEditForm,
    closeForm,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete
  } = useCrudOperations('proprietaires')

  const getBiensCount = (proprietaireId) => {
    return biens.filter(b => b.proprietaireId === proprietaireId).length
  }

  const getLastPaiementDate = (proprietaireId) => {
    // Récupérer tous les biens du propriétaire
    const proprietaireBiens = biens.filter(b => b.proprietaireId === proprietaireId)

    if (proprietaireBiens.length === 0) return null

    // Récupérer tous les locataires de ces biens
    const locataireIds = new Set()
    proprietaireBiens.forEach(bien => {
      if (bien.type === 'cour_commune' && bien.maisons) {
        bien.maisons.forEach(maison => {
          if (maison.locataireId) locataireIds.add(maison.locataireId)
        })
      } else if (bien.locataireId) {
        locataireIds.add(bien.locataireId)
      }
    })

    if (locataireIds.size === 0) return null

    // Trouver le dernier paiement de ces locataires
    const proprietairePaiements = paiements.filter(p => locataireIds.has(p.locataireId))

    if (proprietairePaiements.length === 0) return null

    // Trier par date décroissante et prendre le plus récent
    const sortedPaiements = proprietairePaiements.sort((a, b) =>
      new Date(b.datePaiement) - new Date(a.datePaiement)
    )

    return sortedPaiements[0].datePaiement
  }

  const getLastPaiementStatus = (lastPaiementDate) => {
    if (!lastPaiementDate) return 'none'

    const daysSince = Math.floor((new Date() - new Date(lastPaiementDate)) / (1000 * 60 * 60 * 24))

    if (daysSince <= 30) return 'recent'
    if (daysSince <= 60) return 'warning'
    return 'danger'
  }

  const handleBiensClick = (proprietaireId) => {
    navigate('/biens', { state: { filterProprietaireId: proprietaireId } })
  }

  // Configuration des colonnes pour DataTable
  const columns = useMemo(() => [
    {
      key: 'nom',
      label: 'Propriétaire',
      searchable: true,
      accessor: (prop) => `${prop.prenom} ${prop.nom}`,
      render: (prop) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-medium">
              {prop.prenom?.[0]}{prop.nom?.[0]}
            </span>
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900">
              {prop.prenom} {prop.nom}
            </div>
            {prop.pieceIdentite && (
              <div className="text-sm text-gray-500">
                {prop.pieceIdentite}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'contact',
      label: 'Contact',
      searchable: true,
      accessor: (prop) => `${prop.telephone || ''} ${prop.adresse || ''}`,
      render: (prop) => (
        <div>
          <div className="text-sm text-gray-900">{prop.telephone || '-'}</div>
          <div className="text-sm text-gray-500">{prop.adresse || '-'}</div>
        </div>
      )
    },
    {
      key: 'biens',
      label: 'Biens',
      searchable: true,
      accessor: (prop) => getBiensCount(prop.id),
      render: (prop) => {
        const count = getBiensCount(prop.id)
        return (
          <Tooltip content={count > 0 ? "Cliquer pour filtrer les biens" : "Aucun bien"}>
            <button
              onClick={() => count > 0 && handleBiensClick(prop.id)}
              disabled={count === 0}
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                count > 0
                  ? 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer transition-colors'
                  : 'bg-gray-100 text-gray-500 cursor-not-allowed'
              }`}
            >
              {count} bien{count > 1 ? 's' : ''}
            </button>
          </Tooltip>
        )
      }
    },
    {
      key: 'dernierPaiement',
      label: 'Dernier Paiement Reçu',
      searchable: false,
      accessor: (prop) => {
        const date = getLastPaiementDate(prop.id)
        return date ? formatDate(date) : ''
      },
      render: (prop) => {
        const lastPaiementDate = getLastPaiementDate(prop.id)
        const status = getLastPaiementStatus(lastPaiementDate)

        if (!lastPaiementDate) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
              Aucun paiement
            </span>
          )
        }

        const statusConfig = {
          recent: { bg: 'bg-green-100', text: 'text-green-800', label: 'Récent' },
          warning: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Il y a 1-2 mois' },
          danger: { bg: 'bg-red-100', text: 'text-red-800', label: '> 2 mois' }
        }

        const config = statusConfig[status]

        return (
          <div>
            <div className="text-sm text-gray-900">{formatDate(lastPaiementDate)}</div>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text} mt-1`}>
              {config.label}
            </span>
          </div>
        )
      }
    }
  ], [biens, paiements])

  const renderActions = (proprietaire) => (
    <div className="flex items-center gap-3">
      <Tooltip content="Modifier le propriétaire">
        <button
          onClick={() => openEditForm(proprietaire)}
          className={`${ICON_BUTTON_BASE} text-blue-600 hover:bg-blue-50`}
          aria-label="Modifier"
        >
          <Edit2 className="w-5 h-5" />
        </button>
      </Tooltip>
      <Tooltip content="Supprimer le propriétaire">
        <button
          onClick={() => openDeleteModal(proprietaire)}
          className={`${ICON_BUTTON_BASE} text-red-600 hover:bg-red-50`}
          aria-label="Supprimer"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </Tooltip>
    </div>
  )

  return (
    <div className="dashboard-background">
      <div className="max-w-[1920px] mx-auto space-y-6 p-6">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Propriétaires</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">Gérer les propriétaires de biens immobiliers</p>
          </div>
          <button
            onClick={openCreateForm}
            className={`${BUTTON_PRIMARY_GREEN} flex items-center justify-center`}
          >
            <span className="mr-2">+</span>
            Nouveau Propriétaire
          </button>
        </div>

        {/* Formulaire */}
        <UniversalModal
          variant="form"
          isOpen={showForm}
          onClose={closeForm}
          title={editingProprietaire ? 'Modifier Propriétaire' : 'Nouveau Propriétaire'}
          size="lg"
        >
          <ProprietaireForm
            editingProprietaire={editingProprietaire}
            onClose={closeForm}
            onSuccess={closeForm}
          />
        </UniversalModal>

        {/* DataTable avec recherche et pagination intégrées */}
        <DataTable
          data={proprietaires}
          columns={columns}
          renderActions={renderActions}
          searchable={true}
          sortable={true}
          paginated={true}
          itemsPerPage={10}
          emptyMessage="Aucun propriétaire enregistré. Commencez par créer votre premier propriétaire."
        />

        {/* Modal de confirmation de suppression */}
        <UniversalModal
          variant="delete"
          isOpen={deleteModal.show}
          onClose={closeDeleteModal}
          onConfirm={confirmDelete}
          title="Confirmer la suppression"
          message={`Êtes-vous sûr de vouloir supprimer ${deleteModal.item?.prenom} ${deleteModal.item?.nom} ? Cette action est irréversible.`}
          size="sm"
        />
      </div>
    </div>
  )
}

export default Proprietaires