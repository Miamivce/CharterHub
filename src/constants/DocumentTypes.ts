/**
 * Document Types Constants
 * 
 * TypeScript version of document type constants used across the frontend.
 * This must be kept in sync with the PHP version in backend/constants/DocumentTypes.php
 * and the JS version in shared/constants/documentTypes.js
 */

export const DOCUMENT_TYPES = {
  OTHER: 'other',
  CAPTAIN_DETAILS: 'captain_details',
  PASSPORT: 'passport',
  PASSPORTS: 'passports',
  ITINERARY: 'itinerary',
  CREW_PROFILE: 'crew_profile',
  SAMPLE_MENU: 'sample_menu',
  PREFERENCE_SHEET: 'preference_sheet',
  PAYMENT_OVERVIEW: 'payment_overview',
  BROCHURE: 'brochure',
  PROPOSAL: 'proposal',
  CONTRACT: 'contract',
  INVOICE: 'invoice',
  RECEIPT: 'receipt'
} as const;

// Document type display names for UI
export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  [DOCUMENT_TYPES.OTHER]: 'Other',
  [DOCUMENT_TYPES.CAPTAIN_DETAILS]: 'Captain\'s Details',
  [DOCUMENT_TYPES.PASSPORT]: 'Passport',
  [DOCUMENT_TYPES.PASSPORTS]: 'Passports',
  [DOCUMENT_TYPES.ITINERARY]: 'Itinerary',
  [DOCUMENT_TYPES.CREW_PROFILE]: 'Crew Profile',
  [DOCUMENT_TYPES.SAMPLE_MENU]: 'Sample Menu',
  [DOCUMENT_TYPES.PREFERENCE_SHEET]: 'Preference Sheet',
  [DOCUMENT_TYPES.PAYMENT_OVERVIEW]: 'Payment Overview',
  [DOCUMENT_TYPES.BROCHURE]: 'Brochure',
  [DOCUMENT_TYPES.PROPOSAL]: 'Proposal',
  [DOCUMENT_TYPES.CONTRACT]: 'Contract',
  [DOCUMENT_TYPES.INVOICE]: 'Invoice',
  [DOCUMENT_TYPES.RECEIPT]: 'Receipt'
};

// For use in dropdown menus in forms
export type DocumentTypeOption = {
  value: string;
  label: string;
};

export const DOCUMENT_TYPE_OPTIONS: DocumentTypeOption[] = Object.entries(DOCUMENT_TYPES).map(([key, value]) => ({
  value,
  label: DOCUMENT_TYPE_LABELS[value]
}));

// Type for document type values
export type DocumentType = typeof DOCUMENT_TYPES[keyof typeof DOCUMENT_TYPES];

/**
 * Checks if a string is a valid document type
 * @param type String to check
 * @returns True if the string is a valid document type
 */
export function isValidDocumentType(type: string): type is DocumentType {
  return Object.values(DOCUMENT_TYPES).includes(type as DocumentType);
}

/**
 * Get the display label for a document type
 * @param type Document type
 * @returns Display label for the document type
 */
export function getDocumentTypeLabel(type: string): string {
  return DOCUMENT_TYPE_LABELS[type] || 'Unknown';
} 