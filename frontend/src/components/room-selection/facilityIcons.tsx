import {
  Wifi,
  Utensils,
  ParkingCircle,
  Snowflake,
  Tv,
  Bath,
  Bed,
  ConciergeBell,
  Waves,
  Building2,
  Refrigerator,
  Wind,
  Coffee,
  Users,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

// Maps an admin-supplied icon key (or, failing that, a guess from the
// facility name) to a lucide icon. Anything unrecognised still renders —
// with a generic sparkle — so admins can add brand-new facility types
// from the dashboard without needing a frontend deploy.
const ICONS: Record<string, LucideIcon> = {
  wifi: Wifi,
  breakfast: Utensils,
  food: Utensils,
  parking: ParkingCircle,
  ac: Snowflake,
  'air-conditioning': Snowflake,
  tv: Tv,
  bathroom: Bath,
  bath: Bath,
  bed: Bed,
  bedroom: Bed,
  service: ConciergeBell,
  'room-service': ConciergeBell,
  pool: Waves,
  'swimming-pool': Waves,
  view: Building2,
  'city-view': Building2,
  fridge: Refrigerator,
  refrigerator: Refrigerator,
  balcony: Wind,
  coffee: Coffee,
  guests: Users,
};

export function resolveFacilityIcon(name: string, iconKey?: string): LucideIcon {
  const key = (iconKey || name).toLowerCase().trim().replace(/\s+/g, '-');
  return ICONS[key] ?? Sparkles;
}

export const COMMON_FACILITIES: { name: string; icon: string }[] = [
  { name: 'Free Wi-Fi', icon: 'wifi' },
  { name: 'Free Breakfast', icon: 'breakfast' },
  { name: 'Free Parking', icon: 'parking' },
  { name: 'Air Conditioning', icon: 'ac' },
  { name: 'TV', icon: 'tv' },
  { name: 'Private Bathroom', icon: 'bathroom' },
  { name: 'Room Service', icon: 'service' },
  { name: 'Swimming Pool', icon: 'pool' },
  { name: 'City View', icon: 'view' },
  { name: 'Refrigerator', icon: 'fridge' },
  { name: 'Balcony', icon: 'balcony' },
  { name: 'Work Desk', icon: 'coffee' },
];

export const BADGE_PRESETS = [
  'Frequently booked',
  'Upgrade your stay',
  'Popular',
  'Best value',
  'Recommended',
  'New',
  'Limited availability',
];

export const BED_TYPE_PRESETS = ['Single Bed', 'Twin Bed', 'Double Bed', 'Queen Bed', 'King Bed'];
