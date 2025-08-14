import { useState, useEffect } from 'react'
import dataService from '../services/dataService'
import Modal from '../components/Modal'
import ProprietaireForm from '../components/ProprietaireForm'
import BienForm from '../components/BienForm'
import LocataireForm from '../components/LocataireForm'
import PaiementForm from '../components/PaiementForm'

function Dashboard() {
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  
  // États pour les formulaires modaux
  const [showProprietaireForm, setShowProprietaireForm] = useState(false)
  const [showBienForm, setShowBienForm] = useState(false)
  const [showLocataireForm, setShowLocataireForm] = useState(false)
  const [showPaiementForm, setShowPaiementForm] = useState(false)

  useEffect(() => {
    loadStats()
    // Actualiser les stats toutes les 30 secondes
    const interval = setInterval(loadStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadStats = () => {
    const statistics = dataService.getStatistiques()
    setStats(statistics)
    setLoading(false)
  }

  const handleModalSuccess = () => {
    loadStats() // Recharger les statistiques après ajout
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Cartes statistiques principales  
  const statCards = [
    {
      title: 'Propriétaires',
      value: stats.totalProprietaires || 0,
      icon: '👥',
      color: 'text-blue-600'
    },
    {
      title: 'Biens',
      value: stats.totalBiens || 0,
      subtitle: `${stats.totalUnites || 0} unités`,
      icon: '🏠',
      color: 'text-green-600'
    },
    {
      title: 'Locataires Actifs',
      value: stats.locatairesActifs || 0,
      subtitle: `sur ${stats.totalLocataires || 0} total`,
      icon: '👤',
      color: 'text-purple-600'
    },
    {
      title: 'Taux d\'Occupation',
      value: `${stats.tauxOccupation || 0}%`,
      subtitle: `${stats.unitesOccupees || 0}/${stats.totalUnites || 0} unités`,
      icon: '📊',
      color: 'text-orange-600'
    }
  ]

  // Cartes financières du mois courant
  const financeCards = [
    {
      title: `Revenus ${stats.moisCourant || ''} ${stats.anneeCourante || ''}`,
      value: `${(stats.revenusMoisCourant || 0).toLocaleString()} FCFA`,
      subtitle: `sur ${(stats.totalAttenduMoisCourant || 0).toLocaleString()} attendu`,
      icon: '💰',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'En Attente',
      value: `${(stats.montantEnAttente || 0).toLocaleString()} FCFA`,
      subtitle: `${stats.alertesImpayes || 0} locataire(s) en retard`,
      icon: '⏳',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      title: 'Taux de Recouvrement',
      value: `${stats.tauxRecouvrement || 0}%`,
      subtitle: stats.tauxRecouvrement >= 80 ? 'Excellent ✨' : stats.tauxRecouvrement >= 60 ? 'Bien 👍' : 'À améliorer 📈',
      icon: stats.tauxRecouvrement >= 80 ? '🏆' : stats.tauxRecouvrement >= 60 ? '📊' : '⚠️',
      color: stats.tauxRecouvrement >= 80 ? 'text-green-600' : stats.tauxRecouvrement >= 60 ? 'text-blue-600' : 'text-red-600',
      bgColor: stats.tauxRecouvrement >= 80 ? 'bg-green-50' : stats.tauxRecouvrement >= 60 ? 'bg-blue-50' : 'bg-red-50',
      borderColor: stats.tauxRecouvrement >= 80 ? 'border-green-200' : stats.tauxRecouvrement >= 60 ? 'border-blue-200' : 'border-red-200'
    }
  ]

  return (
    <div className="space-y-6">

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mb-1">{card.value}</p>
                {card.subtitle && (
                  <p className="text-xs text-gray-500">{card.subtitle}</p>
                )}
              </div>
              <div className={`text-3xl ${card.color}`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Aperçu financier */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Finances - {stats.moisCourant}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {financeCards.map((card, index) => (
            <div key={index} className={`${card.bgColor} rounded-lg shadow-sm p-6 border ${card.borderColor}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                  <p className={`text-xl font-bold mb-1 ${card.color}`}>{card.value}</p>
                  <p className="text-xs text-gray-600">{card.subtitle}</p>
                </div>
                <div className="text-2xl">
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => setShowProprietaireForm(true)}
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="text-2xl mr-3">👥</div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Nouveau Propriétaire</p>
              <p className="text-sm text-gray-600">Enregistrer un propriétaire</p>
            </div>
          </button>
          
          <button 
            onClick={() => setShowBienForm(true)}
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <div className="text-2xl mr-3">🏠</div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Nouveau Bien</p>
              <p className="text-sm text-gray-600">Ajouter un bien immobilier</p>
            </div>
          </button>
          
          <button 
            onClick={() => setShowLocataireForm(true)}
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <div className="text-2xl mr-3">👤</div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Nouveau Locataire</p>
              <p className="text-sm text-gray-600">Enregistrer un locataire</p>
            </div>
          </button>

          <button 
            onClick={() => setShowPaiementForm(true)}
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
          >
            <div className="text-2xl mr-3">💰</div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Nouveau Paiement</p>
              <p className="text-sm text-gray-600">Enregistrer un paiement</p>
            </div>
          </button>
        </div>

        {/* Liens utiles */}
        {stats.alertesImpayes > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button 
              onClick={() => window.location.href = '/paiements'}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm"
            >
              Voir les impayés ({stats.alertesImpayes})
            </button>
          </div>
        )}
      </div>


      {/* Modals */}
      <Modal 
        isOpen={showProprietaireForm} 
        onClose={() => setShowProprietaireForm(false)}
        title="Nouveau Propriétaire"
      >
        <ProprietaireForm 
          onClose={() => setShowProprietaireForm(false)}
          onSuccess={handleModalSuccess}
        />
      </Modal>

      <Modal 
        isOpen={showBienForm} 
        onClose={() => setShowBienForm(false)}
        title="Nouveau Bien"
        size="lg"
      >
        <BienForm 
          onClose={() => setShowBienForm(false)}
          onSuccess={handleModalSuccess}
        />
      </Modal>

      <Modal 
        isOpen={showLocataireForm} 
        onClose={() => setShowLocataireForm(false)}
        title="Nouveau Locataire"
        size="lg"
      >
        <LocataireForm 
          onClose={() => setShowLocataireForm(false)}
          onSuccess={handleModalSuccess}
        />
      </Modal>

      <Modal 
        isOpen={showPaiementForm} 
        onClose={() => setShowPaiementForm(false)}
        title="Nouveau Paiement"
      >
        <PaiementForm 
          onClose={() => setShowPaiementForm(false)}
          onSuccess={handleModalSuccess}
        />
      </Modal>
    </div>
  )
}

export default Dashboard