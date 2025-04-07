import { useState, useEffect } from 'react'
import { DocumentType, DocumentCategory, DocumentMetadata, Document } from '@/types/document'
import { Button, Input, Card } from '@/components/shared'
import { XMarkIcon, DocumentIcon, FolderIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import { useDocument } from '@/contexts/document/DocumentContext'
import { DocumentSearchModal } from './DocumentSearchModal'
import { useJWTAuth } from '@/contexts/auth/JWTAuthContext'

// Extend DocumentMetadata to include user ID
interface ExtendedDocumentMetadata extends DocumentMetadata {
  user_id?: number;
}

// Update the DocumentFormValues interface to use the extended metadata
export interface DocumentFormValues {
  type: DocumentType
  category: DocumentCategory
  title: string
  description?: string
  url?: string
  visibleToAllGuests?: boolean
  metadata?: ExtendedDocumentMetadata
  file?: File
}

interface DocumentFormProps {
  onSubmit: (values: DocumentFormValues) => Promise<void>
  onCancel: () => void
  initialValues?: Partial<DocumentFormValues>
  isBookingDocument?: boolean
}

const DOCUMENT_TYPES: { value: DocumentType; label: string; icon: typeof DocumentIcon }[] = [
  { value: 'file', label: 'Upload File', icon: ArrowUpTrayIcon },
  { value: 'form', label: 'Online Form', icon: DocumentIcon },
]

const DOCUMENT_CATEGORIES: { value: DocumentCategory; label: string }[] = [
  { value: 'proposal', label: 'Proposal' },
  { value: 'brochure', label: 'Brochure' },
  { value: 'contract', label: 'Contract' },
  { value: 'payment_overview', label: 'Payment Overview' },
  { value: 'preference_sheet', label: 'Preference Sheet' },
  { value: 'sample_menu', label: 'Sample Menu' },
  { value: 'crew_profiles', label: 'Crew Profiles' },
  { value: 'itinerary', label: 'Itinerary' },
  { value: 'passport_details', label: 'Passport Details' },
  { value: 'captains_details', label: 'Captain\'s Details' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'other', label: 'Other' },
]

type CaptainDetailsField = keyof NonNullable<NonNullable<DocumentMetadata>['captainDetails']>

export function DocumentForm({ onSubmit, onCancel, initialValues, isBookingDocument = false }: DocumentFormProps) {
  const { documents } = useDocument()
  const { user } = useJWTAuth()
  const [values, setValues] = useState<DocumentFormValues>({
    type: initialValues?.type || 'file',
    category: initialValues?.category || 'other',
    title: initialValues?.title || '',
    description: initialValues?.description || '',
    url: initialValues?.url || '',
    visibleToAllGuests: initialValues?.visibleToAllGuests || false,
    metadata: initialValues?.metadata || {
      captainDetails: {
        name: '',
        phone: '',
        email: '',
        experience: '',
        certifications: [],
        notes: '',
      }
    },
  })
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      if (values.type === 'file' && !file && !values.url) {
        throw new Error('Please select a file to upload')
      }
      if (!values.category) {
        throw new Error('Please select a category')
      }
      if (values.category === 'other' && !values.title) {
        throw new Error('Please enter a title')
      }

      // Add the user ID to metadata if available
      if (user && !values.metadata?.user_id) {
        console.log('Adding user ID to document metadata:', user.id);
        values.metadata = {
          ...values.metadata,
          user_id: user.id
        }
      } else {
        console.warn('User ID not available for document:', 
          user ? `User found (ID: ${user.id}) but metadata already has user_id: ${values.metadata?.user_id}` 
               : 'No authenticated user found');
      }

      // Include the file in the values object
      const valuesWithFile = {
        ...values,
        ...(file ? { file } : {})
      }

      await onSubmit(valuesWithFile)
      setFile(null)
      setValues({
        type: 'file',
        category: 'other',
        title: '',
        description: '',
        url: '',
        visibleToAllGuests: false,
        metadata: {
          captainDetails: {
            name: '',
            phone: '',
            email: '',
            experience: '',
            certifications: [],
            notes: '',
          }
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add document')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setValues(prev => ({
        ...prev,
        title: values.category === 'other' ? prev.title : selectedFile.name,
        metadata: {
          ...prev.metadata,
          fileSize: selectedFile.size,
          fileType: selectedFile.type,
        },
      }))
    }
  }

  const handleDocumentSelect = (doc: Document) => {
    setValues(prev => ({
      ...prev,
      title: doc.title,
      url: doc.url,
      category: doc.category,
      metadata: doc.metadata,
    }))
    setSelectedDocument(doc)
    setShowSearchModal(false)
  }

  const handleCaptainDetailsChange = (field: CaptainDetailsField, value: string | string[]) => {
    setValues(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        captainDetails: {
          ...(prev.metadata?.captainDetails || {
            name: '',
            phone: '',
            email: '',
            experience: '',
            certifications: [],
            notes: '',
          }),
          [field]: value,
        },
      },
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* File Upload Form - Always visible */}
      <div className="space-y-4">
        {/* Existing file upload input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Upload Document</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/80">
                  <span>Upload a file</span>
                  <input
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PDF, DOC, DOCX, TXT, JPG, JPEG, PNG up to 10MB</p>

              {/* Show selected file info */}
              {file && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form fields */}
        <div>
          <label className="block text-sm font-medium mb-2">Category</label>
          <select
            value={values.category}
            onChange={e => setValues({ ...values, category: e.target.value as DocumentCategory })}
            className="w-full px-3 py-2 border rounded-md"
            disabled={isSubmitting}
          >
            {DOCUMENT_CATEGORIES.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <Input
            type="text"
            value={values.title}
            onChange={e => setValues({ ...values, title: e.target.value })}
            placeholder="Document title"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description (Optional)</label>
          <textarea
            value={values.description || ''}
            onChange={e => setValues({ ...values, description: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
            rows={3}
            placeholder="Enter a description for this document"
            disabled={isSubmitting}
          />
        </div>

        {values.category === 'captains_details' && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-md">
            <h4 className="font-medium text-gray-900">Captain's Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <Input
                  type="text"
                  value={values.metadata?.captainDetails?.name || ''}
                  onChange={e => handleCaptainDetailsChange('name', e.target.value)}
                  placeholder="Captain's name"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <Input
                  type="text"
                  value={values.metadata?.captainDetails?.phone || ''}
                  onChange={e => handleCaptainDetailsChange('phone', e.target.value)}
                  placeholder="Phone number"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  value={values.metadata?.captainDetails?.email || ''}
                  onChange={e => handleCaptainDetailsChange('email', e.target.value)}
                  placeholder="Email address"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Experience</label>
                <Input
                  type="text"
                  value={values.metadata?.captainDetails?.experience || ''}
                  onChange={e => handleCaptainDetailsChange('experience', e.target.value)}
                  placeholder="Years of experience"
                  disabled={isSubmitting}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  value={values.metadata?.captainDetails?.notes || ''}
                  onChange={e => handleCaptainDetailsChange('notes', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  placeholder="Additional notes"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>
        )}

        {isBookingDocument && (
          <div className="flex items-center">
            <input
              type="checkbox"
              id="visibleToAllGuests"
              checked={values.visibleToAllGuests || false}
              onChange={e => setValues({ ...values, visibleToAllGuests: e.target.checked })}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              disabled={isSubmitting}
            />
            <label htmlFor="visibleToAllGuests" className="ml-2 block text-sm text-gray-900">
              Visible to all guests
            </label>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Document'}
          </Button>
        </div>
      </div>

      {/* Document Search Modal */}
      <DocumentSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSelect={handleDocumentSelect}
      />
    </form>
  )
} 