import { useEffect, useState } from 'react';

// Types for yacht and destination data
export interface Yacht {
  id: number;
  title: {
    rendered: string;
  };
  acf: {
    yacht_details: {
      length: string;
      cabins: number;
      guests: number;
      crew: number;
      year_built: string;
      builder: string;
    };
    yacht_rates: {
      low_season_weekly: string;
      high_season_weekly: string;
      currency: string;
    };
    yacht_location: string;
    yacht_featured_image: {
      url: string;
    };
  };
}

export interface Destination {
  id: number;
  title: {
    rendered: string;
  };
  acf: {
    location_image: {
      url: string;
    };
    location_description: string;
  };
}

// Sample yacht data
const sampleYachts: Yacht[] = [
  {
    id: 1,
    title: {
      rendered: 'Ocean Paradise'
    },
    acf: {
      yacht_details: {
        length: '55m',
        cabins: 6,
        guests: 12,
        crew: 10,
        year_built: '2013',
        builder: 'Benetti'
      },
      yacht_rates: {
        low_season_weekly: '255000',
        high_season_weekly: '295000',
        currency: 'EUR'
      },
      yacht_location: 'Mediterranean',
      yacht_featured_image: {
        url: 'https://placehold.co/600x400/png?text=Ocean+Paradise'
      }
    }
  },
  {
    id: 2,
    title: {
      rendered: 'Lady S'
    },
    acf: {
      yacht_details: {
        length: '93m',
        cabins: 7,
        guests: 12,
        crew: 33,
        year_built: '2019',
        builder: 'Feadship'
      },
      yacht_rates: {
        low_season_weekly: '1250000',
        high_season_weekly: '1450000',
        currency: 'EUR'
      },
      yacht_location: 'Caribbean',
      yacht_featured_image: {
        url: 'https://placehold.co/600x400/png?text=Lady+S'
      }
    }
  },
  {
    id: 3,
    title: {
      rendered: 'Flying Fox'
    },
    acf: {
      yacht_details: {
        length: '136m',
        cabins: 11,
        guests: 22,
        crew: 54,
        year_built: '2019',
        builder: 'Lürssen'
      },
      yacht_rates: {
        low_season_weekly: '3500000',
        high_season_weekly: '4000000',
        currency: 'EUR'
      },
      yacht_location: 'Global',
      yacht_featured_image: {
        url: 'https://placehold.co/600x400/png?text=Flying+Fox'
      }
    }
  }
];

// Sample destination data
const sampleDestinations: Destination[] = [
  {
    id: 1,
    title: {
      rendered: 'French Riviera'
    },
    acf: {
      location_image: {
        url: 'https://placehold.co/600x400/png?text=French+Riviera'
      },
      location_description: 'Explore the glamorous coastline of the French Riviera, home to luxurious ports like Monaco, Cannes, and Saint-Tropez.'
    }
  },
  {
    id: 2,
    title: {
      rendered: 'Caribbean Islands'
    },
    acf: {
      location_image: {
        url: 'https://placehold.co/600x400/png?text=Caribbean+Islands'
      },
      location_description: 'Discover the pristine beaches and crystal-clear waters of the Caribbean, perfect for island hopping and water activities.'
    }
  },
  {
    id: 3,
    title: {
      rendered: 'Greek Islands'
    },
    acf: {
      location_image: {
        url: 'https://placehold.co/600x400/png?text=Greek+Islands'
      },
      location_description: 'Navigate through the historic Greek islands, offering a perfect blend of ancient culture and stunning Mediterranean scenery.'
    }
  }
];

// Hooks to use the data
export const useYachts = () => {
  const [loading, setLoading] = useState(true);
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Simulate API delay
    const timer = setTimeout(() => {
      try {
        setYachts(sampleYachts);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return { yachts, loading, error };
};

export const useDestinations = () => {
  const [loading, setLoading] = useState(true);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Simulate API delay
    const timer = setTimeout(() => {
      try {
        setDestinations(sampleDestinations);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return { destinations, loading, error };
};

// Functions to get individual items
export const getYacht = (id: number): Yacht | undefined => {
  return sampleYachts.find(yacht => yacht.id === id);
};

export const getDestination = (id: number): Destination | undefined => {
  return sampleDestinations.find(destination => destination.id === id);
};

// Export sample data for direct use
export { sampleYachts, sampleDestinations }; 