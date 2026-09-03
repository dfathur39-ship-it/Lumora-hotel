import { Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';

export default function PayPalCancel() {
  return (
    <div className="container flex max-w-md flex-col items-center pb-24 pt-40 text-center">
      <XCircle className="h-10 w-10 text-muted-foreground" />
      <h1 className="mt-4 font-display text-xl text-foreground">Payment Cancelled</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        You cancelled the PayPal payment. No charge was made and no booking was confirmed.
      </p>
      <Link
        to="/hotels"
        className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
      >
        Browse Hotels
      </Link>
    </div>
  );
}
