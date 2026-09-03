export type BedFilter = 'all' | number;

export default function RoomFilters({
  bedCounts,
  active,
  onChange,
}: {
  /** Distinct bed counts present in the currently loaded rooms, ascending. */
  bedCounts: number[];
  active: BedFilter;
  onChange: (v: BedFilter) => void;
}) {
  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      <Pill label="All rooms" isActive={active === 'all'} onClick={() => onChange('all')} />
      {bedCounts.map((count) => (
        <Pill
          key={count}
          label={`${count} bed${count > 1 ? 's' : ''}`}
          isActive={active === count}
          onClick={() => onChange(count)}
        />
      ))}
    </div>
  );
}

function Pill({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
        isActive
          ? 'border-primary bg-primary/15 text-primary'
          : 'border-white/10 text-muted-foreground hover:border-white/25 hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
}
