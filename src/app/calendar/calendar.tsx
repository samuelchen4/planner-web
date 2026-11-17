import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import { useTasks } from '@/db/tables';
import { createTask, moveTask, scheduleTask, setTaskTime, unscheduleTask } from '@/db/tasks';
import { addDays, dateKey, formatHour, MINUTES_PER_DAY, startOfWeek } from '@/lib/time';

import { ChevronLeft, ChevronRight } from '../icons';
import { bucketByDay, type CalendarItem } from './entries';
import { HOUR_H, MIN_BLOCK_MIN, PX_PER_MIN } from './grid';
import { Block, Chip } from './items';
import { layoutColumns } from './layout';

const SNAP_MIN = 15;
const NEW_TASK_MIN = 60;
const DRAG_THRESHOLD = 4;
const HOURS = Array.from({ length: 23 }, (_, i) => i + 1);

type Mode = 'day' | 'week';

type Target =
  { kind: 'grid'; day: number; start: number; end: number } | { kind: 'allDay'; day: number };

interface Drag extends CalendarItem {
  action: 'move' | 'resize';
  from: 'grid' | 'allDay';
  day: number;
  startMin: number;
  duration: number;
  grabMin: number;
  x: number;
  y: number;
  moved: boolean;
  target: Target | null;
}

const snap = (m: number) => Math.round(m / SNAP_MIN) * SNAP_MIN;
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

function drop(d: Drag, t: Target, day: Date) {
  if (t.kind === 'allDay') {
    if (d.from !== 'allDay' || d.day !== t.day) unscheduleTask(d.id, day);
  } else if (d.action === 'resize') setTaskTime(d.id, t.start, t.end);
  else if (d.from === 'allDay') scheduleTask(d.id, day, t.start, t.end - t.start);
  else moveTask(d.id, day, t.start);
}

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function rangeLabel(days: Date[]) {
  const first = days[0];
  const last = days[days.length - 1];
  if (days.length === 1) {
    return first.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
  const start = first.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const end = last.toLocaleDateString(
    undefined,
    first.getMonth() === last.getMonth() ? { day: 'numeric' } : { month: 'short', day: 'numeric' },
  );
  return `${start} – ${end}, ${last.getFullYear()}`;
}

function Toolbar({
  days,
  mode,
  onMode,
  onStep,
  onToday,
  onAdd,
}: {
  days: Date[];
  mode: Mode;
  onMode: (mode: Mode) => void;
  onStep: (dir: 1 | -1) => void;
  onToday: () => void;
  onAdd: () => void;
}) {
  const middle = days[Math.floor(days.length / 2)];
  return (
    <div className="flex shrink-0 items-center gap-4 border-b border-border bg-app px-6 py-3">
      <h1 className="w-60 truncate font-rounded text-title2 font-bold text-ink">
        {middle.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
      </h1>
      <div className="mx-auto flex items-center overflow-hidden rounded-full border border-border bg-card text-subhead text-ink shadow-sm">
        <button
          type="button"
          aria-label="Previous"
          onClick={() => onStep(-1)}
          className="px-3 py-2 hover:bg-app"
        >
          <ChevronLeft />
        </button>
        <button
          type="button"
          onClick={onToday}
          className="border-x border-border px-4 py-1.5 font-semibold hover:bg-app"
        >
          Today
        </button>
        <span className="min-w-44 px-4 text-center tabular-nums">{rangeLabel(days)}</span>
        <button
          type="button"
          aria-label="Next"
          onClick={() => onStep(1)}
          className="border-l border-border px-3 py-2 hover:bg-app"
        >
          <ChevronRight />
        </button>
      </div>
      <div className="flex w-60 items-center justify-end gap-3">
        <div className="flex rounded-full bg-border/70 p-0.5">
          {(['day', 'week'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onMode(m)}
              className={`rounded-full px-3 py-1 text-footnote font-semibold capitalize ${
                mode === m ? 'bg-card text-ink shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-full bg-accent px-4 py-1.5 text-subhead font-semibold text-on-accent hover:bg-accent/90"
        >
          Add
        </button>
      </div>
    </div>
  );
}

export function CalendarView() {
  const tasks = useTasks();
  const now = useNow();
  const todayKey = dateKey(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const [mode, setMode] = useState<Mode>('week');
  const [anchor, setAnchor] = useState(() => new Date());
  const [editing, setEditing] = useState<string | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);

  const dragRef = useRef<Drag | null>(null);
  const suppressClick = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const allDayRef = useRef<HTMLDivElement>(null);

  const days = useMemo(
    () =>
      mode === 'day'
        ? [addDays(anchor, 0)]
        : Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(anchor), i)),
    [mode, anchor],
  );
  const keys = days.map(dateKey);
  const { timed, allDay } = useMemo(() => bucketByDay(tasks, todayKey), [tasks, todayKey]);
  const columns: CSSProperties = { gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` };

  const setDragState = (next: Drag | null) => {
    dragRef.current = next;
    setDrag(next);
  };

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const d = new Date();
    el.scrollTop = Math.max(0, d.getHours() * 60 + d.getMinutes() - 90) * PX_PER_MIN;
  }, []);

  const dragging = drag !== null;
  useEffect(() => {
    if (!dragging) return;

    const hitTest = (x: number, y: number, d: Drag): Target | null => {
      const grid = gridRef.current?.getBoundingClientRect();
      const top = allDayRef.current?.getBoundingClientRect();
      if (!grid || !top) return null;
      const minute = (y - grid.top) / PX_PER_MIN;
      if (d.action === 'resize') {
        return {
          kind: 'grid',
          day: d.day,
          start: d.startMin,
          end: clamp(snap(minute), d.startMin + SNAP_MIN, MINUTES_PER_DAY),
        };
      }
      const day = Math.floor((x - grid.left) / (grid.width / days.length));
      if (day < 0 || day >= days.length) return null;
      if (y < top.bottom) return { kind: 'allDay', day };
      const start = clamp(snap(minute - d.grabMin), 0, MINUTES_PER_DAY - d.duration);
      return { kind: 'grid', day, start, end: start + d.duration };
    };

    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) < DRAG_THRESHOLD) return;
      setDragState({ ...d, moved: true, target: hitTest(e.clientX, e.clientY, d) });
    };
    const onUp = () => {
      const d = dragRef.current;
      setDragState(null);
      if (!d) return;
      if (!d.moved) {
        setEditing(d.id);
        return;
      }
      suppressClick.current = true;
      setTimeout(() => (suppressClick.current = false), 0);
      if (d.target) drop(d, d.target, days[d.target.day]);
    };
    const onCancel = () => setDragState(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };

    const body = document.body.style;
    body.userSelect = 'none';
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('keydown', onKey);
    return () => {
      body.userSelect = '';
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('keydown', onKey);
    };
  }, [dragging, days]);

  const begin = (
    e: ReactPointerEvent,
    item: CalendarItem,
    day: number,
    opts: Pick<Drag, 'action' | 'from' | 'startMin' | 'duration'>,
  ) => {
    if (e.button !== 0 || editing === item.id) return;
    e.stopPropagation();
    const gridTop = gridRef.current?.getBoundingClientRect().top ?? 0;
    const minute = (e.clientY - gridTop) / PX_PER_MIN;
    setDragState({
      ...item,
      ...opts,
      day,
      grabMin: opts.from === 'grid' ? minute - opts.startMin : opts.duration / 2,
      x: e.clientX,
      y: e.clientY,
      moved: false,
      target: null,
    });
  };

  const wasEditing = useRef(false);
  const noteEditing = () => {
    wasEditing.current = editing !== null;
  };
  const shouldCreate = (e: MouseEvent) =>
    e.target === e.currentTarget && !suppressClick.current && !wasEditing.current;

  const createAt = (e: MouseEvent<HTMLDivElement>, day: Date) => {
    if (!shouldCreate(e)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const minute = (e.clientY - rect.top) / PX_PER_MIN;
    const start = clamp(
      Math.floor(minute / SNAP_MIN) * SNAP_MIN,
      0,
      MINUTES_PER_DAY - NEW_TASK_MIN,
    );
    const id = createTask('task', day);
    scheduleTask(id, day, start, NEW_TASK_MIN);
    setEditing(id);
  };

  const createAllDay = (e: MouseEvent<HTMLDivElement>, day: Date) => {
    if (!shouldCreate(e)) return;
    setEditing(createTask('task', day));
  };

  const addToday = () => {
    const today = new Date();
    setAnchor(today);
    setEditing(createTask('task', today));
  };

  const endEdit = () => setEditing(null);
  const live = drag?.moved ? drag : null;
  const target = live?.target ?? null;

  return (
    <div className="flex h-full flex-col">
      <Toolbar
        days={days}
        mode={mode}
        onMode={setMode}
        onStep={(dir) => setAnchor((a) => addDays(a, dir * (mode === 'week' ? 7 : 1)))}
        onToday={() => setAnchor(new Date())}
        onAdd={addToday}
      />
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto bg-card">
        <div className="sticky top-0 z-20 bg-card shadow-[0_1px_0_rgb(var(--color-border))]">
          <div className="flex">
            <div className="w-14 shrink-0" />
            <div className="grid flex-1" style={columns}>
              {days.map((day, i) => {
                const key = keys[i];
                const isToday = key === todayKey;
                const past = key < todayKey;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setAnchor(day);
                      setMode('day');
                    }}
                    className="flex min-w-0 items-center justify-center gap-2 border-l border-border py-3 hover:bg-app/60"
                  >
                    <span
                      className={`flex h-8 min-w-8 items-center justify-center rounded-full px-1.5 text-callout tabular-nums ${
                        isToday
                          ? 'bg-accent font-semibold text-on-accent'
                          : past
                            ? 'text-subtle'
                            : 'font-semibold text-ink'
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    <span
                      className={`truncate text-subhead ${
                        isToday ? 'font-semibold text-accent' : past ? 'text-subtle' : 'text-ink'
                      }`}
                    >
                      {day.toLocaleDateString(undefined, { weekday: 'long' })}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div ref={allDayRef} className="flex border-t border-border">
            <div className="w-14 shrink-0 pr-2 pt-2.5 text-right text-caption2 font-semibold uppercase text-subtle">
              All day
            </div>
            <div className="grid flex-1" style={columns}>
              {days.map((day, i) => {
                const items = allDay.get(keys[i]) ?? [];
                const over = target?.kind === 'allDay' && target.day === i;
                return (
                  <div
                    key={keys[i]}
                    onPointerDown={noteEditing}
                    onClick={(e) => createAllDay(e, day)}
                    className={`flex min-h-11 min-w-0 flex-col gap-1.5 border-l border-border p-1.5 ${
                      over ? 'bg-accent/10' : ''
                    }`}
                  >
                    {items.map((item) => (
                      <Chip
                        key={item.id}
                        item={item}
                        faded={live?.id === item.id}
                        editing={editing === item.id}
                        onEditDone={endEdit}
                        onPointerDown={(e) =>
                          begin(e, item, i, {
                            action: 'move',
                            from: 'allDay',
                            startMin: 0,
                            duration: NEW_TASK_MIN,
                          })
                        }
                      />
                    ))}
                    {over && <div className="h-0.5 shrink-0 rounded-full bg-accent" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex">
          <div className="relative w-14 shrink-0" style={{ height: MINUTES_PER_DAY * PX_PER_MIN }}>
            {HOURS.map((h) => (
              <span
                key={h}
                className="absolute right-2 text-caption tabular-nums text-subtle"
                style={{ top: h * HOUR_H - 8 }}
              >
                {formatHour(h)}
              </span>
            ))}
          </div>
          <div
            ref={gridRef}
            className="relative grid flex-1"
            style={{ ...columns, height: MINUTES_PER_DAY * PX_PER_MIN }}
          >
            <div className="pointer-events-none absolute inset-0">
              {HOURS.map((h) => (
                <div key={h}>
                  <div
                    className="absolute inset-x-0 border-t border-border"
                    style={{ top: h * HOUR_H }}
                  />
                  <div
                    className="absolute inset-x-0 border-t border-dashed border-border/60"
                    style={{ top: (h - 0.5) * HOUR_H }}
                  />
                </div>
              ))}
            </div>
            {days.map((day, i) => {
              const key = keys[i];
              const placed = layoutColumns(timed.get(key) ?? [], MIN_BLOCK_MIN);
              const preview = target?.kind === 'grid' && target.day === i ? target : null;
              return (
                <div
                  key={key}
                  onPointerDown={noteEditing}
                  onClick={(e) => createAt(e, day)}
                  className={`relative border-l border-border ${
                    key === todayKey ? 'bg-accent/[0.03]' : ''
                  }`}
                >
                  {placed.map(({ item, column, columns: count }) => (
                    <Block
                      key={item.id}
                      item={item}
                      startMin={item.startMin}
                      endMin={item.endMin}
                      column={column}
                      columns={count}
                      faded={live?.id === item.id}
                      editing={editing === item.id}
                      onEditDone={endEdit}
                      onPointerDown={(e) =>
                        begin(e, item, i, {
                          action: 'move',
                          from: 'grid',
                          startMin: item.startMin,
                          duration: item.endMin - item.startMin,
                        })
                      }
                      onResizeDown={(e) =>
                        begin(e, item, i, {
                          action: 'resize',
                          from: 'grid',
                          startMin: item.startMin,
                          duration: item.endMin - item.startMin,
                        })
                      }
                    />
                  ))}
                  {live && preview && (
                    <Block item={live} startMin={preview.start} endMin={preview.end} lifted />
                  )}
                  {key === todayKey && (
                    <div
                      className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
                      style={{ top: nowMin * PX_PER_MIN - 5 }}
                    >
                      <div className="-ml-[5px] h-2.5 w-2.5 shrink-0 rounded-full bg-danger" />
                      <div className="h-0.5 flex-1 bg-danger" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
