import { useState } from 'react';

import { signInWithApple } from './session';

export function SignIn() {
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    setError(null);
    try {
      await signInWithApple();
    } catch (e) {
      console.warn('[auth] Sign in with Apple failed:', e);
      setError('Signing in didn’t work. Please try again.');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 rounded-card bg-card p-8 shadow-sm">
        <div className="space-y-2">
          <h1 className="font-rounded text-large-title font-bold text-ink">Planner</h1>
          <p className="text-body text-muted">
            Your day, tasks and habits in one place, in sync with your iPhone.
          </p>
        </div>
        {error && <p className="text-footnote text-danger">{error}</p>}
        <button
          type="button"
          onClick={() => void onClick()}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-black text-body font-medium text-white dark:bg-white dark:text-black"
        >
          <svg viewBox="0 0 17 20" className="h-5 w-5 fill-current" aria-hidden="true">
            <path d="M14.06 10.62c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.73-1.35-.14-2.64.8-3.33.8-.69 0-1.75-.78-2.88-.76-1.48.02-2.85.86-3.61 2.19-1.54 2.67-.39 6.63 1.11 8.8.73 1.06 1.6 2.25 2.75 2.21 1.1-.04 1.52-.71 2.85-.71 1.33 0 1.71.71 2.88.69 1.19-.02 1.94-1.08 2.67-2.15.84-1.23 1.19-2.42 1.21-2.48-.03-.01-2.32-.89-2.35-3.55zM11.89 4.16c.61-.74 1.02-1.76.91-2.78-.88.04-1.94.59-2.57 1.32-.56.65-1.06 1.69-.93 2.69.98.08 1.98-.5 2.59-1.23z" />
          </svg>
          Sign in with Apple
        </button>
      </div>
    </main>
  );
}
