import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Star, MessageSquareText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/utils';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

type Review = {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

async function fetchReviews(hotelId: string): Promise<Review[]> {
  const res = await fetch(`${API_URL}/hotels/${hotelId}/reviews`);
  if (!res.ok) throw new Error('Failed to load reviews');
  return res.json();
}

export default function HotelReviews({ hotelId }: { hotelId: string }) {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviews', hotelId],
    queryFn: () => fetchReviews(hotelId),
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/hotels/${hotelId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, comment }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to submit review');
      }
      setComment('');
      setRating(5);
      queryClient.invalidateQueries({ queryKey: ['reviews', hotelId] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="mt-10 font-display text-xl text-foreground">
        Reviews {reviews.length > 0 && <span className="text-muted-foreground">({reviews.length})</span>}
      </h2>

      {user ? (
        <form onSubmit={handleSubmit} className="mt-4 rounded-xl border border-white/10 bg-card p-4">
          <p className="text-sm text-muted-foreground">Your rating</p>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
                className="p-0.5"
              >
                <Star
                  className={n <= rating ? 'h-5 w-5 fill-primary text-primary' : 'h-5 w-5 text-muted-foreground'}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share how your stay went…"
            rows={3}
            required
            maxLength={2000}
            className="mt-3 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50"
          />
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-3 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {submitting ? 'Posting…' : 'Post Review'}
          </button>
        </form>
      ) : (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-card p-4 text-sm text-muted-foreground">
          <MessageSquareText className="h-4 w-4" />
          <Link to="/login" className="text-primary">
            Sign in
          </Link>
          to leave a review.
        </div>
      )}

      <div className="mt-4 flex flex-col gap-4">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-card" />
          ))
        ) : reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet — be the first to share your stay.</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-white/10 bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{r.userName}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3.5 w-3.5 fill-primary text-primary" /> {r.rating.toFixed(1)}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
              <p className="mt-2 text-xs text-muted-foreground/60">{formatDate(r.createdAt)}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
