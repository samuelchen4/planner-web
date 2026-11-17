import type { ReactNode } from 'react';

function Icon({ children, className = 'h-6 w-6' }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} fill-none stroke-current`}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const CalendarIcon = () => (
  <Icon>
    <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Icon>
);

export const HabitsIcon = () => (
  <Icon>
    <path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.1 2-5.2 3.6-7 .5 1.6 1.4 2.6 2.4 3 0-3 1.3-5.6 3.6-7.3-.3 2.6.9 4.3 2.2 5.9 1.1 1.4 1.7 2.8 1.7 4.6 0 4-3 7-7 7z" />
  </Icon>
);

export const ListsIcon = () => (
  <Icon>
    <path d="M9 6.5h11M9 12h11M9 17.5h11" />
    <circle cx="4.5" cy="6.5" r=".6" />
    <circle cx="4.5" cy="12" r=".6" />
    <circle cx="4.5" cy="17.5" r=".6" />
  </Icon>
);

export const ChevronLeft = () => (
  <Icon className="h-4 w-4">
    <path d="M15 5l-7 7 7 7" />
  </Icon>
);

export const ChevronRight = () => (
  <Icon className="h-4 w-4">
    <path d="M9 5l7 7-7 7" />
  </Icon>
);

export const ListMark = () => (
  <span className="ml-1.5 shrink-0 text-muted" aria-label="List">
    <Icon className="h-3 w-3">
      <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
    </Icon>
  </span>
);

export const NoteMark = () => (
  <span className="ml-1.5 shrink-0 text-muted" aria-label="Has notes">
    <Icon className="h-3 w-3">
      <rect x="4" y="3" width="16" height="18" rx="2.5" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </Icon>
  </span>
);
