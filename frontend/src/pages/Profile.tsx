import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import { User, ShieldCheck, Edit2, Lock, X, Check, Eye, EyeOff } from 'lucide-react';

export default function Profile() {
  const { user, token, logout, refreshAuth, updateProfile, changePassword } = useAuth();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setProfileLoading(true);

    try {
      await updateProfile(name, email);
      setProfileSuccess(true);
      setIsEditingProfile(false);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Gagal update profile');
    } finally {
      setProfileLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError('Password baru harus minimal 8 karakter');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Password baru tidak cocok');
      return;
    }

    setPasswordLoading(true);

    try {
      refreshAuth();
      if (!token) {
        throw new Error('Not authenticated');
      }
      await changePassword(oldPassword, newPassword);
      setPasswordSuccess(true);
      setIsChangingPassword(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal ganti password';
      setPasswordError(errorMessage);
    } finally {
      setPasswordLoading(false);
    }
  }

  function cancelEditProfile() {
    setIsEditingProfile(false);
    setName(user?.name || '');
    setEmail(user?.email || '');
    setProfileError(null);
  }

  function cancelChangePassword() {
    setIsChangingPassword(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
  }

  if (!user) {
    return (
      <div className="container flex flex-col items-center pt-40 pb-24 text-center">
        <User className="h-8 w-8 text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Sign in to view your profile.</p>
        <Link to="/login" className="mt-4 rounded-full bg-primary px-6 py-2.5 text-sm text-primary-foreground">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl pt-32 pb-24">
      {/* Profile Card */}
      <div className="glass-panel rounded-2xl p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 font-display text-2xl text-primary">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="font-display text-xl text-foreground">{user.name}</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          {!isEditingProfile && (
            <button
              onClick={() => setIsEditingProfile(true)}
              className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-foreground hover:border-primary/30 hover:text-primary"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </button>
          )}
        </div>

        {profileSuccess && (
          <div className="mt-4 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-foreground flex items-center gap-2">
            <Check className="h-4 w-4" />
            Profile berhasil diupdate!
          </div>
        )}

        {isEditingProfile ? (
          <form onSubmit={handleUpdateProfile} className="mt-6 space-y-4 border-t border-white/10 pt-6">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Nama</span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-lg border border-white/10 bg-card px-3 py-2.5 text-foreground outline-none focus:border-primary/50"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-lg border border-white/10 bg-card px-3 py-2.5 text-foreground outline-none focus:border-primary/50"
              />
            </label>

            {profileError && <p className="text-sm text-red-400">{profileError}</p>}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={profileLoading}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                {profileLoading ? 'Menyimpan…' : 'Simpan'}
              </button>
              <button
                type="button"
                onClick={cancelEditProfile}
                className="flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm text-foreground/80 hover:border-red-400/40 hover:text-red-400"
              >
                <X className="h-4 w-4" />
                Batal
              </button>
            </div>
          </form>
        ) : (
          <dl className="mt-8 space-y-3 border-t border-white/10 pt-6 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Role</dt>
              <dd className="capitalize text-foreground">{user.role}</dd>
            </div>
          </dl>
        )}

        {user.role === 'admin' && (
          <Link
            to="/admin"
            className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-primary/30 py-3 text-sm text-primary hover:bg-primary/10"
          >
            <ShieldCheck className="h-4 w-4" />
            Open Admin Panel
          </Link>
        )}
      </div>

      {/* Change Password Card */}
      <div className="glass-panel rounded-2xl p-8 mt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-display text-lg text-foreground">Ganti Password</h2>
          </div>
          {!isChangingPassword && (
            <button
              onClick={() => setIsChangingPassword(true)}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-foreground hover:border-primary/30 hover:text-primary"
            >
              Ubah
            </button>
          )}
        </div>

        {passwordSuccess && (
          <div className="mt-4 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-foreground flex items-center gap-2">
            <Check className="h-4 w-4" />
            Password berhasil diubah!
          </div>
        )}

        {isChangingPassword ? (
          <form onSubmit={handleChangePassword} className="mt-6 space-y-4 border-t border-white/10 pt-6">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Password Lama</span>
              <div className="relative">
                <input
                  type={showOldPassword ? "text" : "password"}
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-card px-3 py-2.5 pr-10 text-foreground outline-none focus:border-primary/50"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showOldPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </label>
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
              <span className="text-muted-foreground">Konfirmasi Password Baru</span>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang password baru"
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

            {passwordError && <p className="text-sm text-red-400">{passwordError}</p>}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={passwordLoading}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                {passwordLoading ? 'Mengubah…' : 'Ubah Password'}
              </button>
              <button
                type="button"
                onClick={cancelChangePassword}
                className="flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm text-foreground/80 hover:border-red-400/40 hover:text-red-400"
              >
                <X className="h-4 w-4" />
                Batal
              </button>
            </div>
          </form>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Klik tombol "Ubah" untuk mengganti password Anda.
          </p>
        )}
      </div>

      {/* Logout Button */}
      <button
        onClick={logout}
        className="mt-6 w-full rounded-xl border border-white/15 py-3 text-sm text-foreground/80 hover:border-red-400/40 hover:text-red-400"
      >
        Sign out
      </button>
    </div>
  );
}
