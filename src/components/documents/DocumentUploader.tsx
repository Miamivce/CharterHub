import React, { useState, useEffect } from 'react';
import { useDocuments } from '../../contexts/DocumentContext';
import { DOCUMENT_TYPE_OPTIONS, DOCUMENT_TYPES } from '../../constants/DocumentTypes';

interface DocumentUploaderProps {
  userId?: number;
  bookingId?: number;
  onUploadSuccess?: (documentId: number) => void;
  onUploadError?: (error: string) => void;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ 
  userId,
  bookingId,
  onUploadSuccess,
  onUploadError
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>(DOCUMENT_TYPES.OTHER);
  const [notes, setNotes] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { uploadDocument } = useDocuments();
  
  // Need either userId or bookingId
  useEffect(() => {
    if (!userId && !bookingId) {
      setError('Either a user or booking must be selected for document upload');
    } else {
      setError(null);
    }
  }, [userId, bookingId]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  };
  
  const handleDocumentTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setDocumentType(event.target.value);
  };
  
  const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(event.target.value);
  };
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }
    
    if (!userId && !bookingId) {
      setError('Either a user or booking must be selected for document upload');
      return;
    }
    
    setUploading(true);
    setError(null);
    
    try {
      const document = await uploadDocument(selectedFile, {
        user_id: userId,
        booking_id: bookingId,
        document_type: documentType,
        notes: notes || undefined
      });
      
      // Reset form
      setSelectedFile(null);
      setNotes('');
      setDocumentType(DOCUMENT_TYPES.OTHER);
      
      // Trigger success callback if provided
      if (onUploadSuccess) {
        onUploadSuccess(document.id);
      }
    } catch (err: any) {
      console.error('Document upload failed:', err);
      const errorMessage = err.message || 'Upload failed. Please try again.';
      setError(errorMessage);
      
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-4">Upload Document</h3>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Document Type
          </label>
          <select
            value={documentType}
            onChange={handleDocumentTypeChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={uploading}
          >
            {DOCUMENT_TYPE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            File
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            disabled={uploading}
          />
          {selectedFile && (
            <p className="text-sm text-gray-500 mt-1">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={handleNotesChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Add any additional information about this document"
            disabled={uploading}
          />
        </div>
        
        <div className="mt-4">
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={uploading || !selectedFile || (!userId && !bookingId)}
          >
            {uploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </>
            ) : (
              'Upload Document'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DocumentUploader; 