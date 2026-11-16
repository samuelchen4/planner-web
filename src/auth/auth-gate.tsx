import type { ReactNode } from 'react';

import { DatabaseProvider } from '@/db/provider';

import { useSession } from './session';
import { SignIn } from './sign-in';

export function AuthGate({ children }: { children: ReactNode }) {
  const session = useSession();
  if (session === undefined) return null;
  if (!session) return <SignIn />;
  return <DatabaseProvider userId={session.user.id}>{children}</DatabaseProvider>;
}
