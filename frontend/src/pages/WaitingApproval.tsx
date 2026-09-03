import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function WaitingApproval() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | 'expired'>('pending');
  const [token, setToken] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId) {
      navigate('/forgot-password');
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/reset-status/${requestId}`);
        
        if (!res.ok) {
          throw new Error('Gagal mengecek status');
        }

        const data = await res.json();
        setStatus(data.status);

        if (data.status === 'approved' && data.token) {
          setToken(data.token);
          setTimeout(() => {
            navigate(`/reset-password?token=${data.token}`);
          }, 2000);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 3000);

    return () => clearInterval(interval);
  }, [requestId, navigate]);

  if (status === 'approved') {
    return (
      <div className="container flex min-h-screen max-w-md flex-col items-center justify-center pb-24 pt-32 text-center">
        <CheckCircle className="h-16 w-16 text-green-400" />
        <h1 className="mt-4 font-display text-2xl text-foreground">Request Disetujui!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Anda akan diarahkan ke halaman reset password...
        </p>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="container flex min-h-screen max-w-md flex-col items-center justify-center pb-24 pt-32 text-center">
        <XCircle className="h-16 w-16 text-red-400" />
        <h1 className="mt-4 font-display text-2xl text-foreground">Request Ditolak</h1>
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
        <XCircle className="h-16 w-16 text-red-400" />
        <h1 className="mt-4 font-display text-2xl text-foreground">Request Kadaluarsa</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Permintaan reset password Anda telah kadaluarsa.
        </p>
        <button
          onClick={() => navigate('/forgot-password')}
          className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
        >
          Buat Request Baru
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container flex min-h-screen max-w-md flex-col items-center justify-center pb-24 pt-32 text-center">
        <XCircle className="h-16 w-16 text-red-400" />
        <h1 className="mt-4 font-display text-2xl text-foreground">Terjadi Kesalahan</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <button
          onClick={() => navigate('/forgot-password')}
          className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
        >
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="container flex min-h-screen max-w-md flex-col items-center justify-center pb-24 pt-32 text-center">
      <div className="relative">
        <Clock className="h-16 w-16 text-primary animate-pulse" />
      </div>
      <h1 className="mt-4 font-display text-2xl text-foreground">Menunggu Persetujuan Admin</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Permintaan reset password Anda sedang diproses oleh admin.
        <br />
        Halaman ini akan otomatis terupdate.
      </p>
      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
        Mengecek status...
      </div>
    </div>
  );
}
