import { BedDouble, Maximize, Users, DoorOpen } from 'lucide-react';
import type { Room } from '@/data/hotels';
import { formatCurrency } from '@/lib/utils';
import RoomGallery from './RoomGallery';
import { resolveFacilityIcon } from './facilityIcons';

export default function RoomCard({
  room,
  nights,
  roomsRequested,
  onSelect,
  onViewDetails,
}: {
  room: Room;
  nights: number;
  roomsRequested: number;
  onSelect: (room: Room) => void;
  onViewDetails: (room: Room) => void;
}) {
  const available = room.availableUnits ?? room.totalUnits ?? 1;
  const soldOut = available <= 0;
  const notEnoughUnits = !soldOut && available < roomsRequested;

  const basePrice = room.price;
  const discount = room.discountPercent ?? 0;
  const nightly = room.pricePerNight ?? (discount > 0 ? Math.round(basePrice * (1 - discount / 100)) : basePrice);
  const total = room.totalPrice ?? nightly * Math.max(nights, 1) * roomsRequested;

  const facilities = room.facilities ?? [];
  const legacyAmenities = facilities.length === 0 ? room.amenities.slice(0, 6) : [];

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-card transition-shadow hover:shadow-xl hover:shadow-black/30">
      <RoomGallery images={room.images ?? []} fallbackImage={room.image} alt={room.name} badge={room.badge} />

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <button
            type="button"
            onClick={() => onViewDetails(room)}
            className="text-left font-display text-lg text-foreground transition-colors hover:text-primary"
          >
            {room.name}
          </button>

          {room.reviewCount ? (
            <div className="mt-1 flex items-center gap-2 text-sm">
              <span className="rounded bg-primary/15 px-1.5 py-0.5 font-medium text-primary">
                {room.rating?.toFixed(1)}
              </span>
              <span className="text-muted-foreground">
                {ratingLabel(room.rating ?? 0)} · {room.reviewCount} review{room.reviewCount === 1 ? '' : 's'}
              </span>
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">No reviews yet</p>
          )}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Maximize className="h-4 w-4 text-primary" /> {room.size} sq m
          </span>
          <span className="flex items-center gap-1.5">
            <DoorOpen className="h-4 w-4 text-primary" /> {room.bedroomCount ?? 1} bedroom
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-primary" /> Sleeps {room.capacity}
          </span>
          <span className="flex items-center gap-1.5">
            <BedDouble className="h-4 w-4 text-primary" />
            {room.bedCount && room.bedCount > 1 ? `${room.bedCount} ${room.bedType ?? 'Beds'}` : room.bedType ?? 'Bed'}
          </span>
        </div>

        {(facilities.length > 0 || legacyAmenities.length > 0) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-white/5 pt-3 text-xs text-muted-foreground">
            {facilities.map((f) => {
              const Icon = resolveFacilityIcon(f.name, f.icon);
              return (
                <span key={f.id ?? f.name} className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-primary/80" /> {f.name}
                </span>
              );
            })}
            {legacyAmenities.map((a) => {
              const Icon = resolveFacilityIcon(a);
              return (
                <span key={a} className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-primary/80" /> {a}
                </span>
              );
            })}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-white/5 pt-4">
          <div>
            {soldOut ? (
              <p className="font-display text-lg text-destructive">Sold out</p>
            ) : notEnoughUnits ? (
              <p className="text-sm font-medium text-amber-400">Not available for selected dates</p>
            ) : (
              <>
                {discount > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground line-through">{formatCurrency(basePrice)}</span>
                    <span className="rounded bg-destructive/20 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
                      {discount}% OFF
                    </span>
                  </div>
                )}
                <p className="font-display text-xl text-foreground">
                  {formatCurrency(nightly)} <span className="text-sm font-normal text-muted-foreground">/ night</span>
                </p>
                {nights > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(total)} total · {nights} night{nights > 1 ? 's' : ''}
                  </p>
                )}
              </>
            )}
          </div>

          <button
            type="button"
            disabled={soldOut || notEnoughUnits}
            onClick={() => onSelect(room)}
            className="shrink-0 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Select Room
          </button>
        </div>
      </div>
    </div>
  );
}

function ratingLabel(rating: number) {
  if (rating >= 9.5) return 'Exceptional';
  if (rating >= 9) return 'Superb';
  if (rating >= 8) return 'Excellent';
  if (rating >= 7) return 'Very good';
  if (rating >= 6) return 'Good';
  return 'Fair';
}
