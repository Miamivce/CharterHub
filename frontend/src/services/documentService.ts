import { Document } from '@/types/document'
import axios from 'axios'
import { getAuthToken } from '../utils/auth'
import { TOKEN_KEY } from '@/services/jwtApi'
import { configureAxiosInstance } from '@/utils/axios-config'
import { createCorsXHR, downloadBlobAsFile, downloadDocumentViaForm } from '@/utils/cors-helper'

// Extend DocumentMetadata to include user and booking IDs
interface ExtendedMetadata {
  fileSize?: number
  fileType?: string
  tags?: string[]
  uploadedBy?: {
    name: string
    date: string
    id?: number | string
  }
  captainDetails?: {
    name: string
    phone: string
    email: string
    experience: string
    certifications: string[]
    notes?: string
  }
  user_id?: number
  booking_id?: number
  isExistingDocument?: boolean
  originalDocumentId?: string
  linked_from?: string
}

// Extend the Document interface to include our extended metadata
interface ExtendedDocument extends Omit<Document, 'metadata'> {
  metadata?: ExtendedMetadata
}

// Use the API base URL from configuration
const API_BASE_URL = import.meta.env.VITE_PHP_API_URL || 'http://localhost:8000'

// Mock data store - no sample documents
let mockDocuments: Document[] = []

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Create a dedicated axios instance for document operations
const documentAxios = configureAxiosInstance(
  axios.create({
    timeout: 300000, // 5 minutes timeout for large documents
    withCredentials: true,
    responseType: 'blob', // Default to blob for document downloads
  })
)

// Helper to get auth headers
const getAuthHeaders = () => {
  // Try to get the token from our auth utility first
  let token = getAuthToken()

  // If that fails, try to get it directly from storage
  if (!token) {
    // Check both localStorage and sessionStorage with the correct key
    token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
  }

  if (!token) {
    console.error('Authentication token not found. Please check if you are logged in.')
    console.log('Using token key:', TOKEN_KEY)
    console.log('localStorage has token:', !!localStorage.getItem(TOKEN_KEY))
    console.log('sessionStorage has token:', !!sessionStorage.getItem(TOKEN_KEY))
    throw new Error('Authentication token not found')
  }

  return {
    Authorization: `Bearer ${token}`,
  }
}

// Map frontend document categories to backend document types
const mapCategoryToDocumentType = (category: string): string => {
  const mappings: Record<string, string> = {
    passport_details: 'passport',
    captains_details: 'captain_details',
    crew_profiles: 'crew_profile',
    payment_overview: 'payment_overview',
    preference_sheet: 'preference_sheet',
    sample_menu: 'sample_menu',
    contract: 'contract',
    brochure: 'brochure',
    proposal: 'proposal',
    itinerary: 'itinerary',
    invoice: 'invoice',
    receipt: 'receipt',
    other: 'other',
  }

  return mappings[category] || 'other'
}

// Helper to format file size
const formatFileSize = (sizeInBytes: number): string => {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`
  } else if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`
  } else {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`
  }
}

// Convert backend document data to frontend document format
const convertToFrontendDocument = (backendDoc: any): Document => {
  // Log the incoming backend document for debugging purposes
  if (isDevelopment) {
    console.log('Converting backend document to frontend format:', backendDoc)
  }

  // Process the download URL - if it's a relative path, ensure it uses the correct API path
  let downloadUrl = backendDoc.download_url

  // If the URL is relative (doesn't start with http/https), add the path prefix
  if (downloadUrl && !downloadUrl.startsWith('http')) {
    // Make sure to use the full API base URL for download links
    downloadUrl = `${API_BASE_URL}${downloadUrl}`
    if (isDevelopment) {
      console.log(`Converted relative URL to absolute: ${downloadUrl}`)
    }
  }

  // If download_url is missing, construct it from id
  if (!downloadUrl && backendDoc.id) {
    downloadUrl = `${API_BASE_URL}/api/admin/documents/download.php?id=${backendDoc.id}`
    if (isDevelopment) {
      console.log(`Created download URL from ID: ${downloadUrl}`)
    }
  } else if (!downloadUrl) {
    // Fallback if both download_url and id are missing
    downloadUrl = '#'
    console.warn('Document has no download URL or ID, using fallback placeholder')
  }

  // Create a separate download URL property that's guaranteed to be consistent
  const documentDownloadUrl = downloadUrl

  if (isDevelopment) {
    console.log(`Final document URL: ${documentDownloadUrl}`)
  }

  // Process tags from backend document
  let tags: string[] = []

  // Add document_type as a tag if available
  if (backendDoc.document_type) {
    tags.push(backendDoc.document_type)
  }

  // Include existing tags if they exist
  if (backendDoc.tags) {
    if (Array.isArray(backendDoc.tags)) {
      tags = [...tags, ...backendDoc.tags]
    } else if (typeof backendDoc.tags === 'string') {
      // Handle comma-separated tags
      tags = [...tags, ...backendDoc.tags.split(',').map((tag: string) => tag.trim())]
    }
  }

  // Add booking tag if document is associated with a booking
  if (backendDoc.booking_id) {
    tags.push('booking')
    tags.push(backendDoc.booking_id.toString())
  }

  // Remove duplicate tags
  tags = [...new Set(tags)]

  return {
    id: backendDoc.id?.toString() || '',
    type: 'file', // Assuming all backend documents are files
    category: (backendDoc.document_type as any) || 'other', // Using the document_type as category
    title: backendDoc.title || backendDoc.filename || 'Untitled Document',
    description: backendDoc.notes || '',
    url: documentDownloadUrl,
    metadata: {
      fileSize: backendDoc.file_size || backendDoc.size || 0,
      fileType: backendDoc.file_type || backendDoc.mime_type || 'application/octet-stream',
      tags: tags,
      user_id: backendDoc.user_id ? Number(backendDoc.user_id) : undefined,
      booking_id: backendDoc.booking_id ? Number(backendDoc.booking_id) : undefined,
      uploadedBy: {
        name: backendDoc.uploader_name || 'Unknown User',
        date: backendDoc.created_at || backendDoc.uploaded_at || new Date().toISOString(),
        id: backendDoc.uploaded_by || backendDoc.uploaded_by_user_id || undefined
      },
    },
    uploadedAt: backendDoc.created_at || backendDoc.uploaded_at || new Date().toISOString(),
    updatedAt:
      backendDoc.updated_at ||
      backendDoc.created_at ||
      backendDoc.uploaded_at ||
      new Date().toISOString(),
  }
}

// Log complete request info for debugging in development mode only
// This is much safer for production
const isDevelopment = import.meta.env.MODE === 'development'

export const documentService = {
  async getDocuments(options?: {
    category?: string
    tags?: string[]
    searchTerm?: string
    userId?: number
    bookingId?: number
  }): Promise<Document[]> {
    try {
      // Check if user is authenticated before making request
      const token = getAuthToken()
      if (!token) {
        if (isDevelopment) {
          console.warn('Cannot fetch documents: User not authenticated')
        }
        return []
      }

      // Build query parameters
      const params = new URLSearchParams()

      if (options?.category) {
        params.append('document_type', mapCategoryToDocumentType(options.category))
      }

      if (options?.userId) {
        params.append('user_id', options.userId.toString())
      }

      if (options?.bookingId) {
        params.append('booking_id', options.bookingId.toString())
      }

      // Make API request using the dedicated documentAxios instance
      const response = await documentAxios.get(
        `${API_BASE_URL}/api/admin/documents/list.php?${params.toString()}`,
        {
          headers: getAuthHeaders(),
          // Override responseType for this request - we want JSON here, not blob
          responseType: 'json',
        }
      )

      if (response.data.success) {
        // Convert backend documents to frontend format
        const frontendDocs = response.data.documents.map(convertToFrontendDocument)

        // Apply additional filtering on client side if needed
        let filteredDocs = [...frontendDocs]

        // Filter by tags if specified
        if (options?.tags && options.tags.length > 0) {
          filteredDocs = filteredDocs.filter((doc) => {
            const docTags = doc.metadata?.tags || []
            return options.tags!.some((tag) => docTags.includes(tag))
          })
        }

        // Search by term if specified
        if (options?.searchTerm) {
          const term = options.searchTerm.toLowerCase()
          filteredDocs = filteredDocs.filter(
            (doc) =>
              doc.title.toLowerCase().includes(term) ||
              doc.description?.toLowerCase().includes(term)
          )
        }

        return filteredDocs
      } else {
        console.error('Error fetching documents:', response.data.message)
        return []
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
      return []
    }
  },

  async addDocument(document: ExtendedDocument, file?: File): Promise<Document> {
    if (!file) {
      throw new Error('File is required')
    }

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('document_type', mapCategoryToDocumentType(document.category))

      // Add title if available
      if (document.title) {
        formData.append('title', document.title)
        
        if (isDevelopment) {
          console.log(`Document title: ${document.title}`)
        }
      }

      // Add notes if available
      if (document.description) {
        formData.append('notes', document.description)
      }

      // Add user_id if available in metadata
      if (document.metadata?.user_id) {
        // Add both user_id and explicit uploaded_by_user_id
        formData.append('user_id', document.metadata.user_id.toString())
        // Explicitly set who uploaded this document - critical for client uploads
        formData.append('uploaded_by_user_id', document.metadata.user_id.toString())
        
        if (isDevelopment) {
          console.log(`Document will be attributed to user ID: ${document.metadata.user_id}`)
        }
      } else if (isDevelopment) {
        console.warn('No user_id provided in document metadata. This is required by the backend.')
      }

      // Add uploader name metadata if available
      if (document.metadata?.uploadedBy?.name) {
        formData.append('uploader_name', document.metadata.uploadedBy.name)
        
        if (isDevelopment) {
          console.log(`Document uploader name: ${document.metadata.uploadedBy.name}`)
        }
      }

      // Add booking_id if available in metadata - ensures the document is properly linked to booking
      if (document.metadata?.booking_id) {
        formData.append('booking_id', document.metadata.booking_id.toString())

        // Ensure we log that this is a booking document for debugging purposes
        if (isDevelopment) {
          console.log(`Adding document for booking ID: ${document.metadata.booking_id}`)
        }
      }

      // Ensure client documents are tagged as passports
      const documentTags = document.metadata?.tags || []
      
      // Check if this is a client upload (has 'client' tag)
      if (documentTags.includes('client') && !documentTags.includes('passport')) {
        // Add 'passport' tag for client documents if it doesn't exist already
        documentTags.push('passport')
      }
      
      // Add any tags as comma-separated string
      if (documentTags.length > 0) {
        formData.append('tags', documentTags.join(','))
      }

      if (isDevelopment) {
        console.log('Document upload request:', {
          endpoint: `${API_BASE_URL}/api/admin/documents/upload.php`,
          document_type: mapCategoryToDocumentType(document.category),
          size: file ? formatFileSize(file.size) : 'No file',
          booking_id: document.metadata?.booking_id || 'none',
          has_tags: documentTags.length > 0 ? 'yes' : 'no',
          tags: documentTags.join(','),
        })
      }

      const response = await documentAxios.post(
        `${API_BASE_URL}/api/admin/documents/upload.php`,
        formData,
        {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'multipart/form-data',
          },
          // Increase timeout for large files
          timeout: 300000, // 5 minutes
          // Set responseType to json for this request
          responseType: 'json',
          // Add upload progress tracking
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total!)
            console.log(`Upload progress: ${percentCompleted}%`)
          },
        }
      )

      console.log('Document upload raw response:', response)

      if (response.data.success) {
        const backendDoc = response.data.document || {}
        console.log('Document upload success response:', response.data)

        // Ensure backendDoc has essential properties
        if (!backendDoc.id) {
          console.warn('Document ID missing in backend response')
          backendDoc.id = Date.now().toString() // Generate temporary ID if missing
        }

        // Set values from the original document if missing in response
        if (!backendDoc.title && !backendDoc.filename) {
          backendDoc.title = document.title || file.name
        }

        if (!backendDoc.file_type && !backendDoc.mime_type) {
          backendDoc.file_type = file.type
        }

        if (!backendDoc.file_size && !backendDoc.size) {
          backendDoc.file_size = file.size
        }

        if (!backendDoc.document_type) {
          backendDoc.document_type = mapCategoryToDocumentType(document.category)
        }

        // Preserve client attribution even if backend doesn't return it
        if (document.metadata?.user_id && !backendDoc.uploaded_by) {
          backendDoc.uploaded_by = document.metadata.user_id
        }
        
        // Preserve the uploader name if not returned by backend
        if (document.metadata?.uploadedBy?.name && !backendDoc.uploader_name) {
          backendDoc.uploader_name = document.metadata.uploadedBy.name
        }

        // Preserve booking ID in response if it was in the original document
        if (document.metadata?.booking_id && !backendDoc.booking_id) {
          backendDoc.booking_id = document.metadata.booking_id
        }

        // Preserve tags in response if they were in the original document
        if (document.metadata?.tags && !backendDoc.tags) {
          backendDoc.tags = document.metadata.tags
        }

        // Return response in frontend document format
        return convertToFrontendDocument(backendDoc)
      } else {
        const errorMsg = response.data.message || 'Failed to upload document'
        console.error('API returned success: false with message:', errorMsg)
        throw new Error(errorMsg)
      }
    } catch (error) {
      console.error('Error uploading document:', error)

      // Enhanced error logging for debugging
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            baseURL: error.config?.baseURL,
            headers: error.config?.headers,
          },
        })

        // Special handling for common upload issues
        if (error.response?.status === 401) {
          throw new Error('Authentication error: Please make sure you are logged in')
        } else if (error.response?.status === 403) {
          throw new Error('Authorization error: You do not have permission to upload documents')
        } else if (error.response?.status === 413) {
          throw new Error('File too large: The server rejected the upload due to file size')
        } else if (error.response?.status === 500) {
          const errorMsg = error.response.data?.message || 'Internal server error'
          console.error('Server error details:', error.response.data)
          throw new Error(`Server error: ${errorMsg}`)
        }
      }

      throw error instanceof Error ? error : new Error('Unknown error during document upload')
    }
  },

  async uploadFile(file: File): Promise<string> {
    await delay(1000) // Simulate file upload
    // In a real implementation, this would handle the actual file upload
    console.log('File uploaded:', file.name)
    // Return a mock URL that would normally come from the server
    return `https://mockcdn.example.com/files/${encodeURIComponent(file.name)}`
  },

  async deleteDocument(id: string): Promise<void> {
    try {
      // Log the document ID being deleted for debugging
      console.log('Attempting to delete document with ID:', id)

      // Use FormData instead of JSON for better compatibility with PHP backend
      const formData = new FormData()
      formData.append('document_id', id)
      console.log('Delete request payload using FormData with document_id:', id)

      const response = await documentAxios.post(
        `${API_BASE_URL}/api/admin/documents/delete.php`,
        formData,
        {
          headers: {
            ...getAuthHeaders(),
            // Don't set Content-Type here - axios will set the correct multipart/form-data with boundary
          },
          // Set responseType to json for this request
          responseType: 'json',
        }
      )

      console.log('Delete response:', response.data)

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete document')
      }
    } catch (error) {
      console.error('Error deleting document:', error)

      // Enhanced error reporting
      if (axios.isAxiosError(error)) {
        console.error('Delete error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        })

        if (error.response?.status === 400) {
          throw new Error(`Bad request: ${error.response.data?.message || 'Invalid document ID'}`)
        }
      }

      throw error
    }
  },

  async getDocumentsByTag(tag: string): Promise<Document[]> {
    // This is handled client-side by filtering the results from getDocuments
    const allDocs = await this.getDocuments()
    return allDocs.filter((doc) => doc.metadata?.tags?.includes(tag))
  },

  async getDocumentBlob(documentId: string): Promise<Blob> {
    // This implementation is intentionally left as a placeholder
    // since we're switching to direct URL approach instead of blob fetching
    throw new Error('Direct blob fetching is not supported due to CORS limitations')
  },

  // Helper method to download a document directly
  async downloadDocument(documentId: string, filename?: string): Promise<void> {
    try {
      console.log(`Starting download process for document ${documentId}`)

      // Get auth token
      const token = getAuthToken()
      if (!token) {
        throw new Error('Authentication token not found')
      }

      // Create a direct URL with auth token and download flag
      const downloadUrl = `${API_BASE_URL}/api/admin/documents/download.php?id=${documentId}&auth_token=${encodeURIComponent(token)}&download=1`

      // Create a temporary anchor element to trigger the download
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename || `document-${documentId}.pdf`
      link.target = '_self' // Use _self to avoid opening a new tab
      link.style.display = 'none'

      // Add to document, click, and remove
      document.body.appendChild(link)
      link.click()

      // Remove after a short delay to allow download to start
      setTimeout(() => {
        document.body.removeChild(link)
      }, 100)

      console.log(`Download initiated for document ${documentId}`)
    } catch (error) {
      console.error(`Failed to download document ${documentId}:`, error)
      throw new Error('Failed to download document. Please try again later.')
    }
  },

  // Get a direct URL to a document (for use in iframes, etc.)
  getDocumentDirectUrl(documentId: string): string {
    // Get auth token
    const token = getAuthToken()
    if (!token) {
      console.error('Authentication token not found')
      return ''
    }

    // Return direct URL with auth token
    return `${API_BASE_URL}/api/admin/documents/download.php?id=${documentId}&auth_token=${encodeURIComponent(token)}`
  },

  /**
   * Links an existing document to a booking without requiring a file upload
   * This is called when a user selects an existing document from search
   */
  async linkExistingDocument(
    documentId: string,
    bookingId: string,
    visibility: 'all' | 'main_charterer' = 'main_charterer'
  ): Promise<Document> {
    try {
      // In development/demo mode, just simulate the API call
      if (isDevelopment) {
        console.log(`Linking document ${documentId} to booking ${bookingId} with visibility ${visibility}`);
        
        // Get existing documents and find the one we want to link
        const allDocuments = await this.getDocuments();
        const existingDoc = allDocuments.find((doc: Document) => doc.id === documentId);
        
        if (!existingDoc) {
          throw new Error(`Document with ID ${documentId} not found`);
        }
        
        // Create a new document with the same content but add booking_id to metadata
        const linkedDoc: Document = {
          ...existingDoc,
          id: `linked-${Date.now()}-${documentId}`, // Create a new ID for the linked version
          metadata: {
            ...existingDoc.metadata,
            booking_id: parseInt(bookingId),
            tags: [...(existingDoc.metadata?.tags || []), 'booking', bookingId],
            linked_from: documentId, // Track where this document was linked from
          },
          uploadedAt: new Date().toISOString(),
        };
        
        // In demo mode, we need to manually add to our documents list
        // In real implementation this would be saved to the database
        if (isDevelopment) {
          // Use a mock approach to simulate document addition
          // This is just for development; in production this would be handled by the API
          const result = await this.addDocument(linkedDoc);
          return result;
        }
        
        return linkedDoc;
      }
      
      // In production, call the API
      const requestData = {
        document_id: documentId,
        booking_id: bookingId,
        visibility
      };
      
      const response = await documentAxios.post(
        `${API_BASE_URL}/api/admin/documents/link.php`,
        requestData,
        {
          headers: getAuthHeaders(),
        }
      );
      
      if (response.data.success) {
        console.log('Document linked successfully:', response.data);
        return convertToFrontendDocument(response.data.document || {});
      } else {
        const errorMsg = response.data.message || 'Failed to link document';
        console.error('API returned success: false with message:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Error linking document:', error);
      throw error instanceof Error ? error : new Error('Unknown error during document linking');
    }
  },

  // Also add a method to retrieve all documents for a booking
  async getBookingDocuments(bookingId: string): Promise<Document[]> {
    try {
      // In development/demo mode, filter from local documents
      if (isDevelopment) {
        // Get all documents first
        const allDocuments = await this.getDocuments();
        
        // Find documents with this booking ID in metadata
        return allDocuments.filter((doc: Document) => 
          doc.metadata?.booking_id === parseInt(bookingId) ||
          doc.metadata?.tags?.includes(bookingId)
        );
      }
      
      // In production, call the API
      const response = await documentAxios.get(
        `${API_BASE_URL}/api/admin/documents/list.php?booking_id=${bookingId}`,
        {
          headers: getAuthHeaders(),
        }
      );
      
      if (response.data.success) {
        return (response.data.documents || []).map(convertToFrontendDocument);
      } else {
        const errorMsg = response.data.message || 'Failed to get booking documents';
        console.error('API returned success: false with message:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Error getting booking documents:', error);
      throw error instanceof Error ? error : new Error('Unknown error fetching booking documents');
    }
  },
}
