import { useQuery } from '@tanstack/react-query';
import { CharterhubYacht, CharterhubDestination } from '@/services/wordpressService';
import { localYachtsService } from '@/services/local/localYachtsService';
import { localDestinationsService } from '@/services/local/localDestinationsService';

/**
 * Hook for fetching yacht data from local database
 */
export const useLocalYachts = () => {
  return useQuery<CharterhubYacht[], Error>({
    queryKey: ['local-yachts'],
    queryFn: async () => {
      try {
        return await localYachtsService.getYachts();
      } catch (error) {
        console.error('Error fetching yachts from local database:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};

/**
 * Hook for fetching a single yacht by ID from local database
 */
export const useLocalYacht = (id: string) => {
  return useQuery<CharterhubYacht | null, Error>({
    queryKey: ['local-yacht', id],
    queryFn: async () => {
      try {
        return await localYachtsService.getYachtById(id);
      } catch (error) {
        console.error(`Error fetching yacht ID ${id} from local database:`, error);
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};

/**
 * Hook for fetching destination data from local database
 */
export const useLocalDestinations = () => {
  return useQuery<CharterhubDestination[], Error>({
    queryKey: ['local-destinations'],
    queryFn: async () => {
      try {
        return await localDestinationsService.getDestinations();
      } catch (error) {
        console.error('Error fetching destinations from local database:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};

/**
 * Hook for fetching a single destination by ID from local database
 */
export const useLocalDestination = (id: string) => {
  return useQuery<CharterhubDestination | null, Error>({
    queryKey: ['local-destination', id],
    queryFn: async () => {
      try {
        return await localDestinationsService.getDestinationById(id);
      } catch (error) {
        console.error(`Error fetching destination ID ${id} from local database:`, error);
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}; 