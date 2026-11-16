import type { HabitDay } from '@/db/schema';

import { addDays, dateKey } from '@/lib/time';

export function recentDays(today: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
}

export function doneByHabit(days: HabitDay[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const d of days) {
    if (!d.done_at) continue;
    const set = map.get(d.habit_id) ?? new Set<string>();
    set.add(d.date);
    map.set(d.habit_id, set);
  }
  return map;
}

export function streak(days: Set<string>, today: Date): number {
  let d = days.has(dateKey(today)) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(dateKey(d))) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}
