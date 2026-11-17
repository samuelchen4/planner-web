import { useEffect, type ReactNode } from 'react';

export function Modal({
  label,
  onClose,
  children,
  className = 'max-w-md',
}: {
  label: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`w-full rounded-card bg-card p-6 shadow-xl ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal label={title} onClose={onClose} className="max-w-sm">
      <p className="text-headline font-semibold text-ink">{title}</p>
      <p className="mt-2 text-subhead text-muted">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          autoFocus
          onClick={onClose}
          className="rounded-full border border-border px-4 py-1.5 text-subhead font-semibold text-ink hover:bg-app"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className="rounded-full bg-danger px-4 py-1.5 text-subhead font-semibold text-on-accent hover:bg-danger/90"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export function Check({
  done,
  onToggle,
  label,
  size = 20,
}: {
  done: boolean;
  onToggle: () => void;
  label: string;
  size?: number;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={label}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      style={{ width: size, height: size }}
      className={`flex shrink-0 items-center justify-center rounded-full ${
        done ? 'bg-done text-on-accent' : 'border-[1.5px] border-accent bg-card'
      }`}
    >
      {done && (
        <svg
          viewBox="0 0 12 12"
          className="fill-none stroke-current stroke-2"
          style={{ width: size * 0.6, height: size * 0.6 }}
          aria-hidden="true"
        >
          <path d="M2.5 6.5l2.2 2.2L9.5 3.8" />
        </svg>
      )}
    </button>
  );
}
