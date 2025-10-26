import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * DataTable - Composant de tableau réutilisable avec recherche, tri et pagination
 *
 * @param {Object} props
 * @param {Array} props.data - Les données à afficher
 * @param {Array} props.columns - Configuration des colonnes
 * @param {Function} props.onRowClick - Callback au clic sur une ligne
 * @param {Boolean} props.searchable - Activer la recherche (défaut: true)
 * @param {Boolean} props.sortable - Activer le tri (défaut: true)
 * @param {Boolean} props.paginated - Activer la pagination (défaut: true)
 * @param {Number} props.itemsPerPage - Nombre d'éléments par page (défaut: 10)
 * @param {String} props.emptyMessage - Message si pas de données
 * @param {Function} props.renderActions - Fonction pour rendre les actions personnalisées
 */
export default function DataTable({
  data = [],
  columns = [],
  onRowClick,
  searchable = true,
  sortable = true,
  paginated = true,
  itemsPerPage = 10,
  emptyMessage = 'Aucune donnée disponible',
  renderActions
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState(null)
  const debounceTimerRef = useRef(null)

  // Debounce du searchTerm pour optimiser les performances
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchTerm])
  const [sortDirection, setSortDirection] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)

  // Filtrer les données par recherche (utilise debouncedSearchTerm pour performance)
  const filteredData = useMemo(() => {
    if (!searchable || !debouncedSearchTerm) return data

    return data.filter(item => {
      return columns.some(column => {
        if (!column.searchable) return false

        const value = column.accessor ? column.accessor(item) : item[column.key]
        return String(value).toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      })
    })
  }, [data, debouncedSearchTerm, columns, searchable])

  // Trier les données
  const sortedData = useMemo(() => {
    if (!sortable || !sortColumn) return filteredData

    const sorted = [...filteredData].sort((a, b) => {
      const column = columns.find(col => col.key === sortColumn)
      if (!column) return 0

      const aValue = column.accessor ? column.accessor(a) : a[column.key]
      const bValue = column.accessor ? column.accessor(b) : b[column.key]

      if (aValue === bValue) return 0

      const comparison = aValue > bValue ? 1 : -1
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return sorted
  }, [filteredData, sortColumn, sortDirection, columns, sortable])

  // Paginer les données
  const paginatedData = useMemo(() => {
    if (!paginated) return sortedData

    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return sortedData.slice(start, end)
  }, [sortedData, currentPage, itemsPerPage, paginated])

  const totalPages = Math.ceil(sortedData.length / itemsPerPage)

  // Gérer le tri
  const handleSort = (columnKey) => {
    if (!sortable) return

    const column = columns.find(col => col.key === columnKey)
    if (!column || column.sortable === false) return

    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  // Gérer le changement de page
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  // Réinitialiser à la page 1 quand les données changent
  useMemo(() => {
    setCurrentPage(1)
  }, [searchTerm, data.length])

  return (
    <div className="w-full">
      {/* Barre de recherche */}
      {searchable && (
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}

      {/* Tableau */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column.key)}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    sortable && column.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {sortable && sortColumn === column.key && (
                      <span className="text-blue-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {renderActions && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (renderActions ? 1 : 0)}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => (
                <tr
                  key={item.id || index}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''} transition-colors`}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                      {column.render
                        ? column.render(item)
                        : column.accessor
                        ? column.accessor(item)
                        : item[column.key]}
                    </td>
                  ))}
                  {renderActions && (
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {renderActions(item)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginated && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Affichage {(currentPage - 1) * itemsPerPage + 1} à{' '}
            {Math.min(currentPage * itemsPerPage, sortedData.length)} sur {sortedData.length} résultats
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} sur {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
