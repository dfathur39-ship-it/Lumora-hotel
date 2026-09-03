import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { label: 'Hotels', href: '/hotels' },
    { label: 'Destinations', href: '/hotels' },
    { label: 'Favorites', href: '/favorites' },
  ];

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 transition-all duration-300',
        scrolled ? 'glass-panel py-3' : 'bg-transparent py-6'
      )}
    >
      <div className="container flex items-center justify-between">
        <Link to="/" className="font-display text-xl uppercase tracking-[0.3em] text-foreground">
          Lumora
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {links.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="text-sm text-foreground/80 transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          {user ? (
            <button onClick={logout} className="text-sm text-foreground/80 hover:text-primary">
              Sign out
            </button>
          ) : (
            <Link
              to="/login"
              className="rounded-full border border-primary/40 px-5 py-2 text-sm text-primary transition-colors hover:bg-primary/10"
            >
              Sign in
            </Link>
          )}
        </div>

        <button
          className="md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="container mt-4 flex flex-col gap-4 pb-4 md:hidden">
          {links.map((link) => (
            <Link key={link.label} to={link.href} onClick={() => setOpen(false)} className="text-foreground/80">
              {link.label}
            </Link>
          ))}
          {user ? (
            <button onClick={logout} className="text-left text-foreground/80">
              Sign out
            </button>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)} className="text-primary">
              Sign in
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
