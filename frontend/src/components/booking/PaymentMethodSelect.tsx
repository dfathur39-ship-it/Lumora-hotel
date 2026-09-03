import { QrCode, CreditCard, Wallet, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PaymentMethodId = 'qris' | 'card_bca' | 'paypal' | 'pay_at_hotel';

const methods: { id: PaymentMethodId; label: string; desc: string; icon: typeof QrCode }[] = [
  { id: 'qris', label: 'QRIS', desc: 'Scan with any Indonesian e-wallet or mobile banking app', icon: QrCode },
  { id: 'card_bca', label: 'Card / BCA', desc: 'Pay by debit or credit card', icon: CreditCard },
  { id: 'paypal', label: 'PayPal', desc: 'Pay securely via your PayPal account', icon: Wallet },
  { id: 'pay_at_hotel', label: 'Pay at Hotel', desc: 'No payment now — settle when you check in', icon: Building2 },
];

export default function PaymentMethodSelect({
  value,
  onChange,
}: {
  value: PaymentMethodId | null;
  onChange: (id: PaymentMethodId) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {methods.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id)}
          className={cn(
            'flex items-start gap-3 rounded-xl border p-4 text-left transition-colors',
            value === m.id
              ? 'border-primary bg-primary/10'
              : 'border-white/10 bg-card hover:border-white/20'
          )}
        >
          <m.icon className={cn('mt-0.5 h-5 w-5', value === m.id ? 'text-primary' : 'text-muted-foreground')} />
          <div>
            <p className="text-sm font-medium text-foreground">{m.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{m.desc}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
