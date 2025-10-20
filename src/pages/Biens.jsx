import React, { useState, useMemo, useCallback } from 'react'
import { Edit2, Trash2 } from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { useNotification } from '../contexts/NotificationContext'
import { useCrudOperations } from '../hooks/useCrudOperations'
import CourDetails from '../components/CourDetails'
import BienForm from '../components/BienForm'
import Tooltip from '../components/Tooltip'
import DataTable from '../components/DataTable'
import UniversalModal from '../components/UniversalModal'
import { TYPES_BIEN } from '../constants/biens'
import { getTypeLabel, getLocatairesCount as getLocatairesCountUtil, getProprietaireNom as getProprietaireNomUtil } from '../utils/bienUtils'
import { BUTTON_PRIMARY_GREEN as BUTTON_PRIMARY, BUTTON_SECONDARY, ICON_BUTTON_BASE } from '../constants/cssClasses'
import { formatCurrency } from '../utils/formatters'

function Biens() {
  const { biens, proprietaires, locataires, refreshEntity } = useData()
  const notification = useNotification()
  const [locatairesModal, setLocatairesModal] = useState({ show: false, bien: null })

  // Utilisation du hook CRUD centralisé
  const {
    showForm,
    editingItem: editingBien,
    deleteModal,
    openCreateForm,
    openEditForm,
    closeForm,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete: confirmDeleteBase
  } = useCrudOperations('biens')

  // Wrapper pour ajouter la notification et rafraîchir les locataires
  const confirmDelete = useCallback(() => {
    const success = confirmDeleteBase()
    if (success) {
      refreshEntity('locataires') // Rafraîchir les locataires car ils peuvent être affectés
      notification.success('Bien supprimé avec succès')
    } else {
      notification.error('Erreur lors de la suppression')
    }
  }, [confirmDeleteBase, refreshEntity, notification])

  const showLocataires = useCallback((bien) => {
    setLocatairesModal({ show: true, bien })
  }, [])

  const closeLocatairesModal = useCallback(() => {
    setLocatairesModal({ show: false, bien: null })
  }, [])

  // Mémoriser les fonctions utilitaires avec les dépendances
  const getProprietaireNom = useCallback((proprietaireId) => {
    return getProprietaireNomUtil(proprietaireId, proprietaires)
  }, [proprietaires])

  const getLocatairesCount = useCallback((courId) => {
    return getLocatairesCountUtil(courId, locataires)
  }, [locataires])

  return (
    <div className="dashboard-background">
      <div className="max-w-[1920px] mx-auto space-y-6 p-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Biens Immobiliers</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">Gérer les cours, maisons et magasins</p>
        </div>
        <button
          onClick={openCreateForm}
          className={`${BUTTON_PRIMARY} flex items-center`}
          disabled={proprietaires.length === 0}
        >
          <span className="mr-2">+</span>
          Nouveau Bien
        </button>
      </div>

      {/* Message si pas de propriétaires */}
      {proprietaires.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="text-yellow-600 text-xl mr-3">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Aucun propriétaire enregistré
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Vous devez d'abord enregistrer au moins un propriétaire avant de pouvoir ajouter des biens.
              </p>
              <div className="mt-2">
                <button
                  onClick={() => window.location.href = '/proprietaires'}
                  className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200"
                >
                  Aller aux propriétaires
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire Modal */}
      <UniversalModal
        variant="form"
        isOpen={showForm}
        onClose={closeForm}
        title={editingBien ? 'Modifier le Bien' : 'Nouveau Bien'}
        size="xl"
      >
        <BienForm
          editingBien={editingBien}
          onClose={closeForm}
          onSuccess={closeForm}
        />
      </UniversalModal>

      {/* Configuration des colonnes pour DataTable */}
      <DataTable
        data={biens}
        columns={[
          {
            key: 'bien',
            label: 'Bien',
            searchable: true,
            accessor: (bien) => `${bien.nomCour || getTypeLabel(bien.type)} ${bien.description || ''}`,
            render: (bien) => (
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-lg">
                    {bien.type === 'magasin' ? '🏪' : '🏠'}
                  </span>
                </div>
                <div className="ml-3 flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {bien.nomCour || getTypeLabel(bien.type)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {bien.description ? (
                      bien.description
                    ) : bien.type === 'cour_commune' && bien.maisons ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          showLocataires(bien)
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        {bien.maisons.length} maisons →
                      </button>
                    ) : bien.type === 'cour_unique' ? (
                      'Cour unique (villa)'
                    ) : (
                      getTypeLabel(bien.type)
                    )}
                  </div>
                </div>
              </div>
            )
          },
          {
            key: 'proprietaire',
            label: 'Propriétaire',
            searchable: true,
            accessor: (bien) => getProprietaireNom(bien.proprietaireId),
            render: (bien) => (
              <div className="text-sm text-gray-900">{getProprietaireNom(bien.proprietaireId)}</div>
            )
          },
          {
            key: 'localisation',
            label: 'Localisation',
            searchable: true,
            accessor: (bien) => `${bien.quartier || ''} ${bien.ville || bien.adresse || ''}`,
            render: (bien) => (
              <div>
                <div className="text-sm text-gray-900">{bien.quartier || '-'}</div>
                <div className="text-sm text-gray-500">{bien.ville || bien.adresse || '-'}</div>
              </div>
            )
          },
          {
            key: 'compteurs',
            label: 'Compteurs',
            render: (bien) => (
              bien.type !== 'cour_commune' ? (
                <div className="text-sm">
                  <div className="text-gray-600">Eau: {bien.compteurEau || '-'}</div>
                  <div className="text-gray-600">Élec: {bien.compteurElectricite || '-'}</div>
                </div>
              ) : null
            )
          },
          {
            key: 'locataires',
            label: 'Locataires',
            render: (bien) => (
              <button
                onClick={() => showLocataires(bien)}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
              >
                {getLocatairesCount(bien.id)} locataire(s)
              </button>
            )
          }
        ]}
        renderActions={(bien) => (
          <div className="flex items-center gap-3">
            <Tooltip content="Modifier le bien">
              <button
                onClick={() => openEditForm(bien)}
                className={`${ICON_BUTTON_BASE} text-blue-600 hover:bg-blue-50`}
                aria-label="Modifier"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            </Tooltip>
            <Tooltip content="Supprimer le bien">
              <button
                onClick={() => openDeleteModal(bien)}
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
        emptyMessage="Aucun bien enregistré. Commencez par enregistrer votre premier bien immobilier."
      />

      {/* Modal de confirmation de suppression */}
      <UniversalModal
        variant="delete"
        isOpen={deleteModal.show}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer ${deleteModal.item?.nomCour || getTypeLabel(deleteModal.item?.type)} ? Cette action est irréversible.`}
        size="sm"
      />

      {/* Modal des détails du bien (locataires ou maisons) */}
      {locatairesModal.show && locatairesModal.bien && (
        <UniversalModal
          variant="info"
          isOpen={locatairesModal.show}
          onClose={closeLocatairesModal}
          title={`Détails - ${locatairesModal.bien.nomCour || getTypeLabel(locatairesModal.bien.type)}`}
          size="lg"
        >
          {locatairesModal.bien.type === 'cour_commune' ? (
            <CourDetails bien={locatairesModal.bien} />
          ) : (
            <div className="space-y-3">
              {(() => {
                const locatairesList = locataires.filter(l => l.courId === locatairesModal.bien?.id)
                if (locatairesList.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <p>Aucun locataire pour ce bien</p>
                    </div>
                  )
                }
                return locatairesList.map((locataire) => (
                  <div
                    key={locataire.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {locataire.prenom} {locataire.nom}
                        </p>
                        {locataire.telephone && (
                          <p className="text-sm text-gray-600">📞 {locataire.telephone}</p>
                        )}
                      </div>
                      {locataire.montantLoyer && (
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-700">
                            {formatCurrency(parseInt(locataire.montantLoyer))}
                          </p>
                          <p className="text-xs text-gray-500">/ mois</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              })()}
            </div>
          )}
        </UniversalModal>
      )}
      </div>
    </div>
  )
}

export default Biens
