import React, { useState, useEffect } from 'react'
import { Document } from '@/types/document'
import { format } from 'date-fns'
import { documentService } from '@/services/documentService'
import { getAuthToken } from '@/utils/auth'

// Define document symbols directly in this file to avoid import issues
const DOCUMENT_SYMBOLS = {
  passport_details: '🪪', // ID/Passport symbol
  contract: '📑', // Contract/legal document
  proposal: '📋', // Clipboard/proposal
  brochure: '📰', // Brochure/publication
  payment_overview: '💰', // Money/payment symbol
  preference_sheet: '📝', // Note/preference
  sample_menu: '🍽️', // Dining/menu symbol
  crew_profiles: '👥', // People/crew symbol
  itinerary: '🗺️', // Map/itinerary symbol
  captains_details: '⚓', // Anchor/captain symbol
  invoice: '📊', // Chart/invoice symbol
  receipt: '🧾', // Receipt symbol
  other: '📄', // Generic document
}

// Use the API base URL from configuration
const API_BASE_URL = import.meta.env.VITE_PHP_API_URL || 'http://localhost:8000'

interface DocumentPreviewModalProps {
  document: Document
  onClose: () => void
  onDelete?: (id: string) => void
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document,
  onClose,
  onDelete,
}) => {
  const { id, title, category, description, metadata, uploadedAt } = document
  const symbol =
    DOCUMENT_SYMBOLS[category as keyof typeof DOCUMENT_SYMBOLS] || DOCUMENT_SYMBOLS.other

  // State for document preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [previewError, setPreviewError] = useState(false)

  // Handle file type display
  const fileType = metadata?.fileType || ''
  const fileExtension = fileType.split('/')[1]?.toUpperCase() || ''
  const fileSize = metadata?.fileSize
    ? metadata.fileSize < 1024 * 1024
      ? `${Math.round(metadata.fileSize / 1024)} KB`
      : `${(metadata.fileSize / (1024 * 1024)).toFixed(1)} MB`
    : ''

  // Format dates
  const formattedUploadDate = uploadedAt ? format(new Date(uploadedAt), 'MMMM d, yyyy') : ''
  const formattedUploadTime = uploadedAt ? format(new Date(uploadedAt), 'h:mm a') : ''

  // Determine if we can preview the document
  const isPreviewable = fileType.startsWith('image/') || fileType === 'application/pdf'

  // Load document content for preview
  useEffect(() => {
    if (!id || !isPreviewable) {
      setIsLoading(false)
      return
    }

    async function loadDocument() {
      setIsLoading(true)
      console.log(`Preparing document ${id} for preview...`)

      try {
        // Create URL for direct API access
        const token = getAuthToken()
        if (!token) {
          throw new Error('Authentication token not found')
        }

        // Create a direct URL for API access
        const directUrl = `${API_BASE_URL}/api/admin/documents/download.php?id=${id}&auth_token=${encodeURIComponent(token)}`
        setPreviewUrl(directUrl)
      } catch (error) {
        console.error('Error preparing preview:', error)
        setPreviewError(true)
      } finally {
        setIsLoading(false)
      }
    }

    loadDocument()
  }, [id, isPreviewable, fileType])

  const handleDownload = async () => {
    try {
      if (!id) {
        console.error('Cannot download: Document ID is missing')
        return
      }

      console.log(`Initiating download for document ${id}`)

      // Open download in new tab
      await documentService.downloadDocument(id, title)

      console.log(`Download initiated for document ${id}`)
    } catch (error) {
      console.error('Error downloading document:', error)
      alert('Failed to download document. Please try again later.')
    }
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(id)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Modal header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-3xl mr-3">{symbol}</span>
            <div>
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="text-gray-500 text-sm mt-1">{category.replace(/_/g, ' ')}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        {/* Document preview area */}
        <div className="flex-1 overflow-auto p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Preview panel */}
            <div className="flex-1 min-h-[300px] overflow-hidden bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
              {isLoading ? (
                <div className="text-center py-10">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                  <p className="text-gray-500">Loading document preview...</p>
                </div>
              ) : previewError ? (
                <div className="text-center py-10">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                    />
                  </svg>
                  <p className="mt-2 text-gray-600">Error loading preview</p>
                  <button
                    onClick={handleDownload}
                    className="mt-3 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Download instead
                  </button>
                </div>
              ) : isPreviewable ? (
                fileType.startsWith('image/') && previewUrl ? (
                  <div className="w-full h-full flex items-center justify-center p-4">
                    <img
                      src={previewUrl}
                      alt={title || 'Document preview'}
                      className="max-w-full max-h-[60vh] object-contain"
                      onError={() => setPreviewError(true)}
                    />
                  </div>
                ) : fileType === 'application/pdf' && previewUrl ? (
                  <div className="text-center py-10">
                    <svg
                      className="mx-auto h-16 w-16 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">PDF Document</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      This PDF cannot be displayed directly due to security restrictions.
                    </p>
                    <div className="mt-6 flex justify-center gap-3">
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Open PDF
                      </a>
                      <button
                        onClick={handleDownload}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                      />
                    </svg>
                    <p className="mt-2 text-gray-600">{fileExtension} document</p>
                    <button
                      onClick={handleDownload}
                      className="mt-3 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Download to view
                    </button>
                  </div>
                )
              ) : (
                <div className="text-center py-10">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                    />
                  </svg>
                  <p className="mt-2 text-gray-600">{fileExtension} document</p>
                  <button
                    onClick={handleDownload}
                    className="mt-3 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Download to view
                  </button>
                </div>
              )}
            </div>

            {/* Document info */}
            <div className="md:w-64 space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Document Information</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500 block">Category</span>
                    <span className="text-gray-900">{category.replace(/_/g, ' ')}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Type</span>
                    <span className="text-gray-900">{fileExtension || 'Unknown'}</span>
                  </div>
                  {fileSize && (
                    <div>
                      <span className="text-gray-500 block">Size</span>
                      <span className="text-gray-900">{fileSize}</span>
                    </div>
                  )}
                  {formattedUploadDate && (
                    <div>
                      <span className="text-gray-500 block">Uploaded on</span>
                      <span className="text-gray-900">{formattedUploadDate}</span>
                    </div>
                  )}
                  {metadata?.uploadedBy?.name && (
                    <div>
                      <span className="text-gray-500 block">Uploaded by</span>
                      <span className="text-gray-900">{metadata.uploadedBy.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {description && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700 text-sm">{description}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal footer */}
        <div className="p-6 border-t flex justify-between items-center">
          <div>
            {onDelete && (
              <button
                onClick={handleDelete}
                className="text-red-600 hover:text-red-800 font-medium text-sm"
              >
                Delete Document
              </button>
            )}
          </div>
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
