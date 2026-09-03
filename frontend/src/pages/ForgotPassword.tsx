import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirim permintaan');
      }

      if (data.requestId) {
        navigate(`/waiting-approval/${data.requestId}`);
      } else {
        setSuccess(true);
        setEmail('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container flex min-h-screen max-w-md flex-col justify-center pb-24 pt-32">
      <Link 
        to="/login" 
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke login
      </Link>

      <h1 className="font-display text-3xl text-foreground">Lupa Sandi</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Masukkan email Anda dan kami akan mengirimkan permintaan reset password ke admin untuk disetujui.
      </p>

      {success ? (
        <div className="mt-8 rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm text-foreground">
          <p className="font-medium">Permintaan berhasil dikirim!</p>
          <p className="mt-1 text-muted-foreground">
            Jika email Anda terdaftar, permintaan reset password telah dikirim ke admin untuk disetujui. 
            Anda akan menerima notifikasi setelah admin menyetujui permintaan Anda.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@example.com"
              className="rounded-lg border border-white/10 bg-card px-3 py-2.5 text-foreground outline-none focus:border-primary/50"
            />
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {loading ? 'Mengirim…' : 'Kirim Permintaan'}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Ingat password Anda?{' '}
        <Link to="/login" className="text-primary">
          Sign in
        </Link>
      </p>
    </div>
  );
}
