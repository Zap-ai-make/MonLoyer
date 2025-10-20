import configService from './configService'

class ReceiptService {
  // Formater les montants en FCFA
  formatAmount(amount) {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
  }

  // Formater les dates
  formatDate(date) {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date))
  }

  // Générer le CSS pour l'impression
  getReceiptCSS() {
    return `
      <style>
        @media print {
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
          .receipt { 
            width: 210mm; 
            min-height: 297mm; 
            margin: 0; 
            padding: 15mm; 
            box-sizing: border-box;
            background: white;
          }
          .no-print { display: none !important; }
          .page-break { page-break-after: always; }
        }
        
        @media screen {
          .receipt { 
            max-width: 800px; 
            margin: 20px auto; 
            padding: 30px; 
            border: 1px solid #ddd;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
        }

        .receipt {
          font-family: Arial, sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: #333;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #00B894;
        }

        .logo {
          max-width: 120px;
          max-height: 80px;
        }

        .agency-info {
          text-align: right;
          color: #666;
        }

        .agency-name {
          font-size: 20px;
          font-weight: bold;
          color: #003C57;
          margin-bottom: 5px;
        }

        .receipt-title {
          text-align: center;
          font-size: 28px;
          font-weight: bold;
          color: #003C57;
          margin: 25px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .receipt-number {
          text-align: right;
          font-size: 12px;
          color: #666;
          margin-bottom: 20px;
        }

        .info-section {
          margin-bottom: 30px;
          background: #f8f9fa;
          padding: 20px;
          border-radius: 10px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          padding: 8px 0;
          border-bottom: 1px solid #e9ecef;
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-label {
          font-weight: 600;
          color: #495057;
          min-width: 160px;
        }

        .info-value {
          color: #212529;
          font-weight: 500;
          text-align: right;
          flex: 1;
        }

        .amount-section {
          background: linear-gradient(135deg, #00B894 0%, #00D9A8 100%);
          border: none;
          border-radius: 12px;
          padding: 30px;
          margin: 30px 0;
          box-shadow: 0 4px 15px rgba(0, 184, 148, 0.2);
        }

        .amount-total {
          font-size: 28px;
          font-weight: bold;
          color: #FFFFFF;
          text-align: center;
        }

        .amount-words {
          font-style: italic;
          text-align: center;
          margin-top: 12px;
          color: rgba(255, 255, 255, 0.95);
          font-size: 15px;
        }

        .signature-section {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
        }

        .signature-box {
          width: 200px;
          text-align: center;
        }

        .signature-line {
          border-bottom: 1px solid #666;
          height: 60px;
          margin-bottom: 10px;
        }

        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          text-align: center;
          font-size: 12px;
          color: #666;
        }

        .print-buttons {
          text-align: center;
          margin: 20px 0;
        }

        .print-btn {
          background: #00B894;
          color: white;
          border: none;
          padding: 12px 24px;
          margin: 0 8px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 600;
          transition: all 0.3s;
        }

        .print-btn:hover {
          background: #009977;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 184, 148, 0.3);
        }

        .close-btn {
          background: #6c757d;
        }

        .close-btn:hover {
          background: #545b62;
        }

        .download-btn {
          background: #003C57;
        }

        .download-btn:hover {
          background: #002438;
          box-shadow: 0 4px 12px rgba(0, 60, 87, 0.3);
        }
      </style>
    `
  }

  // Convertir un nombre en lettres (simplifié pour le français)
  numberToWords(num) {
    if (num === 0) return 'zéro'
    
    const unites = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf']
    const dizaines = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix']
    const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf']
    
    function convertHundreds(n) {
      let result = ''
      const hundreds = Math.floor(n / 100)
      const remainder = n % 100
      
      if (hundreds > 0) {
        if (hundreds === 1) {
          result += 'cent'
        } else {
          result += unites[hundreds] + ' cent'
        }
        if (remainder > 0) result += ' '
      }
      
      if (remainder >= 20) {
        const tens = Math.floor(remainder / 10)
        const ones = remainder % 10
        result += dizaines[tens]
        if (ones > 0) {
          result += '-' + unites[ones]
        }
      } else if (remainder >= 10) {
        result += teens[remainder - 10]
      } else if (remainder > 0) {
        result += unites[remainder]
      }
      
      return result
    }
    
    if (num < 1000) {
      return convertHundreds(num)
    }
    
    const thousands = Math.floor(num / 1000)
    const remainder = num % 1000
    let result = ''
    
    if (thousands === 1) {
      result += 'mille'
    } else {
      result += convertHundreds(thousands) + ' mille'
    }
    
    if (remainder > 0) {
      result += ' ' + convertHundreds(remainder)
    }
    
    return result
  }

  // Générer un reçu de paiement pour un locataire
  generatePaymentReceipt(paiement, locataire, bien) {
    const config = configService.getConfig()
    const receiptNumber = `REC-${Date.now()}`
    const currentDate = new Date()

    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reçu de Paiement - ${receiptNumber}</title>
        ${this.getReceiptCSS()}
      </head>
      <body>
        <div class="no-print print-buttons">
          <button class="print-btn" onclick="window.print()">🖨️ Imprimer</button>
          <button class="print-btn download-btn" onclick="downloadPDF()">📥 Télécharger PDF</button>
          <button class="print-btn close-btn" onclick="window.close()">✖️ Fermer</button>
        </div>

        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
        <script>
          function downloadPDF() {
            const element = document.querySelector('.receipt');
            const opt = {
              margin: 10,
              filename: 'recu-paiement-${receiptNumber}.pdf',
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { scale: 2, useCORS: true },
              jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            html2pdf().set(opt).from(element).save();
          }
        </script>
        
        <div class="receipt">
          <!-- En-tête -->
          <div class="header">
            <div>
              ${config.logo ? `<img src="${config.logo}" alt="Logo" class="logo">` : '<div style="width: 120px; height: 80px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 24px;">🏢</div>'}
            </div>
            <div class="agency-info">
              <div class="agency-name">${config.agencyName}</div>
              ${config.address ? `<div>${config.address}</div>` : ''}
              ${config.city ? `<div>${config.city}, ${config.country || ''}</div>` : ''}
              ${config.phone ? `<div>Tél: ${config.phone}</div>` : ''}
              ${config.email ? `<div>Email: ${config.email}</div>` : ''}
              ${config.ifu ? `<div>IFU: ${config.ifu}</div>` : ''}
            </div>
          </div>

          <!-- Titre -->
          <div class="receipt-title">Reçu de Paiement</div>
          
          <!-- Numéro de reçu -->
          <div class="receipt-number">
            N° ${receiptNumber} - ${this.formatDate(currentDate)}
          </div>

          <!-- Informations du locataire -->
          <div class="info-section">
            <h3 style="color: #007bff; margin-bottom: 15px;">Informations du Locataire</h3>
            <div class="info-row">
              <span class="info-label">Nom complet :</span>
              <span class="info-value">${locataire?.prenom} ${locataire?.nom}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Téléphone :</span>
              <span class="info-value">${locataire?.telephone || 'Non renseigné'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email :</span>
              <span class="info-value">${locataire?.email || 'Non renseigné'}</span>
            </div>
          </div>

          <!-- Informations du bien -->
          <div class="info-section">
            <h3 style="color: #007bff; margin-bottom: 15px;">Informations du Bien</h3>
            <div class="info-row">
              <span class="info-label">Bien :</span>
              <span class="info-value">${bien?.nom}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Adresse :</span>
              <span class="info-value">${bien?.adresse}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Type :</span>
              <span class="info-value">${bien?.type}</span>
            </div>
          </div>

          <!-- Détails du paiement -->
          <div class="info-section">
            <h3 style="color: #007bff; margin-bottom: 15px;">Détails du Paiement</h3>
            <div class="info-row">
              <span class="info-label">Date de paiement :</span>
              <span class="info-value">${this.formatDate(paiement.datePaiement)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">${paiement.isPaiementMultiple ? 'Mois concernés' : 'Mois concerné'} :</span>
              <span class="info-value">${paiement.moisConcerne}</span>
            </div>
            ${paiement.isPaiementMultiple ? `
            <div class="info-row">
              <span class="info-label">Nombre de mois :</span>
              <span class="info-value">${paiement.nombreMois} mois</span>
            </div>
            <div class="info-row">
              <span class="info-label">Montant par mois :</span>
              <span class="info-value">${this.formatAmount(paiement.montantParMois)}</span>
            </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">Mode de paiement :</span>
              <span class="info-value">${paiement.modePaiement}</span>
            </div>
            ${paiement.numeroCheque ? `
            <div class="info-row">
              <span class="info-label">Numéro de chèque :</span>
              <span class="info-value">${paiement.numeroCheque}</span>
            </div>
            ` : ''}
          </div>

          <!-- Montant -->
          <div class="amount-section">
            <div class="amount-total">
              Montant reçu : ${this.formatAmount(paiement.montant)}
            </div>
            <div class="amount-words">
              Soit en lettres : ${this.numberToWords(paiement.montant)} francs CFA
            </div>
          </div>

          <!-- Notes -->
          ${paiement.notes ? `
          <div class="info-section">
            <h3 style="color: #007bff; margin-bottom: 15px;">Notes</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; font-style: italic;">
              ${paiement.notes}
            </div>
          </div>
          ` : ''}

          <!-- Signatures -->
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line"></div>
              <div><strong>Signature du Locataire</strong></div>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <div><strong>Signature de l'Agence</strong></div>
              ${config.managerName ? `<div style="margin-top: 5px; font-size: 12px;">${config.managerName}</div>` : ''}
              ${config.managerTitle ? `<div style="font-size: 11px; color: #666;">${config.managerTitle}</div>` : ''}
            </div>
          </div>

          <!-- Pied de page -->
          <div class="footer">
            <div>Ce reçu atteste du paiement effectué à la date mentionnée ci-dessus.</div>
            ${config.website ? `<div style="margin-top: 5px;">${config.website}</div>` : ''}
            <div style="margin-top: 10px; font-style: italic;">
              Généré le ${this.formatDate(currentDate)} par Woning.cloud
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    return html
  }

  // Générer un reçu de reversement pour un propriétaire
  generateRemittanceReceipt(paiements, proprietaire, periode) {
    const config = configService.getConfig()
    const receiptNumber = `REV-${Date.now()}`
    const currentDate = new Date()

    const totalCollecte = paiements.reduce((sum, p) => sum + p.montant, 0)
    const commission = totalCollecte * 0.1 // 10% de commission par exemple
    const montantReverse = totalCollecte - commission

    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reçu de Reversement - ${receiptNumber}</title>
        ${this.getReceiptCSS()}
      </head>
      <body>
        <div class="no-print print-buttons">
          <button class="print-btn" onclick="window.print()">🖨️ Imprimer</button>
          <button class="print-btn download-btn" onclick="downloadPDF()">📥 Télécharger PDF</button>
          <button class="print-btn close-btn" onclick="window.close()">✖️ Fermer</button>
        </div>

        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
        <script>
          function downloadPDF() {
            const element = document.querySelector('.receipt');
            const opt = {
              margin: 10,
              filename: 'recu-reversement-${receiptNumber}.pdf',
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { scale: 2, useCORS: true },
              jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            html2pdf().set(opt).from(element).save();
          }
        </script>
        
        <div class="receipt">
          <!-- En-tête -->
          <div class="header">
            <div>
              ${config.logo ? `<img src="${config.logo}" alt="Logo" class="logo">` : '<div style="width: 120px; height: 80px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 24px;">🏢</div>'}
            </div>
            <div class="agency-info">
              <div class="agency-name">${config.agencyName}</div>
              ${config.address ? `<div>${config.address}</div>` : ''}
              ${config.city ? `<div>${config.city}, ${config.country || ''}</div>` : ''}
              ${config.phone ? `<div>Tél: ${config.phone}</div>` : ''}
              ${config.email ? `<div>Email: ${config.email}</div>` : ''}
              ${config.ifu ? `<div>IFU: ${config.ifu}</div>` : ''}
            </div>
          </div>

          <!-- Titre -->
          <div class="receipt-title">Reçu de Reversement</div>
          
          <!-- Numéro de reçu -->
          <div class="receipt-number">
            N° ${receiptNumber} - ${this.formatDate(currentDate)}
          </div>

          <!-- Informations du propriétaire -->
          <div class="info-section">
            <h3 style="color: #007bff; margin-bottom: 15px;">Informations du Propriétaire</h3>
            <div class="info-row">
              <span class="info-label">Nom complet :</span>
              <span class="info-value">${proprietaire?.prenom} ${proprietaire?.nom}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Téléphone :</span>
              <span class="info-value">${proprietaire?.telephone || 'Non renseigné'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email :</span>
              <span class="info-value">${proprietaire?.email || 'Non renseigné'}</span>
            </div>
          </div>

          <!-- Période et détails -->
          <div class="info-section">
            <h3 style="color: #007bff; margin-bottom: 15px;">Détails du Reversement</h3>
            <div class="info-row">
              <span class="info-label">Période :</span>
              <span class="info-value">${periode}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Nombre de paiements :</span>
              <span class="info-value">${paiements.length}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total collecté :</span>
              <span class="info-value">${this.formatAmount(totalCollecte)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Commission (10%) :</span>
              <span class="info-value">${this.formatAmount(commission)}</span>
            </div>
          </div>

          <!-- Détail des paiements -->
          <div class="info-section">
            <h3 style="color: #007bff; margin-bottom: 15px;">Détail des Paiements</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                  <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">Date</th>
                  <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">Locataire</th>
                  <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">Bien</th>
                  <th style="padding: 10px; text-align: right; border: 1px solid #dee2e6;">Montant</th>
                </tr>
              </thead>
              <tbody>
                ${paiements.map(p => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #dee2e6;">${this.formatDate(p.datePaiement)}</td>
                  <td style="padding: 8px; border: 1px solid #dee2e6;">${p.locataireNom}</td>
                  <td style="padding: 8px; border: 1px solid #dee2e6;">${p.bienNom}</td>
                  <td style="padding: 8px; border: 1px solid #dee2e6; text-align: right;">${this.formatAmount(p.montant)}</td>
                </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Montant reversé -->
          <div class="amount-section">
            <div class="amount-total">
              Montant reversé : ${this.formatAmount(montantReverse)}
            </div>
            <div class="amount-words">
              Soit en lettres : ${this.numberToWords(montantReverse)} francs CFA
            </div>
          </div>

          <!-- Informations bancaires -->
          ${config.bankName || config.bankAccount ? `
          <div class="info-section">
            <h3 style="color: #007bff; margin-bottom: 15px;">Informations de Virement</h3>
            ${config.bankName ? `
            <div class="info-row">
              <span class="info-label">Banque :</span>
              <span class="info-value">${config.bankName}</span>
            </div>
            ` : ''}
            ${config.bankAccount ? `
            <div class="info-row">
              <span class="info-label">Compte :</span>
              <span class="info-value">${config.bankAccount}</span>
            </div>
            ` : ''}
          </div>
          ` : ''}

          <!-- Signatures -->
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line"></div>
              <div><strong>Signature du Propriétaire</strong></div>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <div><strong>Signature de l'Agence</strong></div>
              ${config.managerName ? `<div style="margin-top: 5px; font-size: 12px;">${config.managerName}</div>` : ''}
              ${config.managerTitle ? `<div style="font-size: 11px; color: #666;">${config.managerTitle}</div>` : ''}
            </div>
          </div>

          <!-- Pied de page -->
          <div class="footer">
            <div>Ce reçu atteste du reversement effectué pour la période mentionnée ci-dessus.</div>
            ${config.website ? `<div style="margin-top: 5px;">${config.website}</div>` : ''}
            <div style="margin-top: 10px; font-style: italic;">
              Généré le ${this.formatDate(currentDate)} par Woning.cloud
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    return html
  }

  // Imprimer un reçu de paiement
  printPaymentReceipt(paiement, locataire, bien) {
    const html = this.generatePaymentReceipt(paiement, locataire, bien)
    const printWindow = window.open('', '_blank')
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
  }

  // Imprimer un reçu de reversement
  printRemittanceReceipt(paiements, proprietaire, periode) {
    const html = this.generateRemittanceReceipt(paiements, proprietaire, periode)
    const printWindow = window.open('', '_blank')
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
  }
}

export default new ReceiptService()