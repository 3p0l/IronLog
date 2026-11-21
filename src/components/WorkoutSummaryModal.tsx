import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2, Clock, Dumbbell, Layers, X } from 'lucide-react';
import { PRRecord, WorkoutSession } from '../types/workout';
import { useWorkout } from '../context/WorkoutContext';
import {
  calculateWorkoutCompletedSets,
  calculateWorkoutVolumeKg,
  formatDuration,
  formatVolume,
  formatWeight,
  kgToLbs,
  roundDisplay,
} from '../utils/calculations';

interface WorkoutSummaryModalProps {
  open: boolean;
  session: WorkoutSession | null;
  prs: PRRecord[];
  sourceRoutineName: string | null;
  routineModified: boolean;
  onCancel: () => void;
  onConfirm: (finalNotes: string, updateRoutine: boolean) => void;
}

export function WorkoutSummaryModal({
  open,
  session,
  prs,
  sourceRoutineName,
  routineModified,
  onCancel,
  onConfirm,
}: WorkoutSummaryModalProps) {
  const { db } = useWorkout();
  const [notes, setNotes] = useState('');
  const [updateRoutine, setUpdateRoutine] = useState(false);

  useEffect(() => {
    if (open && session) {
      setNotes(session.notes ?? '');
      setUpdateRoutine(routineModified);
    }
  }, [open, session, routineModified]);

  if (!open || !session) return null;

  const unit = db.settings.weightUnit;
  const volumeKg = calculateWorkoutVolumeKg(session);
  const totalSets = calculateWorkoutCompletedSets(session);

  const prTypeLabel = (type: PRRecord['type']): string => {
    if (type === 'weight') return 'Heaviest weight';
    if (type === '1rm') return 'Best Est. 1RM';
    return 'Best set volume';
  };

  const formatPrValue = (pr: PRRecord): string => {
    const val = roundDisplay(unit === 'lbs' ? kgToLbs(pr.value) : pr.value, 1);
    return `${val.toLocaleString()} ${unit}`;
  };

  return (
    <div
      className="matte-scrim scrim-enter fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Workout completion summary"
    >
      <div className="matte-modal modal-enter flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-hairline)] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--accent-sage-border)] bg-[var(--accent-sage-tint)] text-[var(--accent-sage)]">
              <CheckCircle2 className="h-4 w-4 stroke-[1.5]" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--ink-primary)]">
                Workout summary
              </h2>
              <p className="text-xs text-[var(--ink-secondary)]">
                Review and save session locally
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Return to workout"
            className="calm-press btn-ghost flex h-8 w-8 items-center justify-center"
          >
            <X className="h-4 w-4 stroke-[1.5]" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div>
            <h3 className="text-lg font-semibold tracking-[-0.02em] text-[var(--ink-primary)]">
              {session.title}
            </h3>
            <p className="mt-1 text-xs text-[var(--ink-muted)]">
              {new Date(session.startedAt).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* De-boxed 3-Up Stat Strip */}
          <div className="grid grid-cols-3 divide-x divide-[var(--border-hairline)] border-y border-[var(--border-hairline)] py-4">
            <div className="pr-3">
              <div className="flex items-center gap-2 text-xs text-[var(--ink-secondary)]">
                <Clock className="h-4 w-4 stroke-[1.5] text-[var(--ink-muted)]" />
                <span>Duration</span>
              </div>
              <p className="mt-2 font-mono text-sm font-semibold tabular-nums text-[var(--ink-primary)]">
                {formatDuration(session.durationSeconds)}
              </p>
            </div>
            <div className="px-3">
              <div className="flex items-center gap-2 text-xs text-[var(--ink-secondary)]">
                <Dumbbell className="h-4 w-4 stroke-[1.5] text-[var(--ink-muted)]" />
                <span>Volume</span>
              </div>
              <p className="mt-2 font-mono text-sm font-semibold tabular-nums text-[var(--ink-primary)]">
                {formatVolume(volumeKg, unit)}
              </p>
            </div>
            <div className="pl-3">
              <div className="flex items-center gap-2 text-xs text-[var(--ink-secondary)]">
                <Layers className="h-4 w-4 stroke-[1.5] text-[var(--ink-muted)]" />
                <span>Sets</span>
              </div>
              <p className="mt-2 font-mono text-sm font-semibold tabular-nums text-[var(--ink-primary)]">
                {totalSets}
              </p>
            </div>
          </div>

          {/* Personal Records (Sand Status Ticks) */}
          {prs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 stroke-[1.5] text-[var(--accent-sand)]" />
                  <h4 className="text-xs font-semibold text-[var(--ink-primary)]">
                    {prs.length} new personal {prs.length === 1 ? 'record' : 'records'}
                  </h4>
                </div>
                <span className="pr-badge px-2 py-0.5 font-mono text-[11px] font-medium">
                  PR
                </span>
              </div>
              <div className="divide-y divide-[var(--border-hairline)] rounded-lg border border-[var(--border-hairline)] bg-[var(--recessed)] px-3">
                {prs.map((pr, idx) => (
                  <div
                    key={`${pr.exerciseId}-${pr.type}-${idx}`}
                    className="status-tick status-tick-sand flex items-center justify-between gap-2 py-3 pl-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[var(--ink-primary)]">
                        {pr.exerciseName}
                      </p>
                      <p className="mt-1 text-xs text-[var(--ink-secondary)]">
                        {prTypeLabel(pr.type)}
                        {pr.weightKg && pr.reps ? (
                          <span className="font-mono tabular-nums">
                            {' '}
                            · {formatWeight(pr.weightKg, unit)} × {pr.reps}
                          </span>
                        ) : (
                          ''
                        )}
                      </p>
                    </div>
                    <span className="pr-badge shrink-0 px-2 py-0.5 font-mono text-xs font-medium tabular-nums">
                      {formatPrValue(pr)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Update Routine Option */}
          {sourceRoutineName && routineModified && (
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--border-hairline)] bg-[var(--recessed)] p-4 transition-colors hover:border-[var(--border-focus)]">
              <input
                type="checkbox"
                checked={updateRoutine}
                onChange={(e) => setUpdateRoutine(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-[var(--accent-steel)]"
              />
              <div className="text-xs leading-relaxed">
                <p className="font-semibold text-[var(--ink-primary)]">
                  Update &ldquo;{sourceRoutineName}&rdquo; routine
                </p>
                <p className="mt-1 text-[var(--ink-secondary)]">
                  Save modified exercises, sets, and weights back to routine template
                </p>
              </div>
            </label>
          )}

          {/* Session Notes */}
          <div>
            <label
              htmlFor="summary-notes"
              className="mb-2 block text-xs font-medium text-[var(--ink-secondary)]"
            >
              Workout notes
            </label>
            <textarea
              id="summary-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Session notes"
              className="matte-input w-full bg-[var(--recessed)] p-3 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-[var(--border-hairline)] p-4">
          <button
            type="button"
            onClick={onCancel}
            className="calm-press btn-secondary h-10 flex-1 text-sm font-medium whitespace-nowrap"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => onConfirm(notes.trim(), updateRoutine)}
            className="calm-press btn-primary h-10 flex-[2] text-sm font-medium whitespace-nowrap"
          >
            Save workout
          </button>
        </div>
      </div>
    </div>
  );
}
