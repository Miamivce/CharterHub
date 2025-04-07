import { useState } from 'react'
import { BookingDocument } from '@/types'
import { Button, Card, Modal, ModalHeader, ModalTitle, ModalContent } from '@/components/shared'
import { DocumentForm, DocumentFormValues } from '@/components/shared/DocumentForm'
import {
  DocumentIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  DocumentTextIcon,
  DocumentChartBarIcon,
  ClipboardDocumentIcon,
  DocumentCheckIcon,
  DocumentDuplicateIcon,
  UserIcon,
  MapIcon,
  IdentificationIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'

interface DocumentManagerProps {
  documents: BookingDocument[]
  onAddDocument: (document: Omit<BookingDocument, 'id' | 'uploadedAt'>) => Promise<void>
  onUpdateDocument: (id: string, updates: Partial<BookingDocument>) => Promise<void>
  onDeleteDocument: (id: string) => Promise<void>
}

const DOCUMENT_ICONS: Record<string, typeof DocumentIcon> = {
  proposal: DocumentTextIcon,
  brochure: DocumentChartBarIcon,
  contract: DocumentCheckIcon,
  payment_overview: DocumentDuplicateIcon,
  preference_sheet: ClipboardDocumentIcon,
  sample_menu: DocumentIcon,
  crew_profiles: UserIcon,
  itinerary: MapIcon,
  passport_details: IdentificationIcon,
  captains_details: UserCircleIcon,
  other: DocumentIcon,
}

export function DocumentManager({
  documents,
  onAddDocument,
  onUpdateDocument,
  onDeleteDocument,
}: DocumentManagerProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleAddDocument = async (values: DocumentFormValues) => {
    await onAddDocument({
      ...values,
      visibleToAllGuests: values.visibleToAllGuests || false,
    })
    setShowAddModal(false)
  }

  const handleToggleVisibility = async (document: BookingDocument) => {
    await onUpdateDocument(document.id, {
      visibleToAllGuests: !document.visibleToAllGuests,
    })
  }

  const handleDelete = async (documentId: string) => {
    setIsDeleting(documentId)
    try {
      await onDeleteDocument(documentId)
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Documents</h2>
        <Button onClick={() => setShowAddModal(true)}>Add Document</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {documents.map((document) => {
          const Icon = DOCUMENT_ICONS[document.category] || DocumentIcon
          return (
            <Card key={document.id} className="relative">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Icon className="h-5 w-5 text-gray-400" />
                  <div>
                    <h3 className="font-medium">{document.title}</h3>
                    {document.description && (
                      <p className="text-sm text-gray-500">{document.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDelete(document.id)}
                    className="text-gray-400 hover:text-red-500"
                    disabled={isDeleting === document.id}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                <p>Type: {document.type}</p>
                <p>Category: {document.category}</p>
                {document.metadata?.fileSize && (
                  <p>Size: {Math.round(document.metadata.fileSize / 1024)} KB</p>
                )}
              </div>

              {/* Visibility toggle */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <span className="text-sm font-medium text-gray-700">Visible to all guests</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={document.visibleToAllGuests || false}
                  className={`${
                    document.visibleToAllGuests ? 'bg-primary' : 'bg-gray-200'
                  } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
                  onClick={() => handleToggleVisibility(document)}
                >
                  <span className="sr-only">Visible to all guests</span>
                  <span
                    aria-hidden="true"
                    className={`${
                      document.visibleToAllGuests ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>
            </Card>
          )
        })}
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
        <ModalHeader>
          <ModalTitle>Add Document</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <DocumentForm
            onSubmit={handleAddDocument}
            onCancel={() => setShowAddModal(false)}
            isBookingDocument
            disableSearch={false}
          />
        </ModalContent>
      </Modal>
    </div>
  )
}
