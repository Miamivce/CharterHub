import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookings } from '../../contexts/BookingContext';
import { useJWTAuth } from '../../../frontend/src/contexts/auth/JWTAuthContext';
import type { BookingData } from '../../types';

const BookingList: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useJWTAuth();
  const {
    bookings,
    fetchBookings,
    updateBookingStatus,
    isLoading,
    error,
    totalPages,
    currentPage,
  } = useBookings();

  const [selectedStatus, setSelectedStatus] = useState<BookingData['status'] | 'all'>(
    'all'
  );

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleStatusChange = async (bookingId: number, newStatus: BookingData['status']) => {
    try {
      await updateBookingStatus(bookingId, newStatus);
    } catch (err) {
      console.error('Failed to update booking status:', err);
    }
  };

  const filteredBookings = selectedStatus === 'all'
    ? bookings
    : bookings.filter(booking => booking.status === selectedStatus);

  if (authLoading.refreshUserData || isLoading) {
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
        <h1 className="text-2xl font-bold">Bookings</h1>
        <button
          onClick={() => navigate('/bookings/new')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          New Booking
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Status
        </label>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as BookingData['status'] | 'all')}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredBookings.map((booking) => (
            <li key={booking.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div
                    onClick={() => navigate(`/bookings/${booking.id}`)}
                    className="text-lg font-medium text-blue-600 cursor-pointer hover:text-blue-800"
                  >
                    {booking.title}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(booking.startDate).toLocaleDateString()} -{' '}
                    {new Date(booking.endDate).toLocaleDateString()}
                  </div>
                  {booking.totalPrice && (
                    <div className="text-sm font-medium">
                      Total: ${booking.totalPrice.toFixed(2)}
                    </div>
                  )}
                </div>

                <div className="ml-4">
                  {user?.role === 'admin' ? (
                    <select
                      value={booking.status}
                      onChange={(e) =>
                        handleStatusChange(
                          booking.id!,
                          e.target.value as BookingData['status']
                        )
                      }
                      className={`rounded-full px-3 py-1 text-sm font-medium ${
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
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        booking.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : booking.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : booking.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => fetchBookings(page)}
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
  );
};

export default BookingList; 