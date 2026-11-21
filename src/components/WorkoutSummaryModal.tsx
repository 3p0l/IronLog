import React, { useEffect, useState } from 'react';
import { Award, Clock, Dumbbell, Layers, X } from 'lucide-react';
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
    if (type === 'weight') return 'Heaviest Weight';
    if (type === '1rm') return 'Best Est. 1RM';
    return 'Best Set Volume';
  };

  const formatPrValue = (pr: PRRecord): string => {
    const val = roundDisplay(unit === 'lbs' ? kgToLbs(pr.value) : pr.value, 1);
    return `${val.toLocaleString()} ${unit}`;
  };

  return (
    <div
      className="hud-scrim hud-scrim-enter fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Workout completion summary"
    >
      <div className="hud-modal-enter hud-frame flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[2px] border-2 border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#0A0A0A]">
        {/* Inverted Pitch-Black Header */}
        <div className="flex items-center justify-between border-b border-[#262626] bg-[#000000] px-5 py-4 text-[#FFFFFF]">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#FFFFFF]">
              ■ SESSION COMPLETE // TELEMETRY COMMIT
            </p>
            <h2 className="mt-0.5 text-base font-bold tracking-tight text-[#FFFFFF]">
              Workout Summary
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Return to workout"
            className="mech-press flex h-10 w-10 items-center justify-center rounded-[2px] border border-[#262626] bg-[#0A0A0A] text-[#FFFFFF] hover:border-[#FFFFFF]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-[#000000] dark:text-[#FFFFFF]">
              {session.title}
            </h3>
            <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-[#737373]">
              {new Date(session.startedAt).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* 3-Up Hairline Stat Grid */}
          <div className="grid grid-cols-3 gap-px border border-[#000000] dark:border-[#262626] bg-[#E5E5E5] dark:bg-[#262626]">
            <div className="bg-[#FFFFFF] dark:bg-[#0A0A0A] p-3">
              <div className="flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#737373]">
                <Clock className="h-3 w-3 text-[#000000] dark:text-[#FFFFFF]" />
                <span>Duration</span>
              </div>
              <p className="mt-1.5 font-mono text-sm font-bold tabular-nums text-[#000000] dark:text-[#FFFFFF]">
                {formatDuration(session.durationSeconds)}
              </p>
            </div>
            <div className="bg-[#FFFFFF] dark:bg-[#0A0A0A] p-3">
              <div className="flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#737373]">
                <Dumbbell className="h-3 w-3 text-[#000000] dark:text-[#FFFFFF]" />
                <span>Volume</span>
              </div>
              <p className="mt-1.5 font-mono text-sm font-bold tabular-nums text-[#000000] dark:text-[#FFFFFF]">
                {formatVolume(volumeKg, unit)}
              </p>
            </div>
            <div className="bg-[#FFFFFF] dark:bg-[#0A0A0A] p-3">
              <div className="flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#737373]">
                <Layers className="h-3 w-3 text-[#000000] dark:text-[#FFFFFF]" />
                <span>Sets</span>
              </div>
              <p className="mt-1.5 font-mono text-sm font-bold tabular-nums text-[#000000] dark:text-[#FFFFFF]">
                {totalSets}
              </p>
            </div>
          </div>

          {/* Monochrome PR Ledger */}
          {prs.length > 0 && (
            <div className="rounded-[2px] border-2 border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#0A0A0A] overflow-hidden">
              <div className="flex items-center justify-between bg-[#000000] dark:bg-[#FFFFFF] px-4 py-2 text-[#FFFFFF] dark:text-[#000000]">
                <div className="flex items-center gap-2">
                  <Award className="h-3.5 w-3.5" />
                  <h4 className="font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
                    {prs.length} New Personal {prs.length === 1 ? 'Record' : 'Records'}
                  </h4>
                </div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest">
                  // PR ▲
                </span>
              </div>
              <div className="divide-y divide-[#E5E5E5] dark:divide-[#262626] px-4">
                {prs.map((pr, idx) => (
                  <div
                    key={`${pr.exerciseId}-${pr.type}-${idx}`}
                    className="flex items-center justify-between gap-2 py-2.5 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold text-[#000000] dark:text-[#FFFFFF]">
                        {pr.exerciseName}
                      </p>
                      <p className="font-mono text-[11px] text-[#737373]">
                        {prTypeLabel(pr.type)}
                        {pr.weightKg && pr.reps ? ` · ${formatWeight(pr.weightKg, unit)} × ${pr.reps}` : ''}
                      </p>
                    </div>
                    <span className="hud-pr-stamp shrink-0 px-2 py-0.5 font-mono text-xs font-bold tabular-nums">
                      {formatPrValue(pr)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Update Routine Option */}
          {sourceRoutineName && routineModified && (
            <label className="hud-hatch flex cursor-pointer items-start gap-3 rounded-[2px] border border-[#000000] dark:border-[#FFFFFF] p-3.5">
              <input
                type="checkbox"
                checked={updateRoutine}
                onChange={(e) => setUpdateRoutine(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded-none accent-[#000000] dark:accent-[#FFFFFF]"
              />
              <div className="text-xs leading-relaxed bg-[#FFFFFF]/90 dark:bg-[#0A0A0A]/90 px-2 py-1 border border-[#E5E5E5] dark:border-[#262626]">
                <p className="font-bold text-[#000000] dark:text-[#FFFFFF]">
                  Update &ldquo;{sourceRoutineName}&rdquo; routine
                </p>
                <p className="text-[#525252] dark:text-[#A3A3A3]">
                  Save the modified exercises, set counts, and weights back to your routine template.
                </p>
              </div>
            </label>
          )}

          {/* Session Notes */}
          <div>
            <label
              htmlFor="summary-notes"
              className="mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[#525252] dark:text-[#A3A3A3]"
            >
              Workout Notes
            </label>
            <textarea
              id="summary-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did this session feel?"
              className="w-full rounded-[2px] border border-[#E5E5E5] dark:border-[#262626] bg-[#F5F5F5] dark:bg-[#141414] p-3 text-sm text-[#000000] dark:text-[#FFFFFF] placeholder-[#737373] focus:border-[#000000] dark:focus:border-[#FFFFFF] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 border-t border-[#E5E5E5] dark:border-[#262626] bg-[#F5F5F5] dark:bg-[#000000] p-4">
          <button
            type="button"
            onClick={onCancel}
            className="mech-press min-h-[44px] flex-1 rounded-[2px] border border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#0A0A0A] font-mono text-xs font-bold uppercase tracking-wider text-[#000000] dark:text-[#FFFFFF] hover:bg-[#E5E5E5] dark:hover:bg-[#141414]"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => onConfirm(notes.trim(), updateRoutine)}
            className="mech-press min-h-[44px] flex-[2] rounded-[2px] border border-[#000000] dark:border-[#FFFFFF] bg-[#000000] dark:bg-[#FFFFFF] font-mono text-xs font-bold uppercase tracking-widest text-[#FFFFFF] dark:text-[#000000] hover:bg-[#1A1A1A] dark:hover:bg-[#E5E5E5]"
          >
            Save Workout
          </button>
        </div>
      </div>
    </div>
  );
}
