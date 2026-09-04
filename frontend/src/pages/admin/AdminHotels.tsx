import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Star, X, Edit2, PlusCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/utils';
import type { Hotel, Room } from '@/data/hotels';
import ImageUploadField from '@/components/admin/ImageUploadField';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

async function fetchHotels(): Promise<Hotel[]> {
  const res = await fetch(`${API_URL}/hotels`);
  if (!res.ok) throw new Error('Failed to load hotels');
  return res.json();
}

const emptyForm = {
  name: '',
  location: '',
  description: '',
  image: '',
  priceFrom: '',
  rating: '4.5',
  amenities: '',
};

const emptyRoom = {
  name: '',
  description: '',
  price: '',
  capacity: '2',
  size: '',
  image: '',
  amenities: '',
};

// The room list in this form holds raw string inputs (before they're
// converted to numbers/arrays and sent to the API) — this is a distinct
// shape from the final `Room` type used elsewhere in the app.
type RoomFormState = typeof emptyRoom & { id?: string };

export default function AdminHotels() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [rooms, setRooms] = useState<RoomFormState[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: hotels = [], isLoading } = useQuery({
    queryKey: ['admin-hotels'],
    queryFn: fetchHotels,
  });

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const hotelRes = await fetch(`${API_URL}/admin/hotels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          location: form.location,
          description: form.description,
          image: form.image,
          gallery: form.image ? [form.image] : [],
          rating: Number(form.rating) || 4.5,
          priceFrom: Number(form.priceFrom),
          amenities: form.amenities
            .split(',')
            .map((a) => a.trim())
            .filter(Boolean),
        }),
      });
      if (!hotelRes.ok) {
        const data = await hotelRes.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to create hotel');
      }
      const hotel = await hotelRes.json();

      for (const room of rooms) {
        if (room.name && room.price) {
          await fetch(`${API_URL}/admin/rooms`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              hotelId: hotel.id,
              name: room.name,
              description: room.description,
              price: Number(room.price),
              capacity: Number(room.capacity),
              size: Number(room.size) || 0,
              image: room.image,
              amenities: room.amenities
                .split(',')
                .map((a) => a.trim())
                .filter(Boolean),
            }),
          });
        }
      }

      setForm(emptyForm);
      setRooms([]);
      setShowForm(false);
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-hotels'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(id: string, hotel: Hotel) {
    setEditingId(id);
    setForm({
      name: hotel.name,
      location: hotel.location,
      description: hotel.description,
      image: hotel.image,
      priceFrom: String(hotel.priceFrom),
      rating: String(hotel.rating),
      amenities: hotel.amenities.join(', '),
    });
    setShowForm(true);
  }

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/admin/hotels/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          location: form.location,
          description: form.description,
          image: form.image,
          gallery: form.image ? [form.image] : [],
          rating: Number(form.rating) || 4.5,
          priceFrom: Number(form.priceFrom),
          amenities: form.amenities
            .split(',')
            .map((a) => a.trim())
            .filter(Boolean),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to update hotel');
      }
      setForm(emptyForm);
      setShowForm(false);
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-hotels'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This can't be undone.`)) return;
    try {
      const res = await fetch(`${API_URL}/admin/hotels/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? 'Failed to delete hotel');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['admin-hotels'] });
    } catch {
      alert('Failed to delete hotel — is the backend running?');
    }
  }

  function addRoom() {
    setRooms([...rooms, { ...emptyRoom, id: `temp-${Date.now()}` }]);
  }

  function removeRoom(index: number) {
    setRooms(rooms.filter((_, i) => i !== index));
  }

  function updateRoom(index: number, field: keyof RoomFormState, value: string) {
    const newRooms = [...rooms];
    newRooms[index] = { ...newRooms[index], [field]: value };
    setRooms(newRooms);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-foreground">Hotels</h1>
          <p className="mt-1 text-sm text-muted-foreground">{hotels.length} properties</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'Add Hotel'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={editingId ? handleUpdate : handleCreate} className="mt-6 rounded-2xl border border-white/10 bg-card p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <Field label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} required />
            <Field
              label="Price from (USD/night)"
              type="number"
              value={form.priceFrom}
              onChange={(v) => setForm({ ...form, priceFrom: v })}
              required
            />
            <Field
              label="Rating (0–5)"
              type="number"
              value={form.rating}
              onChange={(v) => setForm({ ...form, rating: v })}
            />
            <Field
              label="Amenities (comma-separated)"
              value={form.amenities}
              onChange={(v) => setForm({ ...form, amenities: v })}
              className="sm:col-span-2"
            />
            <ImageUploadField
              label="Hotel Image"
              value={form.image}
              onChange={(url) => setForm({ ...form, image: url })}
              className="sm:col-span-2"
            />
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

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

          <div className="mt-6 border-t border-white/10 pt-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg text-foreground">Rooms</h3>
              <button
                type="button"
                onClick={addRoom}
                className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Add Room
              </button>
            </div>

            {rooms.length > 0 && (
              <div className="mt-4 space-y-4">
                {rooms.map((room, index) => (
                  <div key={room.id || index} className="rounded-xl border border-white/10 bg-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-foreground">Room {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeRoom(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="flex flex-col gap-1.5 text-sm">
                        <span className="text-muted-foreground">Name</span>
                        <input
                          type="text"
                          value={room.name}
                          onChange={(e) => updateRoom(index, 'name', e.target.value)}
                          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-foreground outline-none focus:border-primary/50"
                        />
                      </label>
                      <label className="flex flex-col gap-1.5 text-sm">
                        <span className="text-muted-foreground">Price (USD/night)</span>
                        <input
                          type="number"
                          value={room.price}
                          onChange={(e) => updateRoom(index, 'price', e.target.value)}
                          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-foreground outline-none focus:border-primary/50"
                        />
                      </label>
                      <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
                        <span className="text-muted-foreground">Description</span>
                        <textarea
                          value={room.description}
                          onChange={(e) => updateRoom(index, 'description', e.target.value)}
                          rows={2}
                          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-foreground outline-none focus:border-primary/50"
                        />
                      </label>
                      <label className="flex flex-col gap-1.5 text-sm">
                        <span className="text-muted-foreground">Capacity (guests)</span>
                        <input
                          type="number"
                          value={room.capacity}
                          onChange={(e) => updateRoom(index, 'capacity', e.target.value)}
                          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-foreground outline-none focus:border-primary/50"
                        />
                      </label>
                      <label className="flex flex-col gap-1.5 text-sm">
                        <span className="text-muted-foreground">Size (m²)</span>
                        <input
                          type="number"
                          value={room.size}
                          onChange={(e) => updateRoom(index, 'size', e.target.value)}
                          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-foreground outline-none focus:border-primary/50"
                        />
                      </label>
                      <ImageUploadField
                        label="Room Image"
                        value={room.image}
                        onChange={(url) => updateRoom(index, 'image', url)}
                      />
                      <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
                        <span className="text-muted-foreground">Amenities (comma-separated)</span>
                        <input
                          type="text"
                          value={room.amenities}
                          onChange={(e) => updateRoom(index, 'amenities', e.target.value)}
                          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-foreground outline-none focus:border-primary/50"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {submitting ? (editingId ? 'Updating…' : 'Creating…') : (editingId ? 'Update Hotel' : 'Create Hotel')}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="mt-8 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-card" />
          ))}
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {hotels.map((hotel) => (
            <div
              key={hotel.id}
              className="flex items-center gap-4 rounded-xl border border-white/10 bg-card p-4"
            >
              <img src={hotel.image} alt={hotel.name} className="h-16 w-24 rounded-lg object-cover" />
              <div className="flex-1">
                <p className="font-display text-base text-foreground">{hotel.name}</p>
                <p className="text-sm text-muted-foreground">{hotel.location}</p>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" /> {hotel.rating.toFixed(1)}
              </div>
               <p className="w-24 text-right font-display text-gradient-gold">
                 {formatCurrency(hotel.priceFrom)}
               </p>
                <button
                  onClick={() => handleDelete(hotel.id, hotel.name)}
                  aria-label={`Delete ${hotel.name}`}
                  className="rounded-full p-2 text-muted-foreground hover:bg-red-400/10 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                 <button
                   onClick={() => handleEdit(hotel.id, hotel)}
                   aria-label={`Edit ${hotel.name}`}
                   className="rounded-full p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                 >
                   <Edit2 className="h-4 w-4" />
                 </button>
                 <button
                   onClick={() => alert('Manage rooms feature coming soon!')}
                   aria-label={`Manage rooms for ${hotel.name}`}
                   className="rounded-full p-2 text-muted-foreground hover:bg-blue-400/10 hover:text-blue-400"
                 >
                   <PlusCircle className="h-4 w-4" />
                 </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 text-sm ${className ?? ''}`}>
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
