import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, MapPin, Heart, Check, ChevronLeft } from 'lucide-react';
import type { Hotel } from '@/data/hotels';
import { useFavorites } from '@/context/FavoritesContext';
import { formatCurrency } from '@/lib/utils';
import HotelReviews from '@/components/HotelReviews';
import RoomSelection from '@/components/room-selection/RoomSelection';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export default function HotelDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [activeImage, setActiveImage] = useState(0);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    fetch(`${API_URL}/hotels/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then((data: Hotel) => {
        if (!cancelled) setHotel(data);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="container pt-40 pb-24">
        <div className="h-72 w-full animate-pulse rounded-2xl bg-white/5" />
      </div>
    );
  }

  if (notFound || !hotel) {
    return (
      <div className="container pt-40 pb-24 text-center">
        <p className="text-muted-foreground">Hotel not found.</p>
        <Link to="/hotels" className="mt-4 inline-block text-primary">
          Back to all hotels
        </Link>
      </div>
    );
  }

  const favorited = isFavorite(hotel.id);

  return (
    <div className="pb-24 pt-24">
      <div className="container">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 mt-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>

        {/* Gallery */}
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4 md:grid-rows-2">
          <div className="relative col-span-1 row-span-2 aspect-[4/3] overflow-hidden rounded-2xl md:col-span-2 md:aspect-auto">
            <img
              src={hotel.gallery[activeImage]}
              alt={`${hotel.name} view ${activeImage + 1}`}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              aria-pressed={favorited}
              aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
              onClick={() => toggleFavorite(hotel.id)}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-md"
            >
              <Heart className={favorited ? 'h-5 w-5 fill-primary text-primary' : 'h-5 w-5 text-white'} />
            </button>
          </div>
          {hotel.gallery.map((img, i) => (
            <button
              key={img}
              onClick={() => setActiveImage(i)}
              className="relative hidden aspect-video overflow-hidden rounded-xl md:block"
            >
              <img src={img} alt={`${hotel.name} thumbnail ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>

        {/* Info */}
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> {hotel.location}
            </div>
            <h1 className="mt-2 font-display text-3xl text-foreground md:text-4xl">{hotel.name}</h1>
            <div className="mt-3 flex items-center gap-2">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="text-sm text-foreground">{hotel.rating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">rating</span>
            </div>
            <p className="mt-6 leading-relaxed text-muted-foreground">{hotel.description}</p>

            <h2 className="mt-10 font-display text-xl text-foreground">Amenities</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {hotel.amenities.map((a) => (
                <div key={a} className="flex items-center gap-2 text-sm text-foreground/80">
                  <Check className="h-4 w-4 text-primary" /> {a}
                </div>
              ))}
            </div>

            <div className="mt-10">
              <RoomSelection hotelId={hotel.id} />
            </div>

            <HotelReviews hotelId={hotel.id} />
          </div>

          {/* Sticky booking CTA */}
          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-panel h-fit rounded-2xl p-6 lg:sticky lg:top-28"
          >
            <p className="text-xs text-muted-foreground">Starting from</p>
            <p className="font-display text-3xl text-gradient-gold">
              {formatCurrency(hotel.priceFrom)}
              <span className="text-sm text-muted-foreground"> /night</span>
            </p>
            <a
              href="#choose-your-room"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('choose-your-room')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="mt-6 block w-full rounded-xl bg-primary py-3 text-center text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.01]"
            >
              Check Availability
            </a>
            <p className="mt-3 text-center text-xs text-muted-foreground">No payment charged until you confirm.</p>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
