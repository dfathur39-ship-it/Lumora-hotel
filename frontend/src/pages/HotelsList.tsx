import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import Hotel3DCard from '@/components/Hotel3DCard';
import { hotels as localHotels, type Hotel } from '@/data/hotels';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

async function fetchHotels(destination: string, guests: string): Promise<Hotel[]> {
  const params = new URLSearchParams();
  if (destination) params.set('destination', destination);
  if (guests) params.set('guests', guests);

  try {
    const res = await fetch(`${API_URL}/hotels?${params.toString()}`);
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch {
    // Backend not running locally yet — fall back to bundled data so the UI stays usable.
    const dest = destination.toLowerCase();
    return dest
      ? localHotels.filter((h) => h.location.toLowerCase().includes(dest))
      : localHotels;
  }
}

export default function HotelsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const destination = searchParams.get('destination') ?? '';
  const guests = searchParams.get('guests') ?? '';

  const { data: results, isLoading } = useQuery({
    queryKey: ['hotels', destination, guests],
    queryFn: () => fetchHotels(destination, guests),
  });

  const list = useMemo(() => results ?? [], [results]);

  return (
    <div className="container pt-32 pb-24">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-3xl text-foreground">
            {destination ? `Hotels in ${destination}` : 'All Hotels'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading ? 'Searching…' : `${list.length} propert${list.length === 1 ? 'y' : 'ies'} found`}
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <SlidersHorizontal className="h-4 w-4" />
          <span className="sr-only">Filter by destination</span>
          <input
            value={destination}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams);
              if (e.target.value) next.set('destination', e.target.value);
              else next.delete('destination');
              setSearchParams(next);
            }}
            placeholder="Filter by destination…"
            className="rounded-full border border-white/10 bg-card px-4 py-2 text-foreground outline-none focus:border-primary/50"
          />
        </label>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-96 animate-pulse rounded-2xl bg-card" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-card p-12 text-center text-muted-foreground">
          No properties match that destination yet. Try a broader search.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((hotel, i) => (
            <motion.div
              key={hotel.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.06 }}
            >
              <Hotel3DCard hotel={hotel} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
