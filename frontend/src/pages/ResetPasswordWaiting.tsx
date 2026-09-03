import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Clock, XCircle, Loader2, Eye, EyeOff } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

type TokenStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export default function ResetPasswordWaiting() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();

  const [status, setStatus] = useState<TokenStatus>('pending');
  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (!requestId) {
      navigate('/forgot-password');
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/auth/reset-status/${requestId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'approved') {
            setStatus('approved');
            setToken(data.token);
            clearInterval(interval);
          } else if (data.status === 'rejected') {
            setStatus('rejected');
            clearInterval(interval);
          } else if (data.status === 'expired') {
            setStatus('expired');
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [requestId, navigate]);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Password harus minimal 8 karakter');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Password tidak cocok');
      return;
    }

    if (!token) {
      setError('Token tidak valid');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mereset password');
      }

      setResetSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }

  if (resetSuccess) {
    return (
      <div className="container flex min-h-screen max-w-md flex-col items-center justify-center pb-24 pt-32 text-center">
        <CheckCircle className="h-16 w-16 text-primary" />
        <h1 className="mt-4 font-display text-2xl text-foreground">Password Berhasil Direset!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Anda akan diarahkan ke halaman login dalam 3 detik...
        </p>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="container flex min-h-screen max-w-md flex-col items-center justify-center pb-24 pt-32 text-center">
        <div className="rounded-full bg-yellow-400/10 p-6">
          <Clock className="h-12 w-12 animate-pulse text-yellow-400" />
        </div>
        <h1 className="mt-6 font-display text-2xl text-foreground">
          Menunggu Persetujuan Admin
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Permintaan reset password Anda sedang diproses.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Halaman ini akan otomatis update ketika admin menyetujui permintaan Anda.
        </p>
        <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Mengecek status...
        </div>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="container flex min-h-screen max-w-md flex-col items-center justify-center pb-24 pt-32 text-center">
        <div className="rounded-full bg-red-400/10 p-6">
          <XCircle className="h-12 w-12 text-red-400" />
        </div>
        <h1 className="mt-6 font-display text-2xl text-foreground">
          Permintaan Ditolak
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Admin telah menolak permintaan reset password Anda.
        </p>
        <button
          onClick={() => navigate('/forgot-password')}
          className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="container flex min-h-screen max-w-md flex-col items-center justify-center pb-24 pt-32 text-center">
        <div className="rounded-full bg-gray-400/10 p-6">
          <XCircle className="h-12 w-12 text-gray-400" />
        </div>
        <h1 className="mt-6 font-display text-2xl text-foreground">
          Permintaan Kadaluarsa
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Permintaan reset password Anda sudah kadaluarsa.
        </p>
        <button
          onClick={() => navigate('/forgot-password')}
          className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
        >
          Request Ulang
        </button>
      </div>
    );
  }

  if (status === 'approved') {
    return (
      <div className="container flex min-h-screen max-w-md flex-col justify-center pb-24 pt-32">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-primary/10 p-6">
            <CheckCircle className="h-12 w-12 text-primary" />
          </div>
        </div>
        <h1 className="text-center font-display text-2xl text-foreground">
          Permintaan Disetujui!
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Admin telah menyetujui permintaan Anda. Silakan buat password baru.
        </p>

        <form onSubmit={handleResetPassword} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">Password Baru</span>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="w-full rounded-lg border border-white/10 bg-card px-3 py-2.5 pr-10 text-foreground outline-none focus:border-primary/50"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">Konfirmasi Password</span>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang password"
                className="w-full rounded-lg border border-white/10 bg-card px-3 py-2.5 pr-10 text-foreground outline-none focus:border-primary/50"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {loading ? 'Mereset Password…' : 'Reset Password'}
          </button>
        </form>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="container flex min-h-screen max-w-md flex-col items-center justify-center pb-24 pt-32 text-center">
        <div className="rounded-full bg-red-400/10 p-6">
          <XCircle className="h-12 w-12 text-red-400" />
        </div>
        <h1 className="mt-6 font-display text-2xl text-foreground">
          Permintaan Ditolak
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Admin telah menolak permintaan reset password Anda.
        </p>
        <button
          onClick={() => navigate('/forgot-password')}
          className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="container flex min-h-screen max-w-md flex-col items-center justify-center pb-24 pt-32 text-center">
        <div className="rounded-full bg-gray-400/10 p-6">
          <XCircle className="h-12 w-12 text-gray-400" />
        </div>
        <h1 className="mt-6 font-display text-2xl text-foreground">
          Permintaan Kadaluarsa
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Permintaan reset password Anda sudah kadaluarsa.
        </p>
        <button
          onClick={() => navigate('/forgot-password')}
          className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
        >
          Request Ulang
        </button>
      </div>
    );
  }

  return null;
}
