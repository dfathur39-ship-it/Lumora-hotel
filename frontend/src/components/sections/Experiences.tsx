import { motion } from 'framer-motion';
import { Waves, UtensilsCrossed, Sparkles, Mountain } from 'lucide-react';

const experiences = [
  { icon: Waves, title: 'Private Beach Access', desc: 'Uncrowded shores reserved for guests, sunrise to sunset.' },
  { icon: UtensilsCrossed, title: 'Chef-Led Dining', desc: 'Tasting menus built around what is caught, grown, or foraged that morning.' },
  { icon: Sparkles, title: 'Signature Spa Rituals', desc: 'Treatments drawn from local tradition, delivered with modern precision.' },
  { icon: Mountain, title: 'Guided Excursions', desc: 'From alpine ridgelines to coral reefs, led by people who call it home.' },
];

export default function Experiences() {
  return (
    <section className="container py-24" aria-labelledby="experiences-heading">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-12 text-center"
      >
        <span className="text-xs uppercase tracking-[0.3em] text-primary">Beyond the room</span>
        <h2 id="experiences-heading" className="mt-3 font-display text-3xl text-foreground md:text-4xl">
          Experiences
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {experiences.map((exp, i) => (
          <motion.div
            key={exp.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="rounded-2xl border border-white/10 bg-card p-6"
          >
            <exp.icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
            <h3 className="mt-4 font-display text-lg text-foreground">{exp.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{exp.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
