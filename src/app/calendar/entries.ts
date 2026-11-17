import type { Task } from '@/db/schema';
import { taskTimes } from '@/db/tasks';
import { dateKey, MINUTES_PER_DAY } from '@/lib/time';

export interface CalendarItem {
  id: string;
  title: string;
  done: boolean;
  isList: boolean;
  hasNotes: boolean;
}

export interface TimedItem extends CalendarItem {
  startMin: number;
  endMin: number;
}

function push<T>(map: Map<string, T[]>, key: string, item: T) {
  const list = map.get(key);
  if (list) list.push(item);
  else map.set(key, [item]);
}

export function bucketByDay(tasks: Task[], todayKey: string) {
  const timed = new Map<string, TimedItem[]>();
  const allDay = new Map<string, CalendarItem[]>();

  for (const task of tasks) {
    if (task.status === 'cancelled' || task.list_id || task.type === 'habit') continue;
    const item: CalendarItem = {
      id: task.id,
      title: task.title,
      done: task.status === 'done',
      isList: task.type === 'list',
      hasNotes: !!task.notes?.trim(),
    };
    const times = taskTimes(task);
    if (task.start_at && times) {
      push(timed, dateKey(new Date(task.start_at)), {
        ...item,
        startMin: times.start,
        endMin: times.end > times.start ? times.end : MINUTES_PER_DAY,
      });
      continue;
    }
    if (item.isList && !task.all_day_date) continue;
    push(allDay, task.all_day_date ?? todayKey, item);
  }

  return { timed, allDay };
}
