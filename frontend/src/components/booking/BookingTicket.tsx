import { Check, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export type BookingTicketData = {
  id: string;
  bookingCode: string;
  hotelName: string;
  location: string;
  roomName: string;
  guestName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  total: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentMethod: 'qris' | 'card_bca' | 'paypal' | 'pay_at_hotel';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'expired' | 'refunded' | 'unpaid';
};

const paymentMethodLabels: Record<BookingTicketData['paymentMethod'], string> = {
  qris: 'QRIS',
  card_bca: 'Card / BCA',
  paypal: 'PayPal',
  pay_at_hotel: 'Pay at Hotel',
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: 'bg-primary/15 text-primary',
    confirmed: 'bg-primary/15 text-primary',
    unpaid: 'bg-white/10 text-muted-foreground',
    pending: 'bg-amber-400/15 text-amber-300',
    failed: 'bg-red-400/15 text-red-400',
    expired: 'bg-red-400/15 text-red-400',
    cancelled: 'bg-red-400/15 text-red-400',
    completed: 'bg-white/10 text-muted-foreground',
    refunded: 'bg-white/10 text-muted-foreground',
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs capitalize ${styles[status] ?? 'bg-white/10 text-muted-foreground'}`}>
      {status}
    </span>
  );
}

export default function BookingTicket({ booking }: { booking: BookingTicketData }) {
  const icon =
    booking.status === 'cancelled' ? (
      <XCircle className="h-7 w-7 text-red-400" />
    ) : booking.paymentStatus === 'pending' ? (
      <Clock className="h-7 w-7 text-amber-300" />
    ) : booking.paymentStatus === 'failed' || booking.paymentStatus === 'expired' ? (
      <AlertTriangle className="h-7 w-7 text-red-400" />
    ) : (
      <Check className="h-7 w-7 text-primary" />
    );

  return (
    <div className="rounded-2xl border border-primary/30 bg-card p-8">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">{icon}</div>
        <h2 className="mt-4 font-display text-2xl text-foreground">
          {booking.status === 'cancelled'
            ? 'Booking Cancelled'
            : booking.paymentStatus === 'pending'
            ? 'Awaiting Payment'
            : 'Booking Confirmed'}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Booking code <span className="text-primary">{booking.bookingCode}</span>
        </p>
      </div>

      <dl className="mt-8 space-y-3 border-t border-white/10 pt-6 text-sm">
        <Row label="Hotel" value={`${booking.hotelName} — ${booking.location}`} />
        <Row label="Room" value={booking.roomName} />
        <Row label="Guest" value={booking.guestName} />
        <Row label="Email" value={booking.guestEmail} />
        <Row label="Check-in" value={formatDate(booking.checkIn)} />
        <Row label="Check-out" value={formatDate(booking.checkOut)} />
        <Row label="Guests" value={String(booking.guests)} />
        <Row label="Nights" value={String(booking.nights)} />
        <Row label="Total" value={formatCurrency(booking.total)} strong />
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Payment method</dt>
          <dd className="text-foreground">{paymentMethodLabels[booking.paymentMethod]}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Payment status</dt>
          <dd>
            <StatusBadge status={booking.paymentStatus} />
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Booking status</dt>
          <dd>
            <StatusBadge status={booking.status} />
          </dd>
        </div>
      </dl>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={strong ? 'font-display text-lg text-gradient-gold' : 'text-foreground'}>{value}</dd>
    </div>
  );
}
