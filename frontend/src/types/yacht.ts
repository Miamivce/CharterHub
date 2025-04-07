/**
 * Interface for yacht data
 */
export interface Yacht {
  id: string;
  name: string;
  description?: string;
  capacity: number;
  length?: string;
  crew?: number;
  basePrice?: number;
  featuredImage?: string;
  isFromApi: boolean;
  specifications: {
    length: string | null;
    capacity: number | null;
    crew: number | null;
    builder?: string;
    year?: number;
    beam?: string;
    cabins?: number;
    cruisingSpeed?: number;
    maxSpeed?: number;
  };
  pricing: {
    basePrice: number;
    currency: string;
    perWeekHighSeason?: number;
    perWeekLowSeason?: number;
  };
  features?: {
    onboardAmenities?: string[];
    waterToys?: string[];
    entertainment?: string[];
  };
  images?: string[];
} 