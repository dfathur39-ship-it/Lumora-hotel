import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Ticket } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, formatDate } from '@/lib/utils';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

type Booking = {
  id: string;
  bookingCode: string;
  hotelName: string;
  location: string;
  roomName: string;
  guestName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  total: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentMethod: 'qris' | 'card_bca' | 'paypal' | 'pay_at_hotel';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'expired' | 'refunded' | 'unpaid';
  transactionId?: string;
  paidAt?: string;
};

const paymentMethodLabels: Record<Booking['paymentMethod'], string> = {
  qris: 'QRIS',
  card_bca: 'Card / BCA',
  paypal: 'PayPal',
  pay_at_hotel: 'Pay at Hotel',
};

async function fetchAllBookings(token: string | null): Promise<Booking[]> {
  if (!token) return [];
  const res = await fetch(`${API_URL}/admin/bookings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load bookings');
  return res.json();
}

function StatusPill({ label, tone }: { label: string; tone: 'good' | 'warn' | 'bad' | 'neutral' }) {
  const styles = {
    good: 'bg-primary/15 text-primary',
    warn: 'bg-amber-400/15 text-amber-300',
    bad: 'bg-red-400/15 text-red-400',
    neutral: 'bg-white/10 text-muted-foreground',
  }[tone];
  return <span className={`rounded-full px-2.5 py-1 text-xs capitalize ${styles}`}>{label}</span>;
}

function paymentTone(status: Booking['paymentStatus']): 'good' | 'warn' | 'bad' | 'neutral' {
  if (status === 'paid') return 'good';
  if (status === 'pending') return 'warn';
  if (status === 'failed' || status === 'expired') return 'bad';
  return 'neutral';
}

export default function AdminBookings() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading, error } = useQuery({
    queryKey: ['admin-bookings', token],
    queryFn: () => fetchAllBookings(token),
    enabled: !!token,
  });

  async function cancelBooking(id: string) {
    try {
      await fetch(`${API_URL}/admin/bookings/${id}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
    } finally {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-foreground">All Bookings</h1>
      <p className="mt-1 text-sm text-muted-foreground">{bookings.length} total</p>

      {isLoading ? (
        <div className="mt-8 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-card" />
          ))}
        </div>
      ) : error ? (
        <div className="mt-8 rounded-2xl border border-white/10 bg-card p-8 text-center text-muted-foreground">
          Couldn't load bookings. Make sure the backend is running.
        </div>
      ) : bookings.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-white/10 bg-card p-8 text-center text-muted-foreground">
          No bookings yet.
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="rounded-xl border border-white/10 bg-card p-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Ticket className="h-3.5 w-3.5" /> {b.bookingCode}
                  </p>
                  <p className="mt-1 font-display text-base text-foreground">{b.hotelName}</p>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {b.location} · {b.roomName}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {b.guestName} · {b.guestEmail}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg text-gradient-gold">{formatCurrency(b.total)}</p>
                  <p className="text-xs text-muted-foreground">{paymentMethodLabels[b.paymentMethod]}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill
                    label={`Booking: ${b.status}`}
                    tone={b.status === 'confirmed' ? 'good' : b.status === 'cancelled' ? 'bad' : 'neutral'}
                  />
                  <StatusPill label={`Payment: ${b.paymentStatus}`} tone={paymentTone(b.paymentStatus)} />
                  {b.transactionId && (
                    <span className="text-xs text-muted-foreground">Txn: {b.transactionId}</span>
                  )}
                  {b.paidAt && (
                    <span className="text-xs text-muted-foreground">Paid: {formatDate(b.paidAt)}</span>
                  )}
                </div>
                {b.status === 'confirmed' && (
                  <button
                    onClick={() => cancelBooking(b.id)}
                    className="rounded-full border border-white/15 px-4 py-2 text-xs text-foreground/80 hover:border-red-400/40 hover:text-red-400"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
