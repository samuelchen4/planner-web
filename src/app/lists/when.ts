import type { Task } from '@/db/schema';
import { dateKey, formatTime, minutesOfDay, parseDateKey, relativeDayName } from '@/lib/time';

export function listDateKey(list: Task): string | null {
  return list.start_at ? dateKey(new Date(list.start_at)) : list.all_day_date;
}

export function whenLabel(list: Task): string | null {
  const key = listDateKey(list);
  if (!key) return null;
  const name = relativeDayName(parseDateKey(key));
  return list.start_at ? `${name}, ${formatTime(minutesOfDay(list.start_at))}` : name;
}
