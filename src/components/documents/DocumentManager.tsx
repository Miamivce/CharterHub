import React, { useState } from 'react';
import DocumentUploader from './DocumentUploader';
import DocumentTable from './DocumentTable';
import { DocumentProvider } from '../../contexts/DocumentContext';

interface DocumentManagerProps {
  userId?: number;
  bookingId?: number;
  title?: string;
  documentType?: string;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({
  userId,
  bookingId,
  title = 'Documents',
  documentType
}) => {
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  
  const handleUploadSuccess = () => {
    // Increment the refresh trigger to cause DocumentTable to refresh
    setRefreshTrigger(prev => prev + 1);
  };
  
  return (
    <DocumentProvider>
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">{title}</h2>
        
        <DocumentUploader 
          userId={userId}
          bookingId={bookingId}
          onUploadSuccess={handleUploadSuccess}
        />
        
        <DocumentTable 
          userId={userId}
          bookingId={bookingId}
          documentType={documentType}
          refreshTrigger={refreshTrigger}
        />
      </div>
    </DocumentProvider>
  );
};

export default DocumentManager; 