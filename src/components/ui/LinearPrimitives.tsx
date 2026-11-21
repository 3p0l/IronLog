import React from 'react';
import { motion } from 'motion/react';

export const CALM_EASE = {
  duration: 0.2,
  ease: [0.22, 1, 0.36, 1] as const,
};

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  ariaLabel?: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  layoutId: string;
  size?: 'xs' | 'sm' | 'md';
  fullWidth?: boolean;
  ariaLabel?: string;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  layoutId,
  size = 'sm',
  fullWidth = false,
  ariaLabel,
  className = '',
}: SegmentedControlProps<T>) {
  const heightClass =
    size === 'xs'
      ? 'h-7 px-2 text-xs'
      : size === 'md'
      ? 'h-9 px-3 text-sm'
      : 'h-8 px-3 text-xs';

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`inline-flex items-center rounded-lg border border-[var(--border-hairline)] bg-[var(--recessed)] p-1 ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            aria-label={opt.ariaLabel}
            className={`calm-press relative inline-flex ${heightClass} ${
              fullWidth ? 'flex-1' : ''
            } items-center justify-center gap-2 rounded-[6px] font-medium whitespace-nowrap transition-colors ${
              active
                ? 'text-[var(--ink-primary)]'
                : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
            }`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={CALM_EASE}
                className="absolute inset-0 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--control-secondary)]"
                aria-hidden="true"
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-2">
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
}

export function ToggleSwitch({ checked, onChange, ariaLabel }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={`calm-press relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border p-0.5 transition-colors ${
        checked
          ? 'border-[var(--accent-sage-border)] bg-[var(--accent-sage)]'
          : 'border-[var(--border-hairline)] bg-[var(--recessed)]'
      }`}
    >
      <motion.span
        layout
        transition={CALM_EASE}
        className={`block h-4 w-4 rounded-full ${
          checked
            ? 'ml-auto bg-[#F5F5F3] dark:bg-[#111215]'
            : 'mr-auto bg-[var(--ink-muted)]'
        }`}
      />
    </button>
  );
}
