import React, { createContext, useContext, useState, useCallback } from 'react';
import { api, ApiError } from '../services/wpApi';
import type { BookingData, PaginatedResponse } from '../types';
import { useJWTAuth } from '../../frontend/src/contexts/auth/JWTAuthContext';

interface BookingContextType {
  bookings: BookingData[];
  isLoading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  createBooking: (data: Omit<BookingData, 'id'>) => Promise<BookingData>;
  updateBooking: (id: number, data: Partial<BookingData>) => Promise<BookingData>;
  deleteBooking: (id: number) => Promise<void>;
  fetchBookings: (page?: number) => Promise<void>;
  getBooking: (id: number) => Promise<BookingData>;
  updateBookingStatus: (id: number, status: BookingData['status']) => Promise<void>;
  attachDocument: (bookingId: number, documentId: number, type: string) => Promise<void>;
  removeDocument: (bookingId: number, documentId: number) => Promise<void>;
}

const BookingContext = createContext<BookingContextType | null>(null);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useJWTAuth();

  const fetchBookings = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getBookings({
        page,
        perPage: 10,
        userId: user?.role === 'client' ? user.id : undefined
      }) as PaginatedResponse<BookingData>;
      
      setBookings(response.items);
      setTotalPages(response.pages);
      setCurrentPage(page);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to fetch bookings');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const createBooking = async (data: Omit<BookingData, 'id'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.createBooking({
        ...data,
        userId: user?.id
      });
      await fetchBookings(currentPage);
      return response;
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to create booking');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateBooking = async (id: number, data: Partial<BookingData>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.updateBooking(id, data);
      await fetchBookings(currentPage);
      return response;
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to update booking');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBooking = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.deleteBooking(id);
      await fetchBookings(currentPage);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to delete booking');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getBooking = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      return await api.getBooking(id);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to fetch booking');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateBookingStatus = async (id: number, status: BookingData['status']) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.updateBookingStatus(id, status);
      await fetchBookings(currentPage);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to update booking status');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const attachDocument = async (bookingId: number, documentId: number, type: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.attachDocumentToBooking({
        bookingId,
        documentId,
        type: type as any,
      });
      await fetchBookings(currentPage);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to attach document');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeDocument = async (bookingId: number, documentId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.removeDocumentFromBooking(bookingId, documentId);
      await fetchBookings(currentPage);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to remove document');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    bookings,
    isLoading,
    error,
    totalPages,
    currentPage,
    createBooking,
    updateBooking,
    deleteBooking,
    fetchBookings,
    getBooking,
    updateBookingStatus,
    attachDocument,
    removeDocument,
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
};

export const useBookings = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBookings must be used within a BookingProvider');
  }
  return context;
}; 