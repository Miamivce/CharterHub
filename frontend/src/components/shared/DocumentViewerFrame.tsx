import React, { useState, useEffect } from 'react'
import { Document as DocumentType } from '@/types/document'
import { documentService } from '@/services/documentService'

interface DocumentViewerFrameProps {
  document: DocumentType
  className?: string
}

/**
 * Component to display documents with CORS handling
 * For PDFs, it fetches the file as a blob and creates a safe local URL
 */
export default function DocumentViewerFrame({
  document,
  className = '',
}: DocumentViewerFrameProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isPdf =
    document.url?.toLowerCase().endsWith('.pdf') ||
    (document.metadata?.fileType && document.metadata.fileType.includes('pdf'))

  useEffect(() => {
    // Clean up previous object URL if any
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [objectUrl])

  useEffect(() => {
    if (!document.id) {
      setError('Invalid document ID')
      setLoading(false)
      return
    }

    if (!document.url) {
      setError('Document URL is missing')
      setLoading(false)
      return
    }

    // For PDFs, fetch the document as blob and create a local URL to avoid CORS issues
    if (isPdf) {
      setLoading(true)
      setError(null)

      const fetchDocumentBlob = async () => {
        try {
          console.log('Fetching document blob for:', document.id)

          // Get document as blob
          const blob = await documentService.getDocumentBlob(document.id)

          // Create a local URL for the blob
          const url = URL.createObjectURL(blob)
          setObjectUrl(url)
          setLoading(false)
          console.log('Created object URL:', url)
        } catch (err) {
          console.error('Error fetching document blob:', err)
          setError('Failed to load document. Please try again.')
          setLoading(false)
        }
      }

      fetchDocumentBlob()
    } else {
      // For non-PDFs, just use the URL directly
      setLoading(false)
    }
  }, [document.id, document.url, isPdf])

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        Loading document...
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full text-red-500 ${className}`}>
        {error}
      </div>
    )
  }

  if (isPdf) {
    // For PDFs, use the local blob URL to avoid CORS issues
    return (
      <div className={`w-full h-full ${className}`}>
        <object data={objectUrl || undefined} type="application/pdf" className="w-full h-full">
          <p>
            Your browser does not support PDF viewing.{' '}
            <a href={objectUrl || '#'} target="_blank" rel="noopener noreferrer">
              Click here to download
            </a>
            .
          </p>
        </object>
      </div>
    )
  }

  // For other document types, use an iframe with the direct URL
  return (
    <div className={`w-full h-full ${className}`}>
      <iframe
        src={document.url}
        className="w-full h-full border-0"
        title={document.title || 'Document'}
        sandbox="allow-same-origin"
      />
    </div>
  )
}
