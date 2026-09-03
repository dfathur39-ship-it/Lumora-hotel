import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Mail, Check } from 'lucide-react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  }

  return (
    <section className="container py-24" aria-labelledby="newsletter-heading">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="glass-panel mx-auto flex max-w-2xl flex-col items-center rounded-2xl p-10 text-center"
      >
        <Mail className="h-6 w-6 text-primary" />
        <h2 id="newsletter-heading" className="mt-4 font-display text-2xl text-foreground">
          Private access to new properties
        </h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Join our list for early booking windows and member-only rates.
        </p>

        {submitted ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-primary">
            <Check className="h-4 w-4" /> You're on the list.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex w-full max-w-sm gap-2">
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-full border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50"
            />
            <button
              type="submit"
              className="whitespace-nowrap rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              Subscribe
            </button>
          </form>
        )}
      </motion.div>
    </section>
  );
}
