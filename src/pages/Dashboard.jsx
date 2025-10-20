import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Home, User as UserIcon, TrendingUp, Percent, DollarSign, Clock, AlertCircle, Plus, Sparkles, Trophy } from 'lucide-react'
import dataService from '../services/dataService'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'
import configService from '../services/configService'
import UniversalModal from '../components/UniversalModal'
import ProprietaireForm from '../components/ProprietaireForm'
import BienForm from '../components/BienForm'

// Styles CSS pour les cartes d'actions rapides (optimisation performance)
const actionCardStyles = `
  .action-card {
    border: 2px dashed #CED4DA;
    background-color: transparent;
    transition: all 0.3s ease;
  }
  .action-card:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  .action-card-primary:hover {
    border-color: #003C57;
    background-color: rgba(0, 60, 87, 0.05);
  }
  .action-card-success:hover {
    border-color: #00B894;
    background-color: rgba(0, 184, 148, 0.05);
  }
  .action-card-warning:hover {
    border-color: #F39C12;
    background-color: rgba(243, 156, 18, 0.05);
  }
  .action-card-info:hover {
    border-color: #3498DB;
    background-color: rgba(52, 152, 219, 0.05);
  }
`
import LocataireForm from '../components/LocataireForm'
import PaiementForm from '../components/PaiementForm'
import { MonthlyRevenueChart } from '../components/Charts'
import Tooltip from '../components/Tooltip'
import CircularProgress from '../components/CircularProgress'
import EmptyState from '../components/EmptyState'
import ProgressBar from '../components/ProgressBar'
import Badge from '../components/Badge'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatCurrency } from '../utils/formatters'
import {
  HEADER_CARD_STYLE,
  HEADER_TITLE_STYLE,
  HEADER_SUBTITLE_STYLE,
  HEADER_ICON_STYLE,
  STAT_CARD_STYLE,
  STAT_CARD_HOVER_STYLE,
  getIconWrapperStyle,
  STAT_VALUE_STYLE,
  STAT_LABEL_STYLE,
  getSlideUpAnimation,
  SPARKLES_ICON_STYLE
} from '../constants/dashboardStyles'

function Dashboard() {
  const navigate = useNavigate()
  const { refreshAll } = useData()

  // Injecter les styles CSS pour les cartes d'actions (optimisation)
  useEffect(() => {
    const styleEl = document.createElement('style')
    styleEl.textContent = actionCardStyles
    document.head.appendChild(styleEl)
    return () => document.head.removeChild(styleEl)
  }, [])
  const { agenceData } = useAuth()
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)

  // Récupérer le nom de l'agence
  const config = configService.getConfig()
  const agencyName = agenceData?.nom || config.agencyName || 'Woning.cloud'
  const isConfiguredAgency = agenceData?.nom || config.agencyName !== 'Woning Agency'

  // États pour les formulaires modaux
  const [showProprietaireForm, setShowProprietaireForm] = useState(false)
  const [showBienForm, setShowBienForm] = useState(false)
  const [showLocataireForm, setShowLocataireForm] = useState(false)
  const [showPaiementForm, setShowPaiementForm] = useState(false)

  const loadStats = useCallback(() => {
    const statistics = dataService.getStatistiques()
    setStats(statistics)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadStats()
    // Actualiser les stats toutes les 30 secondes
    const interval = setInterval(loadStats, 30000)
    return () => clearInterval(interval)
  }, [loadStats])

  // Générer données réelles pour graphiques (6 derniers mois) - Mémorisé
  const monthlyData = useMemo(() => {
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() // 0-11

    const data = []
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

    // Récupérer données des 6 derniers mois
    for (let i = 5; i >= 0; i--) {
      const targetMonth = currentMonth - i
      const targetYear = currentYear + Math.floor(targetMonth / 12)
      const adjustedMonth = ((targetMonth % 12) + 12) % 12

      const monthStats = stats.monthlyData?.[adjustedMonth] || {
        montant: 0,
        attendu: stats.totalAttenduMoisCourant || 0
      }

      data.push({
        mois: monthNames[adjustedMonth],
        montant: monthStats.montant || 0,
        attendu: monthStats.attendu || stats.totalAttenduMoisCourant || 0
      })
    }

    return data
  }, [stats.monthlyData, stats.totalAttenduMoisCourant])

  // Cartes statistiques principales avec style premium - Mémorisé
  const statCards = useMemo(() => [
    {
      title: 'Propriétaires',
      value: stats.totalProprietaires || 0,
      icon: Users,
      iconColor: '#003C57',
      iconBg: 'rgba(0, 60, 87, 0.1)'
    },
    {
      title: 'Biens Immobiliers',
      value: stats.totalBiens || 0,
      subtitle: `${stats.totalUnites || 0} unités`,
      icon: Home,
      iconColor: '#00B894',
      iconBg: 'rgba(0, 184, 148, 0.1)'
    },
    {
      title: 'Locataires Actifs',
      value: stats.locatairesActifs || 0,
      subtitle: `sur ${stats.totalLocataires || 0} total`,
      icon: UserIcon,
      iconColor: '#F39C12',
      iconBg: 'rgba(243, 156, 18, 0.1)'
    },
    {
      title: 'Taux d\'Occupation',
      value: `${stats.tauxOccupation || 0}%`,
      subtitle: `${stats.unitesOccupees || 0}/${stats.totalUnites || 0} unités`,
      icon: Percent,
      iconColor: '#003C57',
      iconBg: 'rgba(0, 60, 87, 0.1)',
      tooltip: 'Pourcentage d\'unités actuellement louées'
    }
  ], [stats.totalProprietaires, stats.totalBiens, stats.totalUnites, stats.locatairesActifs, stats.totalLocataires, stats.tauxOccupation, stats.unitesOccupees])

  // Cartes financières avec badges et ProgressBar - Mémorisé
  const financeCards = useMemo(() => [
    {
      title: `Revenus ${stats.moisCourant || ''} ${stats.anneeCourante || ''}`,
      value: formatCurrency(stats.revenusMoisCourant || 0),
      subtitle: `sur ${formatCurrency(stats.totalAttenduMoisCourant || 0, false)} attendu`,
      icon: DollarSign,
      iconColor: '#00B894',
      iconBg: 'rgba(0, 184, 148, 0.1)',
      bgColor: '#FFFFFF',
      badge: { type: 'success', label: '✅ Reçu' }
    },
    {
      title: 'En Attente',
      value: formatCurrency(stats.montantEnAttente || 0),
      subtitle: `${stats.alertesImpayes || 0} locataire(s) en retard`,
      icon: Clock,
      iconColor: '#F39C12',
      iconBg: 'rgba(243, 156, 18, 0.1)',
      bgColor: '#FFFFFF',
      badge: { type: 'warning', label: '🟠 Alerte' }
    },
    {
      title: 'Taux de Recouvrement',
      value: `${stats.tauxRecouvrement || 0}%`,
      subtitle: stats.tauxRecouvrement >= 80 ? 'Excellent ✨' : stats.tauxRecouvrement >= 60 ? 'Bien 👍' : 'À améliorer 📈',
      icon: Trophy,
      iconColor: stats.tauxRecouvrement >= 80 ? '#FFD700' : stats.tauxRecouvrement >= 60 ? '#00B894' : '#E74C3C',
      iconBg: stats.tauxRecouvrement >= 80 ? 'rgba(255, 215, 0, 0.1)' : stats.tauxRecouvrement >= 60 ? 'rgba(0, 184, 148, 0.1)' : 'rgba(231, 76, 60, 0.1)',
      bgColor: '#FFFFFF',
      tooltip: 'Pourcentage des loyers reçus par rapport au total attendu',
      showProgress: true
    }
  ], [stats.moisCourant, stats.anneeCourante, stats.revenusMoisCourant, stats.totalAttenduMoisCourant, stats.montantEnAttente, stats.alertesImpayes, stats.tauxRecouvrement])

  const handleModalSuccess = useCallback(() => {
    refreshAll() // Rafraîchir toutes les données dans le contexte
    loadStats() // Recharger les statistiques après ajout
  }, [refreshAll, loadStats])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="medium" />
      </div>
    )
  }

  return (
    <div className="dashboard-background">
      <div className="max-w-[1920px] mx-auto space-y-6 p-6">
      {/* En-tête avec slogan et illustration */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={HEADER_CARD_STYLE}
      >
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3" style={HEADER_TITLE_STYLE}>
              Tableau de bord
              <Sparkles className="w-7 h-7 animate-pulse" style={SPARKLES_ICON_STYLE} />
            </h1>
            <p className="text-lg" style={HEADER_SUBTITLE_STYLE}>
              Votre patrimoine, géré en toute confiance ✨
            </p>
          </div>
          <Home className="w-24 h-24 opacity-20" style={HEADER_ICON_STYLE} />
        </div>
      </div>

      {/* Statistiques principales avec style premium */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon
          const hasData = typeof card.value === 'string' ? true : card.value > 0

          return (
            <div
              key={index}
              className="rounded-2xl p-6 transition-all duration-300 hover:scale-105 cursor-pointer"
              style={{ ...STAT_CARD_STYLE, ...getSlideUpAnimation(index) }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = STAT_CARD_HOVER_STYLE.boxShadow
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = STAT_CARD_STYLE.boxShadow
              }}
            >
              {hasData ? (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm font-medium" style={STAT_LABEL_STYLE}>
                          {card.title}
                        </p>
                        {card.tooltip && <Tooltip content={card.tooltip} position="top" />}
                      </div>
                    </div>
                    <div
                      className="p-3 rounded-xl transition-transform duration-300 hover:rotate-12"
                      style={getIconWrapperStyle(card.iconBg)}
                    >
                      <Icon className="w-7 h-7" style={{ color: card.iconColor }} />
                    </div>
                  </div>
                  <p
                    className="text-4xl font-bold mb-2"
                    style={STAT_VALUE_STYLE}
                  >
                    {card.value}
                  </p>
                  {card.subtitle && (
                    <p className="text-sm" style={STAT_LABEL_STYLE}>
                      {card.subtitle}
                    </p>
                  )}
                </>
              ) : (
                <EmptyState
                  type={card.title.toLowerCase().includes('propriétaire') ? 'proprietaire' :
                       card.title.toLowerCase().includes('bien') ? 'bien' :
                       card.title.toLowerCase().includes('locataire') ? 'locataire' : 'default'}
                  title={`Aucun ${card.title.toLowerCase()}`}
                  message={`Commencez par ajouter des ${card.title.toLowerCase()}`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Aperçu financier avec style premium */}
      <div>
        <h2 className="text-2xl font-bold mb-6" style={{ color: '#212529', fontFamily: 'Poppins, sans-serif' }}>
          Finances - {stats.moisCourant}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {financeCards.map((card, index) => {
            const Icon = card.icon
            return (
              <div
                key={index}
                className="rounded-2xl p-6 transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: card.bgColor,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                  animation: `slideUp 0.6s ease-out ${(index + 4) * 0.1}s backwards`
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
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-medium" style={{ color: '#6C757D' }}>
                        {card.title}
                      </p>
                      {card.tooltip && <Tooltip content={card.tooltip} position="top" />}
                    </div>
                    {card.badge && (
                      <Badge type={card.badge.type} size="sm">
                        {card.badge.label}
                      </Badge>
                    )}
                  </div>
                  <div
                    className="p-3 rounded-xl transition-transform duration-300 hover:rotate-12"
                    style={{ backgroundColor: card.iconBg }}
                  >
                    <Icon className="w-7 h-7" style={{ color: card.iconColor }} />
                  </div>
                </div>
                <p
                  className="text-3xl font-bold mb-2"
                  style={{ color: '#212529', fontFamily: 'Poppins, sans-serif' }}
                >
                  {card.value}
                </p>
                <p className="text-sm mb-3" style={{ color: '#6C757D' }}>
                  {card.subtitle}
                </p>
                {card.showProgress && (
                  <ProgressBar
                    percentage={stats.tauxRecouvrement || 0}
                    height={10}
                    color={card.iconColor}
                    showLabel={false}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Graphiques avec jauge animée */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jauge circulaire taux d'occupation */}
        <div
          className="rounded-2xl p-6 transition-all duration-300"
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold" style={{ color: '#212529', fontFamily: 'Poppins, sans-serif' }}>
              Taux d'Occupation
            </h3>
            <Tooltip content="Répartition des unités occupées vs libres" />
          </div>

          {stats.totalUnites > 0 ? (
            <>
              <div className="flex justify-center mb-6">
                <CircularProgress
                  percentage={stats.tauxOccupation || 0}
                  size={200}
                  strokeWidth={16}
                  color="#00B894"
                  label="d'occupation"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4" style={{ borderTop: '1px solid #E9ECEF' }}>
                <div className="text-center p-4 rounded-xl" style={{ backgroundColor: 'rgba(0, 184, 148, 0.1)' }}>
                  <p className="text-sm font-medium mb-2" style={{ color: '#6C757D' }}>Occupées</p>
                  <p className="text-3xl font-bold" style={{ color: '#00B894', fontFamily: 'Poppins, sans-serif' }}>
                    {stats.unitesOccupees || 0}
                  </p>
                </div>
                <div className="text-center p-4 rounded-xl" style={{ backgroundColor: '#F5F7FA' }}>
                  <p className="text-sm font-medium mb-2" style={{ color: '#6C757D' }}>Libres</p>
                  <p className="text-3xl font-bold" style={{ color: '#ADB5BD', fontFamily: 'Poppins, sans-serif' }}>
                    {(stats.totalUnites || 0) - (stats.unitesOccupees || 0)}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              type="bien"
              title="Aucun bien enregistré"
              message="Ajoutez des biens pour suivre votre taux d'occupation"
            />
          )}
        </div>

        {/* Graphique revenus mensuels amélioré */}
        <div
          className="rounded-2xl p-6 transition-all duration-300"
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold" style={{ color: '#212529', fontFamily: 'Poppins, sans-serif' }}>
              Évolution des Revenus
            </h3>
            <Tooltip content="Comparaison revenus reçus vs attendus sur 6 mois" />
          </div>
          <MonthlyRevenueChart data={monthlyData} />
        </div>
      </div>

      {/* Actions rapides avec design premium */}
      <div
        className="rounded-2xl p-6"
        style={{
          backgroundColor: '#FFFFFF',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
        }}
      >
        <h3 className="text-2xl font-bold mb-6" style={{ color: '#212529', fontFamily: 'Poppins, sans-serif' }}>
          Actions rapides
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <button
            onClick={() => setShowProprietaireForm(true)}
            className="action-card action-card-primary group flex items-center p-5 rounded-2xl"
          >
            <div className="p-3 rounded-xl mr-3 group-hover:scale-110 transition-transform" style={{ backgroundColor: 'rgba(0, 60, 87, 0.1)' }}>
              <Users className="w-7 h-7" style={{ color: '#003C57' }} />
            </div>
            <div className="text-left">
              <p className="font-bold mb-1" style={{ color: '#212529', fontFamily: 'Poppins, sans-serif' }}>Nouveau Propriétaire</p>
              <p className="text-sm" style={{ color: '#6C757D' }}>Enregistrer un propriétaire</p>
            </div>
          </button>

          <button
            onClick={() => setShowBienForm(true)}
            className="action-card action-card-success group flex items-center p-5 rounded-2xl"
          >
            <div className="p-3 rounded-xl mr-3 group-hover:scale-110 transition-transform" style={{ backgroundColor: 'rgba(0, 184, 148, 0.1)' }}>
              <Home className="w-7 h-7" style={{ color: '#00B894' }} />
            </div>
            <div className="text-left">
              <p className="font-bold mb-1" style={{ color: '#212529', fontFamily: 'Poppins, sans-serif' }}>Nouveau Bien</p>
              <p className="text-sm" style={{ color: '#6C757D' }}>Ajouter un bien immobilier</p>
            </div>
          </button>

          <button
            onClick={() => setShowLocataireForm(true)}
            className="action-card action-card-warning group flex items-center p-5 rounded-2xl"
          >
            <div className="p-3 rounded-xl mr-3 group-hover:scale-110 transition-transform" style={{ backgroundColor: 'rgba(243, 156, 18, 0.1)' }}>
              <UserIcon className="w-7 h-7" style={{ color: '#F39C12' }} />
            </div>
            <div className="text-left">
              <p className="font-bold mb-1" style={{ color: '#212529', fontFamily: 'Poppins, sans-serif' }}>Nouveau Locataire</p>
              <p className="text-sm" style={{ color: '#6C757D' }}>Enregistrer un locataire</p>
            </div>
          </button>

          <button
            onClick={() => setShowPaiementForm(true)}
            className="action-card action-card-success group flex items-center p-5 rounded-2xl"
          >
            <div className="p-3 rounded-xl mr-3 group-hover:scale-110 transition-transform" style={{ backgroundColor: 'rgba(0, 184, 148, 0.1)' }}>
              <DollarSign className="w-7 h-7" style={{ color: '#00B894' }} />
            </div>
            <div className="text-left">
              <p className="font-bold mb-1" style={{ color: '#212529', fontFamily: 'Poppins, sans-serif' }}>Nouveau Paiement</p>
              <p className="text-sm" style={{ color: '#6C757D' }}>Enregistrer un paiement</p>
            </div>
          </button>
        </div>

        {/* Alertes impayés */}
        {stats.alertesImpayes > 0 && (
          <div className="mt-6 pt-6" style={{ borderTop: '1px solid #E9ECEF' }}>
            <button
              onClick={() => navigate('/paiements')}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: '#FEF5E7',
                color: '#E74C3C',
                boxShadow: '0 2px 8px rgba(231, 76, 60, 0.15)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(231, 76, 60, 0.25)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(231, 76, 60, 0.15)'
              }}
            >
              <AlertCircle className="w-5 h-5" />
              Voir les impayés ({stats.alertesImpayes})
            </button>
          </div>
        )}
      </div>


      {/* Modals */}
      <UniversalModal
        variant="form"
        isOpen={showProprietaireForm}
        onClose={() => setShowProprietaireForm(false)}
        title="Nouveau Propriétaire"
      >
        <ProprietaireForm
          onClose={() => setShowProprietaireForm(false)}
          onSuccess={handleModalSuccess}
        />
      </UniversalModal>

      <UniversalModal
        variant="form"
        isOpen={showBienForm}
        onClose={() => setShowBienForm(false)}
        title="Nouveau Bien"
        size="lg"
      >
        <BienForm
          onClose={() => setShowBienForm(false)}
          onSuccess={handleModalSuccess}
        />
      </UniversalModal>

      <UniversalModal
        variant="form"
        isOpen={showLocataireForm}
        onClose={() => setShowLocataireForm(false)}
        title="Nouveau Locataire"
        size="lg"
      >
        <LocataireForm
          onClose={() => setShowLocataireForm(false)}
          onSuccess={handleModalSuccess}
        />
      </UniversalModal>

      <UniversalModal
        variant="form"
        isOpen={showPaiementForm}
        onClose={() => setShowPaiementForm(false)}
        title="Nouveau Paiement"
      >
        <PaiementForm
          onClose={() => setShowPaiementForm(false)}
          onSuccess={handleModalSuccess}
        />
      </UniversalModal>
      </div>
    </div>
  )
}

export default Dashboard