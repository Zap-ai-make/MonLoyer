import { Link, useLocation } from 'react-router-dom'

function Sidebar({ isOpen, onClose, collapsed, onToggleCollapse }) {
  const location = useLocation()

  const navigation = [
    { name: 'Tableau de bord', href: '/dashboard', icon: '📊' },
    { name: 'Propriétaires', href: '/proprietaires', icon: '👥' },
    { name: 'Biens', href: '/biens', icon: '🏠' },
    { name: 'Locataires', href: '/locataires', icon: '👤' },
    { name: 'Paiements', href: '/paiements', icon: '💰' },
  ]

  const isActive = (href) => location.pathname === href

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 z-50 h-screen bg-gray-900 text-white transition-all duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
        ${collapsed ? 'md:w-16' : 'md:w-64'}
        w-64
      `}>
        {/* Header avec toggle */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center">
            {!collapsed && (
              <h1 className="text-lg font-semibold text-white">MonLoyer</h1>
            )}
            {collapsed && (
              <div className="text-lg font-bold text-white">ML</div>
            )}
          </div>
          
          {/* Toggle button - visible sur desktop */}
          <button 
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 rounded hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d={collapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7M19 19l-7-7 7-7"} 
              />
            </svg>
          </button>

          {/* Close button - visible sur mobile */}
          <button 
            onClick={onClose}
            className="md:hidden p-1.5 rounded hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Barre de recherche (uniquement quand non collapsed) */}
        {!collapsed && (
          <div className="p-3 border-b border-gray-700">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                placeholder="Rechercher..."
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => onClose()}
              className={`
                flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                ${isActive(item.href) 
                  ? 'bg-gray-700 text-white shadow-sm' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }
                ${collapsed ? 'md:justify-center' : ''}
              `}
              title={collapsed ? item.name : ''}
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              {!collapsed && (
                <span className="ml-3">{item.name}</span>
              )}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          {!collapsed ? (
            <div className="text-xs text-gray-400">
              <p className="font-medium text-gray-300">MonLoyer</p>
              <p>Version 1.0.0</p>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-gray-300">
                v1
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Sidebar