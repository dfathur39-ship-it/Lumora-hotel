import { useEffect, useState } from 'react';
import { X, BedDouble, Maximize, Users, DoorOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Room } from '@/data/hotels';
import { formatCurrency } from '@/lib/utils';
import { resolveFacilityIcon } from './facilityIcons';

export default function RoomDetailModal({
  room,
  nights,
  roomsRequested,
  onClose,
  onReserve,
}: {
  room: Room;
  nights: number;
  roomsRequested: number;
  onClose: () => void;
  onReserve: (room: Room) => void;
}) {
  const [index, setIndex] = useState(0);
  const gallery = room.images && room.images.length > 0 ? room.images : [{ imageUrl: room.image, isPrimary: true }];

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const available = room.availableUnits ?? room.totalUnits ?? 1;
  const soldOut = available <= 0 || available < roomsRequested;
  const discount = room.discountPercent ?? 0;
  const nightly = room.pricePerNight ?? (discount > 0 ? Math.round(room.price * (1 - discount / 100)) : room.price);
  const total = room.totalPrice ?? nightly * Math.max(nights, 1) * roomsRequested;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm animate-in fade-in sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full flex-col overflow-y-auto rounded-t-3xl bg-card sm:max-w-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden">
          <div
            className="flex h-full transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {gallery.map((img, i) => (
              <img key={img.id ?? i} src={img.imageUrl} alt="" className="h-full w-full shrink-0 object-cover" />
            ))}
          </div>
          {gallery.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setIndex((i) => (i - 1 + gallery.length) % gallery.length)}
                className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIndex((i) => (i + 1) % gallery.length)}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                {index + 1}/{gallery.length}
              </span>
            </>
          )}
        </div>

        <div className="flex flex-col gap-4 p-6">
          <div>
            <h2 className="font-display text-2xl text-foreground">{room.name}</h2>
            {room.reviewCount ? (
              <div className="mt-1 flex items-center gap-2 text-sm">
                <span className="rounded bg-primary/15 px-1.5 py-0.5 font-medium text-primary">
                  {room.rating?.toFixed(1)}
                </span>
                <span className="text-muted-foreground">{room.reviewCount} reviews</span>
              </div>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">No reviews yet</p>
            )}
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">{room.description}</p>

          <div className="flex flex-wrap gap-x-5 gap-y-2 border-y border-white/10 py-4 text-sm text-muted-foreground">
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

          {room.facilities && room.facilities.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-foreground">Facilities</h3>
              <div className="grid grid-cols-2 gap-2.5 text-sm text-muted-foreground sm:grid-cols-3">
                {room.facilities.map((f) => {
                  const Icon = resolveFacilityIcon(f.name, f.icon);
                  return (
                    <span key={f.id ?? f.name} className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary/80" /> {f.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 rounded-2xl bg-black/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {discount > 0 && (
                <span className="mr-2 text-xs text-muted-foreground line-through">{formatCurrency(room.price)}</span>
              )}
              <span className="font-display text-xl text-foreground">{formatCurrency(nightly)}</span>
              <span className="text-sm text-muted-foreground"> / night</span>
              {nights > 0 && (
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(total)} total · {nights} night{nights > 1 ? 's' : ''}
                </p>
              )}
            </div>
            <button
              type="button"
              disabled={soldOut}
              onClick={() => onReserve(room)}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {soldOut ? 'Not available' : 'Reserve'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
