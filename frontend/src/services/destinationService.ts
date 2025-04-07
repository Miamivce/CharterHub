import { Destination } from '@/types/destination';

// Delay for development purposes only
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Get the API URL from environment variables with fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Service for handling destination-related API calls
 */
export const destinationService = {
  /**
   * Get all destinations
   */
  async getDestinations(): Promise<Destination[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/destinations.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch destinations: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch destinations');
      }

      return data.data.map((item: any) => ({
        id: String(item.id),
        name: item.name,
        description: item.description,
        regions: Array.isArray(item.regions) ? item.regions : [],
        highlights: Array.isArray(item.highlights) ? item.highlights : [],
        bestTimeToVisit: item.best_time_to_visit,
        climate: item.climate,
        featuredImage: item.featured_image,
        isFromApi: false
      }));
    } catch (error) {
      console.error('Error fetching destinations:', error);
      
      // Return empty array on error
      return [];
    }
  },

  /**
   * Get a specific destination by ID
   */
  async getDestinationById(id: string): Promise<Destination | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/destinations.php?id=${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch destination: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch destination');
      }

      const item = data.data;
      
      return {
        id: String(item.id),
        name: item.name,
        description: item.description,
        regions: Array.isArray(item.regions) ? item.regions : [],
        highlights: Array.isArray(item.highlights) ? item.highlights : [],
        bestTimeToVisit: item.best_time_to_visit,
        climate: item.climate,
        featuredImage: item.featured_image,
        isFromApi: false
      };
    } catch (error) {
      console.error(`Error fetching destination with ID ${id}:`, error);
      return null;
    }
  }
}; 