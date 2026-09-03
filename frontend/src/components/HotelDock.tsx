import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  Search,
  Building2,
  Heart,
  CalendarCheck,
  User,
} from 'lucide-react';
import { Dock, DockIcon, DockItem, DockLabel } from '@/components/ui/dock';

type NavItem = {
  title: string;
  href: string;
  icon: typeof Home;
};

const navigation: NavItem[] = [
  { title: 'Home', href: '/', icon: Home },
  { title: 'Search', href: '/hotels', icon: Search },
  { title: 'Hotels', href: '/hotels', icon: Building2 },
  { title: 'Favorites', href: '/favorites', icon: Heart },
  { title: 'Bookings', href: '/bookings', icon: CalendarCheck },
  { title: 'Profile', href: '/profile', icon: User },
];

/** Shows the Dock near the top of the page or while scrolling up;
 * hides it while actively scrolling down, so it never sits on top
 * of content the user is trying to reach. */
function useScrollVisibility() {
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastY.current = window.scrollY;

    function handleScroll() {
      if (ticking.current) return;
      ticking.current = true;

      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastY.current;
        const nearTop = currentY < 80;
        const nearBottom =
          window.innerHeight + currentY >= document.documentElement.scrollHeight - 40;

        if (nearTop || nearBottom) {
          setVisible(true);
        } else if (delta > 8) {
          setVisible(false); // scrolling down
        } else if (delta < -8) {
          setVisible(true); // scrolling up
        }

        lastY.current = currentY;
        ticking.current = false;
      });
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return visible;
}

export default function HotelDock() {
  const navigate = useNavigate();
  const location = useLocation();
  const visible = useScrollVisibility();

  const activeIndex = navigation.findIndex((item) => item.href === location.pathname);

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-2 left-1/2 z-50 -translate-x-1/2"
    >
      <motion.div
        animate={{ y: visible ? 0 : 96, opacity: visible ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        style={{ pointerEvents: visible ? 'auto' : 'none' }}
      >
        <Dock
          className="glass-panel !bg-black/60 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.6)]"
          magnification={70}
          distance={140}
          panelHeight={58}
        >
          {navigation.map((item, index) => {
            const isActive = index === activeIndex;
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                aria-label={item.title}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => navigate(item.href)}
                className="cursor-pointer"
              >
                <DockItem
                  className={
                    isActive
                      ? 'bg-primary/20 rounded-full'
                      : 'hover:bg-white/5 rounded-full transition-colors'
                  }
                >
                  <DockLabel className="border-primary/20 bg-black/80 text-foreground">
                    {item.title}
                  </DockLabel>
                  <DockIcon>
                    <Icon
                      className={cnIcon(isActive)}
                      strokeWidth={1.75}
                    />
                  </DockIcon>
                </DockItem>
              </div>
            );
          })}
        </Dock>
      </motion.div>
    </nav>
  );
}

function cnIcon(isActive: boolean) {
  return isActive
    ? 'h-full w-full text-primary'
    : 'h-full w-full text-foreground/80';
}
