import { motion } from 'framer-motion';
import Hero3D from '@/components/Hero3D';
import BookingSearch from '@/components/BookingSearch';
import FeaturedHotels from '@/components/sections/FeaturedHotels';
import Destinations from '@/components/sections/Destinations';
import Experience3D from '@/components/sections/Experience3D';
import Experiences from '@/components/sections/Experiences';
import { Calendar } from '@/components/ui/calendar';
import Testimonials from '@/components/sections/Testimonials';
import Newsletter from '@/components/sections/Newsletter';
import SocialMediaIcons from '@/components/SocialMediaIcons';

export default function Home() {
  return (
    <>
      <section className="relative flex h-[92vh] min-h-[640px] w-full items-center justify-center overflow-hidden">
        <Hero3D />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-background" />

        <div className="container relative z-10 flex flex-col items-center text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-xs uppercase tracking-[0.4em] text-primary"
          >
            Lumora Hotels
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="mt-6 max-w-3xl font-display text-4xl leading-[1.1] text-foreground sm:text-5xl md:text-6xl"
          >
            Stay somewhere <span className="text-gradient-gold">extraordinary.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-6 max-w-xl text-muted-foreground"
          >
            A curated collection of the world's most quietly remarkable hotels — from cliffside Bali
            villas to overwater Maldivian retreats.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="absolute inset-x-0 bottom-0 z-10 px-4 pb-10"
        >
          <BookingSearch />
        </motion.div>
      </section>

      <FeaturedHotels />
      <Destinations />
      <Experience3D />
      <Experiences />

      <section className="container py-24" aria-labelledby="concierge-heading">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 id="concierge-heading" className="sr-only">
            Talk to a concierge
          </h2>
          <Calendar />
        </motion.div>
      </section>

      <Testimonials />
      <div className="container py-8">
        <SocialMediaIcons />
      </div>
      <Newsletter />
    </>
  );
}
