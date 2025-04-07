import React, { useEffect, useState } from 'react';
import { useDocuments, Document } from '../../contexts/DocumentContext';
import { useJWTAuth } from '../../../frontend/src/contexts/auth/JWTAuthContext';
import { DOCUMENT_TYPE_OPTIONS, DOCUMENT_TYPES, getDocumentTypeLabel } from '../../constants/DocumentTypes';

const DocumentList: React.FC = () => {
  const { user, loading: authLoading } = useJWTAuth();
  const {
    documents,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
    isLoading,
    error,
    totalPages,
    currentPage,
  } = useDocuments();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>(DOCUMENT_TYPES.CONTRACT);
  const [filterType, setFilterType] = useState<string | 'all'>('all');
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    setUploadError(null);

    try {
      await uploadDocument(selectedFile, {
        document_type: selectedType,
        notes: notes || undefined,
        user_id: user?.id || undefined
      });
      setSelectedFile(null);
      setNotes('');
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload document');
      console.error('Upload error:', err);
    }
  };

  const handleDeleteClick = (documentId: number) => {
    setConfirmDelete(documentId);
  };

  const handleCancelDelete = () => {
    setConfirmDelete(null);
  };

  const handleConfirmDelete = async (documentId: number) => {
    setDeleting(documentId);
    try {
      await deleteDocument(documentId);
      setConfirmDelete(null);
    } catch (err: any) {
      console.error('Failed to delete document:', err);
      // You might want to display an error message to the user here
    } finally {
      setDeleting(null);
    }
  };

  const filteredDocuments = filterType === 'all'
    ? documents
    : documents.filter(doc => doc.document_type === filterType);

  if (authLoading.refreshUserData || isLoading && documents.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Documents</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Upload New Document</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                {DOCUMENT_TYPE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File
              </label>
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Add any additional information about this document"
            />
          </div>
          {selectedFile && (
            <button
              onClick={handleFileUpload}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Upload
            </button>
          )}
          {uploadError && <div className="text-red-500 text-sm mt-2">{uploadError}</div>}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Type
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as string | 'all')}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="all">All</option>
            {DOCUMENT_TYPE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}s
              </option>
            ))}
          </select>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Document List</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocuments.length > 0 ? (
                  filteredDocuments.map((doc: Document) => (
                    <tr key={doc.id} className={confirmDelete === doc.id ? 'bg-red-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 rounded-md">
                            {doc.mime_type.startsWith('image/') ? (
                              <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            ) : doc.mime_type === 'application/pdf' ? (
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
                            <div className="text-sm font-medium text-gray-900">{doc.filename}</div>
                            {doc.notes && (
                              <div className="text-sm text-gray-500">
                                {doc.notes.length > 50 ? `${doc.notes.substring(0, 50)}...` : doc.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {getDocumentTypeLabel(doc.document_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {doc.formatted_size}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(doc.uploaded_at).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          By {doc.uploader_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {confirmDelete === doc.id ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleConfirmDelete(doc.id)}
                              className="text-red-600 hover:text-red-900"
                              disabled={deleting === doc.id}
                            >
                              {deleting === doc.id ? (
                                <span className="inline-flex items-center">
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Deleting...
                                </span>
                              ) : (
                                'Confirm'
                              )}
                            </button>
                            <button
                              onClick={handleCancelDelete}
                              className="text-gray-600 hover:text-gray-900"
                              disabled={deleting === doc.id}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <a
                              href={doc.download_url}
                              className="text-blue-600 hover:text-blue-900"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Download
                            </a>
                            <button
                              onClick={() => handleDeleteClick(doc.id)}
                              className="text-red-600 hover:text-red-900 ml-3"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No documents found. Upload one to get started!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => fetchDocuments({ page })}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    page === currentPage
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentList; 