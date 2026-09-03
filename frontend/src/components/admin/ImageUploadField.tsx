import { useRef, useState } from 'react';
import { Link2, Upload, Loader2, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

type Mode = 'url' | 'upload';

export default function ImageUploadField({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  className?: string;
}) {
  const { token } = useAuth();
  const [mode, setMode] = useState<Mode>('url');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`${API_URL}/admin/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Upload failed');
      }

      const data = await res.json();
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed — is the backend running?');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="flex gap-1 rounded-full border border-white/10 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode('url')}
            className={cn(
              'flex items-center gap-1 rounded-full px-2.5 py-1 transition-colors',
              mode === 'url' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'
            )}
          >
            <Link2 className="h-3 w-3" /> URL
          </button>
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={cn(
              'flex items-center gap-1 rounded-full px-2.5 py-1 transition-colors',
              mode === 'upload' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'
            )}
          >
            <Upload className="h-3 w-3" /> Upload
          </button>
        </div>
      </div>

      <div className="mt-1.5">
        {mode === 'url' ? (
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-foreground outline-none focus:border-primary/50"
          />
        ) : (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              disabled={uploading}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-primary/20 file:px-4 file:py-2 file:text-xs file:font-medium file:text-primary hover:file:bg-primary/30"
            />
            {uploading && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Uploading…
              </p>
            )}
          </div>
        )}
        {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
      </div>

      {value && (
        <div className="relative mt-2 inline-block">
          <img src={value} alt="Preview" className="h-20 w-32 rounded-lg object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Remove image"
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/80 text-white hover:bg-red-500"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
