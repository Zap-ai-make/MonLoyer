import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
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
import { getTypeLabel, getLocatairesCount as getLocatairesCountUtil, getProprietaireNom as getProprietaireNomUtil, isOccupe } from '../utils/bienUtils'
import { BUTTON_PRIMARY_GREEN as BUTTON_PRIMARY, BUTTON_SECONDARY, ICON_BUTTON_BASE } from '../constants/cssClasses'
import { formatCurrency } from '../utils/formatters'

function Biens() {
  const { biens, proprietaires, locataires, refreshEntity } = useData()
  const notification = useNotification()
  const location = useLocation()
  const [locatairesModal, setLocatairesModal] = useState({ show: false, bien: null })

  // Récupérer le filtre du propriétaire depuis la navigation (venant de la page Propriétaires)
  const filterProprietaireId = location.state?.filterProprietaireId

  // Filtrer les biens si un propriétaire est sélectionné
  const filteredBiens = useMemo(() => {
    if (filterProprietaireId) {
      return biens.filter(b => b.proprietaireId === filterProprietaireId)
    }
    return biens
  }, [biens, filterProprietaireId])

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

  // Callback pour rafraîchir après libération d'une maison
  const handleMaisonLiberated = useCallback(() => {
    // Rafraîchir les biens et locataires
    refreshEntity('biens')
    refreshEntity('locataires')
  }, [refreshEntity])

  // Effet pour mettre à jour le bien du modal quand les données changent
  useEffect(() => {
    if (locatairesModal.show && locatairesModal.bien) {
      const updatedBien = biens.find(b => b.id === locatairesModal.bien.id)
      if (updatedBien && JSON.stringify(updatedBien) !== JSON.stringify(locatairesModal.bien)) {
        setLocatairesModal(prev => ({ ...prev, bien: updatedBien }))
      }
    }
  }, [biens, locatairesModal.show, locatairesModal.bien])

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
          {filterProprietaireId && (
            <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
              <span className="mr-2">🔍</span>
              Filtré par propriétaire : {getProprietaireNom(filterProprietaireId)}
              <button
                onClick={() => window.history.replaceState({}, '', '/biens')}
                className="ml-2 text-green-600 hover:text-green-800"
                title="Supprimer le filtre"
              >
                ✕
              </button>
            </div>
          )}
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
        data={filteredBiens}
        columns={[
          {
            key: 'bien',
            label: 'Bien',
            searchable: true,
            accessor: (bien) => `${bien.nomCour || getTypeLabel(bien.type)} ${bien.description || ''}`,
            render: (bien) => {
              const occupied = isOccupe(bien)
              return (
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-lg">
                      {bien.type === 'magasin' ? '🏪' : '🏠'}
                    </span>
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-gray-900">
                        {bien.nomCour || getTypeLabel(bien.type)}
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        occupied
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {occupied ? '✓ Occupé' : '○ Libre'}
                      </span>
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
            }
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
          {/* Badge de statut et informations générales */}
          <div className="mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${
                isOccupe(locatairesModal.bien)
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {isOccupe(locatairesModal.bien) ? '✓ Bien Occupé' : '○ Bien Libre'}
              </span>
              <div className="text-sm text-gray-600">
                {locatairesModal.bien.type === 'cour_commune' && locatairesModal.bien.maisons && (
                  <span>
                    {locatairesModal.bien.maisons.filter(m => m.statut === 'occupee').length} / {locatairesModal.bien.maisons.length} maisons occupées
                  </span>
                )}
              </div>
            </div>

            {/* Compteurs */}
            {locatairesModal.bien.type !== 'cour_commune' && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                {locatairesModal.bien.compteurEau && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-xs font-medium text-blue-600 mb-1">💧 Compteur Eau</div>
                    <div className="text-sm font-semibold text-gray-900">{locatairesModal.bien.compteurEau}</div>
                  </div>
                )}
                {locatairesModal.bien.compteurElectricite && (
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <div className="text-xs font-medium text-yellow-600 mb-1">⚡ Compteur Électricité</div>
                    <div className="text-sm font-semibold text-gray-900">{locatairesModal.bien.compteurElectricite}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {locatairesModal.bien.type === 'cour_commune' ? (
            <CourDetails
              bien={locatairesModal.bien}
              onUpdate={handleMaisonLiberated}
            />
          ) : (
            <div className="space-y-6">
              {/* Section Locataires Actifs */}
              {(() => {
                const locatairesList = locataires.filter(l => l.courId === locatairesModal.bien?.id && l.statut === 'actif')
                if (locatairesList.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-3">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 font-medium">Aucun locataire actif</p>
                      <p className="text-sm text-gray-400 mt-1">Ce bien est actuellement libre</p>
                    </div>
                  )
                }
                return (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Locataire Actuel</h3>
                    {locatairesList.map((locataire) => (
                  <div
                    key={locataire.id}
                    className="rounded-xl p-5 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50"
                  >
                    {/* En-tête avec badge statut */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-gray-900">
                            {locataire.prenom} {locataire.nom}
                          </p>
                          <span className="inline-block text-xs px-3 py-1 rounded-full font-semibold bg-green-500 text-white mt-1">
                            ● Actif
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Informations du locataire */}
                    <div className="bg-white/80 rounded-lg p-4 space-y-3 mb-4">
                      {locataire.telephone && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span className="font-medium">Téléphone:</span>
                          <span>{locataire.telephone}</span>
                        </div>
                      )}
                      {locataire.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium">Email:</span>
                          <span>{locataire.email}</span>
                        </div>
                      )}
                      {locataire.montantLoyer && (
                        <div className="flex items-center gap-2 text-sm pt-2 border-t border-gray-200">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-semibold text-gray-700">Loyer:</span>
                          <span className="font-bold text-green-700 text-base">
                            {formatCurrency(parseInt(locataire.montantLoyer))}
                          </span>
                          <span className="text-xs text-gray-500">/ mois</span>
                        </div>
                      )}
                    </div>

                    {/* Bouton Libérer */}
                    <button
                      onClick={() => {
                        if (confirm(`Êtes-vous sûr de vouloir libérer ce bien ?\n\n${locataire.prenom} ${locataire.nom} sera marqué comme inactif.`)) {
                          const success = dataService.libererBien(locatairesModal.bien.id)
                          if (success) {
                            notification.success('Bien libéré avec succès')
                            handleMaisonLiberated()
                          } else {
                            notification.error('Erreur lors de la libération du bien')
                          }
                        }
                      }}
                      className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      🔓 Libérer ce bien
                    </button>
                  </div>
                    ))}
                  </div>
                )
              })()}

              {/* Section Historique des Locataires */}
              {(() => {
                const anciensLocataires = locataires.filter(l => l.courId === locatairesModal.bien?.id && l.statut === 'inactif')

                return (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Historique des Locataires ({anciensLocataires.length})
                    </h3>
                    {anciensLocataires.length === 0 ? (
                      <div className="rounded-lg p-6 bg-gray-50 border border-gray-200 text-center">
                        <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-gray-500">Aucun historique de locataire</p>
                        <p className="text-xs text-gray-400 mt-1">Les anciens locataires apparaîtront ici</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {anciensLocataires.map((locataire) => (
                          <div
                            key={locataire.id}
                            className="rounded-lg p-4 bg-gray-50 border border-gray-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-sm font-semibold">
                                  {locataire.prenom?.[0]}{locataire.nom?.[0]}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {locataire.prenom} {locataire.nom}
                                  </p>
                                  {locataire.telephone && (
                                    <p className="text-xs text-gray-500">{locataire.telephone}</p>
                                  )}
                                </div>
                              </div>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                                Inactif
                              </span>
                            </div>
                            {locataire.montantLoyer && (
                              <div className="mt-2 text-xs text-gray-600">
                                Loyer: {formatCurrency(parseInt(locataire.montantLoyer))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
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
