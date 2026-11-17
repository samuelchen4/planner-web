import { addDays, dateKey, parseDateKey, startOfWeek } from '@/lib/time';

export function bestStreak(done: Set<string>): number {
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const key of [...done].sort()) {
    run = prev && dateKey(addDays(parseDateKey(prev), 1)) === key ? run + 1 : 1;
    best = Math.max(best, run);
    prev = key;
  }
  return best;
}

export function doneInMonth(done: Set<string>, month: Date): number {
  const prefix = dateKey(month).slice(0, 7);
  let n = 0;
  for (const key of done) if (key.startsWith(prefix)) n++;
  return n;
}

export function monthWeeks(month: Date): Date[][] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const weeks: Date[][] = [];
  for (let start = startOfWeek(first); start <= last; start = addDays(start, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(start, i)));
  }
  return weeks;
}
