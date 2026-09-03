import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CalendarDays, Users, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BookingSearch() {
  const navigate = useNavigate();
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set('destination', destination);
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    params.set('guests', String(guests));
    navigate(`/hotels?${params.toString()}`);
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      onSubmit={handleSubmit}
      className="glass-panel relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-3 rounded-2xl p-4 shadow-2xl md:flex-row md:items-end md:gap-2 md:p-3"
      aria-label="Search for hotels"
    >
      <Field label="Destination" icon={<MapPin className="h-4 w-4" />}>
        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Where to?"
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </Field>

      <Field label="Check-in" icon={<CalendarDays className="h-4 w-4" />}>
        <input
          type="date"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          className="w-full bg-transparent text-sm text-foreground outline-none [color-scheme:dark]"
        />
      </Field>

      <Field label="Check-out" icon={<CalendarDays className="h-4 w-4" />}>
        <input
          type="date"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          className="w-full bg-transparent text-sm text-foreground outline-none [color-scheme:dark]"
        />
      </Field>

      <Field label="Guests" icon={<Users className="h-4 w-4" />}>
        <input
          type="number"
          min={1}
          max={12}
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className="w-full bg-transparent text-sm text-foreground outline-none"
        />
      </Field>

      <button
        type="submit"
        className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98] md:h-full"
      >
        <Search className="h-4 w-4" />
        Search Hotels
      </button>
    </motion.form>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-1 flex-col gap-1 rounded-xl px-4 py-2 md:border-r md:border-white/10">
      <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}
