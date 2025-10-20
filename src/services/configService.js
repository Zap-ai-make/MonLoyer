import logger from '../utils/logger'

class ConfigService {
  constructor() {
    this.storageKey = 'woning_agency_config'
    this.defaultConfig = {
      agencyName: 'Woning Agency',
      logo: null,
      ifu: '',
      phone: '',
      email: '',
      address: '',
      city: 'Ouagadougou',
      country: 'Burkina Faso',
      website: '',
      bankAccount: '',
      bankName: '',
      managerName: '',
      managerTitle: 'Directeur Général',

      // Champs supplémentaires pour le contrat de bail - BAILLEUR
      nomResponsable: '',
      prenomResponsable: '',
      pieceIdentite: '',
      dateEtablissementPiece: '',
      lieuEtablissementPiece: '',
      bp: '',
      lot: '',
      parcelles: '',
      section: '',
      secteur: '',
      commune: '',
      quartier: '',
      rueNumero: '',
      porteNumero: '',
      profession: 'Gestion Immobilière',
      ciDessusDesigne: 'Bailleur'
    }
  }

  // Récupérer la configuration actuelle
  getConfig() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const config = JSON.parse(stored)
        return { ...this.defaultConfig, ...config }
      }
    } catch (error) {
      logger.error('Erreur lors de la récupération de la configuration:', error)
    }
    return this.defaultConfig
  }

  // Sauvegarder la configuration
  saveConfig(config) {
    try {
      const currentConfig = this.getConfig()
      const updatedConfig = { ...currentConfig, ...config }
      localStorage.setItem(this.storageKey, JSON.stringify(updatedConfig))
      return true
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde de la configuration:', error)
      return false
    }
  }

  // Réinitialiser la configuration
  resetConfig() {
    try {
      localStorage.removeItem(this.storageKey)
      return true
    } catch (error) {
      logger.error('Erreur lors de la réinitialisation de la configuration:', error)
      return false
    }
  }

  // Importer un logo
  async importLogo(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('Aucun fichier fourni'))
        return
      }

      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        reject(new Error('Le fichier doit être une image'))
        return
      }

      // Vérifier la taille (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        reject(new Error('Le fichier ne doit pas dépasser 2MB'))
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const imageData = e.target.result
        resolve(imageData)
      }
      reader.onerror = () => {
        reject(new Error('Erreur lors de la lecture du fichier'))
      }
      reader.readAsDataURL(file)
    })
  }

  // Supprimer le logo
  removeLogo() {
    const config = this.getConfig()
    config.logo = null
    return this.saveConfig(config)
  }

  // Valider la configuration
  validateConfig(config) {
    const errors = {}

    if (!config.agencyName || config.agencyName.trim().length === 0) {
      errors.agencyName = 'Le nom de l\'agence est requis'
    }

    if (config.email && !this.isValidEmail(config.email)) {
      errors.email = 'L\'adresse email n\'est pas valide'
    }

    if (config.phone && !this.isValidPhone(config.phone)) {
      errors.phone = 'Le numéro de téléphone n\'est pas valide'
    }

    if (config.website && !this.isValidUrl(config.website)) {
      errors.website = 'L\'URL du site web n\'est pas valide'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

  // Utilitaires de validation
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  isValidPhone(phone) {
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{8,15}$/
    return phoneRegex.test(phone)
  }

  isValidUrl(url) {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  // Exporter la configuration
  exportConfig() {
    const config = this.getConfig()
    const dataStr = JSON.stringify(config, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `woning_config_${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  // Importer une configuration
  async importConfig(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('Aucun fichier fourni'))
        return
      }

      if (file.type !== 'application/json') {
        reject(new Error('Le fichier doit être au format JSON'))
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target.result)
          const validation = this.validateConfig(config)

          if (validation.isValid) {
            if (this.saveConfig(config)) {
              resolve(config)
            } else {
              reject(new Error('Erreur lors de la sauvegarde'))
            }
          } else {
            reject(new Error('Configuration invalide: ' + Object.values(validation.errors).join(', ')))
          }
        } catch (error) {
          reject(new Error('Fichier JSON invalide'))
        }
      }
      reader.onerror = () => {
        reject(new Error('Erreur lors de la lecture du fichier'))
      }
      reader.readAsText(file)
    })
  }

  // Obtenir les informations du bailleur pour le contrat
  getBailleurInfo() {
    const config = this.getConfig()
    return {
      nom: config.nomResponsable || config.managerName || '',
      prenom: config.prenomResponsable || '',
      nomAgence: config.agencyName || 'Woning - Gestion Immobilière',
      pieceIdentite: config.pieceIdentite || '',
      dateEtablissementPiece: config.dateEtablissementPiece || '',
      lieuEtablissementPiece: config.lieuEtablissementPiece || '',
      bp: config.bp || '',
      lot: config.lot || '',
      parcelles: config.parcelles || '',
      section: config.section || '',
      secteur: config.secteur || '',
      commune: config.commune || config.city || 'Ouagadougou',
      quartier: config.quartier || '',
      rueNumero: config.rueNumero || '',
      porteNumero: config.porteNumero || '',
      telephone: config.phone || '',
      email: config.email || '',
      profession: config.profession || 'Gestion Immobilière',
      ciDessusDesigne: config.ciDessusDesigne || 'Bailleur',
      adresseComplete: config.address || `${config.city}, ${config.country}`
    }
  }

  // Vérifier si les informations du bailleur sont complètes
  isBailleurInfoComplete() {
    const info = this.getBailleurInfo()
    return !!(info.nom && info.prenom && info.telephone && info.adresseComplete)
  }
}

export default new ConfigService()