import { useEffect, useState } from 'react';
import { Loader2, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'refunded' | 'unpaid';

export default function QRISPayment({
  bookingId,
  transactionId,
  qrImageUrl,
  amount,
  expiresAt,
  token,
  onSettled,
}: {
  bookingId: string;
  transactionId: string;
  qrImageUrl: string;
  amount: number;
  expiresAt: string | null;
  token: string | null;
  onSettled: (status: PaymentStatus) => void;
}) {
  const [status, setStatus] = useState<PaymentStatus>('pending');
  const [simulating, setSimulating] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  // Poll the booking's real payment status from the backend — this is
  // the source of truth, not any local/frontend assumption.
  useEffect(() => {
    if (status !== 'pending') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const paymentStatus: PaymentStatus = data.paymentStatus;
        if (paymentStatus !== 'pending') {
          setStatus(paymentStatus);
          onSettled(paymentStatus);
        }
      } catch {
        // network hiccup — try again on the next tick
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [status, bookingId, token, onSettled]);

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  async function handleSimulate(succeed: boolean) {
    setSimulating(true);
    try {
      const res = await fetch(`${API_URL}/payments/sandbox/${transactionId}/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ succeed }),
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data.paymentStatus);
        onSettled(data.paymentStatus);
      }
    } finally {
      setSimulating(false);
    }
  }

  if (status === 'paid') {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-primary" />
        <p className="mt-3 text-foreground">Payment received</p>
      </div>
    );
  }

  if (status === 'expired' || status === 'failed') {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <XCircle className="h-10 w-10 text-red-400" />
        <p className="mt-3 text-foreground">
          {status === 'expired' ? 'This QR code has expired.' : 'Payment failed.'}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Go back and try again with a new booking.</p>
      </div>
    );
  }

  const minutes = secondsLeft !== null ? Math.floor(secondsLeft / 60) : null;
  const seconds = secondsLeft !== null ? secondsLeft % 60 : null;

  return (
    <div className="flex flex-col items-center py-4 text-center">
      <img
        src={qrImageUrl}
        alt="QRIS payment QR code"
        className="h-56 w-56 rounded-xl border border-white/10 bg-white p-2"
      />
      <p className="mt-4 font-display text-2xl text-gradient-gold">{formatCurrency(amount)}</p>
      {secondsLeft !== null && (
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          Expires in {minutes}:{String(seconds).padStart(2, '0')}
        </p>
      )}
      <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Waiting for payment…
      </p>

      <div className="mt-8 w-full rounded-xl border border-dashed border-white/15 p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Sandbox mode</p>
        <p className="mt-1 text-xs text-muted-foreground">
          No real QRIS aggregator is connected. Use the buttons below to simulate what a bank
          app's payment confirmation would trigger.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            disabled={simulating}
            onClick={() => handleSimulate(true)}
            className="flex-1 rounded-lg bg-primary py-2 text-xs font-medium text-primary-foreground disabled:opacity-60"
          >
            Simulate Success
          </button>
          <button
            disabled={simulating}
            onClick={() => handleSimulate(false)}
            className="flex-1 rounded-lg border border-white/15 py-2 text-xs text-foreground/80 disabled:opacity-60"
          >
            Simulate Failure
          </button>
        </div>
      </div>
    </div>
  );
}
