import React, { useMemo, useState } from 'react';
import { Pencil, Trash2, Trophy, X } from 'lucide-react';
import {
  Exercise,
  TRACKING_TYPE_LABELS,
  TimeframeFilter,
} from '../types/workout';
import { useWorkout } from '../context/WorkoutContext';
import {
  convertWeightFromKg,
  formatDuration,
  formatWeight,
  getExerciseProgressSeries,
  kgToLbs,
  roundDisplay,
} from '../utils/calculations';
import { ProgressChart } from './charts/ProgressChart';
import { ConfirmDialog } from './ConfirmDialog';
import { SegmentedControl } from './ui/LinearPrimitives';

interface ExerciseDetailModalProps {
  exercise: Exercise | null;
  onClose: () => void;
  onEditCustom?: (exercise: Exercise) => void;
}

type DetailSubTab = 'charts' | 'history' | 'about';
type MetricChoice = '1rm' | 'weight' | 'setVolume' | 'sessionVolume';

const TIMEFRAMES: TimeframeFilter[] = ['1M', '3M', '6M', '1Y', 'ALL'];

export function ExerciseDetailModal({
  exercise,
  onClose,
  onEditCustom,
}: ExerciseDetailModalProps) {
  const { db, deleteExercise } = useWorkout();
  const [subTab, setSubTab] = useState<DetailSubTab>('charts');
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('ALL');
  const [metric, setMetric] = useState<MetricChoice>('1rm');
  const [chartMode, setChartMode] = useState<'line' | 'bar'>('line');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const unit = db.settings.weightUnit;

  const allSeries = useMemo(() => {
    if (!exercise) return [];
    return getExerciseProgressSeries(exercise.id, db.workouts, 'ALL');
  }, [exercise, db.workouts]);

  const filteredSeries = useMemo(() => {
    if (!exercise) return [];
    return getExerciseProgressSeries(exercise.id, db.workouts, timeframe);
  }, [exercise, db.workouts, timeframe]);

  const allTimeBests = useMemo(() => {
    let best1RM = 0;
    let heaviest = 0;
    let bestSetVol = 0;
    let bestSessionVol = 0;

    for (const pt of allSeries) {
      if (pt.estimated1RMKg > best1RM) best1RM = pt.estimated1RMKg;
      if (pt.heaviestWeightKg > heaviest) heaviest = pt.heaviestWeightKg;
      if (pt.bestSetVolumeKg > bestSetVol) bestSetVol = pt.bestSetVolumeKg;
      if (pt.totalVolumeKg > bestSessionVol) bestSessionVol = pt.totalVolumeKg;
    }
    return { best1RM, heaviest, bestSetVol, bestSessionVol };
  }, [allSeries]);

  if (!exercise) return null;

  const toUnit = (kg: number) => roundDisplay(unit === 'lbs' ? kgToLbs(kg) : kg, 1);

  const chartData = filteredSeries.map((pt) => {
    let rawKg = pt.estimated1RMKg;
    if (metric === 'weight') rawKg = pt.heaviestWeightKg;
    else if (metric === 'setVolume') rawKg = pt.bestSetVolumeKg;
    else if (metric === 'sessionVolume') rawKg = pt.totalVolumeKg;
    return {
      label: pt.dateLabel,
      value: toUnit(rawKg),
      sublabel: pt.workoutTitle,
    };
  });

  return (
    <>
      <div
        className="matte-scrim scrim-enter fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-label={`${exercise.name} details`}
      >
        <div className="matte-modal modal-enter flex h-[90vh] w-full max-w-3xl flex-col overflow-hidden sm:h-[85vh]">
          {/* Header */}
          <div className="border-b border-[var(--border-hairline)]">
            <div className="flex items-start justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold tracking-[-0.02em] text-[var(--ink-primary)]">
                  {exercise.name}
                </h2>
                <p className="mt-1 text-xs text-[var(--ink-secondary)]">
                  {exercise.primaryMuscle} · {exercise.equipment} ·{' '}
                  {TRACKING_TYPE_LABELS[exercise.trackingType]}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {exercise.isCustom && onEditCustom && (
                  <button
                    type="button"
                    onClick={() => onEditCustom(exercise)}
                    aria-label={`Edit ${exercise.name}`}
                    className="calm-press btn-ghost flex h-8 w-8 items-center justify-center"
                  >
                    <Pencil className="h-4 w-4 stroke-[1.5]" />
                  </button>
                )}
                {exercise.isCustom && (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteOpen(true)}
                    aria-label={`Delete ${exercise.name}`}
                    className="calm-press flex h-8 w-8 items-center justify-center rounded-lg text-[var(--ink-muted)] hover:bg-[var(--accent-clay-tint)] hover:text-[var(--accent-clay)]"
                  >
                    <Trash2 className="h-4 w-4 stroke-[1.5]" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close exercise details"
                  className="calm-press btn-ghost flex h-8 w-8 items-center justify-center"
                >
                  <X className="h-4 w-4 stroke-[1.5]" />
                </button>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="px-5 pb-4">
              <SegmentedControl<DetailSubTab>
                value={subTab}
                onChange={setSubTab}
                layoutId="exercise-detail-subtab"
                size="sm"
                fullWidth
                ariaLabel="Exercise detail sections"
                options={[
                  { value: 'charts', label: 'Charts' },
                  { value: 'history', label: `History (${allSeries.length})` },
                  { value: 'about', label: 'About' },
                ]}
              />
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto bg-[var(--canvas)] p-5 space-y-6">
            {subTab === 'charts' && (
              <div key="charts" className="view-enter space-y-6">
                {/* De-boxed All-Time PR Strip */}
                <div className="grid grid-cols-2 gap-4 border-b border-[var(--border-hairline)] pb-5 sm:grid-cols-4 sm:gap-0 sm:divide-x sm:divide-[var(--border-hairline)]">
                  {[
                    { label: 'Best Est. 1RM', val: allTimeBests.best1RM },
                    { label: 'Heaviest weight', val: allTimeBests.heaviest },
                    { label: 'Best set volume', val: allTimeBests.bestSetVol },
                    { label: 'Best session vol', val: allTimeBests.bestSessionVol },
                  ].map((item, idx) => (
                    <div
                      key={item.label}
                      className={idx === 0 ? 'sm:pr-4' : idx === 3 ? 'sm:pl-4' : 'sm:px-4'}
                    >
                      <div className="flex items-center gap-2 text-xs font-medium text-[var(--ink-secondary)]">
                        <Trophy className="h-4 w-4 shrink-0 stroke-[1.5] text-[var(--accent-sand)]" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <p className="mt-2 font-mono text-sm font-semibold tabular-nums text-[var(--ink-primary)]">
                        {item.val > 0 ? `${toUnit(item.val).toLocaleString()} ${unit}` : '—'}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Chart Surface */}
                <div className="matte-surface p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="overflow-x-auto">
                      <SegmentedControl<MetricChoice>
                        value={metric}
                        onChange={setMetric}
                        layoutId="ex-detail-metric"
                        size="xs"
                        ariaLabel="Progress chart metric"
                        options={[
                          { value: '1rm', label: 'Est. 1RM' },
                          { value: 'weight', label: 'Heaviest' },
                          { value: 'setVolume', label: 'Best set vol' },
                          { value: 'sessionVolume', label: 'Session vol' },
                        ]}
                      />
                    </div>

                    <SegmentedControl<'line' | 'bar'>
                      value={chartMode}
                      onChange={setChartMode}
                      layoutId="ex-detail-mode"
                      size="xs"
                      ariaLabel="Chart display mode"
                      options={[
                        { value: 'line', label: 'Line' },
                        { value: 'bar', label: 'Bar' },
                      ]}
                    />
                  </div>

                  <ProgressChart
                    data={chartData}
                    unit={unit}
                    mode={chartMode}
                    tone="sage"
                    height={220}
                    emptyMessage="Complete a weighted set in range to view progress"
                  />

                  <div className="flex justify-center border-t border-[var(--border-hairline)] pt-4">
                    <SegmentedControl<TimeframeFilter>
                      value={timeframe}
                      onChange={setTimeframe}
                      layoutId="ex-detail-tf"
                      size="xs"
                      ariaLabel="Exercise chart timeframe"
                      options={TIMEFRAMES.map((tf) => ({
                        value: tf,
                        label: tf === 'ALL' ? 'All' : tf,
                      }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {subTab === 'history' && (
              <div key="history" className="view-enter divide-y divide-[var(--border-hairline)]">
                {allSeries.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-sm text-[var(--ink-muted)]">
                      No completed sessions logged for {exercise.name}
                    </p>
                  </div>
                ) : (
                  [...allSeries].reverse().map((session) => (
                    <div key={session.workoutId} className="py-4">
                      <div className="flex items-baseline justify-between gap-3 pb-3">
                        <h3 className="text-sm font-semibold text-[var(--ink-primary)]">
                          {session.workoutTitle}
                        </h3>
                        <span className="font-mono text-xs tabular-nums text-[var(--ink-muted)]">
                          {new Date(session.timestamp).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="divide-y divide-[var(--border-hairline)] rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] px-3">
                        {session.completedSets.map((s, idx) => {
                          const hasPR = Boolean(s.isWeightPR || s.is1RMPR || s.isVolumePR);
                          return (
                            <div
                              key={s.id}
                              className={`flex min-h-[40px] items-center justify-between py-2 text-xs ${
                                hasPR ? 'status-tick status-tick-sand pl-3' : ''
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-[6px] border border-[var(--border-hairline)] bg-[var(--recessed)] font-mono text-[11px] font-medium text-[var(--ink-secondary)]">
                                  {s.setType === 'warmup'
                                    ? 'W'
                                    : s.setType === 'drop'
                                    ? 'D'
                                    : s.setType === 'failure'
                                    ? 'F'
                                    : idx + 1}
                                </span>
                                <span className="font-mono font-medium tabular-nums text-[var(--ink-primary)]">
                                  {exercise.trackingType === 'duration'
                                    ? formatDuration(s.durationSec ?? 0)
                                    : exercise.trackingType === 'bodyweight'
                                    ? `${s.reps ?? 0} reps`
                                    : `${formatWeight(s.weightKg, s.weightUnit ?? unit)} × ${s.reps ?? 0}`}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 font-mono text-xs text-[var(--ink-muted)]">
                                {s.weightKg && s.reps ? (
                                  <span className="tabular-nums">
                                    1RM {convertWeightFromKg(s.weightKg * (1 + s.reps / 30), unit)}{' '}
                                    {unit}
                                  </span>
                                ) : null}
                                {hasPR && (
                                  <span className="pr-badge px-2 py-0.5 text-[11px] font-medium">
                                    PR
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {subTab === 'about' && (
              <div key="about" className="view-enter space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-[var(--ink-muted)]">Primary muscle</p>
                    <p className="mt-1 text-sm font-medium text-[var(--ink-primary)]">
                      {exercise.primaryMuscle}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--ink-muted)]">Equipment</p>
                    <p className="mt-1 text-sm font-medium text-[var(--ink-primary)]">
                      {exercise.equipment}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--ink-muted)]">Secondary muscles</p>
                    <p className="mt-1 text-sm text-[var(--ink-primary)]">
                      {exercise.secondaryMuscles.length > 0
                        ? exercise.secondaryMuscles.join(', ')
                        : 'None'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--ink-muted)]">Tracking mode</p>
                    <p className="mt-1 text-sm text-[var(--ink-primary)]">
                      {TRACKING_TYPE_LABELS[exercise.trackingType]}
                    </p>
                  </div>
                </div>
                {exercise.notes && (
                  <div className="border-t border-[var(--border-hairline)] pt-4">
                    <p className="text-xs text-[var(--ink-muted)]">Form cues and notes</p>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--ink-secondary)]">
                      {exercise.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete custom exercise"
        description={`"${exercise.name}" will be removed from your exercise library. Past workout logs remain intact`}
        confirmLabel="Delete exercise"
        destructive
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={() => {
          deleteExercise(exercise.id);
          setConfirmDeleteOpen(false);
          onClose();
        }}
      />
    </>
  );
}
