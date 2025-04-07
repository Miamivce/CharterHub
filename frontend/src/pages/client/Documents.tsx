import { useState, useRef, useEffect } from 'react'
import { useDocument } from '@/contexts/document/DocumentContext'
import { Button, Card, Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from '@/components/shared'
import { PassportViewerModal } from '@/components/shared/PassportViewerModal'
import {
  DocumentIcon,
  ArrowUpTrayIcon,
  TrashIcon,
  IdentificationIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { Document } from '@/types/document'
import { useNotification } from '@/hooks/useNotification'
import { useJWTAuth } from '@/contexts/auth/JWTAuthContext'

export function Documents() {
  const { documents: contextDocuments, addDocument, deleteDocument } = useDocument()
  const { showNotification } = useNotification()
  const { user } = useJWTAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  // Local documents state to ensure immediate updates
  const [localDocuments, setLocalDocuments] = useState<Document[]>([])
  // State for delete confirmation modal
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync with context documents when they change
  useEffect(() => {
    setLocalDocuments(contextDocuments)
  }, [contextDocuments])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (!title) {
        setTitle(file.name)
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !title) return

    setIsUploading(true)
    setUploadError(null)
    try {
      // Create document with passport tags for central storage
      const newDocument: Document = {
        id: Date.now().toString(), // This will be replaced by the server
        type: 'file',
        category: 'passport_details',
        title,
        description,
        uploadedAt: new Date().toISOString(), // This will be replaced by the server
        metadata: {
          fileSize: selectedFile.size,
          fileType: selectedFile.type,
          tags: ['passport', 'client'], // Always add 'passport' tag for client uploads
          uploadedBy: {
            name: user?.firstName ? `${user.firstName} ${user.lastName}` : 'Client',
            date: new Date().toISOString(),
            id: user?.id ? Number(user.id) : undefined
          },
          user_id: user?.id ? Number(user.id) : undefined,
        },
      }
      
      // Use the documentService through the addDocument function
      // Capture the returned document with the correct server-assigned values
      const uploadedDocument = await addDocument(newDocument, selectedFile)
      
      // Immediately update local state with the uploaded document
      setLocalDocuments(prev => [uploadedDocument, ...prev])
      
      showNotification({
        type: 'success',
        message: 'Document uploaded successfully',
      })
      
      // Reset form fields
      setTitle('')
      setDescription('')
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Failed to upload passport:', error)
      setUploadError(error instanceof Error ? error.message : 'Failed to upload document')
      showNotification({
        type: 'error',
        message: 'Failed to upload document. Please try again.',
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Confirm deletion
  const confirmDelete = (documentId: string) => {
    setDocumentToDelete(documentId)
    setShowDeleteConfirm(true)
  }

  const handleDelete = async () => {
    if (!documentToDelete) return
    
    try {
      await deleteDocument(documentToDelete)
      // Update local state immediately
      setLocalDocuments(prev => prev.filter(doc => doc.id !== documentToDelete))
      showNotification({
        type: 'success',
        message: 'Document deleted successfully',
      })
    } catch (error) {
      console.error('Failed to delete passport:', error)
      showNotification({
        type: 'error',
        message: 'Failed to delete document. Please try again.',
      })
    } finally {
      setDocumentToDelete(null)
      setShowDeleteConfirm(false)
    }
  }

  // Filter passports from central document storage
  const passports = localDocuments.filter(
    (doc) => doc.category === 'passport_details' || doc.metadata?.tags?.includes('passport')
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Documents</h1>
      </div>

      <Card className="p-6 mx-auto w-1/2">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Upload Passport Document</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              placeholder="Enter document title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              placeholder="Add a description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              File (PDF, JPEG, or PNG, max 5MB)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark">
                    <span>Upload a file</span>
                    <input
                      type="file"
                      className="sr-only"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PDF, JPEG, or PNG up to 5MB</p>
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleUpload} disabled={!selectedFile || !title || isUploading}>
              <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </div>
          {uploadError && <p className="text-sm text-red-500 mt-2">{uploadError}</p>}
        </div>
      </Card>

      {passports.length > 0 && (
        <div className="space-y-4 mx-auto w-1/2">
          <h2 className="text-xl font-semibold">Uploaded Passports</h2>
          <div className="grid gap-4">
            {passports.map((doc) => (
              <Card key={doc.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div
                    className="flex items-center space-x-3 cursor-pointer"
                    onClick={() => setPreviewDocument(doc)}
                  >
                    <IdentificationIcon className="h-6 w-6 text-blue-500" />
                    <div>
                      <h3 className="font-medium">{doc.title}</h3>
                      {doc.description && (
                        <p className="text-sm text-gray-500">{doc.description}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button variant="destructive" onClick={() => confirmDelete(doc.id)}>
                    <TrashIcon className="h-5 w-5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Use the PassportViewerModal instead of the generic Modal */}
      <PassportViewerModal
        isOpen={!!previewDocument}
        onClose={() => setPreviewDocument(null)}
        document={previewDocument}
      />

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
        <ModalHeader>
          <ModalTitle>Confirm Deletion</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <div className="flex items-center gap-3 text-amber-600">
            <ExclamationTriangleIcon className="h-8 w-8" />
            <div>
              <h3 className="font-medium">Are you sure you want to delete this document?</h3>
              <p className="text-gray-500 text-sm">
                This action cannot be undone and will permanently delete the document.
              </p>
            </div>
          </div>
        </ModalContent>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
