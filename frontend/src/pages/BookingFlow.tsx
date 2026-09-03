import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardCheck, CreditCard, User, LogIn } from 'lucide-react';
import type { Hotel, Room } from '@/data/hotels';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, nightsBetween } from '@/lib/utils';
import PaymentMethodSelect, { type PaymentMethodId } from '@/components/booking/PaymentMethodSelect';
import QRISPayment, { type PaymentStatus } from '@/components/booking/QRISPayment';
import CardPayment from '@/components/booking/CardPayment';
import BookingTicket, { type BookingTicketData } from '@/components/booking/BookingTicket';

type Step = 'guest' | 'review' | 'payment-method' | 'processing' | 'confirmation';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export default function BookingFlow() {
  const { hotelId, roomId } = useParams<{ hotelId: string; roomId: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [searchParams] = useSearchParams();

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!hotelId || !roomId) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(false);

    Promise.all([
      fetch(`${API_URL}/hotels/${hotelId}`).then((r) => (r.ok ? r.json() : Promise.reject())),
      fetch(`${API_URL}/rooms/${roomId}`).then((r) => (r.ok ? r.json() : Promise.reject())),
    ])
      .then(([hotelData, roomData]: [Hotel, Room]) => {
        if (cancelled) return;
        setHotel(hotelData);
        setRoom(roomData);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hotelId, roomId]);

  const paramCheckIn = searchParams.get('checkIn');
  const paramCheckOut = searchParams.get('checkOut');
  const paramAdults = Number(searchParams.get('adults') || 0);
  const paramChildren = Number(searchParams.get('children') || 0);
  const paramRooms = Number(searchParams.get('rooms') || 1);

  const [step, setStep] = useState<Step>('guest');
  const [dates, setDates] = useState({
    checkIn: paramCheckIn || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    checkOut: paramCheckOut || new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
  });
  const [method, setMethod] = useState<PaymentMethodId | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guest, setGuest] = useState({
    guests: Math.max(1, paramAdults + paramChildren),
    roomsCount: Math.max(1, paramRooms),
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: '',
  });

  const [bookingId, setBookingId] = useState<string | null>(null);
  const [ticket, setTicket] = useState<BookingTicketData | null>(null);
  const [paymentView, setPaymentView] = useState<{
    kind: 'qris' | 'card';
    transactionId: string;
    qrImageUrl?: string;
    expiresAt: string | null;
  } | null>(null);

  useEffect(() => {
    if (user) setGuest((g) => ({ ...g, name: g.name || user.name, email: g.email || user.email }));
  }, [user]);

  if (loading) {
    return <div className="container pt-40 pb-24 text-center text-muted-foreground">Loading room…</div>;
  }

  if (loadError || !hotel || !room) {
    return <div className="container pt-40 pb-24 text-center text-muted-foreground">Room not found.</div>;
  }

  if (!user) {
    return (
      <div className="container pt-40 pb-24 text-center">
        <p className="text-muted-foreground">Please sign in to continue booking this room.</p>
        <Link
          to={`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}
          className="mt-4 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const nights = nightsBetween(dates.checkIn, dates.checkOut);
  const discountedPrice = room.price - Math.round((room.price * (room.discountPercent ?? 0)) / 100);
  const total = nights * discountedPrice * guest.roomsCount;

  const steps: { key: Step; label: string; icon: typeof User }[] = [
    { key: 'guest', label: 'Guest Details', icon: User },
    { key: 'review', label: 'Review', icon: ClipboardCheck },
    { key: 'payment-method', label: 'Payment', icon: CreditCard },
    { key: 'confirmation', label: 'Confirmation', icon: ClipboardCheck },
  ];
  const stepIndex = steps.findIndex((s) => s.key === (step === 'processing' ? 'payment-method' : step));

  async function fetchBooking(id: string): Promise<BookingTicketData> {
    const res = await fetch(`${API_URL}/bookings/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Could not load booking');
    return res.json();
  }

  async function handleCreateBooking() {
    if (!method) return;
    if (!token) {
      setError('Please sign in to complete your booking.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      // Step 1: create the booking itself. The backend recalculates the
      // total server-side from room price x nights x rooms (with any
      // discount applied) and checks real per-date availability — nothing
      // here is trusted blindly from the client.
      const createRes = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hotelId: hotel!.id,
          roomId: room!.id,
          checkIn: dates.checkIn,
          checkOut: dates.checkOut,
          guests: guest.guests,
          roomsCount: guest.roomsCount,
          guestName: guest.name,
          guestEmail: guest.email,
          guestPhone: guest.phone,
          paymentMethod: method,
        }),
      });

      if (!createRes.ok) {
        const data = await createRes.json().catch(() => ({}));
        // Real failures are surfaced to the guest — never silently shown
        // as a success. This is exactly the bug that used to hide failed
        // bookings from History: don't repeat it.
        throw new Error(data.error ?? 'Could not create your booking. Please try again.');
      }

      const booking = await createRes.json();
      setBookingId(booking.id);

      if (method === 'pay_at_hotel') {
        setTicket(booking);
        setStep('confirmation');
        return;
      }

      // Step 2: initiate payment for online methods.
      const payRes = await fetch(`${API_URL}/bookings/${booking.id}/pay`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!payRes.ok) {
        const data = await payRes.json().catch(() => ({}));
        throw new Error(data.error ?? 'Could not start payment. Please try again.');
      }
      const payData = await payRes.json();

      if (method === 'paypal') {
        // Leaving the SPA entirely — stash what we need to resume after
        // the redirect back from PayPal.
        sessionStorage.setItem(
          'lumora_pending_paypal',
          JSON.stringify({ bookingId: booking.id, transactionId: payData.payment.transactionId })
        );
        window.location.href = payData.payment.redirectUrl;
        return;
      }

      setPaymentView({
        kind: method === 'qris' ? 'qris' : 'card',
        transactionId: payData.payment.transactionId,
        qrImageUrl: payData.payment.qrImageUrl,
        expiresAt: payData.payment.expiresAt ?? null,
      });
      setStep('processing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePaymentSettled(status: PaymentStatus) {
    if (!bookingId) return;
    if (status === 'paid') {
      try {
        const fresh = await fetchBooking(bookingId);
        setTicket(fresh);
        setStep('confirmation');
      } catch {
        setError('Payment succeeded but we could not load your booking. Check History shortly.');
      }
    }
    // failed/expired states are rendered inline by the payment view itself
  }

  return (
    <div className="container max-w-3xl pb-24 pt-32">
      <ol className="mb-10 flex items-center justify-between">
        {steps.map((s, i) => {
          const isActive = i === stepIndex;
          const isDone = stepIndex > i;
          return (
            <li key={s.key} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs ${
                    isActive || isDone
                      ? 'border-primary bg-primary/20 text-primary'
                      : 'border-white/15 text-muted-foreground'
                  }`}
                >
                  <s.icon className="h-4 w-4" />
                </div>
                <span className="hidden text-[11px] text-muted-foreground sm:block">{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className="mx-2 h-px flex-1 bg-white/10" />}
            </li>
          );
        })}
      </ol>

      <AnimatePresence mode="wait">
        {step === 'guest' && (
          <motion.div
            key="guest"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="rounded-2xl border border-white/10 bg-card p-6"
          >
            <h2 className="font-display text-xl text-foreground">Guest Details</h2>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Full name" value={guest.name} onChange={(v) => setGuest({ ...guest, name: v })} />
              <Input label="Email" type="email" value={guest.email} onChange={(v) => setGuest({ ...guest, email: v })} />
              <Input label="Phone" value={guest.phone} onChange={(v) => setGuest({ ...guest, phone: v })} />
              <Input
                label="Guests"
                type="number"
                value={String(guest.guests)}
                onChange={(v) => setGuest({ ...guest, guests: Number(v) || 1 })}
              />
              <Input
                label="Rooms"
                type="number"
                value={String(guest.roomsCount)}
                onChange={(v) => setGuest({ ...guest, roomsCount: Math.max(1, Number(v) || 1) })}
              />
              <Input
                label="Check-in"
                type="date"
                value={dates.checkIn}
                onChange={(v) => setDates({ ...dates, checkIn: v })}
              />
              <Input
                label="Check-out"
                type="date"
                value={dates.checkOut}
                onChange={(v) => setDates({ ...dates, checkOut: v })}
              />
            </div>
            <button
              disabled={!guest.name || !guest.email}
              onClick={() => setStep('review')}
              className="mt-8 w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-40"
            >
              Continue to Review
            </button>
          </motion.div>
        )}

        {step === 'review' && (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="rounded-2xl border border-white/10 bg-card p-6"
          >
            <h2 className="font-display text-xl text-foreground">Review Your Booking</h2>
            <div className="mt-6 flex gap-4">
              <img src={room.image} alt={room.name} className="h-24 w-32 rounded-lg object-cover" />
              <div>
                <p className="font-display text-lg text-foreground">{hotel.name}</p>
                <p className="text-sm text-muted-foreground">{room.name} · {hotel.location}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {dates.checkIn} → {dates.checkOut} ({nights} night{nights > 1 ? 's' : ''})
                  {guest.roomsCount > 1 ? ` · ${guest.roomsCount} rooms` : ''}
                </p>
              </div>
            </div>
            <dl className="mt-6 space-y-2 border-t border-white/10 pt-4 text-sm">
              <Row label="Guest" value={guest.name} />
              <Row label="Email" value={guest.email} />
              <Row
                label={`${formatCurrency(discountedPrice)} × ${nights} night${nights > 1 ? 's' : ''}${
                  guest.roomsCount > 1 ? ` × ${guest.roomsCount} rooms` : ''
                }`}
                value={formatCurrency(total)}
              />
              <Row label="Total" value={formatCurrency(total)} strong />
            </dl>
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setStep('guest')}
                className="flex-1 rounded-xl border border-white/15 py-3 text-sm text-foreground/80"
              >
                Back
              </button>
              <button
                onClick={() => setStep('payment-method')}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground"
              >
                Continue to Payment
              </button>
            </div>
          </motion.div>
        )}

        {step === 'payment-method' && (
          <motion.div
            key="payment-method"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="rounded-2xl border border-white/10 bg-card p-6"
          >
            <h2 className="font-display text-xl text-foreground">Choose Payment Method</h2>
            <p className="mt-1 text-sm text-muted-foreground">Total due: {formatCurrency(total)}</p>

            <div className="mt-6">
              <PaymentMethodSelect value={method} onChange={setMethod} />
            </div>

            {!user && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-amber-300">
                <LogIn className="h-4 w-4" />
                <span>
                  <Link to="/login" className="underline">
                    Sign in
                  </Link>{' '}
                  to complete this booking — your details above are kept.
                </span>
              </div>
            )}

            {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setStep('review')}
                className="flex-1 rounded-xl border border-white/15 py-3 text-sm text-foreground/80"
              >
                Back
              </button>
              <button
                disabled={!method || submitting}
                onClick={handleCreateBooking}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                {submitting ? 'Processing…' : method === 'pay_at_hotel' ? 'Confirm Booking' : 'Continue to Payment'}
              </button>
            </div>
          </motion.div>
        )}

        {step === 'processing' && paymentView && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="rounded-2xl border border-white/10 bg-card p-6"
          >
            <h2 className="text-center font-display text-xl text-foreground">
              {paymentView.kind === 'qris' ? 'Scan to Pay' : 'Card Payment'}
            </h2>
            {paymentView.kind === 'qris' ? (
              <QRISPayment
                bookingId={bookingId!}
                transactionId={paymentView.transactionId}
                qrImageUrl={paymentView.qrImageUrl!}
                amount={total}
                expiresAt={paymentView.expiresAt}
                token={token}
                onSettled={handlePaymentSettled}
              />
            ) : (
              <CardPayment
                transactionId={paymentView.transactionId}
                amount={total}
                token={token}
                onSettled={handlePaymentSettled}
              />
            )}
          </motion.div>
        )}

        {step === 'confirmation' && ticket && (
          <motion.div
            key="confirmation"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <BookingTicket booking={ticket} />
            <button
              onClick={() => navigate('/bookings')}
              className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground"
            >
              View My Bookings
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value?: string;
  onChange?: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-foreground outline-none [color-scheme:dark] focus:border-primary/50"
      />
    </label>
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
