import axios from 'axios';
import { 
  Yacht, 
  Destination, 
  useYachts as useLocalYachts, 
  useDestinations as useLocalDestinations,
  getYacht as getLocalYacht,
  getDestination as getLocalDestination
} from './localDataService';

// Configuration
const USE_WP_API = import.meta.env.VITE_USE_WP_API === 'true';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://charterhub-api.onrender.com';
const WP_API_URL = import.meta.env.VITE_WP_API_URL || '';

// Log configuration
console.log('Data Service Configuration:');
console.log(`Using WordPress API: ${USE_WP_API}`);
console.log(`API Base URL: ${API_BASE_URL}`);
console.log(`WordPress API URL: ${WP_API_URL || 'Not configured'}`);

// API hooks for WordPress content
const useApiYachts = () => {
  const { yachts: localYachts, loading: localLoading, error: localError } = useLocalYachts();
  
  // If WordPress API is disabled, use local data
  if (!USE_WP_API || !WP_API_URL) {
    console.log('Using local yacht data instead of WordPress API');
    return { yachts: localYachts, loading: localLoading, error: localError };
  }

  // This would be the actual API implementation if WP_API was enabled
  // Since it's disabled for now, this code won't execute
  // But keeping it here for future use
  /*
  const [loading, setLoading] = useState(true);
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    axios.get(`${WP_API_URL}/wp/v2/yacht`)
      .then(response => {
        setYachts(response.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);

  return { yachts, loading, error };
  */

  // Fallback to local data if WordPress API is enabled but URL is missing
  return { yachts: localYachts, loading: localLoading, error: localError };
};

const useApiDestinations = () => {
  const { destinations: localDestinations, loading: localLoading, error: localError } = useLocalDestinations();
  
  // If WordPress API is disabled, use local data
  if (!USE_WP_API || !WP_API_URL) {
    console.log('Using local destination data instead of WordPress API');
    return { destinations: localDestinations, loading: localLoading, error: localError };
  }

  // This would be the actual API implementation if WP_API was enabled
  // Since it's disabled for now, this code won't execute
  // But keeping it here for future use
  /*
  const [loading, setLoading] = useState(true);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    axios.get(`${WP_API_URL}/wp/v2/location`)
      .then(response => {
        setDestinations(response.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);

  return { destinations, loading, error };
  */

  // Fallback to local data if WordPress API is enabled but URL is missing
  return { destinations: localDestinations, loading: localLoading, error: localError };
};

// Helper functions for getting individual items
const getApiYacht = async (id: number): Promise<Yacht | undefined> => {
  if (!USE_WP_API || !WP_API_URL) {
    console.log(`Using local data for yacht ${id}`);
    return getLocalYacht(id);
  }

  try {
    const response = await axios.get(`${WP_API_URL}/wp/v2/yacht/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching yacht ${id}:`, error);
    return getLocalYacht(id); // Fallback to local data
  }
};

const getApiDestination = async (id: number): Promise<Destination | undefined> => {
  if (!USE_WP_API || !WP_API_URL) {
    console.log(`Using local data for destination ${id}`);
    return getLocalDestination(id);
  }

  try {
    const response = await axios.get(`${WP_API_URL}/wp/v2/location/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching destination ${id}:`, error);
    return getLocalDestination(id); // Fallback to local data
  }
};

// Export the hooks and functions
export const useYachts = useApiYachts;
export const useDestinations = useApiDestinations;
export const getYacht = getApiYacht;
export const getDestination = getApiDestination;

// Export types
export type { Yacht, Destination }; 