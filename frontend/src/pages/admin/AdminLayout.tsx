import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Building2, CalendarCheck, KeyRound, ContactRound, Hotel } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/hotels', label: 'Hotels', icon: Building2, end: false },
  { to: '/admin/rooms', label: 'Rooms', icon: Hotel, end: false },
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarCheck, end: false },
  { to: '/admin/reset-requests', label: 'Reset Password', icon: KeyRound, end: false },
  { to: '/admin/contact', label: 'Contact', icon: ContactRound, end: false },
];

export default function AdminLayout() {
  return (
    <div className="container grid grid-cols-1 gap-8 pb-24 pt-32 md:grid-cols-[220px_1fr]">
      <aside className="h-fit rounded-2xl border border-white/10 bg-card p-3 md:sticky md:top-28">
        <p className="px-3 py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Admin
        </p>
        <nav className="flex flex-col gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-primary/15 text-primary'
                    : 'text-foreground/70 hover:bg-white/5 hover:text-foreground'
                )
              }
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div>
        <Outlet />
      </div>
    </div>
  );
}
