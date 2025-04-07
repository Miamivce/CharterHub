import { CharterhubDestination } from '@/services/wordpressService';

/**
 * Service for handling destination-related API calls from our local database
 */
export const localDestinationsService = {
  /**
   * Get all destinations from the local database
   */
  async getDestinations(): Promise<CharterhubDestination[]> {
    try {
      console.log('Fetching destinations from local database API');
      const response = await fetch('/api/destinations.php', {
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

      // Transform the data to match the CharterhubDestination format
      return data.data.map((item: any) => ({
        id: String(item.id),
        name: item.name,
        description: item.description || '',
        featuredImage: item.featured_image || '',
        additionalImages: [],
        content: item.description || '',
        acf: {
          description: item.description || '',
          highlights: Array.isArray(item.highlights) ? item.highlights : [],
          best_time: item.best_time_to_visit || '',
          climate: item.climate || '',
          image_gallery: []
        }
      }));
    } catch (error) {
      console.error('Error fetching destinations from local API:', error);
      throw error;
    }
  },

  /**
   * Get a specific destination by ID from the local database
   */
  async getDestinationById(id: string): Promise<CharterhubDestination | null> {
    try {
      console.log(`Fetching destination ID ${id} from local database API`);
      const response = await fetch(`/api/destinations.php?id=${id}`, {
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
        description: item.description || '',
        featuredImage: item.featured_image || '',
        additionalImages: [],
        content: item.description || '',
        acf: {
          description: item.description || '',
          highlights: Array.isArray(item.highlights) ? item.highlights : [],
          best_time: item.best_time_to_visit || '',
          climate: item.climate || '',
          image_gallery: []
        }
      };
    } catch (error) {
      console.error(`Error fetching destination with ID ${id} from local API:`, error);
      return null;
    }
  }
}; 