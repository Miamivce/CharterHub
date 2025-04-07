import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBookings } from '../../contexts/BookingContext';
import { useDocuments, Document } from '../../contexts/DocumentContext';
import { useJWTAuth } from '../../../frontend/src/contexts/auth/JWTAuthContext';
import type { BookingData } from '../../types';

const BookingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useJWTAuth();
  const {
    getBooking,
    updateBooking,
    updateBookingStatus,
    attachDocument,
    removeDocument,
    isLoading: bookingLoading,
    error: bookingError,
  } = useBookings();
  const {
    documents,
    uploadDocument,
    fetchDocuments,
    isLoading: documentsLoading,
    error: documentsError,
  } = useDocuments();

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedBooking, setEditedBooking] = useState<BookingData | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    const loadBooking = async () => {
      if (!id) return;
      try {
        const data = await getBooking(parseInt(id));
        setBooking(data);
        setEditedBooking(data);
      } catch (err) {
        console.error('Failed to load booking:', err);
      }
    };

    loadBooking();
    fetchDocuments();
  }, [id, getBooking, fetchDocuments]);

  const handleStatusChange = async (newStatus: BookingData['status']) => {
    if (!booking?.id) return;
    try {
      await updateBookingStatus(booking.id, newStatus);
      const updatedBooking = await getBooking(booking.id);
      setBooking(updatedBooking);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleSave = async () => {
    if (!booking?.id || !editedBooking) return;
    try {
      await updateBooking(booking.id, editedBooking);
      const updatedBooking = await getBooking(booking.id);
      setBooking(updatedBooking);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update booking:', err);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !booking?.id) return;
    setUploadError(null);

    try {
      const document = await uploadDocument(selectedFile, {
        document_type: 'contract',
        booking_id: booking.id
      });
      await attachDocument(booking.id, document.id, 'contract');
      setSelectedFile(null);
      const updatedBooking = await getBooking(booking.id);
      setBooking(updatedBooking);
    } catch (err) {
      setUploadError('Failed to upload document');
      console.error('Upload error:', err);
    }
  };

  const handleRemoveDocument = async (documentId: number) => {
    if (!booking?.id) return;
    try {
      await removeDocument(booking.id, documentId);
      const updatedBooking = await getBooking(booking.id);
      setBooking(updatedBooking);
    } catch (err) {
      console.error('Failed to remove document:', err);
    }
  };

  if (authLoading.refreshUserData || bookingLoading || documentsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (bookingError || documentsError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{bookingError || documentsError}</div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Booking not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{booking.title}</h1>
        <div className="space-x-4">
          <button
            onClick={() => navigate('/bookings')}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            Back to Bookings
          </button>
          {user?.role === 'admin' && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Booking Details</h2>
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={editedBooking?.title || ''}
                  onChange={(e) =>
                    setEditedBooking(prev => prev ? { ...prev, title: e.target.value } : null)
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  value={editedBooking?.startDate || ''}
                  onChange={(e) =>
                    setEditedBooking(prev => prev ? { ...prev, startDate: e.target.value } : null)
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  value={editedBooking?.endDate || ''}
                  onChange={(e) =>
                    setEditedBooking(prev => prev ? { ...prev, endDate: e.target.value } : null)
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Details</label>
                <textarea
                  value={editedBooking?.details || ''}
                  onChange={(e) =>
                    setEditedBooking(prev => prev ? { ...prev, details: e.target.value } : null)
                  }
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">Status</div>
                {user?.role === 'admin' ? (
                  <select
                    value={booking.status}
                    onChange={(e) => handleStatusChange(e.target.value as BookingData['status'])}
                    className={`mt-1 rounded-full px-3 py-1 text-sm font-medium ${
                      booking.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : booking.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : booking.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                ) : (
                  <div className="font-medium capitalize">{booking.status}</div>
                )}
              </div>
              <div>
                <div className="text-sm text-gray-500">Dates</div>
                <div>
                  {new Date(booking.startDate).toLocaleDateString()} -{' '}
                  {new Date(booking.endDate).toLocaleDateString()}
                </div>
              </div>
              {booking.totalPrice && (
                <div>
                  <div className="text-sm text-gray-500">Total Price</div>
                  <div className="font-medium">${booking.totalPrice.toFixed(2)}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-500">Details</div>
                <div className="whitespace-pre-line">{booking.details}</div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Documents</h2>
          {booking.documents && booking.documents.length > 0 ? (
            <ul className="space-y-4">
              {booking.documents.map((docId) => {
                const doc = documents.find(d => d.id === docId);
                if (!doc) return null;
                return (
                  <li key={doc.id} className="border-b pb-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{doc.filename}</div>
                        <div className="text-sm text-gray-500 capitalize">{doc.document_type}</div>
                      </div>
                      <div className="flex space-x-2">
                        <a
                          href={doc.download_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View
                        </a>
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleRemoveDocument(docId)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-gray-500">No documents attached to this booking</p>
          )}

          {user?.role === 'admin' && (
            <div className="mt-6">
              <h3 className="text-md font-medium mb-2">Upload New Document</h3>
              <div className="space-y-4">
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {selectedFile && (
                  <button
                    onClick={handleFileUpload}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    Upload
                  </button>
                )}
                {uploadError && (
                  <div className="text-red-500 text-sm">{uploadError}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingDetails; 