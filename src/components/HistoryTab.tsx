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

  const globalStats = useMemo(() => getGlobalTrainingStats(completedWorkouts, 'ALL'), [completedWorkouts]);

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

  // Build monthly calendar cells (Monday-first grid)
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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr] lg:items-start">
      {/* Left Column: Pitch-Black Inverted Consistency Matrix */}
      <aside className="space-y-4 lg:sticky lg:top-6">
        <div className="hud-frame border border-[#000000] dark:border-[#262626] bg-[#000000] dark:bg-[#0A0A0A] text-[#FFFFFF]">
          <div className="flex items-center justify-between border-b border-[#262626] px-4 py-3">
            <div>
              <p className="font-mono text-[9px] font-bold tracking-[0.12em] uppercase text-[#737373]">
                01 // CONSISTENCY MATRIX
              </p>
              <h2 className="mt-0.5 text-sm font-bold uppercase tracking-[0.04em] text-[#FFFFFF]">
                {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                aria-label="Previous month"
                className="mech-press flex h-8 w-8 items-center justify-center rounded-[2px] border border-[#262626] text-[#FFFFFF] hover:border-[#FFFFFF]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                aria-label="Next month"
                className="mech-press flex h-8 w-8 items-center justify-center rounded-[2px] border border-[#262626] text-[#FFFFFF] hover:border-[#FFFFFF]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] font-bold text-[#737373]">
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
                    className={`mech-press relative flex h-9 flex-col items-center justify-center rounded-[2px] border font-mono text-xs font-bold tabular-nums ${
                      isSelected
                        ? 'border-[#FFFFFF] bg-[#FFFFFF] text-[#000000] hud-pr-stamp'
                        : hasWorkout
                        ? 'border-[#FFFFFF] bg-[#FFFFFF] text-[#000000] hover:bg-[#E5E5E5]'
                        : isToday
                        ? 'border-dashed border-[#FFFFFF] bg-[#141414] text-[#FFFFFF]'
                        : 'border-[#141414] bg-[#0A0A0A] text-[#737373] hover:border-[#262626] hover:text-[#FFFFFF]'
                    }`}
                  >
                    <span>{cell.day}</span>
                  </button>
                );
              })}
            </div>

            {selectedDayKey && (
              <button
                type="button"
                onClick={() => setSelectedDayKey(null)}
                className="mech-press mt-3 w-full rounded-[2px] border border-[#FFFFFF] bg-[#141414] py-2 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#FFFFFF] hover:bg-[#FFFFFF] hover:text-[#000000]"
              >
                FILTER: {selectedDayKey} // CLEAR ×
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 divide-x divide-[#262626] border-t border-[#262626] bg-[#0A0A0A]">
            <div className="p-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-[#737373]">MONTH</p>
              <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-[#FFFFFF]">
                {monthWorkoutCount}
              </p>
            </div>
            <div className="p-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-[#737373]">TOTAL</p>
              <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-[#FFFFFF]">
                {completedWorkouts.length}
              </p>
            </div>
            <div className="p-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-[#737373]">STREAK</p>
              <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-[#FFFFFF]">
                {globalStats.currentWeekStreak}W
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Right Column: Stark-White Modular Session Ledger */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 border-b border-[#000000] dark:border-[#FFFFFF] pb-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[10px] font-bold tracking-[0.12em] uppercase text-[#737373]">
              02 // SESSION LEDGER
            </p>
            <h2 className="mt-0.5 text-lg font-bold tracking-tight text-[#000000] dark:text-[#FFFFFF]">
              Workout Log ({filteredWorkouts.length})
            </h2>
          </div>
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#737373]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sessions or lifts..."
              aria-label="Search workout history"
              className="h-10 w-full rounded-[2px] border border-[#D4D4D4] dark:border-[#262626] bg-[#F5F5F5] dark:bg-[#141414] pl-9 pr-3 text-sm text-[#000000] dark:text-[#FFFFFF] placeholder-[#737373] focus:border-[#000000] dark:focus:border-[#FFFFFF] focus:bg-[#FFFFFF] dark:focus:bg-[#0A0A0A] focus:outline-none"
            />
          </div>
        </div>

        {filteredWorkouts.length === 0 ? (
          <div className="hud-dot-matrix border border-dashed border-[#D4D4D4] dark:border-[#262626] px-6 py-14 text-center">
            <span className="inline-block border border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#000000] px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
              00 // NO LOGS MATCH
            </span>
            <p className="mt-2 font-mono text-xs text-[#737373]">
              {selectedDayKey || searchQuery
                ? 'Clear your date or search filter to see all sessions.'
                : 'Complete your first workout from the Workout tab to populate history.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E5E5] dark:divide-[#262626] border border-[#E5E5E5] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#0A0A0A]">
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
                  className={`transition-colors duration-[180ms] ${
                    prCount > 0 ? 'border-l-[3px] border-l-[#000000] dark:border-l-[#FFFFFF]' : ''
                  }`}
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-bold text-[#000000] dark:text-[#FFFFFF]">
                            {workout.title}
                          </h3>
                          {prCount > 0 && (
                            <span className="hud-pr-stamp inline-flex items-center bg-[#000000] dark:bg-[#FFFFFF] px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-[#FFFFFF] dark:text-[#000000]">
                              {prCount} PR ▲
                            </span>
                          )}
                        </div>
                        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.04em] tabular-nums text-[#737373]">
                          {new Date(workout.startedAt).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}{' '}
                          // {formatDuration(workout.durationSeconds)} // {formatVolume(volumeKg, unit)} // {totalSets} SETS
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : workout.id)}
                          aria-expanded={isExpanded}
                          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${workout.title}`}
                          className="mech-press flex h-9 w-9 items-center justify-center rounded-[2px] border border-[#E5E5E5] dark:border-[#262626] text-[#000000] dark:text-[#FFFFFF] hover:border-[#000000] dark:hover:border-[#FFFFFF]"
                        >
                          <ChevronDown
                            className={`h-4 w-4 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingWorkout(workout)}
                          aria-label={`Delete workout ${workout.title}`}
                          className="mech-press flex h-9 w-9 items-center justify-center rounded-[2px] text-[#737373] hover:bg-[#000000] dark:hover:bg-[#FFFFFF] hover:text-[#FFFFFF] dark:hover:text-[#000000]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {workout.notes && (
                      <p className="mt-2 font-mono text-xs text-[#737373]">
                        // {workout.notes}
                      </p>
                    )}

                    {/* Compact preview when collapsed */}
                    {!isExpanded && (
                      <div className="mt-3 space-y-1 border-t border-[#E5E5E5] dark:border-[#262626] pt-3">
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
                            <div key={ex.id} className="flex items-center justify-between gap-3 text-xs">
                              <span className="truncate text-[#000000] dark:text-[#FFFFFF]">
                                <span className="font-mono font-bold text-[#737373] tabular-nums">
                                  {completed.length} ×{' '}
                                </span>
                                {exDef?.name ?? 'Exercise'}
                              </span>
                              {best && best.weightKg ? (
                                <span className="shrink-0 font-mono text-[11px] font-semibold tabular-nums text-[#737373]">
                                  TOP {formatWeight(best.weightKg, bestUnit)} × {best.reps ?? 0}
                                </span>
                              ) : null}
                            </div>
                          );
                        })}
                        {workout.exercises.length > 4 && (
                          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-[#000000] dark:text-[#FFFFFF]">
                            +{workout.exercises.length - 4} MORE EXERCISES
                          </p>
                        )}
                      </div>
                    )}

                    {/* Smooth Accordion Full Set Breakdown */}
                    <div className="hud-accordion" data-open={isExpanded}>
                      <div>
                        <div className="mt-4 space-y-4 border-t border-[#E5E5E5] dark:border-[#262626] pt-4">
                          {workout.exercises.map((ex) => {
                            const exDef = exerciseMap.get(ex.exerciseId);
                            return (
                              <div key={ex.id} className="space-y-1.5">
                                <div className="flex items-baseline justify-between">
                                  <h4 className="text-sm font-bold text-[#000000] dark:text-[#FFFFFF]">
                                    {exDef?.name ?? 'Exercise'}
                                  </h4>
                                  <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#737373]">
                                    {exDef?.primaryMuscle}
                                  </span>
                                </div>
                                {ex.notes && (
                                  <p className="font-mono text-xs text-[#737373]">// {ex.notes}</p>
                                )}
                                <div className="divide-y divide-[#E5E5E5] dark:divide-[#262626] border border-[#E5E5E5] dark:border-[#262626] bg-[#F5F5F5] dark:bg-[#141414] px-3">
                                  {ex.sets
                                    .filter((s) => s.completed)
                                    .map((s, sIdx) => (
                                      <div key={s.id} className="flex items-center justify-between py-2 text-xs">
                                        <div className="flex items-center gap-3">
                                          <span className="w-5 font-mono font-bold text-[#737373]">
                                            {s.setType === 'warmup'
                                              ? 'W'
                                              : s.setType === 'drop'
                                              ? 'D'
                                              : s.setType === 'failure'
                                              ? 'F'
                                              : sIdx + 1}
                                          </span>
                                          <span className="font-mono font-semibold tabular-nums text-[#000000] dark:text-[#FFFFFF]">
                                            {exDef?.trackingType === 'duration'
                                              ? formatDuration(s.durationSec ?? 0)
                                              : exDef?.trackingType === 'bodyweight'
                                              ? `${s.reps ?? 0} reps`
                                              : `${formatWeight(
                                                  s.weightKg,
                                                  resolveSetWeightUnit(s.weightUnit, ex.weightUnit, unit)
                                                )} × ${s.reps ?? 0}`}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase">
                                          {s.isWeightPR && (
                                            <span className="bg-[#000000] dark:bg-[#FFFFFF] px-1.5 py-0.5 text-[#FFFFFF] dark:text-[#000000]">
                                              // WT PR
                                            </span>
                                          )}
                                          {s.is1RMPR && (
                                            <span className="bg-[#000000] dark:bg-[#FFFFFF] px-1.5 py-0.5 text-[#FFFFFF] dark:text-[#000000]">
                                              // 1RM PR
                                            </span>
                                          )}
                                          {s.isVolumePR && (
                                            <span className="bg-[#000000] dark:bg-[#FFFFFF] px-1.5 py-0.5 text-[#FFFFFF] dark:text-[#000000]">
                                              // VOL PR
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={deletingWorkout !== null}
        title="Delete workout log?"
        description={`"${deletingWorkout?.title}" will be permanently removed from your history and analytics.`}
        confirmLabel="Delete Workout"
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
