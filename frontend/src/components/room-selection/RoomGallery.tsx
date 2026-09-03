import { useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import type { RoomImage } from '@/data/hotels';

export default function RoomGallery({
  images,
  fallbackImage,
  alt,
  badge,
  rounded = 'top',
}: {
  images: RoomImage[];
  fallbackImage?: string;
  alt: string;
  badge?: string;
  rounded?: 'top' | 'all';
}) {
  const gallery = images.length > 0 ? images : fallbackImage ? [{ imageUrl: fallbackImage, isPrimary: true }] : [];
  const [index, setIndex] = useState(0);

  const roundedClass = rounded === 'top' ? 'rounded-t-2xl' : 'rounded-2xl';

  if (gallery.length === 0) {
    return (
      <div className={`flex aspect-[4/3] w-full items-center justify-center bg-white/5 ${roundedClass}`}>
        <ImageOff className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={`group relative aspect-[4/3] w-full overflow-hidden ${roundedClass}`}>
      <div
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {gallery.map((img, i) => (
          <img
            key={img.id ?? i}
            src={img.imageUrl}
            alt={`${alt} photo ${i + 1}`}
            loading="lazy"
            className="h-full w-full shrink-0 object-cover"
          />
        ))}
      </div>

      {badge && (
        <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow">
          {badge}
        </span>
      )}

      {gallery.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((i) => (i - 1 + gallery.length) % gallery.length);
            }}
            className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 focus:opacity-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((i) => (i + 1) % gallery.length);
            }}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 focus:opacity-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white backdrop-blur">
            {index + 1}/{gallery.length}
          </span>
        </>
      )}
    </div>
  );
}
