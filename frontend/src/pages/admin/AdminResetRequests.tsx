import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Check, X, Clock, Copy, CheckCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

type ResetRequest = {
  id: string;
  userId: string;
  token: string;
  status: 'pending' | 'approved' | 'rejected' | 'used' | 'expired';
  requestedAt: string;
  approvedAt?: string;
  expiresAt: string;
  usedAt?: string;
};

export default function AdminResetRequests() {
  const { token } = useAuth();
  const [requests, setRequests] = useState<ResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    try {
      console.log('Fetching reset requests with token:', token);
      const res = await fetch(`${API_URL}/auth/reset-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('Response status:', res.status);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error(errorData.error || 'Gagal memuat permintaan reset password');
      }

      const data = await res.json();
      console.log('Reset requests data:', data);
      setRequests(data.requests || []);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      const res = await fetch(`${API_URL}/auth/reset-requests/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Gagal menyetujui permintaan');
      }

      await fetchRequests();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
    }
  }

  async function handleReject(id: string) {
    try {
      const res = await fetch(`${API_URL}/auth/reset-requests/${id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Gagal menolak permintaan');
      }

      await fetchRequests();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
    }
  }

  function copyToken(token: string, id: string) {
    const resetUrl = `${window.location.origin}/reset-password?token=${token}`;
    navigator.clipboard.writeText(resetUrl);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'approved':
        return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'rejected':
        return 'text-red-400 bg-red-400/10 border-red-400/30';
      case 'used':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'expired':
        return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
      default:
        return 'text-muted-foreground bg-white/5 border-white/10';
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'pending':
        return 'Menunggu';
      case 'approved':
        return 'Disetujui';
      case 'rejected':
        return 'Ditolak';
      case 'used':
        return 'Sudah Digunakan';
      case 'expired':
        return 'Kadaluarsa';
      default:
        return status;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Memuat permintaan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-400">
        {error}
      </div>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const otherRequests = requests.filter((r) => r.status !== 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-foreground">Permintaan Reset Password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola permintaan reset password dari user
        </p>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-medium text-yellow-400">
            <Clock className="h-4 w-4" />
            Menunggu Persetujuan ({pendingRequests.length})
          </h2>
          {pendingRequests.map((request) => (
            <div
              key={request.id}
              className="rounded-xl border border-white/10 bg-card p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">User ID: {request.userId}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Diminta: {formatDate(request.requestedAt)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Kadaluarsa: {formatDate(request.expiresAt)}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusColor(
                    request.status
                  )}`}
                >
                  {getStatusLabel(request.status)}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(request.id)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Check className="h-4 w-4" />
                  Setujui
                </button>
                <button
                  onClick={() => handleReject(request.id)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-400/30 px-4 py-2 text-sm text-red-400 hover:bg-red-400/10"
                >
                  <X className="h-4 w-4" />
                  Tolak
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approved Requests */}
      {otherRequests.filter((r) => r.status === 'approved').length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-medium text-green-400">
            <CheckCircle className="h-4 w-4" />
            Disetujui
          </h2>
          {otherRequests
            .filter((r) => r.status === 'approved')
            .map((request) => (
              <div
                key={request.id}
                className="rounded-xl border border-white/10 bg-card p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">User ID: {request.userId}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Diminta: {formatDate(request.requestedAt)}
                    </p>
                    {request.approvedAt && (
                      <p className="text-xs text-muted-foreground">
                        Disetujui: {formatDate(request.approvedAt)}
                      </p>
                    )}
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusColor(
                      request.status
                    )}`}
                  >
                    {getStatusLabel(request.status)}
                  </span>
                </div>

                <div className="rounded-lg border border-white/10 bg-background/50 p-3">
                  <p className="text-xs text-muted-foreground mb-2">Reset Link:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 overflow-x-auto text-xs text-foreground/70">
                      {window.location.origin}/reset-password?token={request.token}
                    </code>
                    <button
                      onClick={() => copyToken(request.token, request.id)}
                      className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-foreground hover:border-primary/30 hover:text-primary"
                    >
                      {copiedToken === request.id ? (
                        <>
                          <Check className="h-3 w-3" />
                          Tersalin
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Salin
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Other Requests */}
      {otherRequests.filter((r) => r.status !== 'approved').length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Riwayat</h2>
          {otherRequests
            .filter((r) => r.status !== 'approved')
            .map((request) => (
              <div
                key={request.id}
                className="rounded-xl border border-white/10 bg-card p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">User ID: {request.userId}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Diminta: {formatDate(request.requestedAt)}
                    </p>
                    {request.approvedAt && (
                      <p className="text-xs text-muted-foreground">
                        Diproses: {formatDate(request.approvedAt)}
                      </p>
                    )}
                    {request.usedAt && (
                      <p className="text-xs text-muted-foreground">
                        Digunakan: {formatDate(request.usedAt)}
                      </p>
                    )}
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusColor(
                      request.status
                    )}`}
                  >
                    {getStatusLabel(request.status)}
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}

      {requests.length === 0 && (
        <div className="rounded-lg border border-white/10 bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">Belum ada permintaan reset password</p>
        </div>
      )}
    </div>
  );
}
