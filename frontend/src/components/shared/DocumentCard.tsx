import React from 'react'
import { Document } from '@/types/document'
import { format } from 'date-fns'

// Document type symbols with unique, relevant icons for each document type
export const DOCUMENT_SYMBOLS = {
  passport_details: '🪪', // ID/Passport symbol
  contract: '📑', // Contract/legal document
  proposal: '📋', // Clipboard/proposal
  brochure: '📰', // Brochure/publication
  payment_overview: '💰', // Money/payment symbol
  preference_sheet: '📝', // Note/preference
  sample_menu: '🍽️', // Dining/menu symbol
  crew_profiles: '👥', // People/crew symbol
  itinerary: '🗺️', // Map/itinerary symbol
  captains_details: '⚓', // Anchor/captain symbol
  invoice: '📊', // Chart/invoice symbol
  receipt: '🧾', // Receipt symbol
  other: '📄', // Generic document
}

interface DocumentCardProps {
  document: Document
  onClick: (document: Document) => void
  onDelete?: (id: string) => void
  compact?: boolean
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onClick,
  onDelete,
  compact = false,
}) => {
  const { id, title, category, description, metadata, uploadedAt } = document
  const symbol =
    DOCUMENT_SYMBOLS[category as keyof typeof DOCUMENT_SYMBOLS] || DOCUMENT_SYMBOLS.other

  // Handle file type display
  const fileType = metadata?.fileType?.split('/')[1]?.toUpperCase() || ''
  const fileSize = metadata?.fileSize
    ? metadata.fileSize < 1024 * 1024
      ? `${Math.round(metadata.fileSize / 1024)} KB`
      : `${(metadata.fileSize / (1024 * 1024)).toFixed(1)} MB`
    : ''

  // Format the upload date
  const formattedDate = uploadedAt ? format(new Date(uploadedAt), 'MMM d, yyyy') : ''

  if (compact) {
    // Compact card design for overview pages
    return (
      <div
        className="relative group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
        onClick={() => onClick(document)}
      >
        <div className="absolute top-2 right-2 flex items-center space-x-1">
          <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-medium uppercase">
            {fileType}
          </span>
        </div>

        <div className="p-4 pt-8">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-xl">
              {symbol}
            </div>
            <div className="ml-3 overflow-hidden">
              <h3 className="text-sm font-medium text-gray-900 truncate">{title}</h3>
              <p className="text-xs text-blue-600 font-medium mt-0.5">
                {category.replace(/_/g, ' ')}
              </p>
              {!description ? (
                <p className="mt-1 text-xs text-gray-500">{formattedDate}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500 truncate">{description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 bg-gray-50 px-4 py-2 text-xs flex justify-between items-center">
          <span className="text-gray-500">{fileSize}</span>
          <span className="text-gray-500">{formattedDate}</span>
        </div>
      </div>
    )
  }

  // Regular card design with more details
  return (
    <div
      className="relative bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
      onClick={() => onClick(document)}
    >
      <div className="absolute top-3 right-3 flex items-center space-x-2">
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(id)
            }}
            className="text-gray-400 hover:text-red-500 focus:outline-none"
            aria-label="Delete document"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}

        <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-medium uppercase">
          {fileType}
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-start">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-2xl">
            {symbol}
          </div>
          <div className="ml-4 overflow-hidden">
            <h3 className="text-base font-medium text-gray-900 truncate">{title}</h3>
            <p className="mt-1 text-sm text-gray-500">{category.replace('_', ' ')}</p>
            {description && (
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">{description}</p>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
          <div className="flex items-center">
            {metadata?.uploadedBy?.name && <span>Uploaded by {metadata.uploadedBy.name}</span>}
          </div>
          <div className="flex items-center gap-2">
            {fileSize && <span>{fileSize}</span>}
            {formattedDate && <span>{formattedDate}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
