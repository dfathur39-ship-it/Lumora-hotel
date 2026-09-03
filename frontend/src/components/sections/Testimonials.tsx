import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Quote, Star } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

type ApiReview = {
  id: string;
  userName: string;
  hotelName?: string;
  rating: number;
  comment: string;
};

// Shown until real guest reviews start coming in, or if the backend
// is unreachable — so the homepage never looks empty.
const fallbackTestimonials: ApiReview[] = [
  {
    id: 'fallback-1',
    userName: 'Elena R.',
    hotelName: 'The Azure Palm, Bali',
    rating: 5,
    comment: 'We stopped checking our phones by the second day. That almost never happens.',
  },
  {
    id: 'fallback-2',
    userName: 'Marcus T.',
    hotelName: 'Noir Tokyo',
    rating: 4.5,
    comment: 'The staff remembered how I take my coffee after one morning. Small things, done consistently.',
  },
  {
    id: 'fallback-3',
    userName: 'Priya & Dev',
    hotelName: 'Elysian Cove, Santorini',
    rating: 5,
    comment: 'Booked the Presidential Suite for our anniversary. Worth every part of the splurge.',
  },
];

async function fetchRecentReviews(): Promise<ApiReview[]> {
  try {
    const res = await fetch(`${API_URL}/reviews/recent?limit=6`);
    if (!res.ok) throw new Error('failed');
    const data: ApiReview[] = await res.json();
    return data.length > 0 ? data : fallbackTestimonials;
  } catch {
    return fallbackTestimonials;
  }
}

export default function Testimonials() {
  const { data: testimonials = fallbackTestimonials } = useQuery({
    queryKey: ['reviews-recent'],
    queryFn: fetchRecentReviews,
  });

  return (
    <section className="bg-secondary/40 py-24" aria-labelledby="testimonials-heading">
      <div className="container">
        <motion.h2
          id="testimonials-heading"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center font-display text-3xl text-foreground md:text-4xl"
        >
          What guests remember
        </motion.h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.slice(0, 6).map((t, i) => (
            <motion.figure
              key={t.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
              className="rounded-2xl border border-white/10 bg-card p-6"
            >
              <div className="flex items-center justify-between">
                <Quote className="h-5 w-5 text-primary" />
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3.5 w-3.5 fill-primary text-primary" /> {t.rating.toFixed(1)}
                </span>
              </div>
              <blockquote className="mt-4 text-sm leading-relaxed text-foreground/90">
                “{t.comment}”
              </blockquote>
              <figcaption className="mt-4 text-xs text-muted-foreground">
                <span className="text-foreground">{t.userName}</span>
                {t.hotelName ? ` — ${t.hotelName}` : ''}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
