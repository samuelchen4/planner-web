import { useState, type ReactNode } from 'react';

export function Check({
  done,
  onToggle,
  label,
}: {
  done: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={label}
      onClick={onToggle}
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
        done ? 'border-done bg-done text-white' : 'border-subtle'
      }`}
    >
      {done && (
        <svg
          viewBox="0 0 12 12"
          className="h-3 w-3 fill-none stroke-current stroke-2"
          aria-hidden="true"
        >
          <path d="M2.5 6.5l2.2 2.2L9.5 3.8" />
        </svg>
      )}
    </button>
  );
}

export function AddInput({
  placeholder,
  onAdd,
}: {
  placeholder: string;
  onAdd: (title: string) => void;
}) {
  const [value, setValue] = useState('');
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' || !value.trim()) return;
        onAdd(value.trim());
        setValue('');
      }}
      className="w-full rounded-card bg-card px-4 py-3 text-body text-ink shadow-sm outline-none placeholder:text-subtle focus:ring-2 focus:ring-accent/40"
    />
  );
}

export function TitleInput({
  value,
  onSave,
  done,
}: {
  value: string;
  onSave: (title: string) => void;
  done?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  const [editing, setEditing] = useState(false);
  return (
    <input
      value={editing ? draft : value}
      onFocus={() => {
        setDraft(value);
        setEditing(true);
      }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        setEditing(false);
        if (draft.trim() && draft !== value) onSave(draft.trim());
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
      }}
      className={`min-w-0 flex-1 bg-transparent text-body outline-none ${done ? 'text-muted line-through' : 'text-ink'}`}
    />
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="px-1 text-footnote font-semibold uppercase tracking-wide text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-card bg-card shadow-sm ${className}`}>{children}</div>;
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-border px-4 py-3 text-center text-footnote text-subtle">
      {children}
    </p>
  );
}
