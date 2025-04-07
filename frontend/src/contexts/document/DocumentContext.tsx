import { createContext, useContext, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ContextProviderProps } from '../types'
import { Document, BookingDocument } from '@/types/document'
import { useNotification } from '../notification/NotificationContext'
import { documentService } from '@/services/documentService'
import { useJWTAuth } from '../auth/JWTAuthContext'

interface DocumentContextType {
  documents: Document[]
  bookingDocuments: Record<string, BookingDocument[]>
  isLoading: boolean
  error: string | null
  addDocument: (document: Document, file?: File) => Promise<Document>
  addBookingDocument: (
    bookingId: string,
    document: Omit<BookingDocument, 'id' | 'uploadedAt'>,
    file?: File
  ) => Promise<BookingDocument>
  updateDocument: (id: string, updates: Partial<Document>) => Promise<Document>
  updateBookingDocument: (
    bookingId: string,
    documentId: string,
    updates: Partial<BookingDocument>
  ) => Promise<BookingDocument>
  deleteDocument: (id: string) => Promise<void>
  deleteBookingDocument: (bookingId: string, documentId: string) => Promise<void>
  getDocumentsByType: (type: Document['type']) => Document[]
  getDocumentsByCategory: (category: Document['category']) => Document[]
  getDocumentsByTag: (tag: string) => Promise<Document[]>
  getBookingDocuments: (bookingId: string) => BookingDocument[]
  removeDocument: (id: string) => Promise<void>
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined)

// Mock data store for booking documents (until fully implemented with React Query)
let mockBookingDocuments: Record<string, BookingDocument[]> = {}

export function DocumentProvider({ children }: ContextProviderProps) {
  const queryClient = useQueryClient()
  const { showNotification } = useNotification()
  const { isAuthenticated, user } = useJWTAuth()

  // Create the document query key based on user role
  const documentsQueryKey = ['documents', user?.id, user?.role]

  // Use React Query for document fetching and caching
  const {
    data: documents = [],
    isLoading,
    error,
    refetch: refetchDocuments,
  } = useQuery({
    queryKey: documentsQueryKey,
    queryFn: async () => {
      if (!isAuthenticated) return []
      
      // For clients, explicitly request their own documents
      if (user && user.role === 'client') {
        return documentService.getDocuments({ userId: Number(user.id) })
      }
      
      // For admins, fetch all documents
      return documentService.getDocuments()
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  })

  // Booking documents query - we still use state for this until backend is updated
  const { 
    data: bookingDocuments = {}
  } = useQuery({
    queryKey: ['bookingDocuments'],
    queryFn: async () => {
      return mockBookingDocuments
    },
    initialData: {},
  })

  // Add document mutation
  const { mutateAsync: addDocumentMutation } = useMutation({
    mutationFn: async ({ document, file }: { document: Document; file?: File }) => {
      // Upload file if provided
      let fileUrl: string | undefined
      if (file) {
        fileUrl = await documentService.uploadFile(file)
      }

      // Prepare document with file URL
      const documentToAdd = {
        ...document,
        url: fileUrl || document.url,
      }

      // Ensure passport tag for client documents
      if (documentToAdd.metadata?.tags) {
        const tags = documentToAdd.metadata.tags
        if (tags.includes('client') && !tags.includes('passport')) {
          tags.push('passport')
        }
      }

      // Add document via service
      return documentService.addDocument({
        ...documentToAdd,
        id: documentToAdd.id || Date.now().toString(),
        uploadedAt: documentToAdd.uploadedAt || new Date().toISOString(),
      }, file)
    },
    onSuccess: (newDocument) => {
      // Update documents cache
      queryClient.setQueryData(documentsQueryKey, (oldDocs: Document[] = []) => 
        [newDocument, ...oldDocs]
      )

      showNotification({
        type: 'success',
        message: 'Document added successfully',
      })
    },
    onError: (error) => {
      showNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to add document',
      })
    },
  })

  // Delete document mutation
  const { mutateAsync: deleteDocumentMutation } = useMutation({
    mutationFn: (id: string) => documentService.deleteDocument(id),
    onSuccess: (_, id) => {
      // Update documents cache
      queryClient.setQueryData(documentsQueryKey, (oldDocs: Document[] = []) => 
        oldDocs.filter(doc => doc.id !== id)
      )

      // Also remove from booking documents if present
      queryClient.setQueryData<Record<string, BookingDocument[]>>(['bookingDocuments'], (oldData = {}) => {
        const newData = { ...oldData }
        Object.keys(newData).forEach(bookingId => {
          newData[bookingId] = newData[bookingId].filter(doc => doc.id !== id)
        })
        return newData
      })

      showNotification({
        type: 'success',
        message: 'Document deleted successfully',
      })
    },
    onError: (error) => {
      showNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete document',
      })
    },
  })

  // Update document mutation
  const { mutateAsync: updateDocumentMutation } = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Document> }) => {
      // In a real implementation, this would call the API to update the document
      const existingDoc = documents.find(doc => doc.id === id)
      if (!existingDoc) {
        throw new Error('Document not found')
      }
      
      const updatedDoc = {
        ...existingDoc,
        ...updates,
        updatedAt: new Date().toISOString(),
      }
      
      return Promise.resolve(updatedDoc)
    },
    onSuccess: (updatedDoc) => {
      // Update documents cache
      queryClient.setQueryData(documentsQueryKey, (oldDocs: Document[] = []) => 
        oldDocs.map(doc => doc.id === updatedDoc.id ? updatedDoc : doc)
      )

      showNotification({
        type: 'success',
        message: 'Document updated successfully',
      })
    },
    onError: (error) => {
      showNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update document',
      })
    },
  })

  // Link existing document mutation
  const { mutateAsync: linkDocumentMutation } = useMutation({
    mutationFn: async ({ 
      bookingId, 
      document, 
      originalDocumentId 
    }: { 
      bookingId: string; 
      document: Omit<BookingDocument, 'id' | 'uploadedAt'>; 
      originalDocumentId: string 
    }) => {
      const linkedDocument = await documentService.linkExistingDocument(
        originalDocumentId,
        bookingId,
        document.visibleToAllGuests ? 'all' : 'main_charterer'
      )
      
      // Convert to booking document format
      const bookingDoc: BookingDocument = {
        ...linkedDocument,
        visibleToAllGuests: document.visibleToAllGuests || false,
        id: linkedDocument.id,
        uploadedAt: linkedDocument.uploadedAt
      }
      
      return bookingDoc
    },
    onSuccess: (bookingDoc, { bookingId }) => {
      // Update booking documents
      queryClient.setQueryData<Record<string, BookingDocument[]>>(['bookingDocuments'], (oldData = {}) => {
        const newData = { ...oldData }
        newData[bookingId] = [...(newData[bookingId] || []), bookingDoc]
        return newData
      })
      
      // Update documents cache
      queryClient.setQueryData(documentsQueryKey, (oldDocs: Document[] = []) => 
        [bookingDoc, ...oldDocs]
      )
      
      showNotification({
        type: 'success',
        message: 'Document linked successfully',
      })
    },
    onError: (error) => {
      showNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to link document',
      })
    }
  })

  // Add booking document mutation
  const { mutateAsync: addBookingDocumentMutation } = useMutation({
    mutationFn: async ({ 
      bookingId, 
      document, 
      file 
    }: { 
      bookingId: string; 
      document: Omit<BookingDocument, 'id' | 'uploadedAt'>; 
      file?: File 
    }) => {
      // Handle existing document linking
      if (document.metadata?.isExistingDocument && document.metadata?.originalDocumentId) {
        return linkDocumentMutation({ 
          bookingId, 
          document, 
          originalDocumentId: document.metadata.originalDocumentId 
        })
      }
      
      // Otherwise create new document
        const newDocument: BookingDocument = {
          ...document,
          id: Date.now().toString(),
          uploadedAt: new Date().toISOString(),
        }

      // Ensure document has booking_id in metadata
      const documentWithMetadata: BookingDocument = {
          ...newDocument,
          metadata: {
            ...newDocument.metadata,
          booking_id: Number(bookingId),
            tags: [...(newDocument.metadata?.tags || []), 'booking', bookingId],
          },
        }

      // Add to central document storage
      const centralDocument = await addDocumentMutation({ 
        document: documentWithMetadata as Document, 
        file 
      })
      
      return {
        ...centralDocument,
        visibleToAllGuests: document.visibleToAllGuests || false,
      } as BookingDocument
    },
    onSuccess: (newDocument, { bookingId }) => {
        // Update booking documents
      queryClient.setQueryData<Record<string, BookingDocument[]>>(['bookingDocuments'], (oldData = {}) => {
        const newData = { ...oldData }
        newData[bookingId] = [...(newData[bookingId] || []), newDocument]
        return newData
      })
      
      showNotification({
        type: 'success',
        message: 'Document added to booking',
      })
    },
    onError: (error) => {
      showNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to add booking document',
      })
    }
  })

  // Add document function
  const addDocument = useCallback(
    async (document: Document, file?: File) => {
      try {
        // Use mutation and return the result
        const uploadedDocument = await addDocumentMutation({ document, file })
        return uploadedDocument
      } catch (error) {
        console.error('Error in addDocument:', error)
        throw error
      }
    },
    [addDocumentMutation]
  );

  const deleteDocument = useCallback(
    (id: string) => deleteDocumentMutation(id),
    [deleteDocumentMutation]
  )

  const updateDocument = useCallback(
    (id: string, updates: Partial<Document>) => updateDocumentMutation({ id, updates }),
    [updateDocumentMutation]
  )

  const addBookingDocument = useCallback(
    (bookingId: string, document: Omit<BookingDocument, 'id' | 'uploadedAt'>, file?: File) => 
      addBookingDocumentMutation({ bookingId, document, file }),
    [addBookingDocumentMutation]
  )

  // Original helper functions
  const getDocumentsByType = useCallback(
    (type: Document['type']) => {
      return documents.filter((doc) => doc.type === type)
    },
    [documents]
  )

  const getDocumentsByCategory = useCallback(
    (category: Document['category']) => {
      return documents.filter((doc) => doc.category === category)
    },
    [documents]
  )

  const getDocumentsByTag = useCallback(
    async (tag: string) => {
      return documents.filter((doc) => doc.metadata?.tags?.includes(tag))
    },
    [documents]
  )

  const getBookingDocuments = useCallback(
    (bookingId: string) => {
      return bookingDocuments[bookingId] || []
    },
    [bookingDocuments]
  )

  const updateBookingDocument = useCallback(
    async (bookingId: string, documentId: string, updates: Partial<BookingDocument>) => {
      // Find the document in the booking
      const bookingDocs = bookingDocuments[bookingId] || []
      const docIndex = bookingDocs.findIndex((doc) => doc.id === documentId)
      
      if (docIndex === -1) {
        throw new Error('Document not found in booking')
      }
      
      // Update the document
      const updatedDoc = {
        ...bookingDocs[docIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      }
      
      // Update the booking documents
      const updatedBookingDocs = [...bookingDocs]
      updatedBookingDocs[docIndex] = updatedDoc
      
      // Update booking documents state
      queryClient.setQueryData<Record<string, BookingDocument[]>>(['bookingDocuments'], (oldData = {}) => {
        const newData = { ...oldData }
        newData[bookingId] = updatedBookingDocs
        return newData
      })
      
      // Also update in central documents
      await updateDocument(documentId, updates)
      
      return updatedDoc
    },
    [bookingDocuments, updateDocument, queryClient]
  )

  const deleteBookingDocument = useCallback(
    async (bookingId: string, documentId: string) => {
      // Update booking documents state
      queryClient.setQueryData<Record<string, BookingDocument[]>>(['bookingDocuments'], (oldData = {}) => {
        const newData = { ...oldData }
        if (newData[bookingId]) {
          newData[bookingId] = newData[bookingId].filter((doc) => doc.id !== documentId)
        }
        return newData
      })
      
      // Delete from central documents
      await deleteDocument(documentId)
    },
    [deleteDocument, queryClient]
  )

  const removeDocument = useCallback(
    async (id: string) => {
      await deleteDocument(id)
    },
    [deleteDocument]
  )

  const value = {
    documents,
    bookingDocuments,
    isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    addDocument,
    addBookingDocument,
    updateDocument,
    updateBookingDocument,
    deleteDocument,
    deleteBookingDocument,
    getDocumentsByType,
    getDocumentsByCategory,
    getDocumentsByTag,
    getBookingDocuments,
    removeDocument,
  }

  return <DocumentContext.Provider value={value}>{children}</DocumentContext.Provider>
}

export function useDocument() {
  const context = useContext(DocumentContext)
  if (!context) {
    throw new Error('useDocument must be used within a DocumentProvider')
  }
  return context
}
