import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="container pt-40 pb-24 text-center text-muted-foreground">Loading…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return (
      <div className="container flex flex-col items-center pt-40 pb-24 text-center">
        <ShieldAlert className="h-8 w-8 text-muted-foreground" />
        <h1 className="mt-4 font-display text-xl text-foreground">Admin access required</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          This area is restricted to Lumora staff accounts. Contact an administrator if you
          believe you should have access.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
