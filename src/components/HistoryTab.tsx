import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Trash2,
} from 'lucide-react';
import { WorkoutSession } from '../types/workout';
import { useWorkout } from '../context/WorkoutContext';
import {
  calculateWorkoutCompletedSets,
  calculateWorkoutVolumeKg,
  formatDuration,
  formatVolume,
  formatWeight,
  getGlobalTrainingStats,
  resolveSetWeightUnit,
  toLocalDateKey,
} from '../utils/calculations';
import { ConfirmDialog } from './ConfirmDialog';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function HistoryTab() {
  const { db, exerciseMap, deleteWorkout } = useWorkout();
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingWorkout, setDeletingWorkout] = useState<WorkoutSession | null>(null);

  const unit = db.settings.weightUnit;

  const completedWorkouts = useMemo(
    () =>
      [...db.workouts]
        .filter((w) => w.finishedAt !== null)
        .sort((a, b) => b.startedAt - a.startedAt),
    [db.workouts]
  );

  const globalStats = useMemo(
    () => getGlobalTrainingStats(completedWorkouts, 'ALL'),
    [completedWorkouts]
  );

  const workoutsByDate = useMemo(() => {
    const map = new Map<string, WorkoutSession[]>();
    for (const w of completedWorkouts) {
      const key = toLocalDateKey(w.startedAt);
      const list = map.get(key) ?? [];
      list.push(w);
      map.set(key, list);
    }
    return map;
  }, [completedWorkouts]);

  const calendarCells = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = (firstDay.getDay() + 6) % 7;

    const cells: ({ day: number; key: string; count: number } | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const count = workoutsByDate.get(key)?.length ?? 0;
      cells.push({ day: d, key, count });
    }
    return cells;
  }, [viewDate, workoutsByDate]);

  const monthWorkoutCount = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    return completedWorkouts.filter((w) => {
      const d = new Date(w.startedAt);
      return d.getFullYear() === year && d.getMonth() === month;
    }).length;
  }, [completedWorkouts, viewDate]);

  const filteredWorkouts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return completedWorkouts.filter((w) => {
      if (selectedDayKey && toLocalDateKey(w.startedAt) !== selectedDayKey) return false;
      if (!q) return true;
      if (w.title.toLowerCase().includes(q)) return true;
      return w.exercises.some((e) =>
        (exerciseMap.get(e.exerciseId)?.name ?? '').toLowerCase().includes(q)
      );
    });
  }, [completedWorkouts, selectedDayKey, searchQuery, exerciseMap]);

  const todayKey = toLocalDateKey(Date.now());

  const shiftMonth = (delta: number) => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--ink-primary)]">
          History
        </h1>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[312px_1fr] lg:items-start">
        {/* Left Column: Matte Calendar Widget */}
        <aside className="space-y-4 lg:sticky lg:top-8">
          <div className="matte-surface overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] px-4 py-3">
              <h2 className="text-sm font-semibold text-[var(--ink-primary)]">
                {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  aria-label="Previous month"
                  className="calm-press btn-ghost flex h-8 w-8 items-center justify-center"
                >
                  <ChevronLeft className="h-4 w-4 stroke-[1.5]" />
                </button>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  aria-label="Next month"
                  className="calm-press btn-ghost flex h-8 w-8 items-center justify-center"
                >
                  <ChevronRight className="h-4 w-4 stroke-[1.5]" />
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-[var(--ink-muted)]">
                {WEEKDAYS.map((day, i) => (
                  <span key={`${day}-${i}`} className="py-1">
                    {day}
                  </span>
                ))}
              </div>

              <div className="mt-1 grid grid-cols-7 gap-1">
                {calendarCells.map((cell, idx) => {
                  if (!cell) return <div key={`empty-${idx}`} className="h-9" />;
                  const isSelected = selectedDayKey === cell.key;
                  const isToday = cell.key === todayKey;
                  const hasWorkout = cell.count > 0;
                  return (
                    <button
                      key={cell.key}
                      type="button"
                      onClick={() => setSelectedDayKey(isSelected ? null : cell.key)}
                      aria-label={`${cell.key}, ${cell.count} workouts`}
                      aria-pressed={isSelected}
                      className={`calm-press relative flex h-9 flex-col items-center justify-center rounded-lg border font-mono text-xs tabular-nums transition-colors ${
                        isSelected
                          ? 'border-[var(--accent-steel-border)] bg-[var(--accent-steel-tint)] font-semibold text-[var(--accent-steel)]'
                          : hasWorkout
                          ? 'border-[var(--accent-sage-border)] bg-[var(--accent-sage-tint)] font-medium text-[var(--ink-primary)] hover:border-[var(--accent-sage)]'
                          : isToday
                          ? 'border-[var(--border-focus)] bg-transparent font-medium text-[var(--ink-primary)]'
                          : 'border-transparent bg-transparent text-[var(--ink-secondary)] hover:bg-[var(--surface-hover)]'
                      }`}
                    >
                      <span>{cell.day}</span>
                      {hasWorkout && !isSelected && (
                        <span className="mt-0.5 h-1 w-1 rounded-full bg-[var(--accent-sage)]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedDayKey && (
                <button
                  type="button"
                  onClick={() => setSelectedDayKey(null)}
                  className="calm-press btn-secondary mt-3 h-9 w-full px-3 text-xs font-medium"
                >
                  Filtered to <span className="font-mono">{selectedDayKey}</span> · Clear
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 divide-x divide-[var(--border-hairline)] border-t border-[var(--border-hairline)] bg-[var(--recessed)]">
              <div className="p-3">
                <p className="text-xs text-[var(--ink-muted)]">Month</p>
                <p className="mt-1 font-mono text-base font-semibold tabular-nums text-[var(--ink-primary)]">
                  {monthWorkoutCount}
                </p>
              </div>
              <div className="p-3">
                <p className="text-xs text-[var(--ink-muted)]">Total</p>
                <p className="mt-1 font-mono text-base font-semibold tabular-nums text-[var(--ink-primary)]">
                  {completedWorkouts.length}
                </p>
              </div>
              <div className="p-3">
                <p className="text-xs text-[var(--ink-muted)]">Streak</p>
                <p className="mt-1 font-mono text-base font-semibold tabular-nums text-[var(--ink-primary)]">
                  {globalStats.currentWeekStreak}w
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Column: De-boxed Session Feed directly on canvas */}
        <section className="space-y-4">
          <div className="flex flex-col gap-3 border-b border-[var(--border-hairline)] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-[var(--ink-primary)]">
              Workout log{' '}
              <span className="font-mono text-xs font-normal text-[var(--ink-muted)]">
                ({filteredWorkouts.length})
              </span>
            </h2>
            <div className="relative sm:w-72">
              <span className="pointer-events-none absolute left-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-[var(--ink-muted)]">
                <Search className="h-4 w-4 stroke-[1.5]" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sessions or lifts"
                aria-label="Search workout history"
                className="matte-input h-9 w-full pl-10 pr-3 text-sm"
              />
            </div>
          </div>

          {filteredWorkouts.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-[var(--ink-primary)]">No workouts match</p>
              <p className="mt-1 text-xs text-[var(--ink-secondary)]">
                {selectedDayKey || searchQuery
                  ? 'Clear active date or search filter to view all sessions'
                  : 'Complete a workout from the Workout tab to populate history'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-hairline)]">
              {filteredWorkouts.map((workout) => {
                const isExpanded = expandedId === workout.id;
                const volumeKg = calculateWorkoutVolumeKg(workout);
                const totalSets = calculateWorkoutCompletedSets(workout);
                const prCount = workout.exercises.reduce(
                  (acc, ex) =>
                    acc +
                    ex.sets.reduce(
                      (sAcc, s) => sAcc + (s.isWeightPR || s.is1RMPR || s.isVolumePR ? 1 : 0),
                      0
                    ),
                  0
                );

                return (
                  <article
                    key={workout.id}
                    className={`py-5 transition-colors ${
                      prCount > 0 ? 'relative pl-4' : ''
                    }`}
                  >
                    {prCount > 0 && (
                      <span
                        className="absolute left-0 top-6 h-5 w-[2px] rounded-full bg-[var(--accent-sand)]"
                        aria-hidden="true"
                      />
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-semibold tracking-[-0.01em] text-[var(--ink-primary)]">
                            {workout.title}
                          </h3>
                          {prCount > 0 && (
                            <span className="pr-badge inline-flex items-center px-2 py-0.5 font-mono text-xs font-medium">
                              {prCount} PR
                            </span>
                          )}
                        </div>
                        <p className="mt-1 font-mono text-xs tabular-nums text-[var(--ink-muted)]">
                          {new Date(workout.startedAt).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}{' '}
                          · {formatDuration(workout.durationSeconds)} · {formatVolume(volumeKg, unit)}{' '}
                          · {totalSets} sets
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : workout.id)}
                          aria-expanded={isExpanded}
                          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${workout.title}`}
                          className="calm-press btn-ghost flex h-8 w-8 items-center justify-center"
                        >
                          <ChevronDown
                            className={`h-4 w-4 stroke-[1.5] transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingWorkout(workout)}
                          aria-label={`Delete workout ${workout.title}`}
                          className="calm-press flex h-8 w-8 items-center justify-center rounded-lg text-[var(--ink-muted)] hover:bg-[var(--accent-clay-tint)] hover:text-[var(--accent-clay)]"
                        >
                          <Trash2 className="h-4 w-4 stroke-[1.5]" />
                        </button>
                      </div>
                    </div>

                    {workout.notes && (
                      <p className="mt-2 text-xs text-[var(--ink-secondary)]">{workout.notes}</p>
                    )}

                    {/* Compact preview when collapsed */}
                    {!isExpanded && (
                      <div className="mt-3 space-y-2">
                        {workout.exercises.slice(0, 4).map((ex) => {
                          const exDef = exerciseMap.get(ex.exerciseId);
                          const completed = ex.sets.filter((s) => s.completed);
                          const best = completed.reduce(
                            (b, s) => ((s.weightKg ?? 0) > (b.weightKg ?? 0) ? s : b),
                            completed[0]
                          );
                          const bestUnit = best
                            ? resolveSetWeightUnit(best.weightUnit, ex.weightUnit, unit)
                            : unit;
                          return (
                            <div
                              key={ex.id}
                              className="flex items-center justify-between gap-3 text-xs"
                            >
                              <span className="truncate text-[var(--ink-primary)]">
                                <span className="font-mono text-[var(--ink-muted)] tabular-nums">
                                  {completed.length}×{' '}
                                </span>
                                {exDef?.name ?? 'Exercise'}
                              </span>
                              {best && best.weightKg ? (
                                <span className="shrink-0 font-mono text-xs tabular-nums text-[var(--ink-secondary)]">
                                  {formatWeight(best.weightKg, bestUnit)} × {best.reps ?? 0}
                                </span>
                              ) : null}
                            </div>
                          );
                        })}
                        {workout.exercises.length > 4 && (
                          <p className="text-xs text-[var(--ink-muted)]">
                            +{workout.exercises.length - 4} more exercises
                          </p>
                        )}
                      </div>
                    )}

                    {/* Smooth Accordion Full Set Breakdown */}
                    <div className="calm-accordion" data-open={isExpanded}>
                      <div>
                        <div className="mt-4 space-y-4">
                          {workout.exercises.map((ex) => {
                            const exDef = exerciseMap.get(ex.exerciseId);
                            return (
                              <div key={ex.id} className="space-y-2">
                                <div className="flex items-baseline justify-between gap-2">
                                  <h4 className="text-sm font-medium text-[var(--ink-primary)]">
                                    {exDef?.name ?? 'Exercise'}
                                  </h4>
                                  <span className="text-xs text-[var(--ink-muted)]">
                                    {exDef?.primaryMuscle}
                                  </span>
                                </div>
                                {ex.notes && (
                                  <p className="text-xs text-[var(--ink-secondary)]">{ex.notes}</p>
                                )}
                                <div className="divide-y divide-[var(--border-hairline)] rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] px-3">
                                  {ex.sets
                                    .filter((s) => s.completed)
                                    .map((s, sIdx) => {
                                      const hasPR = Boolean(
                                        s.isWeightPR || s.is1RMPR || s.isVolumePR
                                      );
                                      return (
                                        <div
                                          key={s.id}
                                          className={`flex min-h-[40px] items-center justify-between py-2 text-xs ${
                                            hasPR ? 'status-tick status-tick-sand pl-3' : ''
                                          }`}
                                        >
                                          <div className="flex items-center gap-3">
                                            <span className="w-5 font-mono font-medium text-[var(--ink-muted)]">
                                              {s.setType === 'warmup'
                                                ? 'W'
                                                : s.setType === 'drop'
                                                ? 'D'
                                                : s.setType === 'failure'
                                                ? 'F'
                                                : sIdx + 1}
                                            </span>
                                            <span className="font-mono font-medium tabular-nums text-[var(--ink-primary)]">
                                              {exDef?.trackingType === 'duration'
                                                ? formatDuration(s.durationSec ?? 0)
                                                : exDef?.trackingType === 'bodyweight'
                                                ? `${s.reps ?? 0} reps`
                                                : `${formatWeight(
                                                    s.weightKg,
                                                    resolveSetWeightUnit(
                                                      s.weightUnit,
                                                      ex.weightUnit,
                                                      unit
                                                    )
                                                  )} × ${s.reps ?? 0}`}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2 font-mono text-[11px] font-medium">
                                            {s.isWeightPR && (
                                              <span className="pr-badge px-2 py-0.5">
                                                Weight PR
                                              </span>
                                            )}
                                            {s.is1RMPR && (
                                              <span className="pr-badge px-2 py-0.5">1RM PR</span>
                                            )}
                                            {s.isVolumePR && (
                                              <span className="pr-badge px-2 py-0.5">Vol PR</span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={deletingWorkout !== null}
        title="Delete workout log"
        description={`"${deletingWorkout?.title}" will be permanently removed from history and analytics`}
        confirmLabel="Delete workout"
        destructive
        onCancel={() => setDeletingWorkout(null)}
        onConfirm={() => {
          if (deletingWorkout) deleteWorkout(deletingWorkout.id);
          setDeletingWorkout(null);
        }}
      />
    </div>
  );
}
