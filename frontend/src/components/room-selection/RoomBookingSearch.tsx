import { CalendarDays } from 'lucide-react';
import TravellerSelector, { type TravellerCounts } from './TravellerSelector';

export type RoomSearchState = {
  checkIn: string;
  checkOut: string;
  travellers: TravellerCounts;
};

function formatShort(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

export default function RoomBookingSearch({
  value,
  onChange,
  error,
}: {
  value: RoomSearchState;
  onChange: (v: RoomSearchState) => void;
  error?: string | null;
}) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="glass-panel flex flex-col gap-3 rounded-2xl p-4 md:flex-row md:items-stretch md:gap-2">
      <DateField
        label="Start date"
        value={value.checkIn}
        display={formatShort(value.checkIn)}
        min={today}
        onChange={(v) => {
          const next = { ...value, checkIn: v };
          if (value.checkOut && v >= value.checkOut) {
            const d = new Date(`${v}T00:00:00`);
            d.setDate(d.getDate() + 1);
            next.checkOut = d.toISOString().slice(0, 10);
          }
          onChange(next);
        }}
      />
      <DateField
        label="End date"
        value={value.checkOut}
        display={formatShort(value.checkOut)}
        min={value.checkIn || today}
        onChange={(v) => onChange({ ...value, checkOut: v })}
      />
      <div className="flex-1 md:min-w-[220px]">
        <span className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
          Travellers
        </span>
        <TravellerSelector value={value.travellers} onChange={(travellers) => onChange({ ...value, travellers })} />
      </div>
      {error && <p className="self-center text-xs text-red-400 md:hidden">{error}</p>}
      {error && <p className="hidden self-center text-xs text-red-400 md:block md:basis-full">{error}</p>}
    </div>
  );
}

function DateField({
  label,
  value,
  display,
  min,
  onChange,
}: {
  label: string;
  value: string;
  display: string;
  min: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-1 flex-col gap-1 rounded-xl px-1 py-1 md:border-r md:border-white/10 md:px-4 md:py-2">
      <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        <CalendarDays className="h-3.5 w-3.5" /> {label}
      </span>
      <span className="relative">
        <input
          type="date"
          value={value}
          min={min}
          onChange={(e) => onChange(e.target.value)}
          className="w-full cursor-pointer bg-transparent text-sm text-foreground outline-none [color-scheme:dark]"
        />
        {display && (
          <span className="pointer-events-none absolute inset-y-0 left-0 hidden items-center bg-card text-sm text-foreground sm:flex">
            {display}
          </span>
        )}
      </span>
    </label>
  );
}
