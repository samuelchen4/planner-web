import {
  addDays,
  dateKey,
  DEFAULT_DURATION_MIN,
  isoAtMinutes,
  MINUTES_PER_DAY,
  minutesOfDay,
  parseDateKey,
  toLocalIso,
} from '@/lib/time';

import { newId } from './ids';
import { ownerId } from './owner';
import type { Task } from './schema';
import { habitDayTable, taskTable } from './tables';

const now = () => toLocalIso(new Date());

export function taskDay(task: Task): string | null {
  return task.start_at ? dateKey(new Date(task.start_at)) : task.all_day_date;
}

export function taskTimes(task: Task): { start: number; end: number } | null {
  if (!task.start_at) return null;
  const start = minutesOfDay(task.start_at);
  if (!task.end_at) return { start, end: start + DEFAULT_DURATION_MIN };
  const nextDay = dateKey(new Date(task.end_at)) !== dateKey(new Date(task.start_at));
  return { start, end: nextDay ? MINUTES_PER_DAY : minutesOfDay(task.end_at) };
}

export function entriesOf(tasks: Task[], listId: string): Task[] {
  return tasks.filter((t) => t.list_id === listId);
}

function lastPosition(): number {
  const all = taskTable.all();
  return all.length ? all[all.length - 1].position + 1 : 0;
}

function positionBefore(beforeId: string, movingId: string): number {
  const others = taskTable.all().filter((t) => t.id !== movingId);
  const i = others.findIndex((t) => t.id === beforeId);
  if (i < 0) return lastPosition();
  const after = others[i].position;
  const before = i > 0 ? others[i - 1].position : after - 1;
  return (before + after) / 2;
}

export type NewTaskKind = 'task' | 'list' | 'habit';

function blankTask(fields: Partial<Task>): Task {
  const stamp = now();
  return {
    id: newId(),
    user_id: ownerId(),
    type: 'task',
    title: '',
    notes: null,
    start_at: null,
    end_at: null,
    time_zone: null,
    all_day_date: null,
    rrule: null,
    status: 'open',
    completed_at: null,
    list_id: null,
    color: null,
    icon: null,
    position: lastPosition(),
    created_at: stamp,
    updated_at: stamp,
    ...fields,
  };
}

export function createTask(kind: NewTaskKind, day: Date): string {
  const task = blankTask({
    type: kind,
    ...(kind === 'task' && { all_day_date: dateKey(day) }),
    ...(kind === 'list' && { color: 'yellow' }),
    ...(kind === 'habit' && { color: 'blue', icon: 'star.fill' }),
  });
  taskTable.insert(task);
  return task.id;
}

export function deleteTask(id: string) {
  taskTable.delete([id, ...entriesOf(taskTable.all(), id).map((t) => t.id)]);
  habitDayTable.delete(
    habitDayTable
      .all()
      .filter((d) => d.habit_id === id)
      .map((d) => d.id),
  );
}

export function deleteIfUntitled(id: string) {
  const task = taskTable.get(id);
  if (task && !task.title.trim()) deleteTask(id);
}

export function updateTask(id: string, patch: Partial<Task>) {
  taskTable.update(id, { ...patch, updated_at: now() });
}

export function toggleDone(id: string) {
  const task = taskTable.get(id);
  if (!task) return;
  const done = task.status !== 'done';
  updateTask(id, { status: done ? 'done' : 'open', completed_at: done ? now() : null });
}

export function scheduleTask(id: string, day: Date, startMin: number, durationMin: number) {
  const base = toLocalIso(day);
  updateTask(id, {
    start_at: isoAtMinutes(base, startMin),
    end_at: isoAtMinutes(base, startMin + durationMin),
    all_day_date: null,
  });
}

export function moveTask(id: string, day: Date, startMin: number) {
  const task = taskTable.get(id);
  const times = task && taskTimes(task);
  if (!times) return;
  const base = toLocalIso(day);
  updateTask(id, {
    start_at: isoAtMinutes(base, startMin),
    end_at: isoAtMinutes(base, startMin + (times.end - times.start)),
  });
}

export function unscheduleTask(id: string, day: Date, beforeId: string | null = null) {
  updateTask(id, {
    start_at: null,
    end_at: null,
    all_day_date: dateKey(day),
    position: beforeId ? positionBefore(beforeId, id) : lastPosition(),
  });
}

export function setTaskDate(id: string, day: Date | null) {
  const task = taskTable.get(id);
  if (!task) return;
  if (!day) return updateTask(id, { start_at: null, end_at: null, all_day_date: null });
  const times = taskTimes(task);
  if (!times) return updateTask(id, { all_day_date: dateKey(day) });
  const base = toLocalIso(day);
  updateTask(id, {
    start_at: isoAtMinutes(base, times.start),
    end_at: isoAtMinutes(base, times.end),
  });
}

const MIN_SPAN = 15;

export function setTaskTime(id: string, start: number, end: number) {
  const task = taskTable.get(id);
  if (!task) return;
  const key = taskDay(task);
  const base = toLocalIso(key ? parseDateKey(key) : addDays(new Date(), 0));
  const s = Math.min(start, MINUTES_PER_DAY - MIN_SPAN);
  const e = Math.min(Math.max(end, s + MIN_SPAN), MINUTES_PER_DAY);
  updateTask(id, {
    start_at: isoAtMinutes(base, s),
    end_at: isoAtMinutes(base, e),
    all_day_date: null,
  });
}

export function clearTaskTime(id: string) {
  const task = taskTable.get(id);
  if (!task?.start_at) return;
  updateTask(id, { start_at: null, end_at: null, all_day_date: dateKey(new Date(task.start_at)) });
}

export function newEntry(list: Task): Task {
  return blankTask({ list_id: list.id, user_id: list.user_id });
}

export function saveEntries(listId: string, rows: Task[]) {
  const list = taskTable.get(listId);
  if (!list) return;
  const keep = rows.map((r) => ({ ...r, title: r.title.trim() })).filter((r) => r.title);
  const stored = new Map(entriesOf(taskTable.all(), listId).map((t) => [t.id, t]));

  taskTable.delete([...stored.keys()].filter((id) => !keep.some((r) => r.id === id)));

  let prev = -Infinity;
  keep.forEach((row, i) => {
    const old = stored.get(row.id);
    let position = old?.position;
    if (position === undefined || position <= prev) {
      const next = keep.slice(i + 1).find((r) => (stored.get(r.id)?.position ?? -Infinity) > prev);
      const nextPos = next && stored.get(next.id)?.position;
      position =
        prev === -Infinity
          ? (nextPos ?? lastPosition()) - 1
          : nextPos !== undefined
            ? (prev + nextPos) / 2
            : prev + 1;
    }
    prev = position;
    if (!old) taskTable.insert({ ...row, position, updated_at: now() });
    else if (
      old.title !== row.title ||
      old.status !== row.status ||
      old.completed_at !== row.completed_at ||
      old.position !== position
    ) {
      updateTask(row.id, {
        title: row.title,
        status: row.status,
        completed_at: row.completed_at,
        position,
      });
    }
  });

  if (list.type !== 'list' && keep.length) {
    updateTask(listId, { type: 'list', color: list.color ?? 'yellow' });
  }
}
