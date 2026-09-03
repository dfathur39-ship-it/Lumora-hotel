import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-background pb-28 pt-16">
      <div className="container grid grid-cols-2 gap-8 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <span className="font-display text-lg uppercase tracking-[0.3em] text-foreground">
            Lumora
          </span>
          <p className="mt-3 text-sm text-muted-foreground">Stay somewhere extraordinary.</p>
          <div className="mt-4 flex gap-3 text-muted-foreground">
            <Instagram className="h-4 w-4" aria-label="Instagram" />
            <Facebook className="h-4 w-4" aria-label="Facebook" />
            <Twitter className="h-4 w-4" aria-label="Twitter" />
          </div>
        </div>

        <FooterCol
          title="Explore"
          links={[
            { label: 'Hotels', href: '/hotels' },
            { label: 'Favorites', href: '/favorites' },
            { label: 'Bookings', href: '/bookings' },
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            { label: 'About', href: '/' },
            { label: 'Careers', href: '/' },
            { label: 'Press', href: '/' },
          ]}
        />
        <FooterCol
          title="Support"
          links={[
            { label: 'Contact', href: '/' },
            { label: 'FAQ', href: '/' },
            { label: 'Privacy Policy', href: '/' },
          ]}
        />
      </div>
      <div className="container mt-12 border-t border-white/10 pt-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Lumora Hotels. All rights reserved.
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="text-sm font-medium text-foreground">{title}</h4>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <Link to={l.href} className="text-sm text-muted-foreground hover:text-primary">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
