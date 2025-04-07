import { v4 as uuidv4 } from 'uuid'
import { CharterhubYacht, CharterhubDestination } from '@/services/wordpressService'

// Sample yacht data
export const sampleYachts = [
  {
    id: 'yacht-001',
    name: 'Ocean Breeze',
    isFromApi: true,
    specifications: {
      length: '24m',
      capacity: 12,
      crew: 4,
      builder: 'Benetti',
      year: 2018,
      beam: '6.2m',
      cabins: 5,
      cruisingSpeed: 12,
      maxSpeed: 15,
    },
    pricing: {
      basePrice: 5000,
      currency: 'USD',
      seasonalPricing: {
        lowSeason: 35000,
        midSeason: 42000,
        highSeason: 49000,
      },
    },
    features: {
      amenities: ['Jacuzzi', 'WiFi', 'Air Conditioning', 'Stabilizers'],
      waterToys: ['Jet Ski', 'Paddleboards', 'Snorkeling Gear', 'Water Slide'],
      entertainment: ['Satellite TV', 'Sound System', 'Outdoor Cinema'],
    },
    featuredImage: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=800&q=80',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
      'https://images.unsplash.com/photo-1592437111271-239fa8397960?w=800&q=80',
    ],
    description:
      'Ocean Breeze is a luxurious 24m Benetti yacht with elegant styling and spacious deck areas. Accommodating up to 12 guests in 5 cabins, this yacht offers the perfect combination of performance and comfort for an unforgettable charter experience.',
  },
  {
    id: 'yacht-002',
    name: 'Sea Spirit',
    isFromApi: true,
    specifications: {
      length: '32m',
      capacity: 10,
      crew: 6,
      builder: 'Feadship',
      year: 2015,
      beam: '7.4m',
      cabins: 5,
      cruisingSpeed: 14,
      maxSpeed: 18,
    },
    pricing: {
      basePrice: 8000,
      currency: 'USD',
      seasonalPricing: {
        lowSeason: 56000,
        midSeason: 65000,
        highSeason: 75000,
      },
    },
    features: {
      amenities: ['Beach Club', 'Jacuzzi', 'WiFi', 'Air Conditioning', 'Stabilizers'],
      waterToys: [
        'Jet Skis (2)',
        'Seabobs (2)',
        'Paddleboards',
        'Kayaks',
        'Snorkeling Gear',
        'Fishing Equipment',
      ],
      entertainment: ['Satellite TV', 'Apple TV', 'Sound System', 'Movie Library'],
    },
    featuredImage: 'https://images.unsplash.com/photo-1540946485063-a23a339b98df?w=800&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?w=800&q=80',
      'https://images.unsplash.com/photo-1562281302-809409865a63?w=800&q=80',
      'https://images.unsplash.com/photo-1551273675-a86cb40cba2a?w=800&q=80',
    ],
    description:
      'Sea Spirit is a magnificent 32m Feadship yacht featuring impeccable craftsmanship and luxury. With 5 elegant cabins accommodating 10 guests, an expansive sun deck with jacuzzi, and a comprehensive range of water toys, this yacht offers the ultimate charter experience.',
  },
  {
    id: 'yacht-003',
    name: 'Wind Dancer',
    isFromApi: true,
    specifications: {
      length: '38m',
      capacity: 12,
      crew: 7,
      builder: 'Perini Navi',
      year: 2012,
      beam: '8.2m',
      cabins: 5,
      cruisingSpeed: 12,
      maxSpeed: 15,
    },
    pricing: {
      basePrice: 9500,
      currency: 'USD',
      seasonalPricing: {
        lowSeason: 66500,
        midSeason: 73000,
        highSeason: 85000,
      },
    },
    features: {
      amenities: ['Jacuzzi', 'WiFi', 'Air Conditioning', 'Library', 'Gym Equipment'],
      waterToys: ['Jet Ski', 'Wakeboards', 'Paddleboards', 'Snorkeling Gear', 'Inflatable Toys'],
      entertainment: ['Satellite TV', 'PlayStation 5', 'Sound System', 'Board Games'],
    },
    featuredImage: 'https://images.unsplash.com/photo-1560507308-5a6e219a6877?w=800&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1569775748841-bcbb0c888762?w=800&q=80',
      'https://images.unsplash.com/photo-1593351415075-3bac9f45c877?w=800&q=80',
      'https://images.unsplash.com/photo-1528154291023-a6525fabe5b4?w=800&q=80',
    ],
    description:
      'Wind Dancer is a stunning 38m Perini Navi sailing yacht combining classic sailing heritage with modern comfort. Featuring 5 luxurious cabins for 12 guests, this yacht offers a spacious interior, expansive deck areas, and a comprehensive range of water toys for an exhilarating charter experience.',
  },
  {
    id: 'yacht-004',
    name: 'Azure Dream',
    isFromApi: true,
    specifications: {
      length: '45m',
      capacity: 12,
      crew: 9,
      builder: 'Heesen',
      year: 2019,
      beam: '8.5m',
      cabins: 6,
      cruisingSpeed: 16,
      maxSpeed: 23,
    },
    pricing: {
      basePrice: 12000,
      currency: 'USD',
      seasonalPricing: {
        lowSeason: 84000,
        midSeason: 98000,
        highSeason: 112000,
      },
    },
    features: {
      amenities: [
        'Beach Club',
        'Jacuzzi',
        'Sauna',
        'WiFi',
        'Air Conditioning',
        'Stabilizers',
        'Gym',
      ],
      waterToys: [
        'Jet Skis (3)',
        'Seabobs (2)',
        'Water Slide',
        'Paddleboards',
        'Flyboard',
        'Snorkeling Gear',
      ],
      entertainment: [
        'Satellite TV',
        'Apple TV',
        'PlayStation 5',
        'Sound System',
        'Movie Library',
        'Karaoke',
      ],
    },
    featuredImage: 'https://images.unsplash.com/photo-1599582958204-afcc13d88b28?w=800&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1569263313475-d3be9b3ef6a2?w=800&q=80',
      'https://images.unsplash.com/photo-1561834703-7dedc9a58b9e?w=800&q=80',
      'https://images.unsplash.com/photo-1508084133331-25846e22dc5c?w=800&q=80',
    ],
    description:
      'Azure Dream is a spectacular 45m Heesen yacht offering the ultimate in luxury and performance. With 6 opulent cabins accommodating 12 guests, a beach club with sauna, a sun deck with jacuzzi, and an extensive array of water toys, this yacht promises an exceptional charter experience.',
  },
  {
    id: 'yacht-005',
    name: 'Royal Odyssey',
    isFromApi: true,
    specifications: {
      length: '55m',
      capacity: 12,
      crew: 12,
      builder: 'Lürssen',
      year: 2016,
      beam: '9.8m',
      cabins: 6,
      cruisingSpeed: 14,
      maxSpeed: 18,
    },
    pricing: {
      basePrice: 18000,
      currency: 'USD',
      seasonalPricing: {
        lowSeason: 126000,
        midSeason: 150000,
        highSeason: 168000,
      },
    },
    features: {
      amenities: [
        'Beach Club',
        'Swimming Pool',
        'Jacuzzi',
        'Helipad',
        'Elevator',
        'Spa',
        'Gym',
        'WiFi',
        'Stabilizers',
      ],
      waterToys: [
        'Tender',
        'Jet Skis (4)',
        'Seabobs (4)',
        'Water Slide',
        'Flyboard',
        'Paddleboards',
        'Inflatables',
        'Submarine',
      ],
      entertainment: [
        'Cinema Room',
        'Satellite TV',
        'PlayStation 5',
        'Sound System',
        'DJ Equipment',
        'Game Room',
      ],
    },
    featuredImage: 'https://images.unsplash.com/photo-1565006102572-212283ba62ab?w=800&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1560285822-fd626bf27020?w=800&q=80',
      'https://images.unsplash.com/photo-1584156226060-a7ecf14ece33?w=800&q=80',
      'https://images.unsplash.com/photo-1629964874552-3a590cad8898?w=800&q=80',
    ],
    description:
      'Royal Odyssey is an extraordinary 55m Lürssen superyacht representing the pinnacle of luxury yachting. With 6 lavish cabins for 12 guests, a swimming pool, cinema room, helipad, and submarine, this yacht offers unparalleled amenities and experiences for the most discerning charter clients.',
  },
]

// Sample destination data
export const sampleDestinations = [
  {
    id: 'destination-001',
    name: 'Mediterranean',
    featuredImage: 'https://images.unsplash.com/photo-1530538095376-a4936b35b5f0?w=800&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1515859005217-8a1f08870f59?w=800&q=80',
      'https://images.unsplash.com/photo-1533928298208-27ff66555d8d?w=800&q=80',
      'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&q=80',
    ],
    description:
      'Crystal clear waters and historic coastal cities make the Mediterranean a paradise for yacht enthusiasts.',
    regions: [
      'French Riviera',
      'Amalfi Coast',
      'Greek Islands',
      'Balearic Islands',
      'Croatian Coast',
    ],
    highlights: [
      'Explore the glamorous ports of St. Tropez and Monaco',
      'Visit the ancient ruins of Greece',
      'Discover hidden coves and beaches along the Amalfi Coast',
      'Experience the vibrant nightlife of Ibiza',
      'Sail through the stunning Croatian archipelago',
    ],
    bestTimeToVisit: 'May to October',
    climate:
      'Warm, sunny summers with mild winters. Peak season offers temperatures between 25-35°C (77-95°F).',
  },
  {
    id: 'destination-002',
    name: 'Caribbean',
    featuredImage: 'https://images.unsplash.com/photo-1584150721701-bbdc686b7681?w=800&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1580237072353-751a8a5b2561?w=800&q=80',
      'https://images.unsplash.com/photo-1500759285222-a95626b934cb?w=800&q=80',
      'https://images.unsplash.com/photo-1545579133-99bb5ab189bd?w=800&q=80',
    ],
    description:
      'A tropical paradise with white sandy beaches, turquoise waters, and a laid-back island atmosphere.',
    regions: ['Bahamas', 'British Virgin Islands', 'St. Barts', 'Antigua', 'Grenadines'],
    highlights: [
      'Swim with pigs in the Exumas, Bahamas',
      'Explore the famous baths of Virgin Gorda',
      'Experience the luxury and glamour of St. Barts',
      'Discover the 365 beaches of Antigua',
      'Snorkel in pristine coral reefs throughout the islands',
    ],
    bestTimeToVisit: 'December to April',
    climate:
      'Tropical climate with temperatures averaging 24-29°C (75-85°F) year-round. Hurricane season runs from June to November.',
  },
  {
    id: 'destination-003',
    name: 'Southeast Asia',
    featuredImage: 'https://images.unsplash.com/photo-1580935873772-b21876414faa?w=800&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80',
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&q=80',
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
    ],
    description:
      'Exotic landscapes, hidden coves, and rich cultural experiences await in Southeast Asia.',
    regions: ['Thailand', 'Indonesia', 'Malaysia', 'Philippines'],
    highlights: [
      'Cruise the dramatic limestone cliffs of Phang Nga Bay, Thailand',
      'Explore the thousands of islands in the Indonesian archipelago',
      'Discover world-class dive sites in Raja Ampat',
      'Experience traditional cultures and cuisines',
      'Visit untouched beaches and hidden lagoons',
    ],
    bestTimeToVisit: 'November to April',
    climate:
      'Tropical climate with high humidity. Dry season from November to April offers the best cruising conditions with temperatures ranging from 26-32°C (79-90°F).',
  },
  {
    id: 'destination-004',
    name: 'South Pacific',
    featuredImage: 'https://images.unsplash.com/photo-1501963255401-9b7bc892397e?w=800&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1573451441483-74d2fb7d5d2f?w=800&q=80',
      'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=800&q=80',
      'https://images.unsplash.com/photo-1589519160732-576f165b9aad?w=800&q=80',
    ],
    description:
      'Remote islands, pristine waters, and Polynesian culture create an unparalleled yacht charter experience.',
    regions: ['French Polynesia', 'Fiji', 'Tonga', 'Cook Islands'],
    highlights: [
      'Experience the legendary beauty of Bora Bora and Tahiti',
      'Discover traditional Polynesian culture',
      "Explore some of the world's most diverse marine ecosystems",
      'Visit remote islands where time stands still',
      'Enjoy world-class snorkeling and diving',
    ],
    bestTimeToVisit: 'May to October',
    climate:
      'Tropical climate with a dry season from May to October. Temperatures remain pleasant year-round, averaging 24-30°C (75-86°F).',
  },
  {
    id: 'destination-005',
    name: 'Scandinavia',
    featuredImage: 'https://images.unsplash.com/photo-1518635017778-87duad2cad34?w=800&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1601127611669-66296c0ab275?w=800&q=80',
      'https://images.unsplash.com/photo-1520769405411-3377cbdb5902?w=800&q=80',
      'https://images.unsplash.com/photo-1555893675-a631a0c7c2fb?w=800&q=80',
    ],
    description:
      'Dramatic fjords, archipelagos, and coastal villages offer a unique northern yachting adventure.',
    regions: ['Norwegian Fjords', 'Swedish Archipelago', 'Danish Coastline', 'Finnish Islands'],
    highlights: [
      'Cruise the majestic Norwegian fjords',
      'Experience the midnight sun during summer months',
      'Explore picturesque coastal villages',
      'Visit historic sites and Viking heritage',
      'Enjoy the pristine natural environments and wildlife',
    ],
    bestTimeToVisit: 'June to August',
    climate:
      'Short but pleasant summers with temperatures ranging from 15-25°C (59-77°F). Extended daylight hours with midnight sun in northern regions.',
  },
]

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Adapters to convert sample data to match WordPress data structure
const adaptYachtToCharterhub = (yacht: (typeof sampleYachts)[0]): CharterhubYacht => {
  return {
    id: yacht.id,
    name: yacht.name,
    isFromApi: yacht.isFromApi,
    description: yacht.description,
    featuredImage: yacht.featuredImage,
    additionalImages: yacht.additionalImages,
    specifications: yacht.specifications,
    pricing: yacht.pricing,
    features: yacht.features,
    acf: {
      yacht_specifications: {
        length: yacht.specifications.length,
        capacity: yacht.specifications.capacity,
        crew: yacht.specifications.crew,
        builder: yacht.specifications.builder || '',
        year: yacht.specifications.year || 0,
        beam: yacht.specifications.beam || '',
        cabins: yacht.specifications.cabins || 0,
      },
      yacht_pricing: {
        base_price: yacht.pricing.basePrice || 0,
        currency: yacht.pricing.currency || 'USD',
      },
    },
  } as CharterhubYacht
}

const adaptDestinationToCharterhub = (
  destination: (typeof sampleDestinations)[0]
): CharterhubDestination => {
  return {
    id: destination.id,
    name: destination.name,
    isFromApi: true,
    description: destination.description,
    featuredImage: destination.featuredImage,
    acf: {
      description: destination.description,
      highlights: destination.highlights,
      best_time: destination.bestTimeToVisit,
      climate: destination.climate,
      latitude: '0',
      longitude: '0',
      image_gallery: destination.additionalImages?.map((image: string) => ({ url: image })) || [],
      destination_detail__image_map: {
        lat: 25.7617,
        lng: -80.1918,
      },
    },
    content: destination.description,
  } as CharterhubDestination
}

// Sample data service for yachts and destinations
export const sampleDataService = {
  async getYachts() {
    await delay(800) // Simulate API delay
    return sampleYachts.map(adaptYachtToCharterhub)
  },

  async getYachtById(id: string) {
    await delay(500)
    const yacht = sampleYachts.find((yacht) => yacht.id === id)
    return yacht ? adaptYachtToCharterhub(yacht) : null
  },

  async getDestinations() {
    await delay(800)
    return sampleDestinations.map(adaptDestinationToCharterhub)
  },

  async getDestinationById(id: string) {
    await delay(500)
    const destination = sampleDestinations.find((destination) => destination.id === id)
    return destination ? adaptDestinationToCharterhub(destination) : null
  },
}
