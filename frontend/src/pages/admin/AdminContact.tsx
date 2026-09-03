import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, Instagram, MessageSquare, X, Phone, MapPin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

type Contact = {
  id: string;
  whatsapp?: string;
  instagram?: string;
  tiktok?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
};

const emptyForm = {
  whatsapp: '',
  instagram: '',
  tiktok: '',
  email: '',
  phone: '',
  address: '',
  isActive: true,
};

export default function AdminContact() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: contact, isLoading } = useQuery({
    queryKey: ['contact'],
    queryFn: async (): Promise<Contact | null> => {
      const res = await fetch(`${API_URL}/contact`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return res.json();
    },
  });

  useEffect(() => {
    if (contact) {
      setForm({
        whatsapp: contact.whatsapp || '',
        instagram: contact.instagram || '',
        tiktok: contact.tiktok || '',
        email: contact.email || '',
        phone: contact.phone || '',
        address: contact.address || '',
        isActive: contact.isActive,
      });
    }
  }, [contact]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/contact`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update contact');
      }
      queryClient.invalidateQueries({ queryKey: ['contact'] });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  const socialLinks = [
    { icon: MessageSquare, label: 'WhatsApp', value: form.whatsapp },
    { icon: Instagram, label: 'Instagram', value: form.instagram },
    { icon: Mail, label: 'Email', value: form.email },
    { icon: Phone, label: 'Phone', value: form.phone },
    { icon: MapPin, label: 'Address', value: form.address },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-foreground">Contact & Social Media</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage contact information and social media links</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {showForm ? <X className="h-4 w-4" /> : '+ Edit'}
        </button>
      </div>

      {!showForm && !isLoading && !contact && (
        <div className="mt-8 rounded-2xl border border-white/10 bg-card p-8 text-center">
          <p className="text-muted-foreground">No contact information found.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 rounded-xl bg-primary px-6 py-2 text-sm font-medium text-primary-foreground"
          >
            Add Contact Information
          </button>
        </div>
      )}

      {showForm ? (
        <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-white/10 bg-card p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {socialLinks.map((item) => (
              <label key={item.label} className="flex flex-col gap-1.5 text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-foreground">
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <input
                    type={item.label === 'Email' ? 'email' : 'text'}
                    value={form[item.label.toLowerCase() as keyof typeof form] as string}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [item.label.toLowerCase()]: e.target.value,
                      })
                    }
                    placeholder={`Enter ${item.label.toLowerCase()}...`}
                    className="flex-1 bg-transparent outline-none"
                  />
                </div>
              </label>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-white/10 bg-card text-primary focus:ring-primary"
            />
            <label htmlFor="isActive" className="text-sm text-muted-foreground">
              Active (show on website)
            </label>
          </div>

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {submitting ? 'Saving...' : 'Save Contact Information'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-white/15 px-4 py-3 text-sm text-foreground hover:border-red-400/40 hover:text-red-400"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        contact && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-card p-6">
            <h2 className="font-display text-xl text-foreground">Current Contact Information</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {socialLinks.map((item) => {
                const value = form[item.label.toLowerCase() as keyof typeof form] as string;
                if (!value) return null;
                return (
                  <div key={item.label} className="flex items-center gap-2 text-sm">
                    <item.icon className="h-4 w-4 text-primary" />
                    <span className="text-foreground">{value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}
    </div>
  );
}
