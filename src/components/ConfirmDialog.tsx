import React from 'react';

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
      className="hud-scrim hud-scrim-enter fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="hud-modal-enter hud-frame w-full max-w-sm rounded-[2px] border-2 border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#0A0A0A] overflow-hidden">
        {destructive && (
          <div className="hud-hatch-strong border-b border-[#000000] dark:border-[#FFFFFF] px-5 py-2 flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] bg-[#FFFFFF] dark:bg-[#000000] text-[#000000] dark:text-[#FFFFFF] px-1.5 py-0.5 border border-[#000000] dark:border-[#FFFFFF]">
              [!] CAUTION // IRREVERSIBLE
            </span>
          </div>
        )}
        <div className="p-5">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#737373]">
            {destructive ? 'SYS // DESTRUCTIVE ACTION' : 'SYS // CONFIRMATION'}
          </p>
          <h3
            id="confirm-dialog-title"
            className="mt-1.5 text-base font-bold tracking-tight text-[#000000] dark:text-[#FFFFFF]"
          >
            {title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[#525252] dark:text-[#A3A3A3]">
            {description}
          </p>
          <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-[#E5E5E5] dark:border-[#262626] pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="mech-press min-h-[42px] rounded-[2px] border border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#0A0A0A] px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#000000] dark:text-[#FFFFFF] hover:bg-[#F5F5F5] dark:hover:bg-[#141414] whitespace-nowrap"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`mech-press min-h-[42px] rounded-[2px] border px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
                destructive
                  ? 'border-[#000000] dark:border-[#FFFFFF] bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] hover:bg-[#1A1A1A] dark:hover:bg-[#E5E5E5]'
                  : 'border-[#000000] dark:border-[#FFFFFF] bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] hover:bg-[#1A1A1A] dark:hover:bg-[#E5E5E5]'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
