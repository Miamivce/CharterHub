import { useState, useEffect } from 'react'
import { Document } from '@/types/document'
import { useDocument } from '@/contexts/document/DocumentContext'
import { useNotification } from '@/hooks/useNotification'
import {
  Button,
  Card,
  Modal,
  ModalHeader,
  ModalTitle,
  ModalContent,
  Select,
  ModalFooter,
} from '@/components/shared'
import { DocumentForm, DocumentFormValues } from '@/components/shared/DocumentForm'
import { PassportViewerModal } from '@/components/shared/PassportViewerModal'
import { DocumentCard } from '@/components/shared/DocumentCard'
import { DocumentPreviewModal } from '@/components/shared/DocumentPreviewModal'
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { documentService } from '@/services/documentService'

export function AdminDocuments() {
  const { documents: contextDocuments, addDocument, deleteDocument } = useDocument()
  const { showNotification } = useNotification()
  
  // Local documents state to ensure immediate updates
  const [localDocuments, setLocalDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set())
  const [isBulkActionOpen, setIsBulkActionOpen] = useState<boolean>(false)
  const [showAddModal, setShowAddModal] = useState<boolean>(false)
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null)
  const [showPassportModal, setShowPassportModal] = useState<boolean>(false)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState<boolean>(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false)
  // State for delete confirmation modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false)
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null)

  // Sync with context documents when they change
  useEffect(() => {
    setLocalDocuments(contextDocuments)
  }, [contextDocuments])

  // Filter documents based on selected category and search query
  useEffect(() => {
    let filtered = [...localDocuments]

    // Apply category filter if not 'all'
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((doc) => doc.category === selectedCategory)
    }

    // Apply search filter if text is entered
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(query) ||
          doc.description?.toLowerCase()?.includes(query) ||
          doc.category.toLowerCase().includes(query)
      )
    }

    setFilteredDocuments(filtered)
  }, [localDocuments, selectedCategory, searchQuery])

  // Get unique tags from all documents for filter options
  const handleAddDocument = async (values: DocumentFormValues) => {
    try {
      if (!values.file) {
        throw new Error('File is required')
      }

      const docData: Document = {
        id: '',
        title: values.title || values.file.name,
        category: values.category,
        description: values.description || '',
        type: 'file',
        uploadedAt: new Date().toISOString(),
        url: '',
        metadata: {
          tags: [values.category],
          ...(values.metadata || {}), // Include all existing metadata
        },
      }

      // Capture the returned document to ensure it has the latest data from the server
      const uploadedDocument = await addDocument(docData, values.file)
      
      // Immediately update local state with the uploaded document
      setLocalDocuments(prevDocs => [uploadedDocument, ...prevDocs])
      
      setShowAddModal(false)
    } catch (error) {
      console.error('Error adding document:', error)
      showNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to add document',
      })
    }
  }

  const handleDocumentClick = (document: Document) => {
    if (document.category === 'passport_details') {
      setPreviewDocument(document)
      setShowPassportModal(true)
    } else {
      setPreviewDocument(document)
      setShowPassportModal(false)
    }
  }

  const handleClosePassportModal = () => {
    setShowPassportModal(false)
    setPreviewDocument(null)
  }

  const handleClosePreviewModal = () => {
    setPreviewDocument(null)
  }

  // Show delete confirmation modal
  const confirmDelete = (id: string) => {
    setDocumentToDelete(id)
    setShowDeleteConfirm(true)
  }

  const handleDelete = async () => {
    if (!documentToDelete) return
    
    try {
      setIsDeleting(documentToDelete)
      await deleteDocument(documentToDelete)
      
      // Update local state immediately
      setLocalDocuments(prevDocs => prevDocs.filter(doc => doc.id !== documentToDelete))
      
      showNotification({
        type: 'success',
        message: 'Document deleted successfully',
      })
    } catch (error) {
      console.error('Error deleting document:', error)
      showNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete document',
      })
    } finally {
      setIsDeleting(null)
      setDocumentToDelete(null)
      setShowDeleteConfirm(false)
    }
  }

  // Toggle selection of a document for bulk actions
  const toggleDocumentSelection = (e: React.MouseEvent, documentId: string) => {
    e.stopPropagation()
    const newSelected = new Set(selectedDocuments)

    if (newSelected.has(documentId)) {
      newSelected.delete(documentId)
    } else {
      newSelected.add(documentId)
    }

    setSelectedDocuments(newSelected)
  }

  // Toggle selection of all documents
  const toggleSelectAll = () => {
    if (selectedDocuments.size === filteredDocuments.length) {
      setSelectedDocuments(new Set())
    } else {
      setSelectedDocuments(new Set(filteredDocuments.map((d) => d.id)))
    }
  }

  // Handle bulk actions
  const handleBulkAction = (action: string) => {
    setIsBulkActionOpen(false)

    if (action === 'delete') {
      setShowBulkDeleteConfirm(true)
    } else if (action === 'export') {
      // Create CSV data
      const selectedDocumentData = filteredDocuments.filter((d) => selectedDocuments.has(d.id))

      let csvContent = 'data:text/csv;charset=utf-8,'
      csvContent += 'Title,Category,Type,Size,Uploaded Date\n'

      selectedDocumentData.forEach((doc) => {
        const fileSize = doc.metadata?.fileSize
          ? doc.metadata.fileSize < 1024 * 1024
            ? `${Math.round(doc.metadata.fileSize / 1024)} KB`
            : `${(doc.metadata.fileSize / (1024 * 1024)).toFixed(1)} MB`
          : ''
        const fileType = doc.metadata?.fileType?.split('/')[1]?.toUpperCase() || ''

        csvContent += `"${doc.title}","${doc.category.replace(/_/g, ' ')}","${fileType}","${fileSize}","${new Date(doc.uploadedAt).toLocaleDateString()}"\n`
      })

      // Create download link
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', 'documents_export.csv')
      document.body.appendChild(link)

      // Trigger download
      link.click()
      document.body.removeChild(link)
    }
  }

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedDocuments.size === 0) return

    setIsBulkDeleting(true)

    try {
      // Delete each selected document
      const documentIds = Array.from(selectedDocuments)

      for (const id of documentIds) {
        await deleteDocument(id)
      }

      // Update local state immediately
      setLocalDocuments(prevDocs => 
        prevDocs.filter(doc => !selectedDocuments.has(doc.id))
      )

      // Clear selected documents
      setSelectedDocuments(new Set())
      setShowBulkDeleteConfirm(false)

      console.log(`Successfully deleted ${documentIds.length} documents`)
    } catch (err) {
      console.error('Error in bulk delete:', err)
      showNotification({
        type: 'error',
        message: 'Failed to delete some documents. Please try again.',
      })
    } finally {
      setIsBulkDeleting(false)
    }
  }

  // Clear all filters and selections
  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    setSelectedDocuments(new Set())
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Documents</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage documents and files across the platform
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Document
        </Button>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search input */}
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <Select
            className="w-48"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="passport_details">Passports</option>
            <option value="contract">Contracts</option>
            <option value="proposal">Proposals</option>
            <option value="brochure">Brochures</option>
            <option value="payment_overview">Payment Overview</option>
            <option value="preference_sheet">Preference Sheet</option>
            <option value="sample_menu">Sample Menu</option>
            <option value="crew_profiles">Crew Profiles</option>
            <option value="itinerary">Itinerary</option>
            <option value="captains_details">Captain's Details</option>
            <option value="invoice">Invoice</option>
            <option value="receipt">Receipt</option>
            <option value="other">Other</option>
          </Select>
        </div>

        {/* Clear filters button */}
        {(searchQuery || selectedCategory !== 'all' || selectedDocuments.size > 0) && (
          <button
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            onClick={clearFilters}
          >
            Clear
          </button>
        )}
      </div>

      {/* Bulk Actions Bar - Only show when documents are selected */}
      {selectedDocuments.size > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3 flex justify-between items-center">
          <div className="flex items-center">
            <input
              type="checkbox"
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              checked={
                selectedDocuments.size === filteredDocuments.length && filteredDocuments.length > 0
              }
              onChange={toggleSelectAll}
            />
            <span className="ml-2 text-sm text-gray-700">
              {selectedDocuments.size} {selectedDocuments.size === 1 ? 'document' : 'documents'}{' '}
              selected
            </span>
          </div>

          <div className="relative">
            <button
              className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              onClick={() => setIsBulkActionOpen(!isBulkActionOpen)}
            >
              Bulk Actions
              <ChevronDownIcon className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />
            </button>

            {isBulkActionOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <button
                    onClick={() => handleBulkAction('export')}
                    className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    role="menuitem"
                  >
                    Delete Selected
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filteredDocuments.map((document) => (
          <div key={document.id} className="relative">
            {/* Checkbox for bulk selection */}
            <div
              className="absolute top-2 left-2 z-10 h-5 w-5 cursor-pointer"
              onClick={(e) => toggleDocumentSelection(e, document.id)}
            >
              <input
                type="checkbox"
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                checked={selectedDocuments.has(document.id)}
                onChange={() => {}} // Handled by onClick on parent div
              />
            </div>
            <DocumentCard
              document={document}
              onClick={handleDocumentClick}
              onDelete={() => confirmDelete(document.id)}
              compact={true}
            />
          </div>
        ))}
      </div>

      {/* Add Document Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
        <ModalHeader>
          <ModalTitle>Add Document</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <DocumentForm
            onSubmit={handleAddDocument}
            onCancel={() => setShowAddModal(false)}
          />
        </ModalContent>
      </Modal>

      {/* Passport Viewer Modal */}
      {showPassportModal && previewDocument && (
        <PassportViewerModal
          isOpen={showPassportModal}
          document={previewDocument}
          onClose={handleClosePassportModal}
        />
      )}

      {/* Document Preview Modal */}
      {previewDocument && !showPassportModal && (
        <DocumentPreviewModal
          document={previewDocument}
          onClose={handleClosePreviewModal}
          onDelete={() => confirmDelete(previewDocument.id)}
        />
      )}

      {/* Bulk Delete Confirmation Modal */}
      <Modal isOpen={showBulkDeleteConfirm} onClose={() => setShowBulkDeleteConfirm(false)}>
        <ModalHeader>
          <ModalTitle>Delete Multiple Documents</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <ExclamationTriangleIcon className="h-8 w-8" />
              <div>
                <h3 className="font-medium">
                  Are you sure you want to delete {selectedDocuments.size} documents?
                </h3>
                <p className="text-gray-500 text-sm">
                  This action cannot be undone and will permanently delete the selected documents.
                </p>
              </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-md max-h-40 overflow-y-auto">
              {filteredDocuments
                .filter((d) => selectedDocuments.has(d.id))
                .map((document) => (
                  <div key={document.id} className="py-1">
                    <p className="font-medium">{document.title}</p>
                    <p className="text-xs text-gray-500">{document.category.replace(/_/g, ' ')}</p>
                  </div>
                ))}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowBulkDeleteConfirm(false)}
                disabled={isBulkDeleting}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleBulkDelete} disabled={isBulkDeleting}>
                {isBulkDeleting ? 'Deleting...' : 'Delete Selected Documents'}
              </Button>
            </div>
          </div>
        </ModalContent>
      </Modal>

      {/* Document Delete Confirmation Modal */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
        <ModalHeader>
          <ModalTitle>Delete Document</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <ExclamationTriangleIcon className="h-8 w-8" />
              <div>
                <h3 className="font-medium">
                  Are you sure you want to delete this document?
                </h3>
                <p className="text-gray-500 text-sm">
                  This action cannot be undone and will permanently delete the document.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting !== null}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isDeleting !== null}
              >
                {isDeleting === documentToDelete ? 'Deleting...' : 'Delete Document'}
              </Button>
            </div>
          </div>
        </ModalContent>
      </Modal>
    </div>
  )
}
