import { useState, useEffect, useMemo } from 'react'
import { FileText, Download, Trash2, Filter, Search, Sparkles, Upload, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import documentService from '../services/documentService'
import dataService from '../services/dataService'
import { useNotification } from '../contexts/NotificationContext'
import { COLORS } from '../constants/colors'

function Documents() {
  const notification = useNotification()
  const [documents, setDocuments] = useState([])
  const [filteredDocuments, setFilteredDocuments] = useState([])
  const [stats, setStats] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [filters, setFilters] = useState({
    type: '',
    ownerType: '',
    search: '',
    startDate: '',
    endDate: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadDocuments()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [documents, filters])

  const loadDocuments = () => {
    const docs = documentService.getDocuments()

    // Enrichir les documents avec les noms des entités
    const enrichedDocs = docs.map(doc => {
      let entityName = 'Non spécifié'

      if (doc.owner_type === 'proprietaire') {
        const proprietaires = dataService.getProprietaires()
        const proprietaire = proprietaires.find(p => p.id === doc.owner_id)
        if (proprietaire) {
          entityName = `${proprietaire.nom} ${proprietaire.prenom}`
        }
      } else if (doc.owner_type === 'locataire') {
        const locataires = dataService.getLocataires()
        const locataire = locataires.find(l => l.id === doc.owner_id)
        if (locataire) {
          entityName = `${locataire.nom} ${locataire.prenom}`
        }
      } else if (doc.owner_type === 'bien') {
        const biens = dataService.getBiens()
        const bien = biens.find(b => b.id === doc.owner_id)
        if (bien) {
          const proprietaires = dataService.getProprietaires()
          const proprietaire = proprietaires.find(p => p.id === bien.proprietaireId)
          if (proprietaire) {
            entityName = `${proprietaire.nom} ${proprietaire.prenom}`
          }
        }
      }

      return { ...doc, entityName }
    })

    setDocuments(enrichedDocs)
    setStats(documentService.getStatistics())
  }

  const applyFilters = () => {
    let filtered = [...documents]

    if (filters.type) {
      filtered = filtered.filter(doc => doc.type === filters.type)
    }

    if (filters.ownerType) {
      filtered = filtered.filter(doc => doc.owner_type === filters.ownerType)
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(doc =>
        doc.filename.toLowerCase().includes(searchLower) ||
        doc.entityName.toLowerCase().includes(searchLower)
      )
    }

    if (filters.startDate) {
      filtered = filtered.filter(doc => new Date(doc.created_at) >= new Date(filters.startDate))
    }

    if (filters.endDate) {
      filtered = filtered.filter(doc => new Date(doc.created_at) <= new Date(filters.endDate))
    }

    // Trier par date de création (plus récent en premier)
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    setFilteredDocuments(filtered)
    setCurrentPage(1) // Réinitialiser à la page 1 lors d'un changement de filtre
  }

  // Pagination avec useMemo
  const paginatedDocuments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredDocuments.slice(startIndex, endIndex)
  }, [filteredDocuments, currentPage])

  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage)

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters({
      type: '',
      ownerType: '',
      search: '',
      startDate: '',
      endDate: ''
    })
  }

  const handleDownload = (documentId) => {
    try {
      documentService.downloadDocument(documentId)
    } catch (error) {
      notification.error('Erreur lors du téléchargement')
    }
  }

  const handleDelete = (documentId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      documentService.deleteDocument(documentId)
      notification.success('Document supprimé')
      loadDocuments()
    }
  }

  const getTypeLabel = (type) => {
    const labels = {
      mandat: 'Mandat de gestion',
      titre_propriete: 'Titre de propriété',
      contrat_bail: 'Contrat de bail'
    }
    return labels[type] || type
  }

  const getOwnerTypeLabel = (ownerType) => {
    const labels = {
      proprietaire: 'Propriétaire',
      locataire: 'Locataire',
      bien: 'Bien'
    }
    return labels[ownerType] || ownerType
  }

  const getStatusBadge = (doc) => {
    if (doc.generated) {
      return (
        <span
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: COLORS.secondary.light,
            color: COLORS.secondary.DEFAULT
          }}
        >
          <Sparkles className="w-3 h-3" />
          Généré
        </span>
      )
    } else {
      return (
        <span
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: 'rgba(74, 85, 104, 0.1)',
            color: COLORS.primary.DEFAULT
          }}
        >
          <Upload className="w-3 h-3" />
          Uploadé
        </span>
      )
    }
  }

  return (
    <div className="dashboard-background">
      <div className="max-w-[1920px] mx-auto space-y-6 p-6">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-display font-bold" style={{ color: COLORS.primary.DEFAULT }}>
              Documents
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Gestion centralisée de tous vos documents (mandats, titres, contrats)
            </p>
          </div>
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              {
                title: 'Total documents',
                value: stats.total,
                iconColor: COLORS.primary.DEFAULT,
                iconBg: `rgba(0, 60, 87, 0.1)`
              },
              {
                title: 'Mandats de gestion',
                value: stats.byType.mandat,
                iconColor: COLORS.secondary.DEFAULT,
                iconBg: `rgba(0, 184, 148, 0.1)`
              },
              {
                title: 'Titres de propriété',
                value: stats.byType.titre_propriete,
                iconColor: '#9333EA',
                iconBg: 'rgba(147, 51, 234, 0.1)'
              },
              {
                title: 'Contrats de bail',
                value: stats.byType.contrat_bail,
                iconColor: '#F59E0B',
                iconBg: 'rgba(245, 158, 11, 0.1)'
              }
            ].map((card, index) => (
              <div
                key={index}
                className="rounded-2xl p-6 transition-all duration-300 hover:scale-105 cursor-pointer"
                style={{
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                  animation: `slideUp 0.6s ease-out ${index * 0.1}s backwards`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: '#6C757D' }}>
                      {card.title}
                    </p>
                  </div>
                  <div
                    className="p-3 rounded-xl transition-transform duration-300 hover:rotate-12"
                    style={{ backgroundColor: card.iconBg }}
                  >
                    <FileText className="w-7 h-7" style={{ color: card.iconColor }} />
                  </div>
                </div>
                <p
                  className="text-4xl font-bold mb-2"
                  style={{ color: '#212529', fontFamily: 'Poppins, sans-serif' }}
                >
                  {card.value}
                </p>
              </div>
            ))}
          </div>
        )}

      {/* Barre de recherche et filtres */}
      <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un document ou une personne..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Bouton filtres */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-5 h-5" />
            <span className="font-medium">Filtres</span>
            {(filters.type || filters.ownerType || filters.startDate || filters.endDate) && (
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: COLORS.secondary.DEFAULT }}
              />
            )}
          </button>
        </div>

        {/* Panneau de filtres */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de document
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tous les types</option>
                <option value="mandat">Mandat de gestion</option>
                <option value="titre_propriete">Titre de propriété</option>
                <option value="contrat_bail">Contrat de bail</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type d'entité
              </label>
              <select
                value={filters.ownerType}
                onChange={(e) => handleFilterChange('ownerType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Toutes les entités</option>
                <option value="proprietaire">Propriétaires</option>
                <option value="locataire">Locataires</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de début
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de fin
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Réinitialiser les filtres
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Liste des documents */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-16 px-4">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {documents.length === 0 ? 'Aucun document' : 'Aucun résultat'}
            </h3>
            <p className="text-gray-500">
              {documents.length === 0
                ? 'Les documents ajoutés aux propriétaires et locataires apparaîtront ici'
                : 'Essayez de modifier vos filtres de recherche'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Entité
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Nom
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                    Date
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Statut
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div
                          className="p-1.5 sm:p-2 rounded-lg flex-shrink-0"
                          style={{ backgroundColor: 'rgba(74, 85, 104, 0.1)' }}
                        >
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: COLORS.primary.DEFAULT }} />
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-gray-900 max-w-[120px] sm:max-w-xs truncate">
                          {doc.filename}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span className="text-xs sm:text-sm text-gray-900">{getTypeLabel(doc.type)}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <span className="text-xs sm:text-sm text-gray-600">{getOwnerTypeLabel(doc.owner_type)}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <span className="text-xs sm:text-sm font-medium text-gray-900">{doc.entityName}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden xl:table-cell">
                      <span className="text-xs sm:text-sm text-gray-600">
                        {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      {getStatusBadge(doc)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        <button
                          onClick={() => handleDownload(doc.id)}
                          className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Télécharger"
                        >
                          <Download className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 sm:p-2 rounded-lg hover:bg-red-50 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredDocuments.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6 rounded-lg shadow-sm">
          <div className="flex-1 flex justify-between items-center sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} sur {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Affichage de <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> à{' '}
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredDocuments.length)}</span> sur{' '}
                <span className="font-medium">{filteredDocuments.length}</span> document(s)
                {filteredDocuments.length !== documents.length && (
                  <span className="text-gray-500"> (filtré de {documents.length} total)</span>
                )}
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Précédent</span>
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1
                  // Afficher les 3 premières pages, les 3 dernières, et la page courante +/- 1
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNumber
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    )
                  } else if (
                    pageNumber === currentPage - 2 ||
                    pageNumber === currentPage + 2
                  ) {
                    return (
                      <span
                        key={pageNumber}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                      >
                        ...
                      </span>
                    )
                  }
                  return null
                })}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Suivant</span>
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default Documents
