import { useCallback } from 'react'
import { Edit2, Trash2 } from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { useNotification } from '../contexts/NotificationContext'
import { useCrudOperations } from '../hooks/useCrudOperations'
import LocataireForm from '../components/LocataireForm'
import Tooltip from '../components/Tooltip'
import DataTable from '../components/DataTable'
import UniversalModal from '../components/UniversalModal'
import { getBienInfoForLocataire, getProprietaireInfoForLocataire } from '../utils/locataireUtils'
import { BUTTON_PRIMARY_PURPLE as BUTTON_PRIMARY, ICON_BUTTON_BASE } from '../constants/cssClasses'
import { formatCurrency } from '../utils/formatters'

function LocatairesSimple() {
  const { locataires, biens, proprietaires, refreshEntity } = useData()
  const notification = useNotification()

  // Utilisation du hook CRUD centralisé
  const {
    showForm,
    editingItem: editingLocataire,
    deleteModal,
    openCreateForm,
    openEditForm,
    closeForm,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete: confirmDeleteBase
  } = useCrudOperations('locataires')

  // Wrapper pour ajouter la notification et rafraîchir les biens
  const confirmDelete = useCallback(() => {
    const success = confirmDeleteBase()
    if (success) {
      refreshEntity('biens') // Rafraîchir les biens car le statut peut changer
      notification.success('Locataire supprimé avec succès')
    } else {
      notification.error('Erreur lors de la suppression')
    }
  }, [confirmDeleteBase, refreshEntity, notification])

  // Mémoriser les fonctions d'information
  const getBienInfo = useCallback((locataire) => {
    return getBienInfoForLocataire(locataire, biens)
  }, [biens])

  const getProprietaireInfo = useCallback((courId) => {
    return getProprietaireInfoForLocataire(courId, biens, proprietaires)
  }, [biens, proprietaires])

  return (
    <div className="dashboard-background">
      <div className="max-w-[1920px] mx-auto space-y-6 p-6">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Locataires</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">Gérer les locataires</p>
          </div>
          <button
            onClick={openCreateForm}
            className={`${BUTTON_PRIMARY} flex items-center justify-center`}
          >
            <span className="mr-2">+</span>
            Nouveau Locataire
          </button>
        </div>

        {/* Formulaire */}
        <UniversalModal
          variant="form"
          isOpen={showForm}
          onClose={closeForm}
          title={editingLocataire ? 'Modifier Locataire' : 'Nouveau Locataire'}
          size="xl"
        >
          <LocataireForm
            editingLocataire={editingLocataire}
            onClose={closeForm}
            onSuccess={closeForm}
          />
        </UniversalModal>

        {/* DataTable avec recherche et pagination */}
        <DataTable
          data={locataires}
          columns={[
            {
              key: 'nom',
              label: 'Nom & Prénom',
              searchable: true,
              accessor: (loc) => `${loc.prenom} ${loc.nom}`,
              render: (loc) => {
                const initiales = `${loc.prenom?.[0] || ''}${loc.nom?.[0] || ''}`.toUpperCase()
                return (
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-semibold text-sm mr-3">
                      {initiales}
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {loc.prenom} {loc.nom}
                    </div>
                  </div>
                )
              }
            },
            {
              key: 'contact',
              label: 'Contact',
              searchable: true,
              accessor: (loc) => loc.telephone || '',
              render: (loc) => (
                <div className="text-sm text-gray-900">{loc.telephone || '-'}</div>
              )
            },
            {
              key: 'bien',
              label: 'Bien loué',
              searchable: true,
              accessor: (loc) => getBienInfo(loc),
              render: (loc) => (
                <div className="text-sm text-gray-900">{getBienInfo(loc)}</div>
              )
            },
            {
              key: 'proprietaire',
              label: 'Propriétaire',
              searchable: true,
              accessor: (loc) => getProprietaireInfo(loc.courId),
              render: (loc) => (
                <div className="text-sm text-gray-900">{getProprietaireInfo(loc.courId)}</div>
              )
            },
            {
              key: 'loyer',
              label: 'Loyer',
              render: (loc) => (
                <div className="text-sm text-gray-900">
                  {loc.montantLoyer ? formatCurrency(parseInt(loc.montantLoyer)) : '-'}
                </div>
              )
            },
            {
              key: 'statut',
              label: 'Statut',
              render: (loc) => {
                const isActif = loc.statut === 'actif'
                return (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    isActif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {isActif ? 'Actif' : 'Inactif'}
                  </span>
                )
              }
            }
          ]}
          renderActions={(locataire) => (
            <div className="flex items-center gap-3">
              <Tooltip content="Modifier le locataire">
                <button
                  onClick={() => openEditForm(locataire)}
                  className={`${ICON_BUTTON_BASE} text-blue-600 hover:bg-blue-50`}
                  aria-label="Modifier"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              </Tooltip>
              <Tooltip content="Supprimer le locataire">
                <button
                  onClick={() => openDeleteModal(locataire)}
                  className={`${ICON_BUTTON_BASE} text-red-600 hover:bg-red-50`}
                  aria-label="Supprimer"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </Tooltip>
            </div>
          )}
          searchable={true}
          sortable={true}
          paginated={true}
          itemsPerPage={10}
          emptyMessage="Aucun locataire enregistré. Ajoutez votre premier locataire."
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

export default LocatairesSimple