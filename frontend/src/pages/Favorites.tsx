import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { hotels } from '@/data/hotels';
import { useFavorites } from '@/context/FavoritesContext';
import Hotel3DCard from '@/components/Hotel3DCard';

export default function Favorites() {
  const { favorites } = useFavorites();
  const favoritedHotels = hotels.filter((h) => favorites.includes(h.id));

  return (
    <div className="container pt-32 pb-24">
      <h1 className="font-display text-3xl text-foreground">Your Favorites</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {favoritedHotels.length} saved propert{favoritedHotels.length === 1 ? 'y' : 'ies'}
      </p>

      {favoritedHotels.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-2xl border border-white/10 bg-card p-16 text-center">
          <Heart className="h-8 w-8 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">You haven't saved any hotels yet.</p>
          <Link to="/hotels" className="mt-4 text-sm text-primary">
            Browse hotels
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favoritedHotels.map((hotel) => (
            <Hotel3DCard key={hotel.id} hotel={hotel} />
          ))}
        </div>
      )}
    </div>
  );
}
