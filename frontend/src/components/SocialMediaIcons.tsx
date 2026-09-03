import { useState, useEffect } from 'react';
import { Mail, Instagram, MessageSquare, Phone, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

type SocialMedia = {
  id: string;
  whatsapp?: string;
  instagram?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
};

export default function SocialMediaIcons() {
  const [socials, setSocials] = useState<SocialMedia | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSocials() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/contact`);
        if (res.ok) {
          const data = await res.json();
          setSocials(data);
        }
      } catch {
        // Fallback - no socials displayed
      } finally {
        setLoading(false);
      }
    }
    fetchSocials();
  }, []);

  if (loading) return null;

  const icons = [
    { icon: MessageSquare, href: socials?.whatsapp, label: 'WhatsApp' },
    { icon: Instagram, href: socials?.instagram, label: 'Instagram' },
    { icon: Mail, href: socials?.email, label: 'Email' },
  ].filter((item) => item.href);

  if (icons.length === 0) return null;

  return (
    <div className="flex items-center gap-4">
      {icons.map(({ icon: Icon, href, label }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition-colors hover:bg-primary"
          aria-label={label}
        >
          <Icon className="h-5 w-5 text-foreground transition-transform group-hover:scale-110" />
        </a>
      ))}
    </div>
  );
}
