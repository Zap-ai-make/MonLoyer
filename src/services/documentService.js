import storageWrapper from '../utils/storageWrapper'
import { generateDocumentId } from '../utils/idGenerator'
import { DocumentSchema } from '../utils/validation/schemas'
import logger from '../utils/logger'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import configService from './configService'
import storageService from './storageService'
import firestoreService from './firestoreService'
import { shouldUseFirebase, getCurrentAgenceId, dataURLtoBlob, blobToFile } from '../utils/firebaseHelpers'

// Service pour gérer les documents (mandats, titres, contrats)
class DocumentService {
  constructor() {
    this.storageKey = 'crm_documents'
    this.initializeData()
  }

  initializeData() {
    const existing = storageWrapper.getItem(this.storageKey, null)
    if (existing === null) {
      storageWrapper.setItem(this.storageKey, [])
    }
  }

  // CRUD Operations
  getDocuments() {
    return storageWrapper.getItem(this.storageKey, [])
  }

  getDocumentById(id) {
    const documents = this.getDocuments()
    return documents.find(doc => doc.id === id)
  }

  getDocumentsByOwner(ownerType, ownerId) {
    const documents = this.getDocuments()
    return documents.filter(doc => doc.owner_type === ownerType && doc.owner_id === ownerId)
  }

  getDocumentsByType(type) {
    const documents = this.getDocuments()
    return documents.filter(doc => doc.type === type)
  }

  async addDocument(documentData) {
    try {
      // Valider les données avec Zod
      const validated = DocumentSchema.parse(documentData)

      const documents = this.getDocuments()
      const newDocument = {
        id: generateDocumentId(),
        ...validated,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Si Firebase est configuré, uploader vers Cloud Storage
      if (shouldUseFirebase() && newDocument.url) {
        try {
          const agenceId = getCurrentAgenceId()
          if (agenceId) {
            const blob = dataURLtoBlob(newDocument.url)
            const file = blobToFile(blob, newDocument.filename, 'application/pdf')
            const storagePath = `documents/${newDocument.owner_type}/${newDocument.owner_id}/${newDocument.filename}`

            // Uploader vers Cloud Storage
            const downloadURL = await storageService.uploadFile(agenceId, storagePath, file)

            // Remplacer l'URL base64 par l'URL Cloud Storage
            newDocument.url = downloadURL
            newDocument.storagePath = storagePath

            // Sauvegarder les métadonnées dans Firestore
            await firestoreService.addDocument(agenceId, 'documents', newDocument)

          }
        } catch (error) {
          logger.error('Erreur upload Firebase Storage:', error)
          // Continuer avec localStorage si Firebase échoue
        }
      }

      documents.push(newDocument)
      storageWrapper.setItem(this.storageKey, documents)
      return newDocument
    } catch (error) {
      logger.error('Erreur validation document:', error)
      throw error
    }
  }

  async updateDocument(id, documentData) {
    const documents = this.getDocuments()
    const index = documents.findIndex(doc => doc.id === id)
    if (index !== -1) {
      documents[index] = {
        ...documents[index],
        ...documentData,
        updated_at: new Date().toISOString()
      }

      // Synchroniser avec Firestore si disponible
      if (shouldUseFirebase()) {
        try {
          const agenceId = getCurrentAgenceId()
          if (agenceId) {
            await firestoreService.updateDocument(agenceId, 'documents', id, documents[index])
          }
        } catch (error) {
          logger.error('Erreur mise à jour Firestore:', error)
        }
      }

      storageWrapper.setItem(this.storageKey, documents)
      return documents[index]
    }
    return null
  }

  async deleteDocument(id) {
    const documents = this.getDocuments()
    const doc = documents.find(d => d.id === id)

    // Supprimer de Cloud Storage si disponible
    if (shouldUseFirebase() && doc?.storagePath) {
      try {
        const agenceId = getCurrentAgenceId()
        if (agenceId) {
          await storageService.deleteFile(agenceId, doc.storagePath)
          await firestoreService.deleteDocument(agenceId, 'documents', id)
        }
      } catch (error) {
        logger.error('Erreur suppression Firebase:', error)
      }
    }

    const filtered = documents.filter(doc => doc.id !== id)
    storageWrapper.setItem(this.storageKey, filtered)
    return true
  }

  // Upload de fichier PDF (converti en base64)
  async uploadPdfFile(file, ownerType, ownerId, documentType) {
    return new Promise((resolve, reject) => {
      if (file.type !== 'application/pdf') {
        reject(new Error('Seuls les fichiers PDF sont acceptés'))
        return
      }

      // Vérifier la taille du fichier (max 2MB)
      const maxSize = 2 * 1024 * 1024 // 2MB
      if (file.size > maxSize) {
        reject(new Error(`Le fichier est trop volumineux (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum: 2MB`))
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const document = this.addDocument({
            owner_type: ownerType,
            owner_id: ownerId,
            type: documentType,
            filename: file.name,
            url: e.target.result, // base64
            generated: false
          })
          resolve(document)
        } catch (error) {
          reject(new Error('Erreur lors de l\'enregistrement du document: ' + error.message))
        }
      }
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'))
      reader.readAsDataURL(file)
    })
  }

  // Génération de documents PDF
  generateMandatGestion(proprietaireData) {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const margin = 20

    // En-tête
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('MANDAT DE GESTION', pageWidth / 2, 30, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - margin, 30, { align: 'right' })

    // Corps du document
    doc.setFontSize(12)
    let yPos = 50

    doc.text('ENTRE LES SOUSSIGNÉS :', margin, yPos)
    yPos += 15

    doc.setFont('helvetica', 'bold')
    doc.text('LE MANDANT (Propriétaire) :', margin, yPos)
    doc.setFont('helvetica', 'normal')
    yPos += 10

    doc.text(`Nom: ${proprietaireData.nom || ''} ${proprietaireData.prenom || ''}`, margin + 10, yPos)
    yPos += 7
    doc.text(`Adresse: ${proprietaireData.adresse || ''}`, margin + 10, yPos)
    yPos += 7
    doc.text(`Téléphone: ${proprietaireData.telephone || ''}`, margin + 10, yPos)
    yPos += 7
    doc.text(`Pièce d'identité: ${proprietaireData.pieceIdentite || ''}`, margin + 10, yPos)
    yPos += 15

    doc.setFont('helvetica', 'bold')
    doc.text('LE MANDATAIRE (Agence) :', margin, yPos)
    doc.setFont('helvetica', 'normal')
    yPos += 10

    doc.text('Nom: Woning - Gestion Immobilière', margin + 10, yPos)
    yPos += 7
    doc.text('Adresse: Ouagadougou, Burkina Faso', margin + 10, yPos)
    yPos += 20

    doc.setFont('helvetica', 'bold')
    doc.text('OBJET DU MANDAT :', margin, yPos)
    doc.setFont('helvetica', 'normal')
    yPos += 10

    const mandatText = [
      'Le Mandant donne mandat au Mandataire pour assurer la gestion complète de ses biens immobiliers,',
      'incluant notamment :',
      '',
      '• La recherche et la sélection de locataires',
      '• La rédaction et la signature des baux',
      '• L\'encaissement des loyers et charges',
      '• La gestion des réclamations et entretiens',
      '• Le suivi des paiements et relances',
      '',
      'Ce mandat est donné pour une durée d\'un (1) an renouvelable par tacite reconduction.'
    ]

    mandatText.forEach(line => {
      doc.text(line, margin + 5, yPos)
      yPos += 7
    })

    yPos += 10

    // Signatures
    doc.setFont('helvetica', 'bold')
    doc.text('Signature du Mandant', margin + 10, yPos)
    doc.text('Signature du Mandataire', pageWidth - margin - 60, yPos)

    // Convertir en base64
    return doc.output('dataurlstring')
  }

  generateContratBail(locataireData, bienData) {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    const margin = 15
    const maxWidth = pageWidth - 2 * margin
    let yPos = 20

    // Récupérer les infos du bailleur depuis la configuration
    const bailleurInfo = configService.getBailleurInfo()

    // Helper function pour vérifier si on doit changer de page
    const checkPageBreak = (spaceNeeded = 20) => {
      if (yPos > pageHeight - spaceNeeded) {
        doc.addPage()
        yPos = 20
      }
    }

    // ==================== PAGE 1 ====================

    // TITRE
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('CONTRAT DE BAIL', pageWidth / 2, yPos, { align: 'center' })
    yPos += 15

    // Entre les soussignés
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Entre les soussignés', pageWidth / 2, yPos, { align: 'center' })
    yPos += 12

    // BAILLEUR
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    const bailleurLine1 = `Nom :${bailleurInfo.nom || '…………………………………………'}  Prénom :${bailleurInfo.prenom || '……………………………'}  N° de la pièce d'identité date et lieu`
    doc.text(bailleurLine1, margin, yPos)
    yPos += 5

    const bailleurLine2 = `d'établissement :${bailleurInfo.dateEtablissementPiece || '………………………………………………………'}  BP${bailleurInfo.bp || '………………………………………………………………'}`
    doc.text(bailleurLine2, margin, yPos)
    yPos += 5

    const bailleurLine3 = `Lot :${bailleurInfo.lot || '…………………………'} Parcelles${bailleurInfo.parcelles || '………………………………'} Section ${bailleurInfo.section || '…………………………'} Secteur ${bailleurInfo.secteur || '…………………………'}`
    doc.text(bailleurLine3, margin, yPos)
    yPos += 5

    const bailleurLine4 = `Adresse : Rue n° ${bailleurInfo.rueNumero || '…………………………………………………'}  Porte n°${bailleurInfo.porteNumero || '………………………………………………………………'}`
    doc.text(bailleurLine4, margin, yPos)
    yPos += 5

    const bailleurLine5 = `Profession : ${bailleurInfo.profession || '…………………………………………………………………………………………………………………………………'}`
    doc.text(bailleurLine5, margin, yPos)
    yPos += 5

    const bailleurLine6 = `Ci-dessus désigné : ${bailleurInfo.ciDessusDesigne || '……………………………………………………………………………………………………………………'}`
    doc.text(bailleurLine6, margin, yPos)
    yPos += 5

    doc.setFont('helvetica', 'normal')
    doc.text("Bailleur ou son représentant d'une part.", margin, yPos)
    yPos += 10

    // ET
    doc.setFont('helvetica', 'bold')
    doc.text('Et', margin, yPos)
    yPos += 8

    // PRENEUR (Locataire)
    doc.setFont('helvetica', 'normal')

    const preneurLine1 = `Nom : ${locataireData.nom || '…………………………………………………'}Prénom : ${locataireData.prenom || '…………………………'} N° de la pièce d'identité date et`
    doc.text(preneurLine1, margin, yPos)
    yPos += 5

    const preneurLine2 = `lieu d'établissement :${locataireData.pieceIdentite || '…………………………………………………………………'}  ou  dénomination  de  la`
    doc.text(preneurLine2, margin, yPos)
    yPos += 5

    const preneurLine3 = `société :${locataireData.denominationSociete || '………………………………………………………………………………………………………………………………………'}`
    doc.text(preneurLine3, margin, yPos)
    yPos += 5

    const preneurLine4 = `BP : ${locataireData.bp || '………………………………………………………………………………………………………………………………………………………'}`
    doc.text(preneurLine4, margin, yPos)
    yPos += 5

    const preneurLine5 = `Lot :${locataireData.lot || '……………………………'} Parcelles ${locataireData.parcelles || '……………………………'} Section ${locataireData.section || '……………………………………'} Secteur ${locataireData.secteur || '……………………………………'}`
    doc.text(preneurLine5, margin, yPos)
    yPos += 5

    const preneurLine6 = `Adresse : Rue n° ${locataireData.rueNumero || '…………………………………………'}  Porte n° ${locataireData.porteNumero || '…………………………………………………………………'}`
    doc.text(preneurLine6, margin, yPos)
    yPos += 5

    const preneurLine7 = `Profession : ${locataireData.profession || '…………………………………………………………………………………………………………………………………'}`
    doc.text(preneurLine7, margin, yPos)
    yPos += 5

    const preneurLine8 = `Ci-dessous désigné : ${locataireData.ciDessousDesigne || '……………………………………………………………………………………………………………………'}`
    doc.text(preneurLine8, margin, yPos)
    yPos += 5

    doc.text("Preneur ou son représentant d'une part.", margin, yPos)
    yPos += 10

    // Il a été convenu ce qui suit
    doc.setFont('helvetica', 'italic')
    doc.text('Il a été convenu ce qui suit :', pageWidth / 2, yPos, { align: 'center' })
    yPos += 10

    // ARTICLE 1
    doc.setFont('helvetica', 'bold')
    doc.text('ARTICLE 1', margin, yPos)
    yPos += 7

    doc.setFont('helvetica', 'normal')
    doc.text('Le bailleur donne en bail à loyer au preneur qui accepte un immeuble à', margin, yPos)
    yPos += 7

    const article1Line1 = `Usage : ${bienData?.usage || '…………………………………………………………'}Sise à ${bienData?.adresse || '…………………………………………………………………'}`
    doc.text(article1Line1, margin, yPos)
    yPos += 6

    const article1Line2 = `Commune de : ${bienData?.commune || bailleurInfo.commune || '…………………………………………'}Secteur : ${bienData?.secteurBien || '………………………………………'}Quartier`
    doc.text(article1Line2, margin, yPos)
    yPos += 6

    const article1Line3 = `Lot :${bienData?.lotBien || '……………………………'} Parcelles ${bienData?.parcellesBien || '……………………………'} Section ${bienData?.sectionBien || '……………………………………'} Secteur ${bienData?.secteurBien || '……………………………………'}`
    doc.text(article1Line3, margin, yPos)
    yPos += 6

    const article1Line4 = `Titre de propriété : ${bienData?.titrePropriete || '……………………………………………………………………………………'}du ${bienData?.dateTitrePropriete || '……………………………………'}`
    doc.text(article1Line4, margin, yPos)
    yPos += 8

    // ==================== PAGE 2 ====================
    doc.addPage()
    yPos = 20

    const article1Page2Line1 = `Adresse : Rue n° ${bienData?.rueNumeroBien || '…………………………………………'} Porte n° ${bienData?.porteNumeroBien || '…………………………………………………………………'}`
    doc.text(article1Page2Line1, margin, yPos)
    yPos += 6

    const article1Page2Line2 = `d'une superficie total de ${bienData?.superficie || '…………………………………………'}m2`
    doc.text(article1Page2Line2, margin, yPos)
    yPos += 7

    doc.text('équipe de :', margin, yPos)
    yPos += 7

    const eauCourante = bienData?.eauCourante ? 'OUI' : (bienData?.eauCourante === false ? 'NON' : 'OUI          NON')
    doc.text(`une installation d'eau courante fonctionnelle : ${eauCourante}`, margin, yPos)
    yPos += 7

    const electricite = bienData?.electricite ? 'OUI' : (bienData?.electricite === false ? 'NON' : 'OUI          NON')
    doc.text(`Une installation électrique fonctionnelle    : ${electricite}`, margin, yPos)
    yPos += 7

    doc.text(`Autres équipements :`, margin, yPos)
    yPos += 10

    // ARTICLE 2
    doc.setFont('helvetica', 'bold')
    doc.text("Article 2 : DATE D'ENTREE EN JUISSANCE –DUREE", margin, yPos)
    yPos += 7

    doc.setFont('helvetica', 'normal')
    const dureeContrat = locataireData.dureeContrat || '…………………………………………………………………………………'
    doc.text(`Le présent bail à loyer est conclu pour une durée de ${dureeContrat}`, margin, yPos)
    yPos += 7

    const dateEntree = locataireData.dateEntree || '…………………………………………………………………'
    const dateFin = locataireData.dateFin || '……………………………………………………'
    doc.text(`Commerçant à courir du ${dateEntree}Au ${dateFin}`, margin, yPos)
    yPos += 7

    doc.text('et renouvelable par tacite reconduction', margin, yPos)
    yPos += 10

    // ARTICLE 3
    doc.setFont('helvetica', 'bold')
    doc.text('ARTICLE 3 : LOYER', margin, yPos)
    yPos += 7

    doc.setFont('helvetica', 'normal')
    doc.text('Le bail est consenti par le bailleur et accepté par le preneur, moyennant :', margin, yPos)
    yPos += 7

    const loyerMensuel = locataireData.montantLoyer || '…………………………………………………………………………………………………………'
    doc.text(`1°- Un loyer mensuel de ${loyerMensuel}FCFA`, margin, yPos)
    yPos += 7

    doc.text(`2°- Et le  dépôt préalable entre les mains du bailleur.`, margin, yPos)
    yPos += 7

    const caution = locataireData.caution || '………………………………………………………………………………………………………………………'
    doc.text(`D'une somme de ${caution}FCFA`, margin, yPos)
    yPos += 7

    const representantCaution = locataireData.representantCaution || '…………………………………………………………………………………………………………………………………'
    doc.text(`Représentant${representantCaution}`, margin, yPos)
    yPos += 10

    // ARTICLE 4
    doc.setFont('helvetica', 'bold')
    doc.text('ARTICLE 4 : CHARGES ET CONDITIONS', margin, yPos)
    yPos += 10

    doc.setFont('helvetica', 'bold')
    doc.text('I - A la charge du preneur', pageWidth / 2, yPos, { align: 'center' })
    yPos += 7

    doc.setFont('helvetica', 'normal')
    const article4Para1 = "1. Le preneur devra occuper ladite maison par lui-même. S'abstenant d'y mener des activités proscrites ou incompatibles."
    const lines4Para1 = doc.splitTextToSize(article4Para1, maxWidth)
    doc.text(lines4Para1, margin, yPos)
    yPos += lines4Para1.length * 5 + 2

    const article4Para2 = "2 .Entretient et préparation : Le preneur entretiendra les locaux et les meubles du bail tel qu'il les aura reçus, conformément à l'état des lieux fait en trois exemplaires signés par des deux parties et visés par le service ayant compétence pour enregistrer le contrat."
    const lines4Para2 = doc.splitTextToSize(article4Para2, maxWidth)
    doc.text(lines4Para2, margin, yPos)
    yPos += lines4Para2.length * 5 + 2

    const article4Para3 = "3. Règlement urbain : Le preneur satisfera en lieu et place du bailleur, toutes les prescriptions de police, de voirie et d'hygiène. Il exécutera ses frais, sans recours contre le bailleur, tous travaux qui sont ou seront exigés par les textes et lois sur la santé publique."
    const lines4Para3 = doc.splitTextToSize(article4Para3, maxWidth)
    doc.text(lines4Para3, margin, yPos)
    yPos += lines4Para3.length * 5 + 2

    const article4Para4 = "4. Transformation : Le preneur ne pourra faire faire aucune modification ni transformation dans l'état ou la disposition des lieux sans autorisation préalable et expresse du Bailleur. Tout embellissement, toute amélioration ou construction nouvelle appartiendront de plein de droit au Bailleur en fin de bail, sans aucune indemnité."
    const lines4Para4 = doc.splitTextToSize(article4Para4, maxWidth)
    doc.text(lines4Para4, margin, yPos)
    yPos += lines4Para4.length * 5 + 2

    // ==================== PAGE 3 ====================
    doc.addPage()
    yPos = 20

    const article4Para5 = "5. Sous-location cession : Le preneur ne pourra céder son droit au présent bail sans le consentement exprès du Bailleur. De même, il ne pourra sous-louer tout ou partie des locaux sans le dit consentement."
    const lines4Para5 = doc.splitTextToSize(article4Para5, maxWidth)
    doc.text(lines4Para5, margin, yPos)
    yPos += lines4Para5.length * 5 + 10

    doc.setFont('helvetica', 'bold')
    doc.text('II – A la charge du Bailleur', pageWidth / 2, yPos, { align: 'center' })
    yPos += 7

    doc.setFont('helvetica', 'normal')
    doc.text('Le bailleur supportera les grosses réparations qui pourraient devenir nécessaire', margin, yPos)
    yPos += 10

    doc.setFont('helvetica', 'bold')
    doc.text('III- Conditions particulières', pageWidth / 2, yPos, { align: 'center' })
    yPos += 7

    doc.setFont('helvetica', 'normal')
    doc.text('……………………………………………………………………………………………………………………………………………………………………', margin, yPos)
    yPos += 5
    doc.text('……………………………………………………………………………………………………………………………………………………………………', margin, yPos)
    yPos += 5
    doc.text('…………………………………………………………………………………………………………………………………………………………………', margin, yPos)
    yPos += 10

    doc.setFont('helvetica', 'normal')
    doc.text('(1) rayer les mentions inutiles', pageWidth / 2, yPos, { align: 'center' })
    yPos += 12

    // ARTICLE 5
    doc.setFont('helvetica', 'bold')
    doc.text('ARTICLE 5 : RESILIATION', margin, yPos)
    yPos += 7

    doc.setFont('helvetica', 'normal')
    doc.text("Le présent bail sera résilié à la demande écrite de l'une des parties pour les motifs suivants :", margin, yPos)
    yPos += 7

    const motifs = [
      "a) Le défaut de paiement de deux termes (2 mois) de loyer ;",
      "b) L'inexécution par l'une des parties quelconque clause de présent bail ;",
      "c) La détérioration notable de l'immeuble par le fait du preneur ;",
      "d) La reprise de l'immeuble par le propriétaire ;",
      "e) La demande expresse du locataire adressée au Bailleur donnant un préavis de trois mois pour libérer les lieux ;",
      "f) Cas fortuit d'affectation du preneur, expropriation du preneur du Bailleur pour cause d'utile publique etc."
    ]

    motifs.forEach(motif => {
      const linesMotif = doc.splitTextToSize(motif, maxWidth - 10)
      doc.text(linesMotif, margin + 5, yPos)
      yPos += linesMotif.length * 5
    })
    yPos += 3

    const article5Para1 = "Dans tous les cas, les services des impôts du domicile du bailleur doit être informé par écrit de tout demande de résiliation. A défaut de règlement à l'amiable, tout litige sera porté devant les juridictions compétentes."
    const lines5Para1 = doc.splitTextToSize(article5Para1, maxWidth)
    doc.text(lines5Para1, margin, yPos)
    yPos += lines5Para1.length * 5 + 3

    const article5Para2 = "Le droit proportionnel sur les mutations de jouissance de biens immeubles est exigible lors de l'enregistrement de l'acte mais son montant peut être fractionné pour le paiement :"
    const lines5Para2 = doc.splitTextToSize(article5Para2, maxWidth)
    doc.text(lines5Para2, margin, yPos)
    yPos += lines5Para2.length * 5 + 3

    const article5SubA = "a) S'il s'agit d'un bail à durée fixe, en autant de paiement qu'il y a de périodes triennales dans la durée du bail ;"
    const lines5SubA = doc.splitTextToSize(article5SubA, maxWidth - 10)
    doc.text(lines5SubA, margin + 5, yPos)
    yPos += lines5SubA.length * 5

    const article5SubB = "b) S'il s'agit d'un bail à période, en autant de paiement que le bail comporte de période."
    const lines5SubB = doc.splitTextToSize(article5SubB, maxWidth - 10)
    doc.text(lines5SubB, margin + 5, yPos)
    yPos += lines5SubB.length * 5 + 3

    const article5Para3 = "Le droit afférent au bail et à son renouvellement est payé dans le mois du commencement de la nouvelle période à la diligence du propriétaire ou du locataire. Le défaut d'enregistrement, de renouvellement ou de paiement des droits afférents à une période dans les délais fixés par les textes en vigueur entraîne à l'encontre de s parties l'application d'une amende égale au montant des droits dus."
    const lines5Para3 = doc.splitTextToSize(article5Para3, maxWidth)
    doc.text(lines5Para3, margin, yPos)
    yPos += lines5Para3.length * 5 + 5

    // ==================== PAGE 4 ====================
    doc.addPage()
    yPos = 20

    // ARTICLE 6
    doc.setFont('helvetica', 'bold')
    doc.text('ARTICLE 6: IMPÔTS SUR LES REVENUS FONCIERS', margin, yPos)
    yPos += 7

    doc.setFont('helvetica', 'normal')
    const article6Para1 = "Conformément aux termes en vigueur, il est fait obligation au bailleur d'effectuer la déclaration ses revenus locatifs auprès du service des impôts de lieu de situation géographique de l'immeuble au plus tard le 1O du mois suivant celui au titre duquel le loyer échu, à l'aide d'un imprimé fourni par l'administration et d'acquitter l'impôt correspondant dans le délai auprès du même service."
    const lines6Para1 = doc.splitTextToSize(article6Para1, maxWidth)
    doc.text(lines6Para1, margin, yPos)
    yPos += lines6Para1.length * 5 + 5

    const article6Para2 = "Lorsque l'immeuble est situé à l'étranger, la déclaration doit être faite au service des impôts du lieu de résidence du bailleur et l'impôt correspond acquitté dans le même délai que ci-dessus."
    const lines6Para2 = doc.splitTextToSize(article6Para2, maxWidth)
    doc.text(lines6Para2, margin, yPos)
    yPos += lines6Para2.length * 5 + 5

    const article6Para3 = "En cas de résiliation avant terme du contrat de bail, le bailleur doit en effectuer la notification au service des impôts dans les 1O jours de la rupture du contrat."
    const lines6Para3 = doc.splitTextToSize(article6Para3, maxWidth)
    doc.text(lines6Para3, margin, yPos)
    yPos += lines6Para3.length * 5 + 5

    const article6Para4 = "A défaut ; l'impôt est dû, sans préjudice » des pénalités prévues dans le présent titre."
    const lines6Para4 = doc.splitTextToSize(article6Para4, maxWidth)
    doc.text(lines6Para4, margin, yPos)
    yPos += lines6Para4.length * 5 + 10

    // ARTICLE 7
    doc.setFont('helvetica', 'bold')
    doc.text('ARTCLE 7 : MODIFICATION', margin, yPos)
    yPos += 7

    doc.setFont('helvetica', 'normal')
    const article7Para1 = "Les parties peuvent apporter toutes modifications au présent bail dans les conditions qu'ils détermineront."
    const lines7Para1 = doc.splitTextToSize(article7Para1, maxWidth)
    doc.text(lines7Para1, margin, yPos)
    yPos += lines7Para1.length * 5 + 5

    const article7Para2 = "Toutefois, ces modifications seront opposables à l'administration que si cette dernière est informée et que ces dites modifications ne soient pas contraires à la loi."
    const lines7Para2 = doc.splitTextToSize(article7Para2, maxWidth)
    doc.text(lines7Para2, margin, yPos)
    yPos += lines7Para2.length * 5 + 10

    // ARTICLE 8
    doc.setFont('helvetica', 'bold')
    doc.text('ARTICLE 8 : ELECTION DE DOMICILE', margin, yPos)
    yPos += 7

    doc.setFont('helvetica', 'normal')
    doc.text("Pour l'exécution des présentes et leurs suites les parties font élection de domicile aux lieux-ci après :", margin, yPos)
    yPos += 10

    doc.text('Le Bailleur', pageWidth / 2, yPos, { align: 'center' })
    yPos += 15

    doc.text('L e Preneur', pageWidth / 2, yPos, { align: 'center' })
    yPos += 15

    doc.text('Fait en quatre (4) exemplaires', pageWidth - margin - 60, yPos, { align: 'right' })
    yPos += 7

    const lieuDate = `A${bailleurInfo.commune || '………………………………'} le, ${new Date().toLocaleDateString('fr-FR')}`
    doc.text(lieuDate, pageWidth - margin - 60, yPos, { align: 'right' })
    yPos += 20

    // SIGNATURES
    const signatureY = yPos
    doc.setFont('helvetica', 'normal')
    doc.text('Le Preneur', margin + 30, signatureY)
    doc.text('Le Bailleur', pageWidth - margin - 50, signatureY)

    yPos += 7
    doc.setFontSize(9)
    doc.text('(Signature précédée de la mention', margin + 10, yPos)
    doc.text('(Signature précédée de la mention', pageWidth - margin - 70, yPos)

    yPos += 5
    doc.text('Lu et approuvé)', margin + 30, yPos)
    doc.text('Lu et approuvé)', pageWidth - margin - 50, yPos)

    // Convertir en base64
    return doc.output('dataurlstring')
  }

  // Générer et enregistrer un document
  async generateAndSaveDocument(type, ownerType, ownerId, data, additionalData = null) {
    let pdfDataUrl = null
    let filename = ''

    switch (type) {
      case 'mandat':
        pdfDataUrl = this.generateMandatGestion(data)
        filename = `Mandat_Gestion_${data.nom}_${data.prenom}_${Date.now()}.pdf`
        break
      case 'contrat_bail':
        pdfDataUrl = this.generateContratBail(data, additionalData)
        filename = `Contrat_Bail_${data.nom}_${data.prenom}_${Date.now()}.pdf`
        break
      case 'titre_propriete':
        // Pour le titre de propriété, seul l'upload manuel est autorisé
        throw new Error('Le titre de propriété ne peut être que uploadé manuellement')
      default:
        throw new Error('Type de document non reconnu')
    }

    const document = this.addDocument({
      owner_type: ownerType,
      owner_id: ownerId,
      type: type,
      filename: filename,
      url: pdfDataUrl,
      generated: true
    })

    return document
  }

  // Télécharger un document
  downloadDocument(documentId) {
    const doc = this.getDocumentById(documentId)
    if (!doc) {
      throw new Error('Document non trouvé')
    }

    const link = window.document.createElement('a')
    link.href = doc.url
    link.download = doc.filename
    window.document.body.appendChild(link)
    link.click()
    window.document.body.removeChild(link)
  }

  // Filtrer les documents
  filterDocuments(filters) {
    let documents = this.getDocuments()

    if (filters.type) {
      documents = documents.filter(doc => doc.type === filters.type)
    }

    if (filters.ownerType) {
      documents = documents.filter(doc => doc.owner_type === filters.ownerType)
    }

    if (filters.startDate) {
      documents = documents.filter(doc => new Date(doc.created_at) >= new Date(filters.startDate))
    }

    if (filters.endDate) {
      documents = documents.filter(doc => new Date(doc.created_at) <= new Date(filters.endDate))
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      documents = documents.filter(doc =>
        doc.filename.toLowerCase().includes(searchLower)
      )
    }

    return documents
  }

  // Obtenir les statistiques
  getStatistics() {
    const documents = this.getDocuments()

    return {
      total: documents.length,
      byType: {
        mandat: documents.filter(d => d.type === 'mandat').length,
        titre_propriete: documents.filter(d => d.type === 'titre_propriete').length,
        contrat_bail: documents.filter(d => d.type === 'contrat_bail').length
      },
      byOwnerType: {
        proprietaire: documents.filter(d => d.owner_type === 'proprietaire').length,
        locataire: documents.filter(d => d.owner_type === 'locataire').length
      },
      generated: documents.filter(d => d.generated === true).length,
      uploaded: documents.filter(d => d.generated === false).length
    }
  }
}

export default new DocumentService()
