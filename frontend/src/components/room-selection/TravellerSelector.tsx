import { useEffect, useRef, useState } from 'react';
import { Users, Minus, Plus, ChevronDown } from 'lucide-react';

export type TravellerCounts = {
  adults: number;
  children: number;
  rooms: number;
};

export default function TravellerSelector({
  value,
  onChange,
}: {
  value: TravellerCounts;
  onChange: (v: TravellerCounts) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function step(key: keyof TravellerCounts, delta: number, min: number, max: number) {
    const next = Math.min(max, Math.max(min, value[key] + delta));
    onChange({ ...value, [key]: next });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-left text-sm text-foreground outline-none transition-colors hover:border-primary/40 focus:border-primary/50"
      >
        <span className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          {value.adults + value.children} traveller{value.adults + value.children !== 1 ? 's' : ''}, {value.rooms} room
          {value.rooms !== 1 ? 's' : ''}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-72 max-w-[90vw] rounded-2xl border border-white/10 bg-card p-4 shadow-2xl">
          <Row
            label="Adults"
            sublabel="Ages 13+"
            value={value.adults}
            onDecrement={() => step('adults', -1, 1, 16)}
            onIncrement={() => step('adults', 1, 1, 16)}
          />
          <Row
            label="Children"
            sublabel="Ages 0–12"
            value={value.children}
            onDecrement={() => step('children', -1, 0, 10)}
            onIncrement={() => step('children', 1, 0, 10)}
          />
          <Row
            label="Rooms"
            value={value.rooms}
            onDecrement={() => step('rooms', -1, 1, 8)}
            onIncrement={() => step('rooms', 1, 1, 8)}
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-2 w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  sublabel,
  value,
  onDecrement,
  onIncrement,
}: {
  label: string;
  sublabel?: string;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div>
        <p className="text-sm text-foreground">{label}</p>
        {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDecrement}
          aria-label={`Decrease ${label}`}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-foreground/70 transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-30"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-4 text-center text-sm text-foreground">{value}</span>
        <button
          type="button"
          onClick={onIncrement}
          aria-label={`Increase ${label}`}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-foreground/70 transition-colors hover:border-primary/50 hover:text-primary"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
