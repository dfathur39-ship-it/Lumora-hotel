import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import BookingTicket, { type BookingTicketData } from '@/components/booking/BookingTicket';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

type State = 'capturing' | 'success' | 'error';

export default function PayPalReturn() {
  const { token } = useAuth();
  const [state, setState] = useState<State>('capturing');
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<BookingTicketData | null>(null);

  useEffect(() => {
    async function capture() {
      const raw = sessionStorage.getItem('lumora_pending_paypal');
      if (!raw || !token) {
        setState('error');
        setError('No pending PayPal payment found for this session.');
        return;
      }

      const { bookingId, transactionId } = JSON.parse(raw);

      try {
        // The redirect back from PayPal is never trusted on its own — the
        // backend calls PayPal's Capture Order API server-side and only
        // marks the booking paid if PayPal confirms it.
        const res = await fetch(`${API_URL}/payments/capture`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ method: 'paypal', transactionId }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? 'Payment verification failed');
        }

        const booking = await res.json();
        sessionStorage.removeItem('lumora_pending_paypal');

        if (booking.paymentStatus === 'paid') {
          setTicket(booking);
          setState('success');
        } else {
          setError('PayPal did not confirm this payment. Please try again or choose another method.');
          setState('error');
        }
        void bookingId;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong verifying your payment.');
        setState('error');
      }
    }

    capture();
  }, [token]);

  return (
    <div className="container max-w-2xl pb-24 pt-32">
      {state === 'capturing' && (
        <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-card p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Verifying your PayPal payment…</p>
        </div>
      )}

      {state === 'error' && (
        <div className="rounded-2xl border border-red-400/20 bg-card p-8 text-center">
          <p className="text-foreground">{error}</p>
          <Link to="/bookings" className="mt-4 inline-block text-sm text-primary">
            Go to My Bookings
          </Link>
        </div>
      )}

      {state === 'success' && ticket && (
        <>
          <BookingTicket booking={ticket} />
          <Link
            to="/bookings"
            className="mt-6 block w-full rounded-xl bg-primary py-3 text-center text-sm font-medium text-primary-foreground"
          >
            View My Bookings
          </Link>
        </>
      )}
    </div>
  );
}
