import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import axios, { AxiosError } from 'axios';
import { useJWTAuth } from '../../frontend/src/contexts/auth/JWTAuthContext';
import { TOKEN_KEY } from '../../frontend/src/services/jwtApi';
import { isValidDocumentType } from '../constants/DocumentTypes';

export interface Document {
  id: number;
  user_id: number | null;
  booking_id: number | null;
  document_type: string;
  filename: string;
  mime_type: string;
  size: number;
  formatted_size: string;
  uploaded_by: number;
  uploader_name: string;
  uploaded_at: string;
  expires_at: string | null;
  status: string;
  notes: string | null;
  download_url: string;
}

export interface DocumentFilters {
  user_id?: number;
  booking_id?: number;
  document_type?: string;
  page?: number;
  limit?: number;
}

interface DocumentContextProps {
  documents: Document[];
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  fetchDocuments: (filters?: DocumentFilters) => Promise<void>;
  uploadDocument: (file: File, documentData: {
    user_id?: number;
    booking_id?: number;
    document_type: string;
    notes?: string;
    expires_at?: string;
  }) => Promise<Document>;
  deleteDocument: (id: number) => Promise<void>;
}

const DocumentContext = createContext<DocumentContextProps | undefined>(undefined);

export const useDocuments = (): DocumentContextProps => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
};

interface DocumentProviderProps {
  children: ReactNode;
}

// Helper to extract error message from API responses
const extractErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ success: boolean; message: string }>;
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unknown error occurred';
};

export const DocumentProvider: React.FC<DocumentProviderProps> = ({ children }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  
  const { user, isAuthenticated } = useJWTAuth();

  // Helper to get token headers
  const getTokenHeaders = useCallback(() => {
    // Determine which storage to use based on how the token was saved
    const useLocalStorage = localStorage.getItem('remember_me') === 'true';
    const storage = useLocalStorage ? localStorage : sessionStorage;
    
    // Get the token from storage
    const token = storage.getItem(TOKEN_KEY);
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    return {
      Authorization: `Bearer ${token}`
    };
  }, []);

  const fetchDocuments = useCallback(async (filters: DocumentFilters = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!isAuthenticated) {
        throw new Error('User not authenticated');
      }
      
      const headers = getTokenHeaders();
      
      // Build query string from filters
      const queryParams = new URLSearchParams();
      if (filters.user_id) queryParams.append('user_id', filters.user_id.toString());
      if (filters.booking_id) queryParams.append('booking_id', filters.booking_id.toString());
      if (filters.document_type) queryParams.append('document_type', filters.document_type);
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      
      const response = await axios.get(`/backend/api/admin/documents/list.php?${queryParams.toString()}`, {
        headers
      });
      
      if (response.data.success) {
        setDocuments(response.data.documents);
        setCurrentPage(response.data.pagination?.current_page || 1);
        setTotalPages(response.data.pagination?.total_pages || 1);
      } else {
        setError(response.data.message || 'Failed to fetch documents');
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, getTokenHeaders]);

  const uploadDocument = useCallback(async (file: File, documentData: {
    user_id?: number;
    booking_id?: number;
    document_type: string;
    notes?: string;
    expires_at?: string;
  }): Promise<Document> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!isAuthenticated) {
        throw new Error('User not authenticated');
      }
      
      // Validate document type
      if (!isValidDocumentType(documentData.document_type)) {
        throw new Error('Invalid document type');
      }
      
      const headers = getTokenHeaders();
      
      const formData = new FormData();
      formData.append('file', file);
      if (documentData.user_id) formData.append('user_id', documentData.user_id.toString());
      if (documentData.booking_id) formData.append('booking_id', documentData.booking_id.toString());
      formData.append('document_type', documentData.document_type);
      if (documentData.notes) formData.append('notes', documentData.notes);
      if (documentData.expires_at) formData.append('expires_at', documentData.expires_at);
      
      const response = await axios.post('/backend/api/admin/documents/upload.php', formData, {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        // Refresh document list after upload
        fetchDocuments();
        return response.data.document;
      } else {
        throw new Error(response.data.message || 'Failed to upload document');
      }
    } catch (err) {
      console.error('Error uploading document:', err);
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, getTokenHeaders, fetchDocuments]);

  const deleteDocument = useCallback(async (id: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!isAuthenticated) {
        throw new Error('User not authenticated');
      }
      
      const headers = getTokenHeaders();
      
      const response = await axios.post('/backend/api/admin/documents/delete.php', 
        { document_id: id },
        { headers }
      );
      
      if (response.data.success) {
        // Remove document from state
        setDocuments(prev => prev.filter(doc => doc.id !== id));
      } else {
        throw new Error(response.data.message || 'Failed to delete document');
      }
    } catch (err) {
      console.error('Error deleting document:', err);
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, getTokenHeaders]);

  const value = {
    documents,
    isLoading,
    error,
    currentPage,
    totalPages,
    fetchDocuments,
    uploadDocument,
    deleteDocument
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
};

export default DocumentProvider; 