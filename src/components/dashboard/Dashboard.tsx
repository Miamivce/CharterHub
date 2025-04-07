import React, { useEffect } from 'react';
import { useJWTAuth } from '../../../frontend/src/contexts/auth/JWTAuthContext';
import { useBookings } from '../../contexts/BookingContext';

const Dashboard: React.FC = () => {
  const { user, loading: authLoading } = useJWTAuth();
  const { bookings, fetchBookings, isLoading, error } = useBookings();

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Handle both authentication loading and bookings loading
  if (authLoading?.refreshUserData || isLoading) {
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
      <h1 className="text-2xl font-bold mb-6">
        Welcome back, {user?.firstName}!
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Bookings</h2>
          {bookings.length === 0 ? (
            <p className="text-gray-500">No recent bookings</p>
          ) : (
            <ul className="space-y-4">
              {bookings.slice(0, 5).map((booking) => (
                <li key={booking.id} className="border-b pb-2">
                  <div className="font-medium">{booking.title}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(booking.startDate).toLocaleDateString()} -{' '}
                    {new Date(booking.endDate).toLocaleDateString()}
                  </div>
                  <div className="text-sm">
                    Status:{' '}
                    <span
                      className={`font-medium ${
                        booking.status === 'confirmed'
                          ? 'text-green-600'
                          : booking.status === 'pending'
                          ? 'text-yellow-600'
                          : booking.status === 'cancelled'
                          ? 'text-red-600'
                          : 'text-blue-600'
                      }`}
                    >
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <button
              onClick={() => {/* TODO: Implement new booking */}}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              New Booking
            </button>
            <button
              onClick={() => {/* TODO: Implement document upload */}}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
            >
              Upload Document
            </button>
            <button
              onClick={() => {/* TODO: Implement profile update */}}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
            >
              Update Profile
            </button>
          </div>
        </div>

        {/* Account Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Account Overview</h2>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500">Email</div>
              <div>{user?.email}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Role</div>
              <div className="capitalize">{user?.role}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Company</div>
              <div>{user?.company || 'Not specified'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Phone</div>
              <div>{user?.phoneNumber || 'Not specified'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 