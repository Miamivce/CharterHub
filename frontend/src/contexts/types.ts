import { ReactNode } from 'react'

export interface ContextProviderProps {
  children: ReactNode
}

export interface BaseUser {
  id: string | number
  email: string
  firstName: string
  lastName: string
  displayName?: string
  username?: string
  role: 'admin' | 'administrator' | 'client'
  verified?: boolean
}

export interface AdminUser extends BaseUser {
  role: 'admin' | 'administrator'
  phone?: string
}

export interface ClientUser extends BaseUser {
  role: 'client'
  phone?: string
  company?: string
  country?: string
  address?: string
  notes?: string
}

export type User = AdminUser | ClientUser

export interface UserRegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phoneNumber?: string
  company?: string
  role?: 'admin' | 'client' | 'charter_client'
  rememberMe?: boolean
}

export interface UserLoginData {
  email: string
  password: string
  rememberMe?: boolean
}

export interface UserUpdateData {
  firstName?: string
  lastName?: string
  email?: string
  phoneNumber?: string
  company?: string
  role?: 'admin' | 'client' | 'charter_client'
}

export interface Yacht {
  id: string
  name: string
  description: string
  specifications: {
    length: string
    capacity: number
    crew: number
    builder?: string
    year?: number
    beam?: string
    cabins?: number
  }
  pricing: {
    basePrice: number
    currency: string
  }
  featuredImage?: string
  charterTypes?: number[]
  destinations?: number[]
  metadata?: {
    charterTypeNames: string[]
    destinationNames: string[]
    link: string
    modified: string
  }
}

export interface Destination {
  id: string
  name: string
  description: string
  location: {
    latitude: number
    longitude: number
  }
}

export interface BookingDocument {
  id: string
  title: string
  url: string
  type:
    | 'proposal'
    | 'brochure'
    | 'contract'
    | 'payment_overview'
    | 'preference_sheet'
    | 'sample_menu'
    | 'crew_profiles'
    | 'itinerary'
    | 'passport_details'
    | 'captains_details'
    | 'other'
  documentType: 'file' | 'link' | 'form'
  visibility: 'main_charterer' | 'all'
  uploadedAt: string
  metadata?: {
    fileSize?: number
    fileType?: string
    captainsDetails?: {
      name: string
      phone: string
      email: string
      experience: string
      certifications: string[]
      notes?: string
    }
  }
}

export interface BookingGuest {
  id: string
  firstName: string
  lastName: string
  email: string
  notes?: string
}

export interface Booking {
  id: string
  yachtId: string
  customerId: string
  startDate: string
  endDate: string
  guests: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  specialRequests?: string
  totalPrice: number
  mainCharterer: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  guestList: BookingGuest[]
  documents: BookingDocument[]
  yacht: {
    id: string
    name: string
    isFromApi: boolean
  }
  destination: {
    id: string
    name: string
    isFromApi: boolean
  }
}

export interface Document {
  id: string
  name: string
  type: 'contract' | 'insurance' | 'license' | 'other'
  url: string
  uploadedAt: string
  relatedEntityId?: string
  relatedEntityType?: 'yacht' | 'booking' | 'customer'
}

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

// Dashboard types
export interface DashboardStats {
  totalBookings: number
  totalCustomers: number
  totalRevenue: number
  availableYachts: number
}

export interface BookingWithDetails extends Booking {
  customer: {
    id: string
    name: string
    email: string
  }
  yacht: {
    id: string
    name: string
    isFromApi: boolean
    specifications: {
      length: string
      capacity: number
      crew: number
    }
    pricing: {
      basePrice: number
      currency: string
    }
    imageUrl?: string
  }
  destination: {
    id: string
    name: string
    isFromApi: boolean
    location?: {
      latitude: number
      longitude: number
    }
  }
}

export interface CustomerWithStats extends ClientUser {
  bookingsCount: number
  totalSpent: number
  lastBooking?: string
  selfRegistered?: boolean
  registrationDate?: string
  passportDocumentId?: string
}

export interface CharterhubDestination {
  id: string
  name: string
  description: string
  featuredImage?: string
  content?: {
    rendered: string
  }
  acf?: {
    destination_detail__description?: string
    destination_detail__highlights?: string[]
    destination_detail__best_time?: string
    destination_detail__climate?: string
    destination_detail__image_map?: {
      lat: number
      lng: number
    }
    destination_detail__banner_image?: {
      url: string
    }
    destination_detail__gallery?: Array<{
      url?: string
      source_url?: string
      sizes?: {
        full?: string
      }
      guid?: string
    }>
  }
}
