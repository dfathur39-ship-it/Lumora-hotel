import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { Room } from '@/data/hotels';
import RoomBookingSearch, { type RoomSearchState } from './RoomBookingSearch';
import RoomFilters, { type BedFilter } from './RoomFilters';
import RoomCard from './RoomCard';
import RoomDetailModal from './RoomDetailModal';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

function defaultDates(): { checkIn: string; checkOut: string } {
  const in3 = new Date();
  in3.setDate(in3.getDate() + 3);
  const in4 = new Date();
  in4.setDate(in4.getDate() + 4);
  return { checkIn: in3.toISOString().slice(0, 10), checkOut: in4.toISOString().slice(0, 10) };
}

export default function RoomSelection({ hotelId }: { hotelId: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [search, setSearch] = useState<RoomSearchState>(() => ({
    ...defaultDates(),
    travellers: { adults: 2, children: 0, rooms: 1 },
  }));
  const [bedFilter, setBedFilter] = useState<BedFilter>('all');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailRoom, setDetailRoom] = useState<Room | null>(null);

  const dateError =
    search.checkIn && search.checkOut && search.checkOut <= search.checkIn
      ? 'Check-out must be after check-in.'
      : null;

  // Debounced fetch: re-runs whenever dates or traveller counts change, so
  // the room list — and its availability/pricing — always reflects what
  // the guest actually asked for.
  useEffect(() => {
    if (dateError) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const timeout = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          hotelId,
          checkIn: search.checkIn,
          checkOut: search.checkOut,
          adults: String(search.travellers.adults),
          children: String(search.travellers.children),
          rooms: String(search.travellers.rooms),
        });
        const res = await fetch(`${API_URL}/rooms?${params}`, { signal: controller.signal });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? 'Failed to load rooms');
        }
        const data: Room[] = await res.json();
        setRooms(data);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load rooms');
        setRooms([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [hotelId, search.checkIn, search.checkOut, search.travellers.adults, search.travellers.children, search.travellers.rooms, dateError]);

  const bedCounts = useMemo(() => {
    const set = new Set<number>();
    rooms.forEach((r) => set.add(r.bedCount ?? 1));
    return Array.from(set).sort((a, b) => a - b);
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    if (bedFilter === 'all') return rooms;
    return rooms.filter((r) => (r.bedCount ?? 1) === bedFilter);
  }, [rooms, bedFilter]);

  useEffect(() => {
    // Reset a stale filter if the admin no longer offers that bed count.
    if (bedFilter !== 'all' && !bedCounts.includes(bedFilter)) setBedFilter('all');
  }, [bedCounts, bedFilter]);

  const nights = useMemo(() => {
    if (!search.checkIn || !search.checkOut) return 0;
    const diff = (new Date(search.checkOut).getTime() - new Date(search.checkIn).getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(1, Math.round(diff));
  }, [search.checkIn, search.checkOut]);

  function goToBooking(room: Room) {
    const params = new URLSearchParams({
      checkIn: search.checkIn,
      checkOut: search.checkOut,
      adults: String(search.travellers.adults),
      children: String(search.travellers.children),
      rooms: String(search.travellers.rooms),
    });
    const destination = `/book/${hotelId}/${room.id}?${params}`;
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(destination)}`);
      return;
    }
    navigate(destination);
  }

  return (
    <section className="flex flex-col gap-5">
      <h2 id="choose-your-room" className="font-display text-2xl text-foreground sm:text-3xl">Choose your room</h2>

      <RoomBookingSearch value={search} onChange={setSearch} error={dateError} />

      {rooms.length > 0 && bedCounts.length > 1 && (
        <RoomFilters bedCounts={bedCounts} active={bedFilter} onChange={setBedFilter} />
      )}

      {!loading && !error && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredRooms.length} of {rooms.length} room{rooms.length === 1 ? '' : 's'}
        </p>
      )}

      {dateError && <p className="text-sm text-red-400">{dateError}</p>}

      {loading && !dateError && <RoomGridSkeleton />}

      {!loading && error && (
        <div className="rounded-2xl border border-white/10 bg-card p-8 text-center">
          <p className="text-foreground">Couldn't load rooms right now.</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </div>
      )}

      {!loading && !error && !dateError && filteredRooms.length === 0 && (
        <EmptyState
          hasAnyRooms={rooms.length > 0}
          onChangeDates={() => setSearch({ ...search, ...defaultDates() })}
          onClearFilters={() => setBedFilter('all')}
        />
      )}

      {!loading && !error && filteredRooms.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              nights={nights}
              roomsRequested={search.travellers.rooms}
              onSelect={goToBooking}
              onViewDetails={setDetailRoom}
            />
          ))}
        </div>
      )}

      {detailRoom && (
        <RoomDetailModal
          room={detailRoom}
          nights={nights}
          roomsRequested={search.travellers.rooms}
          onClose={() => setDetailRoom(null)}
          onReserve={(room) => {
            setDetailRoom(null);
            goToBooking(room);
          }}
        />
      )}
    </section>
  );
}

function RoomGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-white/10 bg-card">
          <div className="aspect-[4/3] w-full animate-pulse bg-white/5" />
          <div className="space-y-3 p-5">
            <div className="h-4 w-2/3 animate-pulse rounded bg-white/5" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-white/5" />
            <div className="h-3 w-full animate-pulse rounded bg-white/5" />
            <div className="h-8 w-1/3 animate-pulse rounded bg-white/5" />
          </div>
        </div>
      ))}
      <p className="col-span-full text-center text-sm text-muted-foreground">Checking available rooms...</p>
    </div>
  );
}

function EmptyState({
  hasAnyRooms,
  onChangeDates,
  onClearFilters,
}: {
  hasAnyRooms: boolean;
  onChangeDates: () => void;
  onClearFilters: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-card p-10 text-center">
      <h3 className="font-display text-xl text-foreground">No rooms available</h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        We couldn't find any rooms for your selected dates.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onChangeDates}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Change dates
        </button>
        {hasAnyRooms && (
          <button
            type="button"
            onClick={onClearFilters}
            className="rounded-xl border border-white/15 px-5 py-2.5 text-sm text-foreground"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
