/**
 * Customer types for CharterHub application
 */

import { ClientUser } from '@/contexts/types'

/**
 * Customer data structure for API interactions
 */
export interface Customer {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  company?: string
  notes?: string
  country?: string
  address?: string
  role: 'customer'
  verified: boolean
  selfRegistered: boolean
  createdAt: string
  updatedAt?: string
  lastLogin?: string
  bookings: number
}

export interface CustomerWithStats extends Customer {
  stats: {
    totalBookings: number
    lastBooking?: string
    totalSpent: number
  }
}

/**
 * Form data for creating or updating customers
 */
export interface CustomerFormData {
  id?: string | number
  email: string
  firstName: string
  lastName: string
  phone?: string
  company?: string
  notes?: string
  country?: string
  address?: string
  role?: 'customer'
  password?: string
}

/**
 * Customer data with additional fields for API responses
 */
export interface CustomerResponse {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  company?: string
  notes?: string
  bookingsCount: number
  totalSpent: number
  lastBooking?: string
  role?: 'customer'
}

/**
 * Helper functions for customer data
 */
export const CustomerUtils = {
  /**
   * Convert a Customer to a CustomerFormData for API requests
   */
  toFormData(customer: Customer): CustomerFormData {
    return {
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
      notes: customer.notes,
      country: customer.country,
      address: customer.address,
      role: customer.role,
    }
  },

  /**
   * Convert a ClientUser to a CustomerFormData
   */
  clientUserToFormData(user: ClientUser): CustomerFormData {
    return {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      company: user.company || '',
      notes: user.notes || '',
      country: user.country || '',
      address: user.address || '',
      role: 'customer',
    }
  },
}

export interface CustomerModalResult {
  customer: Customer
  inviteLink?: string | null
  action: 'created' | 'updated'
}
