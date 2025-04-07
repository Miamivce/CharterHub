import React, { useEffect, useState } from 'react';
import { useJWTAuth } from '../../../frontend/src/contexts/auth/JWTAuthContext';
import { useBookings } from '../../contexts/BookingContext';
import { Link } from 'react-router-dom';
import type { BookingAnalytics, BookingData } from '../../types';
import { api } from '../../services/wpApi';

const AdminDashboard: React.FC = () => {
  const { user, loading: authLoading } = useJWTAuth();
  const { bookings, fetchBookings } = useBookings();
  
  const [bookingStats, setBookingStats] = useState<BookingAnalytics | null>(null);
  const [documentStats, setDocumentStats] = useState<any>(null);
  const [recentBookings, setRecentBookings] = useState<BookingData[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<BookingData[]>([]);
  const [totalBookings, setTotalBookings] = useState<number>(0);
  const [activeCharters, setActiveCharters] = useState<number>(0);
  const [nextMonthBookings, setNextMonthBookings] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch bookings first to populate the bookings state
        await fetchBookings();
        
        // Get analytics data directly from the API
        const [bookingData, documentData] = await Promise.all([
          api.getBookingAnalytics(),
          api.getDocumentAnalytics()
        ]);
        
        setBookingStats(bookingData);
        setDocumentStats(documentData);

        // Calculate metrics
        calculateMetrics();
        
        // Get recent and upcoming bookings
        await fetchBookingsForDisplay();
      } catch (err) {
        setError('Failed to fetch analytics data');
        console.error('Analytics fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [fetchBookings]);

  const calculateMetrics = () => {
    if (!bookings) return;
    
    // Total bookings
    setTotalBookings(bookings.length);
    
    // Active charters (status is 'confirmed' and endDate is in the future)
    const now = new Date();
    const active = bookings.filter(booking => 
      booking.status === 'confirmed' && 
      new Date(booking.endDate) >= now
    );
    setActiveCharters(active.length);
    
    // Bookings in the next month
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    
    const nextMonth = bookings.filter(booking => {
      const startDate = new Date(booking.startDate);
      return startDate >= now && startDate <= oneMonthLater;
    });
    setNextMonthBookings(nextMonth.length);
  };

  const fetchBookingsForDisplay = async () => {
    if (!bookings) return;
    
    const now = new Date();
    
    // Recent bookings: sort by startDate DESC, take the first 5
    const recent = [...bookings]
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .slice(0, 5);
    setRecentBookings(recent);
    
    // Upcoming bookings: filter to future bookings, sort by startDate ASC, take the first 5
    const upcoming = bookings
      .filter(booking => new Date(booking.startDate) >= now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 5);
    setUpcomingBookings(upcoming);
  };

  if (authLoading?.refreshUserData || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user?.role || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">Access denied. Admin privileges required.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {error && (
        <div className="mb-8 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Total Bookings</div>
          <div className="text-2xl font-bold text-blue-600">{totalBookings}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Active Charters</div>
          <div className="text-2xl font-bold text-green-600">{activeCharters}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Bookings in Next Month</div>
          <div className="text-2xl font-bold text-purple-600">{nextMonthBookings}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Booking Analytics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Booking Analytics</h2>
          {bookingStats && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded">
                  <div className="text-sm text-gray-500">Total Bookings</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {bookingStats.bookings.total}
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded">
                  <div className="text-sm text-gray-500">Revenue</div>
                  <div className="text-2xl font-bold text-green-600">
                    ${bookingStats.revenue.total.toLocaleString()}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Status Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="capitalize">Pending</span>
                    <span className="font-medium">{bookingStats.bookings.pending}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="capitalize">Confirmed</span>
                    <span className="font-medium">{bookingStats.bookings.confirmed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="capitalize">Completed</span>
                    <span className="font-medium">{bookingStats.bookings.completed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="capitalize">Cancelled</span>
                    <span className="font-medium">{bookingStats.bookings.cancelled}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Document Analytics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Document Analytics</h2>
          {documentStats && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-50 p-4 rounded">
                  <div className="text-sm text-gray-500">Total Documents</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {documentStats.totalDocuments}
                  </div>
                </div>
                <div className="bg-indigo-50 p-4 rounded">
                  <div className="text-sm text-gray-500">Storage Used</div>
                  <div className="text-2xl font-bold text-indigo-600">
                    {(documentStats.totalStorageSize / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Document Types</h3>
                <div className="space-y-2">
                  {Object.entries(documentStats.typeBreakdown || {}).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="capitalize">{type}</span>
                      <span className="font-medium">{String(count)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Bookings</h2>
          {recentBookings.length > 0 ? (
            <div className="space-y-4">
              {recentBookings.map(booking => (
                <Link 
                  key={booking.id} 
                  to={`/admin/bookings/${booking.id}`}
                  className="block p-3 border rounded hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium">{booking.title}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(booking.startDate).toLocaleDateString()} - 
                    {new Date(booking.endDate).toLocaleDateString()}
                  </div>
                  <div className="text-xs px-2 py-1 rounded-full inline-block mt-1 bg-blue-100 text-blue-800">
                    {booking.status}
                  </div>
                </Link>
              ))}
              <Link 
                to="/admin/bookings" 
                className="text-blue-600 hover:text-blue-800 block text-center pt-2 font-medium"
              >
                View all bookings →
              </Link>
            </div>
          ) : (
            <div className="text-gray-500">No recent bookings found.</div>
          )}
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Upcoming Bookings</h2>
          {upcomingBookings.length > 0 ? (
            <div className="space-y-4">
              {upcomingBookings.map(booking => (
                <Link 
                  key={booking.id} 
                  to={`/admin/bookings/${booking.id}`}
                  className="block p-3 border rounded hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium">{booking.title}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(booking.startDate).toLocaleDateString()} - 
                    {new Date(booking.endDate).toLocaleDateString()}
                  </div>
                  <div className="text-xs px-2 py-1 rounded-full inline-block mt-1 bg-green-100 text-green-800">
                    {booking.status}
                  </div>
                </Link>
              ))}
              <Link 
                to="/admin/bookings" 
                className="text-blue-600 hover:text-blue-800 block text-center pt-2 font-medium"
              >
                View all bookings →
              </Link>
            </div>
          ) : (
            <div className="text-gray-500">No upcoming bookings found.</div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => window.location.href = '/admin/users'}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Manage Users
            </button>
            <button
              onClick={() => window.location.href = '/admin/bookings'}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
            >
              View All Bookings
            </button>
            <button
              onClick={() => window.location.href = '/admin/documents'}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
            >
              Document Management
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 