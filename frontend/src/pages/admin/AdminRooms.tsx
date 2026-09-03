import { useMemo, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit2, EyeOff, Eye, Wrench, GripVertical, Star, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, cn } from '@/lib/utils';
import type { Hotel, Room, RoomImage, RoomFacility, RoomStatus } from '@/data/hotels';
import ImageUploadField from '@/components/admin/ImageUploadField';
import { COMMON_FACILITIES, BADGE_PRESETS, BED_TYPE_PRESETS, resolveFacilityIcon } from '@/components/room-selection/facilityIcons';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

async function fetchRooms(token: string | null, filters: { hotelId: string; status: string; search: string }): Promise<Room[]> {
  const params = new URLSearchParams();
  if (filters.hotelId) params.set('hotelId', filters.hotelId);
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  const res = await fetch(`${API_URL}/admin/rooms?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load rooms');
  return res.json();
}

async function fetchHotels(): Promise<Hotel[]> {
  const res = await fetch(`${API_URL}/hotels`);
  if (!res.ok) throw new Error('Failed to load hotels');
  return res.json();
}

type FormState = {
  hotelId: string;
  name: string;
  description: string;
  price: string;
  discountPercent: string;
  capacity: string;
  maxAdults: string;
  maxChildren: string;
  size: string;
  bedType: string;
  bedCount: string;
  bedroomCount: string;
  totalUnits: string;
  badge: string;
  status: RoomStatus;
  breakfast: boolean;
  parking: boolean;
  wifi: boolean;
  amenities: string;
  images: RoomImage[];
  facilities: RoomFacility[];
};

const emptyForm: FormState = {
  hotelId: '',
  name: '',
  description: '',
  price: '',
  discountPercent: '0',
  capacity: '2',
  maxAdults: '2',
  maxChildren: '0',
  size: '',
  bedType: 'Queen Bed',
  bedCount: '1',
  bedroomCount: '1',
  totalUnits: '1',
  badge: '',
  status: 'available',
  breakfast: false,
  parking: false,
  wifi: false,
  amenities: '',
  images: [],
  facilities: [],
};

function roomToForm(room: Room): FormState {
  return {
    hotelId: room.hotelId,
    name: room.name,
    description: room.description,
    price: String(room.price),
    discountPercent: String(room.discountPercent ?? 0),
    capacity: String(room.capacity),
    maxAdults: String(room.maxAdults ?? room.capacity),
    maxChildren: String(room.maxChildren ?? 0),
    size: String(room.size),
    bedType: room.bedType || 'Queen Bed',
    bedCount: String(room.bedCount ?? 1),
    bedroomCount: String(room.bedroomCount ?? 1),
    totalUnits: String(room.totalUnits ?? 1),
    badge: room.badge ?? '',
    status: room.status ?? 'available',
    breakfast: !!room.breakfast,
    parking: !!room.parking,
    wifi: !!room.wifi,
    amenities: room.amenities.join(', '),
    images: room.images ?? (room.image ? [{ imageUrl: room.image, isPrimary: true }] : []),
    facilities: room.facilities ?? [],
  };
}

export default function AdminRooms() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filterHotel, setFilterHotel] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  const { data: hotels = [] } = useQuery({ queryKey: ['admin-hotels-for-rooms'], queryFn: fetchHotels });

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['admin-rooms', filterHotel, filterStatus, search],
    queryFn: () => fetchRooms(token, { hotelId: filterHotel, status: filterStatus, search }),
  });

  const hotelName = useMemo(() => {
    const map = new Map(hotels.map((h) => [h.id, h.name]));
    return (id: string) => map.get(id) ?? id;
  }, [hotels]);

  function buildPayload() {
    const images = form.images.filter((i) => i.imageUrl);
    return {
      hotelId: form.hotelId,
      name: form.name,
      description: form.description,
      price: Number(form.price) || 0,
      discountPercent: Number(form.discountPercent) || 0,
      capacity: Number(form.capacity) || 1,
      maxAdults: Number(form.maxAdults) || Number(form.capacity) || 1,
      maxChildren: Number(form.maxChildren) || 0,
      size: Number(form.size) || 0,
      bedType: form.bedType,
      bedCount: Number(form.bedCount) || 1,
      bedroomCount: Number(form.bedroomCount) || 1,
      totalUnits: Number(form.totalUnits) || 1,
      badge: form.badge,
      status: form.status,
      breakfast: form.breakfast,
      parking: form.parking,
      wifi: form.wifi,
      image: images[0]?.imageUrl ?? '',
      amenities: form.amenities.split(',').map((a) => a.trim()).filter(Boolean),
      images: images.map((img, i) => ({ imageUrl: img.imageUrl, isPrimary: i === 0 })),
      facilities: form.facilities.filter((f) => f.name),
    };
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/admin/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(buildPayload()),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to create room');
      }
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin-rooms'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(room: Room) {
    setEditingId(room.id);
    setForm(roomToForm(room));
    setShowForm(true);
    setError(null);
  }

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/admin/rooms/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(buildPayload()),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to update room');
      }
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin-rooms'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setForm(emptyForm);
    setShowForm(false);
    setEditingId(null);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Archive "${name}"? It will disappear from the site but existing bookings stay intact.`)) return;
    try {
      const res = await fetch(`${API_URL}/admin/rooms/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? 'Failed to archive room');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['admin-rooms'] });
    } catch {
      alert('Failed to archive room — is the backend running?');
    }
  }

  async function handleSetStatus(id: string, status: RoomStatus) {
    try {
      const res = await fetch(`${API_URL}/admin/rooms/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? 'Failed to update status');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['admin-rooms'] });
    } catch {
      alert('Failed to update status — is the backend running?');
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">Room Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">{rooms.length} rooms</p>
        </div>
        <button
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'Add Room'}
        </button>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-3">
        <select
          value={filterHotel}
          onChange={(e) => setFilterHotel(e.target.value)}
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-foreground outline-none"
        >
          <option value="">All hotels</option>
          {hotels.map((h) => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-foreground outline-none"
        >
          <option value="">All statuses</option>
          <option value="available">Available</option>
          <option value="hidden">Hidden</option>
          <option value="maintenance">Maintenance</option>
          <option value="archived">Archived</option>
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search room name…"
          className="min-w-[200px] flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-foreground outline-none"
        />
      </div>

      {showForm && (
        <form onSubmit={editingId ? handleUpdate : handleCreate} className="mt-6 rounded-2xl border border-white/10 bg-card p-6">
          <h2 className="font-display text-lg text-foreground">Basic Information</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Hotel</span>
              <select
                required
                value={form.hotelId}
                onChange={(e) => setForm({ ...form, hotelId: e.target.value })}
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-foreground outline-none focus:border-primary/50"
              >
                <option value="" disabled>Select a hotel…</option>
                {hotels.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </label>
            <Field label="Room name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
              <span className="text-muted-foreground">Description</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-foreground outline-none focus:border-primary/50"
              />
            </label>
          </div>

          <h2 className="mt-8 font-display text-lg text-foreground">Pricing</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Price / night" type="number" value={form.price} onChange={(v) => setForm({ ...form, price: v })} required />
            <Field label="Discount (%)" type="number" value={form.discountPercent} onChange={(v) => setForm({ ...form, discountPercent: v })} />
            <Field label="Total units" type="number" value={form.totalUnits} onChange={(v) => setForm({ ...form, totalUnits: v })} />
          </div>

          <h2 className="mt-8 font-display text-lg text-foreground">Capacity &amp; Beds</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Sleeps (capacity)" type="number" value={form.capacity} onChange={(v) => setForm({ ...form, capacity: v })} required />
            <Field label="Max adults" type="number" value={form.maxAdults} onChange={(v) => setForm({ ...form, maxAdults: v })} />
            <Field label="Max children" type="number" value={form.maxChildren} onChange={(v) => setForm({ ...form, maxChildren: v })} />
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Bed type</span>
              <select
                value={form.bedType}
                onChange={(e) => setForm({ ...form, bedType: e.target.value })}
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-foreground outline-none focus:border-primary/50"
              >
                {BED_TYPE_PRESETS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
                <option value="Custom">Custom…</option>
              </select>
              {!BED_TYPE_PRESETS.includes(form.bedType) && (
                <input
                  type="text"
                  value={form.bedType}
                  onChange={(e) => setForm({ ...form, bedType: e.target.value })}
                  placeholder="Custom bed name"
                  className="mt-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
                />
              )}
            </label>
            <Field label="Number of beds" type="number" value={form.bedCount} onChange={(v) => setForm({ ...form, bedCount: v })} />
            <Field label="Bedrooms" type="number" value={form.bedroomCount} onChange={(v) => setForm({ ...form, bedroomCount: v })} />
            <Field label="Room size (m²)" type="number" value={form.size} onChange={(v) => setForm({ ...form, size: v })} />
          </div>

          <h2 className="mt-8 font-display text-lg text-foreground">Status &amp; Badge</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Status</span>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as RoomStatus })}
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-foreground outline-none focus:border-primary/50"
              >
                <option value="available">Available</option>
                <option value="hidden">Hidden</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Badge</span>
              <select
                value={BADGE_PRESETS.includes(form.badge) ? form.badge : form.badge ? 'Custom' : ''}
                onChange={(e) => setForm({ ...form, badge: e.target.value === 'Custom' ? '' : e.target.value === 'None' ? '' : e.target.value })}
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-foreground outline-none focus:border-primary/50"
              >
                <option value="">None</option>
                {BADGE_PRESETS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
                <option value="Custom">Custom…</option>
              </select>
              <input
                type="text"
                value={form.badge}
                onChange={(e) => setForm({ ...form, badge: e.target.value })}
                placeholder="Badge text shown on the room card"
                className="mt-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
              />
            </label>
          </div>

          <h2 className="mt-8 font-display text-lg text-foreground">Facilities</h2>
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {COMMON_FACILITIES.map((f) => {
              const checked = form.facilities.some((rf) => rf.name === f.name);
              const Icon = resolveFacilityIcon(f.name, f.icon);
              return (
                <label
                  key={f.name}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                    checked ? 'border-primary/50 bg-primary/10 text-primary' : 'border-white/10 text-muted-foreground'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        facilities: e.target.checked
                          ? [...form.facilities, f]
                          : form.facilities.filter((rf) => rf.name !== f.name),
                      })
                    }
                    className="sr-only"
                  />
                  <Icon className="h-4 w-4" /> {f.name}
                </label>
              );
            })}
          </div>
          <CustomFacilityAdder
            facilities={form.facilities}
            onAdd={(f) => setForm({ ...form, facilities: [...form.facilities, f] })}
            onRemove={(name) => setForm({ ...form, facilities: form.facilities.filter((rf) => rf.name !== name) })}
          />

          <div className="mt-4 flex flex-wrap gap-4">
            <Toggle label="Free Breakfast" checked={form.breakfast} onChange={(v) => setForm({ ...form, breakfast: v })} />
            <Toggle label="Free Parking" checked={form.parking} onChange={(v) => setForm({ ...form, parking: v })} />
            <Toggle label="Free Wi-Fi" checked={form.wifi} onChange={(v) => setForm({ ...form, wifi: v })} />
          </div>

          <label className="mt-4 flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">Other amenities (comma-separated, legacy fallback)</span>
            <input
              type="text"
              value={form.amenities}
              onChange={(e) => setForm({ ...form, amenities: e.target.value })}
              placeholder="Only used if no facilities are checked above"
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-foreground outline-none focus:border-primary/50"
            />
          </label>

          <h2 className="mt-8 font-display text-lg text-foreground">Photos</h2>
          <p className="mt-1 text-xs text-muted-foreground">The first photo is used as the cover image shown on the room card.</p>
          <RoomGalleryEditor
            images={form.images}
            onChange={(images) => setForm({ ...form, images })}
          />

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

          <div className="mt-8 flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {submitting ? (editingId ? 'Updating…' : 'Creating…') : editingId ? 'Update Room' : 'Create Room'}
            </button>
            <button type="button" onClick={resetForm} className="rounded-xl border border-white/15 px-6 py-3 text-sm text-foreground/80">
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="mt-8 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-card" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No rooms match these filters.</p>
      ) : (
        <div className="mt-8 space-y-3">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="flex flex-col gap-3 rounded-xl border border-white/10 bg-card p-4 sm:flex-row sm:items-center"
            >
              <img
                src={room.images?.[0]?.imageUrl || room.image}
                alt={room.name}
                className="h-24 w-32 rounded-lg object-cover sm:h-16 sm:w-24"
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-base text-foreground">{room.name}</p>
                  <StatusPill status={room.deletedAt ? 'archived' : room.status ?? 'available'} />
                  {room.badge && (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] text-primary">{room.badge}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{hotelName(room.hotelId)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sleeps {room.capacity} • {room.bedCount ?? 1} {room.bedType ?? 'bed'} • {room.size} m² • {room.totalUnits ?? 1} unit{(room.totalUnits ?? 1) > 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <p className="font-display text-lg text-gradient-gold">{formatCurrency(room.price)}</p>
                <div className="flex items-center gap-1">
                  {!room.deletedAt && room.status !== 'hidden' && (
                    <IconButton title="Hide" onClick={() => handleSetStatus(room.id, 'hidden')}>
                      <EyeOff className="h-4 w-4" />
                    </IconButton>
                  )}
                  {!room.deletedAt && room.status !== 'available' && (
                    <IconButton title="Show" onClick={() => handleSetStatus(room.id, 'available')}>
                      <Eye className="h-4 w-4" />
                    </IconButton>
                  )}
                  {!room.deletedAt && room.status !== 'maintenance' && (
                    <IconButton title="Set to maintenance" onClick={() => handleSetStatus(room.id, 'maintenance')}>
                      <Wrench className="h-4 w-4" />
                    </IconButton>
                  )}
                  {!room.deletedAt && (
                    <IconButton title="Edit" onClick={() => handleEdit(room)}>
                      <Edit2 className="h-4 w-4" />
                    </IconButton>
                  )}
                  {!room.deletedAt && (
                    <IconButton title="Archive" danger onClick={() => handleDelete(room.id, room.name)}>
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function IconButton({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={cn(
        'rounded-full p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary',
        danger && 'hover:bg-red-400/10 hover:text-red-400'
      )}
    >
      {children}
    </button>
  );
}

function StatusPill({ status }: { status: RoomStatus | 'archived' }) {
  const styles: Record<string, string> = {
    available: 'bg-emerald-400/15 text-emerald-300',
    hidden: 'bg-white/10 text-muted-foreground',
    maintenance: 'bg-amber-400/15 text-amber-300',
    archived: 'bg-red-400/15 text-red-300',
  };
  return <span className={cn('rounded-full px-2 py-0.5 text-[11px] capitalize', styles[status])}>{status}</span>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground/80">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-primary" />
      {label}
    </label>
  );
}

function CustomFacilityAdder({
  facilities,
  onAdd,
  onRemove,
}: {
  facilities: RoomFacility[];
  onAdd: (f: RoomFacility) => void;
  onRemove: (name: string) => void;
}) {
  const [name, setName] = useState('');
  const custom = facilities.filter((f) => !COMMON_FACILITIES.some((c) => c.name === f.name));

  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add custom facility…"
          className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
        />
        <button
          type="button"
          onClick={() => {
            if (!name.trim()) return;
            onAdd({ name: name.trim(), icon: '' });
            setName('');
          }}
          className="rounded-lg border border-white/15 px-3 py-2 text-sm text-foreground/80"
        >
          + Add Custom Facility
        </button>
      </div>
      {custom.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {custom.map((f) => (
            <span key={f.name} className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-foreground/80">
              {f.name}
              <button type="button" onClick={() => onRemove(f.name)} aria-label={`Remove ${f.name}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function RoomGalleryEditor({ images, onChange }: { images: RoomImage[]; onChange: (images: RoomImage[]) => void }) {
  function addSlot() {
    onChange([...images, { imageUrl: '', isPrimary: images.length === 0 }]);
  }
  function updateSlot(index: number, url: string) {
    const next = [...images];
    next[index] = { ...next[index], imageUrl: url };
    onChange(next);
  }
  function removeSlot(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }
  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="mt-4 space-y-4">
      {images.map((img, i) => (
        <div key={i} className="flex items-start gap-3 rounded-xl border border-white/10 p-3">
          <div className="flex flex-col items-center gap-1 pt-2 text-muted-foreground">
            <GripVertical className="h-4 w-4" />
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="text-xs disabled:opacity-30">↑</button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} className="text-xs disabled:opacity-30">↓</button>
          </div>
          <ImageUploadField label={i === 0 ? 'Cover photo' : `Photo ${i + 1}`} value={img.imageUrl} onChange={(url) => updateSlot(i, url)} className="flex-1" />
          <div className="flex flex-col items-center gap-2 pt-6">
            {i === 0 && <Star className="h-4 w-4 fill-primary text-primary" />}
            <button
              type="button"
              onClick={() => removeSlot(i)}
              aria-label="Remove photo"
              className="rounded-full p-1 text-muted-foreground hover:bg-red-400/10 hover:text-red-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
      <button type="button" onClick={addSlot} className="rounded-lg border border-dashed border-white/20 px-4 py-2 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary">
        + Add photo
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-foreground outline-none focus:border-primary/50"
      />
    </label>
  );
}
