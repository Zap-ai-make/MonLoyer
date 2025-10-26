import { useCallback, useState, useMemo } from 'react'
import { Edit2, Trash2, Users, UserCheck, UserX } from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { useNotification } from '../contexts/NotificationContext'
import { useCrudOperations } from '../hooks/useCrudOperations'
import LocataireForm from '../components/LocataireForm'
import Tooltip from '../components/Tooltip'
import DataTable from '../components/DataTable'
import UniversalModal from '../components/UniversalModal'
import { getBienInfoForLocataire, getProprietaireInfoForLocataire } from '../utils/locataireUtils'
import { BUTTON_PRIMARY_GREEN as BUTTON_PRIMARY, ICON_BUTTON_BASE } from '../constants/cssClasses'
import { formatCurrency } from '../utils/formatters'

function LocatairesSimple() {
  const { locataires, biens, proprietaires, refreshEntity } = useData()
  const notification = useNotification()
  const [filterTab, setFilterTab] = useState('tous') // 'tous', 'actifs', 'inactifs'

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

  // Filtrer les locataires selon l'onglet actif
  const filteredLocataires = useMemo(() => {
    if (filterTab === 'actifs') {
      return locataires.filter(l => l.statut === 'actif')
    } else if (filterTab === 'inactifs') {
      return locataires.filter(l => l.statut === 'inactif')
    }
    return locataires // tous
  }, [locataires, filterTab])

  // Calculer les statistiques pour les badges
  const stats = useMemo(() => ({
    tous: locataires.length,
    actifs: locataires.filter(l => l.statut === 'actif').length,
    inactifs: locataires.filter(l => l.statut === 'inactif').length
  }), [locataires])

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

        {/* Onglets de filtrage avec badges */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 flex gap-2">
          <button
            onClick={() => setFilterTab('tous')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              filterTab === 'tous'
                ? 'bg-green-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Tous</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              filterTab === 'tous'
                ? 'bg-white/20 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}>
              {stats.tous}
            </span>
          </button>

          <button
            onClick={() => setFilterTab('actifs')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              filterTab === 'actifs'
                ? 'bg-green-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <UserCheck className="w-5 h-5" />
            <span>Actifs</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              filterTab === 'actifs'
                ? 'bg-white/20 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}>
              {stats.actifs}
            </span>
          </button>

          <button
            onClick={() => setFilterTab('inactifs')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              filterTab === 'inactifs'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <UserX className="w-5 h-5" />
            <span>Inactifs</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              filterTab === 'inactifs'
                ? 'bg-white/20 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}>
              {stats.inactifs}
            </span>
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
          data={filteredLocataires}
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
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-semibold text-sm mr-3">
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