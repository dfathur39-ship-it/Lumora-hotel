export type RoomImage = {
  id?: string;
  imageUrl: string;
  isPrimary: boolean;
  displayOrder?: number;
};

export type RoomFacility = {
  id?: string;
  name: string;
  icon: string;
};

export type RoomStatus = 'available' | 'hidden' | 'maintenance';

export type Room = {
  id: string;
  hotelId: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  size: number; // sqm
  image: string;
  amenities: string[];
  // "Choose your room" fields — all admin-controlled, all optional here
  // so older/partial objects (e.g. the legacy hotel-wizard inline room
  // form) still satisfy this type.
  bedType?: string;
  bedCount?: number;
  bedroomCount?: number;
  maxAdults?: number;
  maxChildren?: number;
  discountPercent?: number;
  badge?: string;
  status?: RoomStatus;
  breakfast?: boolean;
  parking?: boolean;
  wifi?: boolean;
  totalUnits?: number;
  images?: RoomImage[];
  facilities?: RoomFacility[];
  updatedAt?: string;
  deletedAt?: string | null;
  // Only present when the API call included check-in/check-out dates.
  availableUnits?: number;
  nights?: number;
  pricePerNight?: number;
  totalPrice?: number;
  rating?: number;
  reviewCount?: number;
};

export type Hotel = {
  id: string;
  name: string;
  location: string;
  description: string;
  image: string;
  gallery: string[];
  rating: number;
  priceFrom: number;
  amenities: string[];
};

export const hotels: Hotel[] = [
  {
    id: 'azure-palm',
    name: 'The Azure Palm',
    location: 'Uluwatu, Bali',
    description:
      'Cliffside villas overlooking the Indian Ocean, framed by infinity pools and palm-shaded terraces.',
    image: 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
    ],
    rating: 4.9,
    priceFrom: 480,
    amenities: ['Infinity Pool', 'Spa', 'Private Beach Access', 'Ocean View'],
  },
  {
    id: 'grand-aurelia',
    name: 'The Grand Aurelia',
    location: 'Paris, France',
    description:
      'A Belle Époque landmark reimagined with contemporary elegance, steps from the Champs-Élysées.',
    image: 'https://images.unsplash.com/photo-1541971875076-8f970d573be6?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1541971875076-8f970d573be6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1549294413-26f195200c16?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
    ],
    rating: 4.8,
    priceFrom: 620,
    amenities: ['Michelin Dining', 'Rooftop Bar', 'Concierge', 'Valet Parking'],
  },
  {
    id: 'montis-retreat',
    name: 'Montis Retreat',
    location: 'Zermatt, Swiss Alps',
    description:
      'A timber-and-stone alpine sanctuary with Matterhorn views and a cedar-lined spa.',
    image: 'https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1548704806-38a3a2050c04?auto=format&fit=crop&w=1200&q=80',
    ],
    rating: 4.9,
    priceFrom: 710,
    amenities: ['Ski-in/Ski-out', 'Alpine Spa', 'Fireplace Suites', 'Mountain View'],
  },
  {
    id: 'ocean-pearl-resort',
    name: 'Ocean Pearl Resort',
    location: 'North Malé Atoll, Maldives',
    description:
      'Overwater bungalows above turquoise lagoons, with glass floor panels open to coral gardens below.',
    image: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1573052905904-34ad8c27f0cc?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80',
    ],
    rating: 5.0,
    priceFrom: 980,
    amenities: ['Overwater Villa', 'Private Lagoon', 'Snorkeling', 'Butler Service'],
  },
  {
    id: 'noir-tokyo',
    name: 'Noir Tokyo',
    location: 'Shinjuku, Tokyo',
    description:
      'A minimalist high-rise retreat above the neon skyline, where washi-paper light meets skyline views.',
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1554797589-7241bb691973?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?auto=format&fit=crop&w=1200&q=80',
    ],
    rating: 4.7,
    priceFrom: 390,
    amenities: ['Skyline View', 'Onsen Bath', 'Omakase Dining', 'City Center'],
  },
  {
    id: 'casa-verde',
    name: 'Casa Verde',
    location: 'Tulum, Mexico',
    description:
      'A jungle-wrapped eco-retreat with open-air suites, cenote access, and barefoot luxury.',
    image: 'https://images.unsplash.com/photo-1518733057094-95b53143d2a7?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1518733057094-95b53143d2a7?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544124499-58912cbddaad?auto=format&fit=crop&w=1200&q=80',
    ],
    rating: 4.6,
    priceFrom: 320,
    amenities: ['Cenote Access', 'Yoga Deck', 'Eco Design', 'Jungle View'],
  },
  {
    id: 'aurora-heights',
    name: 'Aurora Heights',
    location: 'Reykjavík, Iceland',
    description:
      'Glass-domed suites for aurora watching, warmed by geothermal pools and volcanic-stone interiors.',
    image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1518623001395-125242310d0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?auto=format&fit=crop&w=1200&q=80',
    ],
    rating: 4.8,
    priceFrom: 540,
    amenities: ['Geothermal Pool', 'Glass-Roof Suite', 'Northern Lights View', 'Sauna'],
  },
  {
    id: 'velvet-sands',
    name: 'Velvet Sands',
    location: 'Positano, Amalfi Coast',
    description:
      'Pastel-terraced suites cascading toward the sea, with a private cove and lemon-grove dining.',
    image: 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80',
    ],
    rating: 4.9,
    priceFrom: 590,
    amenities: ['Private Cove', 'Terrace Dining', 'Sea View', 'Boat Excursions'],
  },
  {
    id: 'the-meridian',
    name: 'The Meridian',
    location: 'Manhattan, New York',
    description:
      'A Art Deco tower reborn as a residence for the discerning traveler, overlooking Central Park.',
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=80',
    ],
    rating: 4.7,
    priceFrom: 450,
    amenities: ['Park View', 'Rooftop Lounge', 'Business Center', 'Fitness Studio'],
  },
  {
    id: 'elysian-cove',
    name: 'Elysian Cove',
    location: 'Santorini, Greece',
    description:
      'Whitewashed cave suites carved into the caldera, with private plunge pools facing the sunset.',
    image: 'https://images.unsplash.com/photo-1570213489059-0aac6626cade?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1570213489059-0aac6626cade?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
    ],
    rating: 5.0,
    priceFrom: 670,
    amenities: ['Caldera View', 'Private Plunge Pool', 'Sunset Terrace', 'Wine Cellar'],
  },
];

export const rooms: Room[] = hotels.flatMap((hotel) => [
  {
    id: `${hotel.id}-deluxe`,
    hotelId: hotel.id,
    name: 'Deluxe Room',
    description: 'A refined retreat with curated furnishings and a private balcony.',
    price: hotel.priceFrom,
    capacity: 2,
    size: 32,
    image: hotel.gallery[0],
    amenities: ['King Bed', 'Free Wi-Fi', 'Minibar', 'Balcony'],
  },
  {
    id: `${hotel.id}-ocean-suite`,
    hotelId: hotel.id,
    name: 'Ocean View Suite',
    description: 'An expansive suite with panoramic views and a soaking tub.',
    price: Math.round(hotel.priceFrom * 1.5),
    capacity: 3,
    size: 52,
    image: hotel.gallery[1],
    amenities: ['King Bed', 'Soaking Tub', 'Lounge Area', 'Ocean View'],
  },
  {
    id: `${hotel.id}-presidential`,
    hotelId: hotel.id,
    name: 'Presidential Suite',
    description: 'The pinnacle of the property — a private terrace, dining room, and butler service.',
    price: Math.round(hotel.priceFrom * 2.4),
    capacity: 4,
    size: 90,
    image: hotel.gallery[2],
    amenities: ['Private Terrace', 'Butler Service', 'Dining Room', 'Panoramic View'],
  },
]);

export function getHotelById(id: string) {
  return hotels.find((h) => h.id === id);
}

export function getRoomsByHotelId(hotelId: string) {
  return rooms.filter((r) => r.hotelId === hotelId);
}
