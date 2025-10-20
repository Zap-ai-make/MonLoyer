import { useState, useEffect } from 'react'
import archiveService from '../services/archiveService'

function Archives() {
  const [paymentArchives, setPaymentArchives] = useState([])
  const [remittanceArchives, setRemittanceArchives] = useState([])
  const [selectedPaymentArchive, setSelectedPaymentArchive] = useState(null)
  const [selectedRemittanceArchive, setSelectedRemittanceArchive] = useState(null)
  const [activeSection, setActiveSection] = useState('paiements') // 'paiements' ou 'reversements'
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState({})

  useEffect(() => {
    loadArchives()
  }, [])

  const loadArchives = () => {
    const payments = archiveService.getArchivedPayments()
    const remittances = archiveService.getArchivedRemittances()
    const statistics = archiveService.getArchiveStats()
    
    
    setPaymentArchives(payments)
    setRemittanceArchives(remittances)
    setStats(statistics)
  }

  const filteredPaymentArchives = paymentArchives.filter(archive =>
    archive.monthLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
    archive.payments.some(payment => 
      JSON.stringify(payment).toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const filteredRemittanceArchives = remittanceArchives.filter(archive =>
    archive.proprietaireNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    archive.periode.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
  }

  const handleExportArchives = (type) => {
    archiveService.exportArchives(type)
  }

  return (
    <div className="dashboard-background">
      <div className="max-w-[1920px] mx-auto space-y-6 p-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Archives</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Historique des paiements et reversements validés
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleExportArchives('all')}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center gap-2"
          >
            📄 Exporter tout
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Paiements archivés</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalArchivedPayments || 0}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.paymentArchives || 0} mois archivés</p>
            </div>
            <div className="text-green-600 text-3xl">📦</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Montant archivé</p>
              <p className="text-2xl font-bold text-blue-600">{formatAmount(stats.totalArchivedAmount || 0)}</p>
              <p className="text-xs text-gray-500 mt-1">Total des paiements</p>
            </div>
            <div className="text-blue-600 text-3xl">💰</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Reversements</p>
              <p className="text-2xl font-bold text-purple-600">{stats.remittanceArchives || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Reversements validés</p>
            </div>
            <div className="text-purple-600 text-3xl">🏦</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Reversements total</p>
              <p className="text-2xl font-bold text-orange-600">{formatAmount(stats.totalRemittanceAmount || 0)}</p>
              <p className="text-xs text-gray-500 mt-1">Montant total reversé</p>
            </div>
            <div className="text-orange-600 text-3xl">📊</div>
          </div>
        </div>
      </div>

      {/* Recherche */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Rechercher dans les archives..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveSection('paiements')}
              className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeSection === 'paiements'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Archives Paiements ({filteredPaymentArchives.length})
            </button>
            <button
              onClick={() => setActiveSection('reversements')}
              className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeSection === 'reversements'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Archives Reversements ({filteredRemittanceArchives.length})
            </button>
          </nav>
        </div>

        {/* Contenu des onglets */}
        <div className="p-6">
          {activeSection === 'paiements' && (
            <div>
              {filteredPaymentArchives.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-5xl mb-4">📦</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucune archive de paiements
                  </h3>
                  <p className="text-gray-600">
                    Les paiements seront archivés automatiquement chaque 1er du mois.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Liste des archives */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Mois archivés ({filteredPaymentArchives.length})
                    </h3>
                    {filteredPaymentArchives.map((archive) => (
                      <div
                        key={archive.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          selectedPaymentArchive?.id === archive.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                        }`}
                        onClick={() => setSelectedPaymentArchive(archive)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{archive.monthLabel}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {archive.totalPayments} paiements • {formatAmount(archive.totalAmount)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Archivé le {formatDate(archive.archivedDate)}
                            </p>
                          </div>
                          <div className="text-green-600">
                            {selectedPaymentArchive?.id === archive.id ? '📂' : '📁'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Détail de l'archive sélectionnée */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    {selectedPaymentArchive ? (
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Détails - {selectedPaymentArchive.monthLabel}
                          </h3>
                          <button
                            onClick={() => handleExportArchives('payments')}
                            className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200"
                          >
                            📄 Exporter
                          </button>
                        </div>
                        
                        <div className="space-y-3">
                          {selectedPaymentArchive.payments.map((payment) => (
                            <div key={payment.id} className="bg-white p-3 rounded border">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">
                                    {payment.mois} {payment.annee}
                                    {payment.paiementMultiple && (
                                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                        {payment.totalMoisPayes} mois
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    Montant: {formatAmount(payment.montantPaye || 0)}
                                  </div>
                                  {payment.datePaiement && (
                                    <div className="text-xs text-gray-500">
                                      Payé le {formatDate(payment.datePaiement)}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium text-gray-900">
                                    {formatAmount(payment.montantPaye || 0)}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {payment.modePaiement}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-gray-400 text-3xl mb-3">👆</div>
                        <p className="text-gray-600">
                          Sélectionnez un mois à gauche pour voir les détails
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSection === 'reversements' && (
            <div>
              {filteredRemittanceArchives.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-5xl mb-4">🏦</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucun reversement archivé
                  </h3>
                  <p className="text-gray-600">
                    Les reversements apparaîtront ici une fois validés.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRemittanceArchives.map((remittance) => (
                    <div key={remittance.id} className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {remittance.proprietaireNom}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Période: {remittance.periode}
                          </p>
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                            <div>
                              <span className="text-gray-600">Montant brut:</span>
                              <span className="font-medium text-purple-600 ml-1">
                                {formatAmount(remittance.montantReverse)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Commission (10%):</span>
                              <span className="font-medium text-gray-600 ml-1">
                                {formatAmount(remittance.commission)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Montant net:</span>
                              <span className="font-medium text-green-600 ml-1">
                                {formatAmount(remittance.montantNet)}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Validé le {formatDate(remittance.validatedDate)} • {remittance.totalPaiements} paiement(s)
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Validé
                          </span>
                          <button
                            onClick={() => handleExportArchives('remittances')}
                            className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200"
                          >
                            📄 Exporter
                          </button>
                        </div>
                      </div>

                      {/* Détails des paiements (collapsible) */}
                      <details className="mt-3">
                        <summary className="text-sm text-purple-600 cursor-pointer hover:text-purple-800">
                          Voir les {remittance.totalPaiements} paiement(s) ▼
                        </summary>
                        <div className="mt-2 space-y-2 pl-4 border-l-2 border-purple-200">
                          {remittance.paiements.map((payment, index) => (
                            <div key={index} className="bg-white p-2 rounded border text-xs">
                              <div className="font-medium">
                                {payment.locataireNom} - {payment.bienNom}
                              </div>
                              <div className="text-gray-600">
                                Montant: {formatAmount(payment.montant)} • {payment.modePaiement}
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}

export default Archives