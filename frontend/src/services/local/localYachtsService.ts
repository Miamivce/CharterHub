import { CharterhubYacht } from '@/services/wordpressService';

/**
 * Service for handling yacht-related API calls from our local database
 */
export const localYachtsService = {
  /**
   * Get all yachts from the local database
   */
  async getYachts(): Promise<CharterhubYacht[]> {
    try {
      console.log('Fetching yachts from local database API');
      const response = await fetch('/api/yachts.php', {
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

      // Transform the data to match the CharterhubYacht format
      return data.data.map((item: any) => ({
        id: String(item.id),
        name: item.name,
        description: item.description || '',
        specifications: {
          length: item.length || '',
          capacity: parseInt(item.capacity) || 0,
          crew: parseInt(item.crew) || 0,
          builder: 'Custom', // Default value
          year: new Date().getFullYear(), // Default to current year
          beam: '20 ft', // Default value
          cabins: 4, // Default value
          cruisingSpeed: 20, // Default value 
          maxSpeed: 25 // Default value
        },
        pricing: {
          basePrice: parseFloat(item.base_price) || 0,
          currency: 'USD'
        },
        featuredImage: item.featured_image || '',
        additionalImages: [],
        toys: [],
        tenders: [],
        charterTypes: [],
        destinations: [],
        features: {
          amenities: ['WiFi', 'Air Conditioning', 'Jacuzzi'],
          waterToys: ['Jet Ski', 'Paddleboard', 'Snorkeling Gear']
        },
        metadata: {
          charterTypeNames: [],
          destinationNames: [],
          link: '',
          modified: item.updated_at || new Date().toISOString()
        }
      }));
    } catch (error) {
      console.error('Error fetching yachts from local API:', error);
      throw error;
    }
  },

  /**
   * Get a specific yacht by ID from the local database
   */
  async getYachtById(id: string): Promise<CharterhubYacht | null> {
    try {
      console.log(`Fetching yacht ID ${id} from local database API`);
      const response = await fetch(`/api/yachts.php?id=${id}`, {
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
        description: item.description || '',
        specifications: {
          length: item.length || '',
          capacity: parseInt(item.capacity) || 0,
          crew: parseInt(item.crew) || 0,
          builder: 'Custom', // Default value
          year: new Date().getFullYear(), // Default to current year
          beam: '20 ft', // Default value
          cabins: 4, // Default value
          cruisingSpeed: 20, // Default value 
          maxSpeed: 25 // Default value
        },
        pricing: {
          basePrice: parseFloat(item.base_price) || 0,
          currency: 'USD'
        },
        featuredImage: item.featured_image || '',
        additionalImages: [],
        toys: [],
        tenders: [],
        charterTypes: [],
        destinations: [],
        features: {
          amenities: ['WiFi', 'Air Conditioning', 'Jacuzzi'],
          waterToys: ['Jet Ski', 'Paddleboard', 'Snorkeling Gear']
        },
        metadata: {
          charterTypeNames: [],
          destinationNames: [],
          link: '',
          modified: item.updated_at || new Date().toISOString()
        }
      };
    } catch (error) {
      console.error(`Error fetching yacht with ID ${id} from local API:`, error);
      return null;
    }
  }
}; 