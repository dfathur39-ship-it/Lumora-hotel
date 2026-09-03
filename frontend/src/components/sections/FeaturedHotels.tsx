import { motion } from 'framer-motion';
import { hotels } from '@/data/hotels';
import Hotel3DCard from '@/components/Hotel3DCard';

export default function FeaturedHotels() {
  const featured = hotels.slice(0, 6);

  return (
    <section className="container py-24" aria-labelledby="featured-heading">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end"
      >
        <div>
          <span className="text-xs uppercase tracking-[0.3em] text-primary">Curated stays</span>
          <h2 id="featured-heading" className="mt-3 font-display text-3xl text-foreground md:text-4xl">
            Featured Hotels
          </h2>
        </div>
        <p className="max-w-sm text-sm text-muted-foreground">
          A hand-picked selection of properties, each chosen for what makes it impossible to forget.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((hotel, i) => (
          <motion.div
            key={hotel.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
          >
            <Hotel3DCard hotel={hotel} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
