import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="matte-scrim scrim-enter fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="matte-modal modal-enter w-full max-w-sm overflow-hidden p-6">
        <div className="flex items-start gap-3">
          {destructive && (
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--accent-clay-border)] bg-[var(--accent-clay-tint)] text-[var(--accent-clay)]">
              <AlertTriangle className="h-4 w-4 stroke-[1.5]" />
            </div>
          )}
          <div className="min-w-0">
            <h3
              id="confirm-dialog-title"
              className="text-base font-semibold tracking-[-0.01em] text-[var(--ink-primary)]"
            >
              {title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-secondary)]">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="calm-press btn-secondary h-9 px-4 text-sm font-medium whitespace-nowrap"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`calm-press h-9 px-4 text-sm font-medium whitespace-nowrap ${
              destructive ? 'btn-danger' : 'btn-primary'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
