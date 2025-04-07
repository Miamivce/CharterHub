import React, { useState, useEffect } from 'react';
import { useDocuments, Document, DocumentFilters } from '../../contexts/DocumentContext';

interface DocumentTableProps {
  userId?: number;
  bookingId?: number;
  documentType?: string;
  limit?: number;
  refreshTrigger?: number; // Used to trigger a refresh from parent component
}

const DocumentTable: React.FC<DocumentTableProps> = ({
  userId,
  bookingId,
  documentType,
  limit = 10,
  refreshTrigger = 0,
}) => {
  const {
    documents,
    isLoading,
    error,
    currentPage,
    totalPages,
    fetchDocuments,
    deleteDocument,
  } = useDocuments();

  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Fetch documents when props change or refresh is triggered
  useEffect(() => {
    const filters: DocumentFilters = {
      page: 1,
      limit,
    };

    if (userId) filters.user_id = userId;
    if (bookingId) filters.booking_id = bookingId;
    if (documentType) filters.document_type = documentType;

    fetchDocuments(filters);
  }, [fetchDocuments, userId, bookingId, documentType, limit, refreshTrigger]);

  // Handle page change
  const handlePageChange = (page: number) => {
    const filters: DocumentFilters = {
      page,
      limit,
    };

    if (userId) filters.user_id = userId;
    if (bookingId) filters.booking_id = bookingId;
    if (documentType) filters.document_type = documentType;

    fetchDocuments(filters);
  };

  // Handle delete confirmation
  const handleDeleteClick = (documentId: number) => {
    setConfirmDelete(documentId);
  };

  // Cancel delete
  const handleCancelDelete = () => {
    setConfirmDelete(null);
  };

  // Confirm and execute delete
  const handleConfirmDelete = async (documentId: number) => {
    setDeleting(documentId);
    try {
      await deleteDocument(documentId);
      setConfirmDelete(null);
    } catch (err) {
      console.error('Error deleting document:', err);
    } finally {
      setDeleting(null);
    }
  };

  // Format document type for display
  const formatDocumentType = (type: string): string => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (isLoading && documents.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow flex justify-center items-center h-40">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading documents...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="bg-red-50 text-red-700 p-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-gray-500 text-center py-6">No documents found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Document
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Size
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Uploaded
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {documents.map((document: Document) => (
              <tr key={document.id} className={confirmDelete === document.id ? 'bg-red-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 rounded-md">
                      {document.mime_type.startsWith('image/') ? (
                        <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      ) : document.mime_type === 'application/pdf' ? (
                        <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {document.filename}
                      </div>
                      {document.notes && (
                        <div className="text-sm text-gray-500">
                          {document.notes.length > 50 ? `${document.notes.substring(0, 50)}...` : document.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {formatDocumentType(document.document_type)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {document.formatted_size}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(document.uploaded_at).toLocaleDateString()}
                  <div className="text-xs text-gray-400">
                    by {document.uploader_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {confirmDelete === document.id ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleConfirmDelete(document.id)}
                        className="text-red-600 hover:text-red-900 font-bold disabled:opacity-50"
                        disabled={deleting === document.id}
                      >
                        {deleting === document.id ? 'Deleting...' : 'Confirm'}
                      </button>
                      <button
                        onClick={handleCancelDelete}
                        className="text-gray-600 hover:text-gray-900"
                        disabled={deleting === document.id}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex space-x-4">
                      <a
                        href={document.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Download
                      </a>
                      <button
                        onClick={() => handleDeleteClick(document.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{documents.length > 0 ? (currentPage - 1) * limit + 1 : 0}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * limit, (currentPage - 1) * limit + documents.length)}</span> of{' '}
                <span className="font-medium">{totalPages * limit}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => handlePageChange(i + 1)}
                    aria-current={currentPage === i + 1 ? 'page' : undefined}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === i + 1
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentTable; 