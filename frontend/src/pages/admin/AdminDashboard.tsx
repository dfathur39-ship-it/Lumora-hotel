import { useQuery } from '@tanstack/react-query';
import { Building2, CalendarCheck, Users, XCircle, DollarSign, KeyRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/utils';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

type Stats = {
  totalHotels: number;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  totalUsers: number;
  revenueConfirmed: number;
};

type ResetRequest = {
  id: string;
  userId: string;
  status: string;
  requestedAt: string;
};

async function fetchStats(token: string | null): Promise<Stats | null> {
  if (!token) return null;
  const res = await fetch(`${API_URL}/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load stats');
  return res.json();
}

async function fetchPendingResetRequests(token: string | null): Promise<ResetRequest[]> {
  if (!token) return [];
  try {
    const res = await fetch(`${API_URL}/auth/reset-requests`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.requests || []).filter((r: ResetRequest) => r.status === 'pending');
  } catch {
    return [];
  }
}

export default function AdminDashboard() {
  const { token } = useAuth();
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['admin-stats', token],
    queryFn: () => fetchStats(token),
    enabled: !!token,
  });

  const { data: pendingResets } = useQuery({
    queryKey: ['pending-reset-requests', token],
    queryFn: () => fetchPendingResetRequests(token),
    enabled: !!token,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const cards = stats
    ? [
        { label: 'Hotels', value: stats.totalHotels, icon: Building2 },
        { label: 'Confirmed Bookings', value: stats.confirmedBookings, icon: CalendarCheck },
        { label: 'Cancelled Bookings', value: stats.cancelledBookings, icon: XCircle },
        { label: 'Registered Users', value: stats.totalUsers, icon: Users },
        {
          label: 'Confirmed Revenue',
          value: formatCurrency(stats.revenueConfirmed),
          icon: DollarSign,
          isText: true,
        },
      ]
    : [];

  return (
    <div>
      <h1 className="font-display text-3xl text-foreground">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Live overview of Lumora's hotels, bookings, and guests.
      </p>

      {/* Pending Reset Requests Alert */}
      {pendingResets && pendingResets.length > 0 && (
        <Link
          to="/admin/reset-requests"
          className="mt-6 flex items-center gap-3 rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-4 text-sm hover:bg-yellow-400/15"
        >
          <KeyRound className="h-5 w-5 text-yellow-400" />
          <div className="flex-1">
            <p className="font-medium text-yellow-400">
              {pendingResets.length} Permintaan Reset Password Menunggu
            </p>
            <p className="text-xs text-yellow-400/70">
              Klik untuk melihat dan menyetujui permintaan
            </p>
          </div>
        </Link>
      )}

      {isLoading ? (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-card" />
          ))}
        </div>
      ) : error ? (
        <div className="mt-8 rounded-2xl border border-white/10 bg-card p-8 text-center text-muted-foreground">
          Couldn't load stats. Make sure the backend is running and you're signed in as an admin.
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-white/10 bg-card p-6">
              <card.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
              <p className={card.isText ? 'mt-4 font-display text-2xl text-gradient-gold' : 'mt-4 font-display text-3xl text-foreground'}>
                {card.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{card.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
