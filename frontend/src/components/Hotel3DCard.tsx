import { useState, useRef, type MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, Heart, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Hotel } from '@/data/hotels';
import { useFavorites } from '@/context/FavoritesContext';
import { cn, formatCurrency } from '@/lib/utils';

const MAX_TILT = 8; // degrees — kept subtle per spec

export default function Hotel3DCard({ hotel }: { hotel: Hotel }) {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const favorited = isFavorite(hotel.id);
  const rooms = [
    { id: `${hotel.id}-deluxe`, price: hotel.priceFrom },
    { id: `${hotel.id}-ocean-suite`, price: Math.round(hotel.priceFrom * 1.5) },
    { id: `${hotel.id}-presidential`, price: Math.round(hotel.priceFrom * 2.4) }
  ];

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -MAX_TILT, y: px * MAX_TILT });
  }

  function handleMouseLeave() {
    setTilt({ x: 0, y: 0 });
    setIsHovering(false);
  }

  function handleCheckIn(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    navigate(`/book/${hotel.id}/${rooms[0].id}`);
  }

  return (
    <div style={{ perspective: 1000 }}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={handleMouseLeave}
        onClick={() => navigate(`/hotels/${hotel.id}`)}
        animate={{ rotateX: tilt.x, rotateY: tilt.y, scale: isHovering ? 1.02 : 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        style={{ transformStyle: 'preserve-3d' }}
        role="button"
        tabIndex={0}
        aria-label={`View ${hotel.name} in ${hotel.location}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter') navigate(`/hotels/${hotel.id}`);
        }}
        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-card shadow-lg"
      >
        <div className="relative h-56 w-full overflow-hidden">
          <img
            src={hotel.image}
            alt={`${hotel.name} — ${hotel.location}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          <button
            type="button"
            aria-label={favorited ? `Remove ${hotel.name} from favorites` : `Add ${hotel.name} to favorites`}
            aria-pressed={favorited}
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(hotel.id);
            }}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-md transition-colors hover:bg-black/70"
          >
            <Heart className={cn('h-4 w-4', favorited ? 'fill-primary text-primary' : 'text-white')} />
          </button>

          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-xs backdrop-blur-md">
            <Star className="h-3.5 w-3.5 fill-primary text-primary" />
            <span className="font-medium text-foreground">{hotel.rating.toFixed(1)}</span>
          </div>
        </div>

        <div className="p-5" style={{ transform: 'translateZ(20px)' }}>
          <h3 className="font-display text-lg leading-tight text-foreground">{hotel.name}</h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {hotel.location}
          </p>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <span className="text-xs text-muted-foreground">From</span>
              <p className="font-display text-xl text-gradient-gold">
                {formatCurrency(hotel.priceFrom)}
                <span className="text-sm text-muted-foreground"> /night</span>
              </p>
            </div>
            <button
              onClick={handleCheckIn}
              className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Check className="h-3 w-3" />
              Check-in
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
