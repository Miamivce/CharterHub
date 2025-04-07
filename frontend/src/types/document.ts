export type DocumentType = 'file' | 'link' | 'form'

export type DocumentCategory =
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
  | 'invoice'
  | 'receipt'
  | 'other'

export interface DocumentMetadata {
  fileSize?: number
  fileType?: string
  tags?: string[]
  uploadedBy?: {
    name: string
    date: string
    id?: number | string
  }
  captainDetails?: {
    name: string
    phone: string
    email: string
    experience: string
    certifications: string[]
    notes?: string
  }
  user_id?: number
  booking_id?: number
  isExistingDocument?: boolean
  originalDocumentId?: string
  linked_from?: string
}

export interface Document {
  id: string
  type: DocumentType
  category: DocumentCategory
  title: string
  description?: string
  url?: string
  metadata?: DocumentMetadata
  uploadedAt: string
  updatedAt?: string
}

export interface BookingDocument extends Document {
  visibleToAllGuests: boolean
}
