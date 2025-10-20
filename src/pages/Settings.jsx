import { useState, useEffect, useRef } from 'react'
import configService from '../services/configService'
import authService from '../services/authService'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

function Settings() {
  const { isConfigured } = useAuth()
  const [config, setConfig] = useState({})
  const [originalConfig, setOriginalConfig] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')
  const [logoPreview, setLogoPreview] = useState(null)
  const fileInputRef = useRef(null)
  const importInputRef = useRef(null)

  // États pour le changement de mot de passe
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = () => {
    try {
      const currentConfig = configService.getConfig()
      setConfig(currentConfig)
      setOriginalConfig(currentConfig)
      setLogoPreview(currentConfig.logo)
      setLoading(false)
    } catch (error) {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }))
    }
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const logoData = await configService.importLogo(file)
      setConfig(prev => ({ ...prev, logo: logoData }))
      setLogoPreview(logoData)
      setErrors(prev => ({ ...prev, logo: null }))
    } catch (error) {
      setErrors(prev => ({ ...prev, logo: error.message }))
    }
  }

  const handleRemoveLogo = () => {
    setConfig(prev => ({ ...prev, logo: null }))
    setLogoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setErrors({})
    setSuccess('')

    try {
      const validation = configService.validateConfig(config)
      
      if (!validation.isValid) {
        setErrors(validation.errors)
        setSaving(false)
        return
      }

      const saved = configService.saveConfig(config)
      if (saved) {
        setOriginalConfig(config)
        setSuccess('Configuration sauvegardée avec succès!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setErrors({ general: 'Erreur lors de la sauvegarde' })
      }
    } catch (error) {
      setErrors({ general: error.message })
    }

    setSaving(false)
  }

  const handleReset = () => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler les modifications?')) {
      setConfig(originalConfig)
      setLogoPreview(originalConfig.logo)
      setErrors({})
      setSuccess('')
    }
  }

  const handleExport = () => {
    configService.exportConfig()
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const importedConfig = await configService.importConfig(file)
      setConfig(importedConfig)
      setLogoPreview(importedConfig.logo)
      setSuccess('Configuration importée avec succès!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setErrors({ general: error.message })
    }

    if (importInputRef.current) {
      importInputRef.current.value = ''
    }
  }

  const hasChanges = () => {
    return JSON.stringify(config) !== JSON.stringify(originalConfig)
  }

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }))
    setPasswordError('')
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('Veuillez remplir tous les champs')
      return
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 6 caractères')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas')
      return
    }

    setPasswordLoading(true)

    try {
      await authService.changePassword(passwordData.currentPassword, passwordData.newPassword)
      setPasswordSuccess('Mot de passe modifié avec succès!')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setTimeout(() => setPasswordSuccess(''), 5000)
    } catch (error) {
      setPasswordError(error.message)
    } finally {
      setPasswordLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres de l'Agence</h1>
        <p className="text-gray-600 mt-1">
          Configurez les informations de votre agence immobilière
        </p>
      </div>

      {/* Notifications */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {errors.general && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {errors.general}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Logo et informations principales */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Logo</h2>
            
            {/* Logo preview */}
            <div className="mb-4">
              {logoPreview ? (
                <div className="relative">
                  <img 
                    src={logoPreview} 
                    alt="Logo" 
                    className="w-32 h-32 object-contain border border-gray-200 rounded-lg mx-auto"
                  />
                  <button 
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mx-auto">
                  <span className="text-gray-400 text-4xl">🏢</span>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Choisir un logo
            </button>
            
            {errors.logo && (
              <p className="mt-2 text-sm text-red-600">{errors.logo}</p>
            )}

            <p className="mt-2 text-xs text-gray-500">
              Image PNG, JPG ou SVG (max 2MB)
            </p>
          </div>

          {/* Actions d'import/export */}
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sauvegarde</h2>
            
            <div className="space-y-3">
              <button 
                onClick={handleExport}
                className="w-full bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
              >
                Exporter la configuration
              </button>

              <input
                ref={importInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              
              <button 
                onClick={() => importInputRef.current?.click()}
                className="w-full bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
              >
                Importer une configuration
              </button>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Informations de l'Agence</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nom de l'agence */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'agence *
                </label>
                <input
                  type="text"
                  value={config.agencyName || ''}
                  onChange={(e) => handleInputChange('agencyName', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.agencyName ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="Nom de votre agence"
                />
                {errors.agencyName && (
                  <p className="mt-1 text-sm text-red-600">{errors.agencyName}</p>
                )}
              </div>

              {/* IFU */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IFU
                </label>
                <input
                  type="text"
                  value={config.ifu || ''}
                  onChange={(e) => handleInputChange('ifu', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Numéro IFU"
                />
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={config.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.phone ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="+226 XX XX XX XX"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={config.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.email ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="contact@monagence.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Site web */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site web
                </label>
                <input
                  type="url"
                  value={config.website || ''}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.website ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="https://www.monagence.com"
                />
                {errors.website && (
                  <p className="mt-1 text-sm text-red-600">{errors.website}</p>
                )}
              </div>

              {/* Adresse */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse
                </label>
                <textarea
                  value={config.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Adresse complète de votre agence"
                />
              </div>

              {/* Ville */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ville
                </label>
                <input
                  type="text"
                  value={config.city || ''}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ouagadougou"
                />
              </div>

              {/* Pays */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pays
                </label>
                <input
                  type="text"
                  value={config.country || ''}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Burkina Faso"
                />
              </div>

              {/* Nom du responsable */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du responsable
                </label>
                <input
                  type="text"
                  value={config.managerName || ''}
                  onChange={(e) => handleInputChange('managerName', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nom du directeur ou responsable"
                />
              </div>

              {/* Titre du responsable */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre du responsable
                </label>
                <input
                  type="text"
                  value={config.managerTitle || ''}
                  onChange={(e) => handleInputChange('managerTitle', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Directeur Général"
                />
              </div>

              {/* Informations bancaires */}
              <div className="md:col-span-2">
                <h3 className="text-md font-semibold text-gray-900 mb-3 mt-6">Informations Bancaires</h3>
              </div>

              {/* Nom de la banque */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la banque
                </label>
                <input
                  type="text"
                  value={config.bankName || ''}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nom de votre banque"
                />
              </div>

              {/* Numéro de compte */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de compte
                </label>
                <input
                  type="text"
                  value={config.bankAccount || ''}
                  onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Numéro de compte bancaire"
                />
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="mt-8 flex justify-between">
              <button
                onClick={handleReset}
                disabled={!hasChanges()}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>

              <button
                onClick={handleSave}
                disabled={saving || !hasChanges()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && <LoadingSpinner size="small" />}
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>

          {/* Section Sécurité - Changement de mot de passe */}
          {isConfigured && (
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Sécurité</h2>

              <form onSubmit={handleChangePassword} className="space-y-4">
                {passwordSuccess && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                    {passwordSuccess}
                  </div>
                )}

                {passwordError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {passwordError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe actuel *
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Votre mot de passe actuel"
                    disabled={passwordLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nouveau mot de passe *
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Minimum 6 caractères"
                    disabled={passwordLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le nouveau mot de passe *
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Confirmer le mot de passe"
                    disabled={passwordLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {passwordLoading && <LoadingSpinner size="small" />}
                  {passwordLoading ? 'Modification en cours...' : 'Modifier le mot de passe'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings