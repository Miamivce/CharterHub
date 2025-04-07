/**
 * Interface for destination data
 */
export interface Destination {
  id: string;
  name: string;
  description: string;
  regions: string[];
  highlights: string[];
  bestTimeToVisit: string;
  climate: string;
  featuredImage: string;
  isFromApi: boolean;
} 