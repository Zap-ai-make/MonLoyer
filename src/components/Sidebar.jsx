import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Home, User, DollarSign, Archive, Settings, Search, Sparkles, Map, FileText, LogOut } from 'lucide-react'
import { useState, useMemo } from 'react'
import Logo from './Logo'
import UniversalModal from './UniversalModal'
import { COLORS } from '../constants/colors'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import configService from '../services/configService'
import logger from '../utils/logger'

function Sidebar({ isOpen, onClose, collapsed, onToggleCollapse, onOpenChatbot }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, isConfigured, logout, agenceData } = useAuth()
  const { proprietaires, biens, locataires, paiements } = useData()

  // Récupérer le nom de l'agence
  const config = configService.getConfig()
  const agencyName = agenceData?.nom || config.agencyName || 'Woning.cloud'

  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
      setShowLogoutModal(false)
    } catch (error) {
      logger.error('Erreur déconnexion:', error)
    }
  }

  // Fonction de recherche avec debounce
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return []

    const query = searchQuery.toLowerCase()
    const results = []

    // Rechercher dans les propriétaires
    proprietaires.filter(p =>
      p.nom?.toLowerCase().includes(query) ||
      p.prenom?.toLowerCase().includes(query) ||
      p.telephone?.includes(query) ||
      p.email?.toLowerCase().includes(query)
    ).forEach(p => {
      results.push({
        type: 'Propriétaire',
        title: `${p.prenom} ${p.nom}`,
        subtitle: p.telephone,
        link: '/proprietaires',
        icon: Users
      })
    })

    // Rechercher dans les biens
    biens.filter(b =>
      b.nom?.toLowerCase().includes(query) ||
      b.adresse?.toLowerCase().includes(query) ||
      b.type?.toLowerCase().includes(query)
    ).forEach(b => {
      results.push({
        type: 'Bien',
        title: b.nom,
        subtitle: b.adresse,
        link: '/biens',
        icon: Home
      })
    })

    // Rechercher dans les locataires
    locataires.filter(l =>
      l.nom?.toLowerCase().includes(query) ||
      l.prenom?.toLowerCase().includes(query) ||
      l.telephone?.includes(query) ||
      l.email?.toLowerCase().includes(query)
    ).forEach(l => {
      results.push({
        type: 'Locataire',
        title: `${l.prenom} ${l.nom}`,
        subtitle: l.telephone,
        link: '/locataires',
        icon: User
      })
    })

    // Rechercher dans les paiements (par montant ou mois)
    paiements.filter(p =>
      p.montant?.toString().includes(query) ||
      p.moisConcerne?.toLowerCase().includes(query)
    ).slice(0, 5).forEach(p => {
      results.push({
        type: 'Paiement',
        title: `${p.montant} FCFA`,
        subtitle: `${p.locataireNom} - ${p.moisConcerne}`,
        link: '/paiements',
        icon: DollarSign
      })
    })

    return results.slice(0, 10) // Limiter à 10 résultats
  }, [searchQuery, proprietaires, biens, locataires, paiements])

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchQuery(value)
    setShowSearchResults(value.length >= 2)
  }

  const handleResultClick = (link) => {
    navigate(link)
    setSearchQuery('')
    setShowSearchResults(false)
    onClose()
  }

  const navigation = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Propriétaires', href: '/proprietaires', icon: Users },
    { name: 'Biens', href: '/biens', icon: Home },
    { name: 'Locataires', href: '/locataires', icon: User },
    { name: 'Paiements', href: '/paiements', icon: DollarSign },
    { name: 'Documents', href: '/documents', icon: FileText },
    { name: 'Carte', href: '/carte', icon: Map },
    { name: 'Archives', href: '/archives', icon: Archive },
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
      <div
        className={`
          fixed top-0 left-0 z-50 h-screen transition-all duration-300 ease-in-out flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          ${collapsed ? 'md:w-20' : 'md:w-72'}
          w-72
        `}
        style={{ backgroundColor: COLORS.primary.DEFAULT, color: COLORS.white }}
      >
        {/* Header avec Logo */}
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {!collapsed ? (
            <Logo size="md" showText={true} customText={agencyName} className="text-white" />
          ) : (
            <Logo size="sm" showText={false} />
          )}

          {/* Toggle button - visible sur desktop */}
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex p-2 rounded-lg hover:bg-primary-600 transition-colors"
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
            className="md:hidden p-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Barre de recherche (uniquement quand non collapsed) */}
        {!collapsed && (
          <div className="p-4 relative" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 z-10" style={{ color: 'rgba(255,255,255,0.6)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setShowSearchResults(searchQuery.length >= 2)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                className="w-full pl-10 pr-3 py-2.5 rounded-lg text-sm focus:outline-none"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#FFFFFF'
                }}
                placeholder="Rechercher..."
              />
            </div>

            {/* Résultats de recherche */}
            {showSearchResults && searchResults.length > 0 && (
              <div
                className="absolute left-4 right-4 mt-2 max-h-96 overflow-y-auto rounded-lg shadow-2xl z-50"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #E9ECEF' }}
              >
                {searchResults.map((result, index) => {
                  const Icon = result.icon
                  return (
                    <button
                      key={index}
                      onClick={() => handleResultClick(result.link)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left border-b last:border-b-0"
                      style={{ borderColor: '#E9ECEF' }}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" style={{ color: COLORS.primary.DEFAULT }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{result.title}</div>
                        <div className="text-xs text-gray-500 truncate">{result.type} • {result.subtitle}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Message si aucun résultat */}
            {showSearchResults && searchQuery.length >= 2 && searchResults.length === 0 && (
              <div
                className="absolute left-4 right-4 mt-2 p-4 rounded-lg shadow-2xl z-50 text-center"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #E9ECEF' }}
              >
                <p className="text-sm text-gray-500">Aucun résultat trouvé</p>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => onClose()}
                className={`
                  group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300
                  ${collapsed ? 'md:justify-center' : ''}
                `}
                style={{
                  backgroundColor: active ? COLORS.secondary.DEFAULT : 'transparent',
                  color: COLORS.white
                }}
                title={collapsed ? item.name : ''}
              >
                <Icon className={`flex-shrink-0 w-5 h-5 ${active ? '' : 'group-hover:scale-110 transition-transform'}`} />
                {!collapsed && (
                  <span className="ml-3">{item.name}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bouton IA Assistant */}
        <div className="px-4 pb-4">
          <button
            onClick={onOpenChatbot}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 group"
            style={{
              background: 'linear-gradient(135deg, #00B894 0%, #00D9A8 100%)',
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(0, 184, 148, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 184, 148, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 184, 148, 0.3)'
            }}
          >
            <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            {!collapsed && <span>Assistant IA</span>}
          </button>
        </div>

        {/* Footer */}
        <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {!collapsed ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs">
                  <p className="font-semibold mb-1" style={{ color: '#FFFFFF', fontFamily: 'Poppins, sans-serif' }}>Woning.cloud</p>
                  <p style={{ color: 'rgba(255,255,255,0.7)' }}>Version 1.3.5</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to="/settings"
                    onClick={onClose}
                    className="p-2 rounded-lg text-primary-200 hover:text-white hover:bg-primary-600 transition-all duration-300 hover:scale-110"
                    title="Paramètres"
                  >
                    <Settings className="w-5 h-5" />
                  </Link>
                  {isConfigured && isAuthenticated && (
                    <button
                      onClick={() => setShowLogoutModal(true)}
                      className="p-2 rounded-lg text-primary-200 hover:text-white hover:bg-red-600 transition-all duration-300 hover:scale-110"
                      title="Déconnexion"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-3">
              <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-xs font-display font-bold text-white">
                v1.1
              </div>
              <Link
                to="/settings"
                onClick={onClose}
                className="p-2 rounded-lg text-primary-200 hover:text-white hover:bg-primary-600 transition-all duration-300 hover:scale-110"
                title="Paramètres"
              >
                <Settings className="w-5 h-5" />
              </Link>
              {isConfigured && isAuthenticated && (
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="p-2 rounded-lg text-primary-200 hover:text-white hover:bg-red-600 transition-all duration-300 hover:scale-110"
                  title="Déconnexion"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmation de déconnexion */}
      <UniversalModal
        variant="confirm"
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Confirmation de déconnexion"
      >
        <div className="text-center py-4">
          <p className="text-gray-700 mb-6">Voulez-vous vraiment vous déconnecter ?</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowLogoutModal(false)}
              className="px-6 py-2.5 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: '#E9ECEF',
                color: '#495057'
              }}
            >
              ❌ Annuler
            </button>
            <button
              onClick={handleLogout}
              className="px-6 py-2.5 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: '#DC3545',
                color: '#FFFFFF'
              }}
            >
              ✅ Oui, déconnecter
            </button>
          </div>
        </div>
      </UniversalModal>
    </>
  )
}

export default Sidebar