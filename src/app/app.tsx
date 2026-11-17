import { useState, type ReactNode } from 'react';

import { signOut, useSession } from '@/auth/session';
import { pendingUploads } from '@/db/database';

import { CalendarView } from './calendar/calendar';
import { HabitsView } from './habits';
import { CalendarIcon, HabitsIcon, ListsIcon } from './icons';
import { ListsView } from './lists';

const VIEWS = {
  calendar: { label: 'Calendar', icon: <CalendarIcon /> },
  habits: { label: 'Habits', icon: <HabitsIcon /> },
  lists: { label: 'Lists', icon: <ListsIcon /> },
} satisfies Record<string, { label: string; icon: ReactNode }>;
type View = keyof typeof VIEWS;

async function confirmSignOut() {
  const unsynced = await pendingUploads();
  const message = unsynced
    ? `${unsynced} change(s) haven’t been backed up yet and will be lost. Sign out anyway?`
    : 'Sign out? Your data stays in your account.';
  if (window.confirm(message)) await signOut();
}

export function App() {
  const [view, setView] = useState<View>('calendar');
  const session = useSession();

  return (
    <div className="flex h-screen flex-col bg-app">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-5">
        <p className="font-rounded text-title3 font-bold text-ink">Planner</p>
        <div className="flex items-center gap-4">
          {session?.user.email && (
            <p className="truncate text-footnote text-muted">{session.user.email}</p>
          )}
          <button
            type="button"
            onClick={() => void confirmSignOut()}
            className="rounded-full border border-border px-3 py-1 text-footnote font-semibold text-danger hover:bg-app"
          >
            Sign out
          </button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <nav className="flex w-16 shrink-0 flex-col items-center gap-2 border-r border-border bg-card py-3">
          {(Object.keys(VIEWS) as View[]).map((key) => (
            <button
              key={key}
              type="button"
              title={VIEWS[key].label}
              aria-label={VIEWS[key].label}
              aria-current={view === key ? 'page' : undefined}
              onClick={() => setView(key)}
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                view === key ? 'bg-accent text-on-accent' : 'text-muted hover:bg-app hover:text-ink'
              }`}
            >
              {VIEWS[key].icon}
            </button>
          ))}
        </nav>
        <main className="min-w-0 flex-1">
          {view === 'calendar' ? (
            <CalendarView />
          ) : (
            <div className="h-full overflow-y-auto">
              <div className="mx-auto max-w-3xl px-8 py-10">
                {view === 'habits' && <HabitsView />}
                {view === 'lists' && <ListsView />}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
