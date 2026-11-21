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

  const metricTabs: { id: MetricChoice; label: string }[] = [
    { id: '1rm', label: 'Est. 1RM' },
    { id: 'weight', label: 'Heaviest' },
    { id: 'setVolume', label: 'Best Set Vol' },
    { id: 'sessionVolume', label: 'Session Vol' },
  ];

  return (
    <>
      <div
        className="hud-scrim hud-scrim-enter fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-label={`${exercise.name} details`}
      >
        <div className="hud-modal-enter hud-frame flex h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2px] border-2 border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#0A0A0A] sm:h-[85vh]">
          {/* Inverted Pitch-Black Header */}
          <div className="bg-[#000000] text-[#FFFFFF] border-b border-[#262626]">
            <div className="flex items-start justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A3A3A3]">
                  MOVEMENT TELEMETRY // {exercise.primaryMuscle.toUpperCase()}
                </p>
                <h2 className="mt-0.5 truncate text-lg font-bold tracking-tight text-[#FFFFFF]">
                  {exercise.name}
                </h2>
                <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-[#737373]">
                  {exercise.equipment} · {TRACKING_TYPE_LABELS[exercise.trackingType]}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {exercise.isCustom && onEditCustom && (
                  <button
                    type="button"
                    onClick={() => onEditCustom(exercise)}
                    aria-label={`Edit ${exercise.name}`}
                    className="mech-press flex h-10 w-10 items-center justify-center rounded-[2px] border border-[#262626] bg-[#0A0A0A] text-[#FFFFFF] hover:border-[#FFFFFF]"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
                {exercise.isCustom && (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteOpen(true)}
                    aria-label={`Delete ${exercise.name}`}
                    className="mech-press flex h-10 w-10 items-center justify-center rounded-[2px] border border-[#262626] bg-[#0A0A0A] text-[#FFFFFF] hover:bg-[#FFFFFF] hover:text-[#000000]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close exercise details"
                  className="mech-press flex h-10 w-10 items-center justify-center rounded-[2px] border border-[#262626] bg-[#0A0A0A] text-[#FFFFFF] hover:border-[#FFFFFF]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="border-t border-[#262626] bg-[#0A0A0A] px-5 py-2.5">
              <div className="grid grid-cols-3 gap-1 border border-[#262626] bg-[#000000] p-1 rounded-[2px]">
                {(['charts', 'history', 'about'] as DetailSubTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSubTab(tab)}
                    className={`mech-press min-h-[36px] rounded-[2px] font-mono text-[11px] font-bold uppercase tracking-wider transition-colors ${
                      subTab === tab
                        ? 'bg-[#FFFFFF] text-[#000000]'
                        : 'text-[#A3A3A3] hover:text-[#FFFFFF]'
                    }`}
                  >
                    {tab === 'history' ? `History (${allSeries.length})` : tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#FFFFFF] dark:bg-[#0A0A0A]">
            {subTab === 'charts' && (
              <>
                {/* All-Time PR Strip */}
                <div className="grid grid-cols-2 gap-px bg-[#E5E5E5] dark:bg-[#262626] border border-[#E5E5E5] dark:border-[#262626] sm:grid-cols-4">
                  {[
                    { label: 'Best Est. 1RM', val: allTimeBests.best1RM },
                    { label: 'Heaviest Weight', val: allTimeBests.heaviest },
                    { label: 'Best Set Volume', val: allTimeBests.bestSetVol },
                    { label: 'Best Session Vol', val: allTimeBests.bestSessionVol },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-[#FFFFFF] dark:bg-[#0A0A0A] p-3.5"
                    >
                      <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#737373]">
                        <Trophy className="h-3 w-3 text-[#000000] dark:text-[#FFFFFF]" />
                        <span>{item.label}</span>
                      </div>
                      <p className="mt-1.5 font-mono text-base font-bold tabular-nums text-[#000000] dark:text-[#FFFFFF]">
                        {item.val > 0 ? `${toUnit(item.val).toLocaleString()} ${unit}` : '—'}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Chart Console */}
                <div className="hud-frame rounded-[2px] border border-[#000000] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#0A0A0A] p-4 sm:p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1 border border-[#E5E5E5] dark:border-[#262626] bg-[#F5F5F5] dark:bg-[#000000] p-1 rounded-[2px]">
                      {metricTabs.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMetric(m.id)}
                          className={`mech-press min-h-[32px] rounded-[2px] px-2.5 font-mono text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${
                            metric === m.id
                              ? 'bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]'
                              : 'text-[#737373] hover:text-[#000000] dark:hover:text-[#FFFFFF]'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1 border border-[#E5E5E5] dark:border-[#262626] bg-[#F5F5F5] dark:bg-[#000000] p-1 rounded-[2px]">
                      {(['line', 'bar'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setChartMode(m)}
                          className={`mech-press min-h-[32px] rounded-[2px] px-2.5 font-mono text-[11px] font-bold uppercase tracking-wider ${
                            chartMode === m
                              ? 'bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]'
                              : 'text-[#737373] hover:text-[#000000] dark:hover:text-[#FFFFFF]'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <ProgressChart
                    data={chartData}
                    unit={unit}
                    mode={chartMode}
                    height={220}
                    emptyMessage="Complete at least one weighted set for this exercise in the selected timeframe."
                  />

                  {/* Timeframe Selector */}
                  <div className="mt-4 flex items-center justify-center gap-1 border-t border-[#E5E5E5] dark:border-[#262626] pt-3.5">
                    {TIMEFRAMES.map((tf) => (
                      <button
                        key={tf}
                        type="button"
                        onClick={() => setTimeframe(tf)}
                        className={`mech-press min-h-[34px] min-w-[44px] rounded-[2px] border px-3 font-mono text-[11px] font-bold uppercase tracking-wider ${
                          timeframe === tf
                            ? 'border-[#000000] dark:border-[#FFFFFF] bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]'
                            : 'border-transparent text-[#737373] hover:border-[#E5E5E5] dark:hover:border-[#262626] hover:text-[#000000] dark:hover:text-[#FFFFFF]'
                        }`}
                      >
                        {tf === 'ALL' ? 'All' : tf}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {subTab === 'history' && (
              <div className="space-y-3">
                {allSeries.length === 0 ? (
                  <div className="hud-dot-matrix rounded-[2px] border border-dashed border-[#000000] dark:border-[#262626] px-6 py-12 text-center">
                    <p className="inline-block bg-[#FFFFFF] dark:bg-[#0A0A0A] border border-[#E5E5E5] dark:border-[#262626] px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-[#737373]">
                      00 // No completed sessions logged for {exercise.name}
                    </p>
                  </div>
                ) : (
                  [...allSeries].reverse().map((session) => (
                    <div
                      key={session.workoutId}
                      className="rounded-[2px] border border-[#E5E5E5] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#0A0A0A] p-4"
                    >
                      <div className="flex items-baseline justify-between gap-3 border-b border-[#E5E5E5] dark:border-[#262626] pb-2.5">
                        <h4 className="text-sm font-bold text-[#000000] dark:text-[#FFFFFF]">
                          {session.workoutTitle}
                        </h4>
                        <span className="font-mono text-[11px] uppercase tracking-wider text-[#737373]">
                          {new Date(session.timestamp).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="mt-2 divide-y divide-[#E5E5E5] dark:divide-[#262626]">
                        {session.completedSets.map((s, idx) => (
                          <div key={s.id} className="flex items-center justify-between py-2 text-xs">
                            <div className="flex items-center gap-3">
                              <span
                                className={`inline-flex h-6 w-6 items-center justify-center rounded-[2px] font-mono text-[11px] font-bold ${
                                  s.setType === 'warmup'
                                    ? 'border border-dashed border-[#000000] dark:border-[#FFFFFF] text-[#000000] dark:text-[#FFFFFF]'
                                    : s.setType === 'drop'
                                    ? 'hud-hatch border border-[#000000] dark:border-[#FFFFFF] text-[#000000] dark:text-[#FFFFFF]'
                                    : s.setType === 'failure'
                                    ? 'border-2 border-[#000000] dark:border-[#FFFFFF] text-[#000000] dark:text-[#FFFFFF]'
                                    : 'border border-[#E5E5E5] dark:border-[#262626] bg-[#F5F5F5] dark:bg-[#141414] text-[#000000] dark:text-[#FFFFFF]'
                                }`}
                              >
                                {s.setType === 'warmup'
                                  ? 'W'
                                  : s.setType === 'drop'
                                  ? 'D'
                                  : s.setType === 'failure'
                                  ? 'F'
                                  : idx + 1}
                              </span>
                              <span className="font-mono font-semibold tabular-nums text-[#000000] dark:text-[#FFFFFF]">
                                {exercise.trackingType === 'duration'
                                  ? formatDuration(s.durationSec ?? 0)
                                  : exercise.trackingType === 'bodyweight'
                                  ? `${s.reps ?? 0} reps`
                                  : `${formatWeight(s.weightKg, s.weightUnit ?? unit)} × ${s.reps ?? 0}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 font-mono text-[11px] text-[#737373]">
                              {s.weightKg && s.reps ? (
                                <span className="tabular-nums">
                                  1RM {convertWeightFromKg(s.weightKg * (1 + s.reps / 30), unit)} {unit}
                                </span>
                              ) : null}
                              {(s.isWeightPR || s.is1RMPR || s.isVolumePR) && (
                                <span className="hud-pr-stamp px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                  PR ▲
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {subTab === 'about' && (
              <div className="rounded-[2px] border border-[#E5E5E5] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#0A0A0A] p-5 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="border-l-2 border-[#000000] dark:border-[#FFFFFF] pl-3">
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#737373]">
                      Primary Muscle
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#000000] dark:text-[#FFFFFF]">
                      {exercise.primaryMuscle}
                    </p>
                  </div>
                  <div className="border-l-2 border-[#000000] dark:border-[#FFFFFF] pl-3">
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#737373]">
                      Equipment
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#000000] dark:text-[#FFFFFF]">
                      {exercise.equipment}
                    </p>
                  </div>
                  <div className="border-l-2 border-[#E5E5E5] dark:border-[#262626] pl-3">
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#737373]">
                      Secondary Muscles
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#000000] dark:text-[#FFFFFF]">
                      {exercise.secondaryMuscles.length > 0 ? exercise.secondaryMuscles.join(', ') : 'None'}
                    </p>
                  </div>
                  <div className="border-l-2 border-[#E5E5E5] dark:border-[#262626] pl-3">
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#737373]">
                      Tracking Mode
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#000000] dark:text-[#FFFFFF]">
                      {TRACKING_TYPE_LABELS[exercise.trackingType]}
                    </p>
                  </div>
                </div>
                {exercise.notes && (
                  <div className="border-t border-[#E5E5E5] dark:border-[#262626] pt-4">
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#737373]">
                      Form Cues // Notes
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#000000] dark:text-[#D4D4D4]">
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
        title="Delete custom exercise?"
        description={`"${exercise.name}" will be removed from your exercise library. Past workout logs remain intact.`}
        confirmLabel="Delete Exercise"
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
