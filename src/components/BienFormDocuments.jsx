import DocumentUpload from './DocumentUpload'

// Composant pour la section documents du bien
function BienFormDocuments({ bienId, formData, mandatDoc, setMandatDoc, titreDoc, setTitreDoc }) {
  return (
    <div className="pt-6 mt-6 border-t-2 border-gray-200 space-y-5">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
      </div>

      <div className="grid grid-cols-1 gap-5">
        <DocumentUpload
          type="mandat"
          ownerType="bien"
          ownerId={bienId || 'temp'}
          formData={formData}
          canGenerate={false}
          existingDocument={mandatDoc}
          onDocumentAdded={(doc) => setMandatDoc(doc)}
        />

        <DocumentUpload
          type="titre_propriete"
          ownerType="bien"
          ownerId={bienId || 'temp'}
          formData={formData}
          canGenerate={false}
          existingDocument={titreDoc}
          onDocumentAdded={(doc) => setTitreDoc(doc)}
        />
      </div>
    </div>
  )
}

export default BienFormDocuments
