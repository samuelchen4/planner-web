import { useState } from 'react';

import { signOut, useSession } from '@/auth/session';
import { pendingUploads } from '@/db/database';

import { HabitsView } from './habits';
import { ListsView } from './lists';
import { TodayView } from './today';

const VIEWS = { today: 'Today', habits: 'Habits', lists: 'Lists' } as const;
type View = keyof typeof VIEWS;

async function confirmSignOut() {
  const unsynced = await pendingUploads();
  const message = unsynced
    ? `${unsynced} change(s) haven’t been backed up yet and will be lost. Sign out anyway?`
    : 'Sign out? Your data stays in your account.';
  if (window.confirm(message)) await signOut();
}

export function App() {
  const [view, setView] = useState<View>('today');
  const session = useSession();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border p-4">
        <p className="mb-6 px-3 font-rounded text-title3 font-bold text-ink">Planner</p>
        <nav className="flex flex-col gap-1">
          {(Object.keys(VIEWS) as View[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              className={`rounded-xl px-3 py-2 text-left text-callout ${
                view === key ? 'bg-accent/10 font-semibold text-accent' : 'text-ink hover:bg-card'
              }`}
            >
              {VIEWS[key]}
            </button>
          ))}
        </nav>
        <div className="mt-auto space-y-2 px-3">
          {session?.user.email && (
            <p className="truncate text-footnote text-muted">{session.user.email}</p>
          )}
          <button
            type="button"
            onClick={() => void confirmSignOut()}
            className="text-footnote text-danger"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-8 py-10">
          {view === 'today' && <TodayView />}
          {view === 'habits' && <HabitsView />}
          {view === 'lists' && <ListsView />}
        </div>
      </main>
    </div>
  );
}
