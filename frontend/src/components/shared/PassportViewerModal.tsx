import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalContent,
  ModalFooter,
  Button,
} from '@/components/shared'
import { Document } from '@/types/document'
import { ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline'
import DocumentViewerFrame from './DocumentViewerFrame'
import { documentService } from '@/services/documentService'
import { useState } from 'react'

interface PassportViewerModalProps {
  isOpen: boolean
  onClose: () => void
  document: Document | null | undefined
}

export function PassportViewerModal({ isOpen, onClose, document }: PassportViewerModalProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  // Add debugging to help diagnose the issue
  console.log('PassportViewerModal render:', { isOpen, document })

  // If there's no document but the modal is still open, display an empty state rather than returning null
  // This ensures the modal UI remains consistent
  if (!document) {
    if (!isOpen) {
      console.log('PassportViewerModal: No document provided, returning null')
      return null
    }

    // Show empty state in the modal when it's open but no document is available
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalHeader>
          <ModalTitle>Document Viewer</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <div className="text-center py-8 text-gray-500">
            <p>No document available</p>
            <p className="text-sm mt-2">The document may be missing or could not be loaded.</p>
          </div>
        </ModalContent>
        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>
            <XMarkIcon className="h-5 w-5 mr-2" />
            Close
          </Button>
        </ModalFooter>
      </Modal>
    )
  }

  const handleDownload = async () => {
    if (!document.id) return

    try {
      setIsDownloading(true)

      // Get document as blob to avoid CORS issues
      const blob = await documentService.getDocumentBlob(document.id)

      // Create temporary URL for the blob
      const blobUrl = URL.createObjectURL(blob)

      // Create a link element and trigger the download
      const a = window.document.createElement('a')
      a.href = blobUrl
      a.download = document.title || 'document'
      window.document.body.appendChild(a)
      a.click()

      // Clean up
      window.document.body.removeChild(a)
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl)
      }, 100)
    } catch (error) {
      console.error('Error downloading document:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>{document.title}</ModalTitle>
      </ModalHeader>
      <ModalContent>
        {document.url ? (
          <div className="aspect-[4/3] relative">
            <DocumentViewerFrame document={document} />
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Preview not available</p>
            <p className="text-sm mt-2">The document may have been moved or deleted.</p>
          </div>
        )}
        {document.description && (
          <div className="mt-4 text-sm text-gray-500">
            <p>{document.description}</p>
          </div>
        )}
      </ModalContent>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          <XMarkIcon className="h-5 w-5 mr-2" />
          Close
        </Button>
        {document.id && (
          <Button onClick={handleDownload} disabled={isDownloading}>
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            {isDownloading ? 'Downloading...' : 'Download'}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  )
}
