import { useRef, useState, type PointerEvent, type ReactNode } from 'react';

import { deleteTask, toggleDone, updateTask } from '@/db/tasks';
import { formatTime } from '@/lib/time';

import { ListMark, NoteMark } from '../icons';
import { Check } from '../ui';
import type { CalendarItem } from './entries';
import { MIN_BLOCK_MIN, PX_PER_MIN } from './grid';

type PointerHandler = (e: PointerEvent<HTMLDivElement>) => void;

const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();

function saveTitle(item: CalendarItem, value: string) {
  const title = value.trim();
  if (!title) deleteTask(item.id);
  else if (title !== item.title) updateTask(item.id, { title });
}

function TitleEditor({ item, onDone }: { item: CalendarItem; onDone: () => void }) {
  const [draft, setDraft] = useState(item.title);
  const cancelled = useRef(false);
  return (
    <input
      autoFocus
      value={draft}
      placeholder="New task"
      aria-label="Title"
      onChange={(e) => setDraft(e.target.value)}
      onPointerDown={stop}
      onClick={stop}
      onKeyDown={(e) => {
        if (e.key === 'Escape') cancelled.current = true;
        if (e.key === 'Enter' || e.key === 'Escape') e.currentTarget.blur();
      }}
      onBlur={() => {
        saveTitle(item, cancelled.current ? item.title : draft);
        onDone();
      }}
      className="min-w-0 flex-1 bg-transparent text-footnote font-semibold text-ink outline-none placeholder:text-subtle"
    />
  );
}

function Title({
  item,
  editing,
  onEditDone,
}: {
  item: CalendarItem;
  editing: boolean;
  onEditDone: () => void;
}) {
  if (editing) return <TitleEditor item={item} onDone={onEditDone} />;
  return (
    <>
      <span
        className={`min-w-0 truncate text-footnote font-semibold ${
          item.done ? 'text-muted line-through' : 'text-ink'
        }`}
      >
        {item.title || 'New task'}
      </span>
      {item.isList && <ListMark />}
      {item.hasNotes && <NoteMark />}
    </>
  );
}

function Tinted({
  done,
  lifted,
  children,
}: {
  done: boolean;
  lifted?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`h-full rounded-lg bg-card ${lifted ? 'shadow-lg' : ''}`}>
      <div
        className={`flex h-full overflow-hidden rounded-lg ${done ? 'bg-done/15' : 'bg-accent/15'}`}
      >
        <div className={`w-1 shrink-0 ${done ? 'bg-done' : 'bg-accent'}`} />
        {children}
      </div>
    </div>
  );
}

function ItemCheck({ item }: { item: CalendarItem }) {
  return (
    <Check
      size={16}
      done={item.done}
      onToggle={() => toggleDone(item.id)}
      label={`Mark "${item.title}" done`}
    />
  );
}

interface BlockProps {
  item: CalendarItem;
  startMin: number;
  endMin: number;
  column?: number;
  columns?: number;
  faded?: boolean;
  lifted?: boolean;
  editing?: boolean;
  onEditDone?: () => void;
  onPointerDown?: PointerHandler;
  onResizeDown?: PointerHandler;
}

export function Block({
  item,
  startMin,
  endMin,
  column = 0,
  columns = 1,
  faded = false,
  lifted = false,
  editing = false,
  onEditDone = () => {},
  onPointerDown,
  onResizeDown,
}: BlockProps) {
  const height = Math.max(endMin - startMin, MIN_BLOCK_MIN) * PX_PER_MIN;
  const compact = height < 40;
  return (
    <div
      onPointerDown={onPointerDown}
      onClick={stop}
      className={`absolute select-none pb-0.5 pr-0.5 ${lifted ? 'pointer-events-none z-10' : ''} ${
        faded ? 'opacity-[0.35]' : ''
      } ${onPointerDown ? 'cursor-grab' : ''}`}
      style={{
        top: startMin * PX_PER_MIN,
        height,
        left: `${(column / columns) * 100}%`,
        width: `${100 / columns}%`,
      }}
    >
      <Tinted done={item.done} lifted={lifted}>
        <div
          className={`flex min-w-0 flex-1 flex-col pl-2 pr-1.5 ${compact ? 'justify-center' : 'py-1'}`}
        >
          <div className="flex h-[18px] items-center">
            <Title item={item} editing={editing} onEditDone={onEditDone} />
            {compact && (
              <span className="ml-1.5 shrink-0 text-footnote tabular-nums text-muted">
                {formatTime(startMin)}
              </span>
            )}
            <span className="flex-1" />
            <span className="pl-2">
              <ItemCheck item={item} />
            </span>
          </div>
          {!compact && (
            <p className="truncate text-caption tabular-nums text-muted">
              {formatTime(startMin)} – {formatTime(endMin)}
            </p>
          )}
        </div>
      </Tinted>
      {onResizeDown && (
        <div
          onPointerDown={onResizeDown}
          className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize"
        />
      )}
    </div>
  );
}

export function Chip({
  item,
  faded,
  editing,
  onEditDone,
  onPointerDown,
}: {
  item: CalendarItem;
  faded: boolean;
  editing: boolean;
  onEditDone: () => void;
  onPointerDown: PointerHandler;
}) {
  return (
    <div
      onPointerDown={onPointerDown}
      onClick={stop}
      className={`h-8 shrink-0 cursor-grab select-none ${faded ? 'opacity-[0.35]' : ''}`}
    >
      <Tinted done={item.done}>
        <div className="flex min-w-0 flex-1 items-center pl-2 pr-1.5">
          <Title item={item} editing={editing} onEditDone={onEditDone} />
          <span className="flex-1" />
          <span className="pl-2">
            <ItemCheck item={item} />
          </span>
        </div>
      </Tinted>
    </div>
  );
}
