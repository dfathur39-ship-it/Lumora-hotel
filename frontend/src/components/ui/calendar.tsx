import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const CalendarDay: React.FC<{ day: number | string; isHeader?: boolean }> = ({ day, isHeader }) => {
  // Deterministic-ish "highlighted day" look without relying on Math.random
  // on every render (avoids the calendar visually reshuffling on re-render).
  const highlighted = !isHeader && typeof day === 'number' && day % 7 === 3;

  return (
    <div
      className={`col-span-1 row-span-1 flex h-8 w-8 items-center justify-center ${
        isHeader ? '' : 'rounded-xl'
      } ${highlighted ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
    >
      <span className={`font-medium ${isHeader ? 'text-xs' : 'text-sm'}`}>{day}</span>
    </div>
  );
};

type CalendarProps = {
  /** Where "Book Now" sends the guest. Internal paths (starting with "/")
   * use client-side routing; anything else opens in a new tab. */
  bookingLink?: string;
};

export function Calendar({ bookingLink = 'https://cal.com/lumorahotels/concierge' }: CalendarProps) {
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();
  const firstDayOfMonth = new Date(currentYear, currentDate.getMonth(), 1);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = new Date(currentYear, currentDate.getMonth() + 1, 0).getDate();

  const renderCalendarDays = () => {
    const days: React.ReactNode[] = [
      ...dayNames.map((day) => <CalendarDay key={`header-${day}`} day={day} isHeader />),
      // Array.from (not Array(n).map) so the leading empty cells actually render —
      // Array(n) alone creates holes that .map() silently skips.
      ...Array.from({ length: firstDayOfWeek }).map((_, i) => (
        <div key={`empty-start-${i}`} className="col-span-1 row-span-1 h-8 w-8" />
      )),
      ...Array.from({ length: daysInMonth }).map((_, i) => <CalendarDay key={`date-${i + 1}`} day={i + 1} />),
    ];
    return days;
  };

  return (
    <BentoCard height="h-auto" linkTo={bookingLink}>
      <div className="grid h-full gap-5">
        <div>
          <h2 className="mb-4 font-display text-lg text-foreground md:text-3xl">
            Planning something special?
          </h2>
          <p className="mb-2 text-xs text-muted-foreground md:text-base">
            Talk to a Lumora concierge about bespoke itineraries, private rates, and
            room upgrades.
          </p>
          <Button className="mt-3 rounded-2xl">Book Now</Button>
        </div>
        <div className="transition-all duration-500 ease-out md:group-hover:-right-12 md:group-hover:top-5">
          <div className="h-full w-full max-w-[550px] rounded-[24px] border border-white/10 p-2 transition-colors duration-100 group-hover:border-primary/40">
            <div
              className="h-full rounded-2xl border-2 border-white/5 p-3"
              style={{ boxShadow: '0px 2px 1.5px 0px rgba(201,161,90,0.15) inset' }}
            >
              <div className="flex items-center space-x-2">
                <p className="text-sm text-foreground">
                  <span className="font-medium">
                    {currentMonth}, {currentYear}
                  </span>
                </p>
                <span className="h-1 w-1 rounded-full bg-muted-foreground">&nbsp;</span>
                <p className="text-xs text-muted-foreground">30 min call</p>
              </div>
              <div className="mt-4 grid grid-cols-7 grid-rows-5 gap-2 px-4">{renderCalendarDays()}</div>
            </div>
          </div>
        </div>
      </div>
    </BentoCard>
  );
}

interface BentoCardProps {
  children: React.ReactNode;
  height?: string;
  rowSpan?: number;
  colSpan?: number;
  className?: string;
  showHoverGradient?: boolean;
  hideOverflow?: boolean;
  linkTo?: string;
}

export function BentoCard({
  children,
  height = 'h-auto',
  rowSpan = 8,
  colSpan = 7,
  className = '',
  showHoverGradient = true,
  hideOverflow = true,
  linkTo,
}: BentoCardProps) {
  const cardContent = (
    <div
      className={`group relative flex flex-col rounded-2xl border border-white/10 bg-card p-6 transition-colors hover:bg-primary/5 ${
        hideOverflow ? 'overflow-hidden' : ''
      } ${height} ${className}`}
      // row-span-N / col-span-N as Tailwind classes only work when N is a literal
      // string Tailwind can see at build time — since these are dynamic props,
      // the actual span is set via inline style instead.
      style={{
        gridRow: `span ${rowSpan} / span ${rowSpan}`,
        gridColumn: `span ${colSpan} / span ${colSpan}`,
      }}
    >
      {linkTo && (
        <div className="absolute bottom-4 right-6 z-[999] flex h-12 w-12 rotate-6 items-center justify-center rounded-full bg-primary opacity-0 transition-all duration-300 ease-in-out group-hover:translate-y-[-8px] group-hover:rotate-0 group-hover:opacity-100">
          <svg className="h-6 w-6 text-primary-foreground" width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17.25 15.25V6.75H8.75"
            />
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 7L6.75 17.25"
            />
          </svg>
        </div>
      )}
      {showHoverGradient && (
        <div className="pointer-events-none absolute inset-0 z-30 select-none bg-gradient-to-tl from-primary/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100" />
      )}
      {children}
    </div>
  );

  if (linkTo) {
    return linkTo.startsWith('/') ? (
      <Link to={linkTo} className="block">
        {cardContent}
      </Link>
    ) : (
      <a href={linkTo} target="_blank" rel="noopener noreferrer" className="block">
        {cardContent}
      </a>
    );
  }

  return cardContent;
}
