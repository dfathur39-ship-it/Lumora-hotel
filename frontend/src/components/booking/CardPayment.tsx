import { useState } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { PaymentStatus } from '@/components/booking/QRISPayment';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export default function CardPayment({
  transactionId,
  amount,
  token,
  onSettled,
}: {
  transactionId: string;
  amount: number;
  token: string | null;
  onSettled: (status: PaymentStatus) => void;
}) {
  const [simulating, setSimulating] = useState(false);

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
        onSettled(data.paymentStatus);
      }
    } finally {
      setSimulating(false);
    }
  }

  return (
    <div className="flex flex-col items-center py-8 text-center">
      <ShieldCheck className="h-10 w-10 text-primary" />
      <p className="mt-4 font-display text-2xl text-gradient-gold">{formatCurrency(amount)}</p>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        In production you'd be redirected to your card issuer or a PCI-compliant gateway's
        hosted payment page here — we never collect or store your card number, CVV, or PIN
        ourselves.
      </p>

      <div className="mt-8 w-full max-w-sm rounded-xl border border-dashed border-white/15 p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Sandbox mode</p>
        <p className="mt-1 text-xs text-muted-foreground">
          No real card gateway is connected yet. Simulate the outcome a real one would return.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            disabled={simulating}
            onClick={() => handleSimulate(true)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-medium text-primary-foreground disabled:opacity-60"
          >
            {simulating && <Loader2 className="h-3 w-3 animate-spin" />}
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
