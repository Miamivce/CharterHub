import { Yacht } from '@/types/yacht';

// Delay for development purposes only
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Get the API URL from environment variables with fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Service for handling yacht-related API calls
 */
export const yachtService = {
  /**
   * Get all yachts
   */
  async getYachts(): Promise<Yacht[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/yachts.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch yachts: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch yachts');
      }

      return data.data.map((item: any) => ({
        id: String(item.id),
        name: item.name,
        description: item.description,
        capacity: item.capacity,
        length: item.length,
        crew: item.crew,
        basePrice: item.base_price,
        featuredImage: item.featured_image,
        isFromApi: false,
        specifications: {
          length: item.length || null,
          capacity: item.capacity || null,
          crew: item.crew || null
        },
        pricing: {
          basePrice: parseFloat(item.base_price) || 0,
          currency: 'USD'
        }
      }));
    } catch (error) {
      console.error('Error fetching yachts:', error);
      
      // Return empty array on error
      return [];
    }
  },

  /**
   * Get a specific yacht by ID
   */
  async getYachtById(id: string): Promise<Yacht | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/yachts.php?id=${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch yacht: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch yacht');
      }

      const item = data.data;
      
      return {
        id: String(item.id),
        name: item.name,
        description: item.description,
        capacity: item.capacity,
        length: item.length,
        crew: item.crew,
        basePrice: item.base_price,
        featuredImage: item.featured_image,
        isFromApi: false,
        specifications: {
          length: item.length || null,
          capacity: item.capacity || null,
          crew: item.crew || null
        },
        pricing: {
          basePrice: parseFloat(item.base_price) || 0,
          currency: 'USD'
        }
      };
    } catch (error) {
      console.error(`Error fetching yacht with ID ${id}:`, error);
      return null;
    }
  }
}; 