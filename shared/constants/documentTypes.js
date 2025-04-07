/**
 * Shared Document Type Constants
 * 
 * This file defines document types used by both frontend and backend
 * to ensure consistency across the application.
 */

const DOCUMENT_TYPES = {
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
};

// Document type display names for UI
const DOCUMENT_TYPE_LABELS = {
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
const DOCUMENT_TYPE_OPTIONS = Object.entries(DOCUMENT_TYPES).map(([key, value]) => ({
  value,
  label: DOCUMENT_TYPE_LABELS[value]
}));

// For frontend
export {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPE_OPTIONS
};

// For backend PHP - will be filtered out during JS transpiling
// @php
// $DOCUMENT_TYPES = [
//   'OTHER' => 'other',
//   'CAPTAIN_DETAILS' => 'captain_details',
//   'PASSPORT' => 'passport',
//   'PASSPORTS' => 'passports',
//   'ITINERARY' => 'itinerary',
//   'CREW_PROFILE' => 'crew_profile',
//   'SAMPLE_MENU' => 'sample_menu',
//   'PREFERENCE_SHEET' => 'preference_sheet',
//   'PAYMENT_OVERVIEW' => 'payment_overview',
//   'BROCHURE' => 'brochure',
//   'PROPOSAL' => 'proposal',
//   'CONTRACT' => 'contract',
//   'INVOICE' => 'invoice',
//   'RECEIPT' => 'receipt'
// ];
// @endphp 