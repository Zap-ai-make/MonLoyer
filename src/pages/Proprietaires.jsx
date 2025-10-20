import { useMemo } from 'react'
import { Edit2, Trash2 } from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { useCrudOperations } from '../hooks/useCrudOperations'
import Tooltip from '../components/Tooltip'
import ProprietaireForm from '../components/ProprietaireForm'
import UniversalModal from '../components/UniversalModal'
import DataTable from '../components/DataTable'
import { BUTTON_PRIMARY, ICON_BUTTON_BASE } from '../constants/cssClasses'

function Proprietaires() {
  const { proprietaires, biens } = useData()

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
      render: (prop) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {getBiensCount(prop.id)} bien(s)
        </span>
      )
    }
  ], [biens])

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
            className={`${BUTTON_PRIMARY} flex items-center justify-center`}
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