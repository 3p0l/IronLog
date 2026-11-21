import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  Clock,
  Plus,
  Timer,
  Trash2,
  X,
} from 'lucide-react';
import {
  Exercise,
  PRRecord,
  SetType,
  WeightUnit,
  WorkoutSession,
  WorkoutSet,
} from '../types/workout';
import { useWorkout } from '../context/WorkoutContext';
import {
  calculateWorkoutCompletedSets,
  calculateWorkoutVolumeKg,
  checkRoutineDiff,
  convertDistanceFromKm,
  convertDistanceToKm,
  convertWeightFromKg,
  convertWeightToKg,
  formatDuration,
  formatTimerClock,
  formatVolume,
  formatWeight,
  getPreviousExerciseSets,
  resolveSetWeightUnit,
} from '../utils/calculations';
import { ExercisePickerModal } from './ExercisePickerModal';
import { CustomExerciseModal } from './CustomExerciseModal';
import { ExerciseDetailModal } from './ExerciseDetailModal';
import { WorkoutSummaryModal } from './WorkoutSummaryModal';
import { ConfirmDialog } from './ConfirmDialog';
import { SegmentedControl } from './ui/LinearPrimitives';

const SET_TYPE_ORDER: SetType[] = ['normal', 'warmup', 'drop', 'failure'];

function cycleSetType(cur: SetType): SetType {
  return SET_TYPE_ORDER[(SET_TYPE_ORDER.indexOf(cur) + 1) % SET_TYPE_ORDER.length];
}

interface SetRowProps {
  workoutExerciseId: string;
  exercise: Exercise;
  exerciseWeightUnit?: WeightUnit;
  set: WorkoutSet;
  displayIndex: number;
  rowNumber: number;
  previousSet: WorkoutSet | undefined;
}

function SetRow({
  workoutExerciseId,
  exercise,
  exerciseWeightUnit,
  set,
  displayIndex,
  rowNumber,
  previousSet,
}: SetRowProps) {
  const { db, updateActiveSet, toggleActiveSetComplete, deleteSetFromActiveExercise } = useWorkout();
  const globalUnit = db.settings.weightUnit;
  const setUnit = resolveSetWeightUnit(set.weightUnit, exerciseWeightUnit, globalUnit);
  const distUnit = db.settings.distanceUnit;
  const touchStartX = useRef<number | null>(null);
  const [swipedOpen, setSwipedOpen] = useState(false);

  const tracking = exercise.trackingType;

  const formatPrev = (compact = false): string => {
    if (!previousSet) return '—';
    if (tracking === 'duration') {
      return previousSet.durationSec ? formatDuration(previousSet.durationSec) : '—';
    }
    if (tracking === 'distance') {
      const dist = convertDistanceFromKm(previousSet.distanceKm, distUnit);
      return dist !== null ? `${dist}${compact ? '' : ' '}${distUnit}` : '—';
    }
    if (tracking === 'bodyweight') {
      return previousSet.reps !== null ? `${previousSet.reps}${compact ? 'r' : ' reps'}` : '—';
    }
    const prevUnit = resolveSetWeightUnit(previousSet.weightUnit, exerciseWeightUnit, globalUnit);
    const wt = formatWeight(previousSet.weightKg, prevUnit, !compact);
    if (wt === '—' && previousSet.reps === null) return '—';
    return compact ? `${wt}×${previousSet.reps ?? 0}` : `${wt} × ${previousSet.reps ?? 0}`;
  };

  const applyPrevious = () => {
    if (!previousSet) return;
    updateActiveSet(workoutExerciseId, set.id, {
      weightKg: previousSet.weightKg,
      weightUnit: previousSet.weightUnit ?? setUnit,
      reps: previousSet.reps,
      durationSec: previousSet.durationSec,
      distanceKm: previousSet.distanceKm,
    });
  };

  const toggleSetUnit = () => {
    const nextUnit: WeightUnit = setUnit === 'kg' ? 'lbs' : 'kg';
    updateActiveSet(workoutExerciseId, set.id, { weightUnit: nextUnit });
  };

  const setBadgeLabel =
    set.setType === 'warmup'
      ? 'W'
      : set.setType === 'drop'
      ? 'D'
      : set.setType === 'failure'
      ? 'F'
      : String(displayIndex);

  const setBadgeStyle =
    set.setType === 'warmup'
      ? 'border border-dashed border-[var(--border-focus)] bg-transparent text-[var(--ink-secondary)]'
      : set.setType === 'drop'
      ? 'border border-[var(--accent-steel-border)] bg-[var(--accent-steel-tint)] text-[var(--accent-steel)]'
      : set.setType === 'failure'
      ? 'border border-[var(--accent-clay-border)] bg-[var(--accent-clay-tint)] text-[var(--accent-clay)]'
      : set.completed
      ? 'border border-[var(--accent-sage-border)] bg-[var(--accent-sage-tint)] text-[var(--accent-sage)]'
      : 'border border-[var(--border-hairline)] bg-[var(--recessed)] text-[var(--ink-secondary)]';

  return (
    <div
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const delta = touchStartX.current - e.changedTouches[0].clientX;
        if (delta > 55) setSwipedOpen(true);
        else if (delta < -35) setSwipedOpen(false);
        touchStartX.current = null;
      }}
      className={`group relative grid min-h-[48px] items-center gap-1 sm:gap-2 rounded-lg pl-2 pr-1 py-2 transition-colors duration-[180ms] ${
        tracking === 'bodyweight' || tracking === 'duration'
          ? 'grid-cols-[36px_1fr_92px_40px_28px]'
          : tracking === 'distance'
          ? 'grid-cols-[36px_minmax(52px,1fr)_74px_60px_38px_28px] sm:grid-cols-[40px_1fr_92px_80px_40px_32px]'
          : 'grid-cols-[32px_minmax(48px,1fr)_92px_46px_36px_26px] sm:grid-cols-[40px_1fr_124px_80px_40px_32px]'
      } ${
        set.completed
          ? 'status-tick status-tick-sage bg-transparent'
          : 'bg-transparent hover:bg-[var(--surface-hover)]/50'
      }`}
    >
      {/* Set # / Type */}
      <button
        type="button"
        onClick={() => updateActiveSet(workoutExerciseId, set.id, { setType: cycleSetType(set.setType) })}
        title="Tap to change set type (Normal, Warmup, Drop, Failure)"
        aria-label={`Set ${rowNumber} type ${set.setType}`}
        className={`calm-press flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-[6px] font-mono text-xs font-medium ${setBadgeStyle}`}
      >
        {setBadgeLabel}
      </button>

      {/* Previous Session Value */}
      <button
        type="button"
        onClick={applyPrevious}
        disabled={!previousSet}
        title={previousSet ? 'Tap to copy previous session value' : 'No previous session'}
        className="calm-press truncate text-left font-mono text-xs tabular-nums text-[var(--ink-muted)] hover:text-[var(--ink-primary)] disabled:cursor-default disabled:hover:text-[var(--ink-muted)]"
      >
        <span className="sm:hidden">{formatPrev(true)}</span>
        <span className="hidden sm:inline">{formatPrev(false)}</span>
      </button>

      {/* Dynamic Metric Inputs */}
      {tracking === 'duration' ? (
        <input
          type="number"
          min="0"
          value={set.durationSec ?? ''}
          onChange={(e) =>
            updateActiveSet(workoutExerciseId, set.id, {
              durationSec: e.target.value === '' ? null : Math.max(0, Math.round(Number(e.target.value))),
            })
          }
          placeholder="sec"
          aria-label={`${exercise.name} set ${rowNumber} duration in seconds`}
          className="matte-input h-9 w-full bg-[var(--recessed)] px-2 text-center font-mono text-sm font-medium tabular-nums"
        />
      ) : tracking === 'bodyweight' ? (
        <input
          type="number"
          min="0"
          value={set.reps ?? ''}
          onChange={(e) =>
            updateActiveSet(workoutExerciseId, set.id, {
              reps: e.target.value === '' ? null : Math.max(0, Math.round(Number(e.target.value))),
            })
          }
          placeholder="reps"
          aria-label={`${exercise.name} set ${rowNumber} reps`}
          className="matte-input h-9 w-full bg-[var(--recessed)] px-2 text-center font-mono text-sm font-medium tabular-nums"
        />
      ) : tracking === 'distance' ? (
        <>
          <input
            type="number"
            step="any"
            min="0"
            value={convertDistanceFromKm(set.distanceKm, distUnit) ?? ''}
            onChange={(e) =>
              updateActiveSet(workoutExerciseId, set.id, {
                distanceKm:
                  e.target.value === '' ? null : convertDistanceToKm(Number(e.target.value), distUnit),
              })
            }
            placeholder={distUnit}
            aria-label={`${exercise.name} set ${rowNumber} distance`}
            className="matte-input h-9 w-full bg-[var(--recessed)] px-2 text-center font-mono text-sm font-medium tabular-nums"
          />
          <input
            type="number"
            min="0"
            value={set.durationSec ?? ''}
            onChange={(e) =>
              updateActiveSet(workoutExerciseId, set.id, {
                durationSec: e.target.value === '' ? null : Math.max(0, Math.round(Number(e.target.value))),
              })
            }
            placeholder="sec"
            aria-label={`${exercise.name} set ${rowNumber} seconds`}
            className="matte-input h-9 w-full bg-[var(--recessed)] px-2 text-center font-mono text-sm font-medium tabular-nums"
          />
        </>
      ) : (
        <>
          <div className="flex h-9 w-full items-stretch overflow-hidden rounded-lg border border-[var(--border-hairline)] bg-[var(--recessed)] transition-colors focus-within:border-[var(--accent-steel)]">
            <input
              type="number"
              step="any"
              min="0"
              value={convertWeightFromKg(set.weightKg, setUnit) ?? ''}
              onChange={(e) =>
                updateActiveSet(workoutExerciseId, set.id, {
                  weightKg:
                    e.target.value === '' ? null : convertWeightToKg(Number(e.target.value), setUnit),
                  weightUnit: setUnit,
                })
              }
              placeholder={tracking === 'assisted_bodyweight' ? `-${setUnit}` : '0'}
              aria-label={`${exercise.name} set ${rowNumber} weight`}
              className="min-w-0 flex-1 bg-transparent px-1 sm:px-2 text-center font-mono text-xs sm:text-sm font-medium tabular-nums text-[var(--ink-primary)] placeholder-[var(--ink-muted)] focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={toggleSetUnit}
              title={`Switch set ${rowNumber} to ${setUnit === 'kg' ? 'lbs' : 'kg'}`}
              aria-label={`${exercise.name} set ${rowNumber} unit ${setUnit}`}
              className={`calm-press flex w-8 sm:w-9 shrink-0 items-center justify-center border-l border-[var(--border-hairline)] font-mono text-[11px] font-medium transition-colors ${
                setUnit === 'lbs'
                  ? 'bg-[var(--surface-active)] text-[var(--ink-primary)]'
                  : 'bg-[var(--surface)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
              }`}
            >
              {setUnit}
            </button>
          </div>
          <input
            type="number"
            min="0"
            value={set.reps ?? ''}
            onChange={(e) =>
              updateActiveSet(workoutExerciseId, set.id, {
                reps: e.target.value === '' ? null : Math.max(0, Math.round(Number(e.target.value))),
              })
            }
            placeholder="reps"
            aria-label={`${exercise.name} set ${rowNumber} reps`}
            className="matte-input h-9 w-full bg-[var(--recessed)] px-1 sm:px-2 text-center font-mono text-xs sm:text-sm font-medium tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </>
      )}

      {/* Completion Toggle (Muted Sage) */}
      <button
        type="button"
        onClick={() => toggleActiveSetComplete(workoutExerciseId, set.id)}
        aria-label={`${set.completed ? 'Uncheck' : 'Complete'} ${exercise.name} set ${rowNumber}`}
        aria-pressed={set.completed}
        className={`calm-press flex h-9 w-9 sm:w-10 items-center justify-center rounded-lg border transition-colors ${
          set.completed
            ? 'border-[var(--accent-sage-border)] bg-[var(--accent-sage-tint)] text-[var(--accent-sage)]'
            : 'border-[var(--border-hairline)] bg-[var(--recessed)] text-[var(--ink-muted)] hover:border-[var(--border-focus)] hover:text-[var(--ink-primary)]'
        }`}
      >
        <Check className="h-4 w-4 stroke-[1.5]" />
      </button>

      {/* Delete Set Button */}
      <button
        type="button"
        onClick={() => deleteSetFromActiveExercise(workoutExerciseId, set.id)}
        aria-label={`Delete ${exercise.name} set ${rowNumber}`}
        className={`calm-press flex h-8 w-6 sm:w-8 items-center justify-center rounded-lg transition-colors ${
          swipedOpen
            ? 'bg-[var(--accent-clay-tint)] text-[var(--accent-clay)]'
            : 'text-[var(--ink-muted)] hover:bg-[var(--accent-clay-tint)] hover:text-[var(--accent-clay)]'
        }`}
      >
        <Trash2 className="h-4 w-4 stroke-[1.5]" />
      </button>
    </div>
  );
}

export function ActiveWorkoutModal() {
  const {
    db,
    exerciseMap,
    activeWorkoutOpen,
    setActiveWorkoutOpen,
    restTimer,
    restSecondsRemaining,
    startRestTimer,
    adjustRestTimer,
    skipRestTimer,
    updateActiveWorkoutTitle,
    addExercisesToActiveWorkout,
    removeExerciseFromActiveWorkout,
    moveActiveWorkoutExercise,
    updateActiveExerciseNotes,
    updateActiveExerciseRest,
    updateActiveExerciseWeightUnit,
    addSetToActiveExercise,
    prepareFinishWorkout,
    confirmFinishWorkout,
    discardActiveWorkout,
  } = useWorkout();

  const [elapsedSec, setElapsedSec] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    annotatedSession: WorkoutSession;
    prs: PRRecord[];
  } | null>(null);
  const [emptyFinishWarning, setEmptyFinishWarning] = useState(false);

  const session = db.activeWorkout;

  useEffect(() => {
    if (!session) return;
    const update = () => {
      setElapsedSec(Math.max(0, Math.floor((Date.now() - session.startedAt) / 1000)));
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [session?.id, session?.startedAt]);

  const totalVolumeKg = useMemo(
    () => (session ? calculateWorkoutVolumeKg(session) : 0),
    [session]
  );
  const completedSets = useMemo(
    () => (session ? calculateWorkoutCompletedSets(session) : 0),
    [session]
  );
  const plannedSets = useMemo(
    () => (session ? session.exercises.reduce((acc, e) => acc + e.sets.length, 0) : 0),
    [session]
  );

  const sourceRoutine = useMemo(
    () => (session?.routineId ? db.routines.find((r) => r.id === session.routineId) : undefined),
    [session?.routineId, db.routines]
  );

  const routineModified = useMemo(
    () => (session && sourceRoutine ? checkRoutineDiff(session, sourceRoutine) : false),
    [session, sourceRoutine]
  );

  if (!session || !activeWorkoutOpen) return null;

  const handleFinishClick = () => {
    if (completedSets === 0) {
      setEmptyFinishWarning(true);
      return;
    }
    const prepared = prepareFinishWorkout();
    if (prepared) {
      setSummaryData(prepared);
    }
  };

  const restProgressPct =
    restTimer && restTimer.totalSeconds > 0
      ? Math.max(0, Math.min(100, (restSecondsRemaining / restTimer.totalSeconds) * 100))
      : 0;

  return (
    <>
      <div
        className="view-enter fixed inset-0 z-40 flex flex-col bg-[var(--canvas)]"
        role="region"
        aria-label="Active workout logger"
      >
        {/* Solid Matte Sticky Header (zero glassmorphism) */}
        <header className="sticky top-0 z-20 border-b border-[var(--border-hairline)] bg-[var(--recessed)]">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveWorkoutOpen(false)}
                aria-label="Minimize active workout"
                className="calm-press btn-secondary flex h-9 w-9 shrink-0 items-center justify-center"
              >
                <ChevronDown className="h-4 w-4 stroke-[1.5]" />
              </button>
              <div className="status-tick status-tick-steel min-w-0 pl-3">
                <p className="text-xs font-medium text-[var(--accent-steel)]">Active workout</p>
                <input
                  type="text"
                  value={session.title}
                  onChange={(e) => updateActiveWorkoutTitle(e.target.value)}
                  aria-label="Workout title"
                  className="w-full min-w-0 truncate bg-transparent text-sm font-semibold tracking-[-0.01em] text-[var(--ink-primary)] focus:outline-none sm:text-base"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => startRestTimer('manual', db.settings.defaultRestSeconds)}
                aria-label="Start rest timer"
                title="Start rest timer"
                className="calm-press btn-secondary flex h-9 w-9 items-center justify-center"
              >
                <Timer className="h-4 w-4 stroke-[1.5]" />
              </button>
              <button
                type="button"
                onClick={handleFinishClick}
                className="calm-press btn-primary h-9 px-4 text-sm font-medium whitespace-nowrap"
              >
                Finish
              </button>
            </div>
          </div>

          {/* Live Readout Strip */}
          <div className="border-t border-[var(--border-hairline)]">
            <div className="mx-auto grid max-w-4xl grid-cols-3 divide-x divide-[var(--border-hairline)] px-4 sm:px-6">
              <div className="py-2 pr-3">
                <p className="text-xs text-[var(--ink-muted)]">Duration</p>
                <p
                  data-testid="active-workout-duration"
                  className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-[var(--ink-primary)]"
                >
                  {formatTimerClock(elapsedSec)}
                </p>
              </div>
              <div className="py-2 px-3">
                <p className="text-xs text-[var(--ink-muted)]">Volume</p>
                <p
                  data-testid="active-workout-volume"
                  className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-[var(--ink-primary)]"
                >
                  {formatVolume(totalVolumeKg, db.settings.weightUnit)}
                </p>
              </div>
              <div className="py-2 pl-3">
                <p className="text-xs text-[var(--ink-muted)]">Sets</p>
                <p
                  data-testid="active-workout-sets"
                  className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-[var(--ink-primary)]"
                >
                  {completedSets}
                  <span className="font-normal text-[var(--ink-muted)]"> / {plannedSets}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Live Rest Countdown Bar (Steel Accent + 2px left status tick) */}
          {restTimer && restSecondsRemaining > 0 && (
            <div
              data-testid="rest-timer-bar"
              className="view-enter border-t border-[var(--border-hairline)] bg-[var(--surface)]"
            >
              <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
                <div className="status-tick status-tick-steel flex items-center gap-2 pl-3">
                  <span className="flex h-5 w-5 items-center justify-center text-[var(--accent-steel)]">
                    <Clock className="h-4 w-4 stroke-[1.5]" />
                  </span>
                  <span className="text-xs font-medium text-[var(--ink-secondary)]">Rest</span>
                  <span className="font-mono text-sm font-semibold tabular-nums text-[var(--ink-primary)]">
                    {formatTimerClock(restSecondsRemaining)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjustRestTimer(-15)}
                    className="calm-press btn-secondary h-8 px-3 font-mono text-xs font-medium"
                  >
                    -15s
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustRestTimer(15)}
                    className="calm-press btn-secondary h-8 px-3 font-mono text-xs font-medium"
                  >
                    +15s
                  </button>
                  <button
                    type="button"
                    onClick={skipRestTimer}
                    className="calm-press btn-primary h-8 px-3 text-xs font-medium"
                  >
                    Skip
                  </button>
                </div>
              </div>
              <div className="mx-auto max-w-4xl px-4 pb-2 sm:px-6">
                <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--recessed)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent-steel)] transition-[width] duration-200"
                    style={{ width: `${restProgressPct}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Scrollable Exercise Logger Containers */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl space-y-5 px-3 py-6 pb-20 sm:px-6">
            {session.exercises.length === 0 ? (
              <div className="matte-surface px-6 py-12 text-center">
                <h2 className="text-base font-semibold text-[var(--ink-primary)]">
                  No exercises in session
                </h2>
                <p className="mt-1 text-sm text-[var(--ink-secondary)]">
                  Add exercises to record sets, weights, and reps
                </p>
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="calm-press btn-primary mt-5 inline-flex h-10 items-center gap-2 px-5 text-sm font-medium whitespace-nowrap"
                >
                  <Plus className="h-4 w-4 stroke-[1.5]" />
                  Add exercise
                </button>
              </div>
            ) : (
              session.exercises.map((wEx, exIdx) => {
                const exDef = exerciseMap.get(wEx.exerciseId);
                if (!exDef) return null;
                const previousSets = getPreviousExerciseSets(
                  exDef.id,
                  db.workouts,
                  session.startedAt
                );
                const tracking = exDef.trackingType;
                const isWeighted =
                  tracking === 'weight_reps' || tracking === 'assisted_bodyweight';
                const exerciseUnit = wEx.weightUnit ?? db.settings.weightUnit;
                const hasMixedSetUnits =
                  isWeighted &&
                  new Set(
                    wEx.sets.map((s) =>
                      resolveSetWeightUnit(s.weightUnit, wEx.weightUnit, db.settings.weightUnit)
                    )
                  ).size > 1;

                let normalCounter = 0;

                return (
                  <section key={wEx.id} className="matte-surface p-4 space-y-3">
                    {/* Exercise Header */}
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-hairline)] pb-3">
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => setDetailExercise(exDef)}
                          className="truncate text-left text-sm sm:text-base font-semibold text-[var(--ink-primary)] hover:underline underline-offset-4"
                        >
                          {exDef.name}
                        </button>
                        <p className="mt-1 text-xs text-[var(--ink-secondary)]">
                          {exDef.primaryMuscle} · {exDef.equipment}
                          {hasMixedSetUnits ? ' · Mixed kg/lbs' : ''}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {isWeighted && (
                          <SegmentedControl<WeightUnit>
                            value={hasMixedSetUnits ? null : exerciseUnit}
                            onChange={(u) => updateActiveExerciseWeightUnit(wEx.id, u)}
                            layoutId={`active-ex-unit-${wEx.id}`}
                            size="xs"
                            ariaLabel={`${exDef.name} weight unit`}
                            options={[
                              { value: 'kg', label: 'kg', ariaLabel: `Set ${exDef.name} to kg` },
                              { value: 'lbs', label: 'lbs', ariaLabel: `Set ${exDef.name} to lbs` },
                            ]}
                          />
                        )}
                        <select
                          value={wEx.restSeconds}
                          onChange={(e) => updateActiveExerciseRest(wEx.id, Number(e.target.value))}
                          aria-label={`${exDef.name} rest timer`}
                          className="matte-input h-8 bg-[var(--recessed)] px-2 font-mono text-xs tabular-nums"
                        >
                          {[0, 30, 45, 60, 75, 90, 120, 150, 180, 240, 300].map((sec) => (
                            <option key={sec} value={sec}>
                              {sec === 0 ? 'Rest off' : `Rest ${sec}s`}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => moveActiveWorkoutExercise(wEx.id, 'up')}
                          disabled={exIdx === 0}
                          aria-label={`Move ${exDef.name} up`}
                          className="calm-press btn-ghost flex h-8 w-8 items-center justify-center disabled:opacity-25"
                        >
                          <ArrowUp className="h-4 w-4 stroke-[1.5]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveActiveWorkoutExercise(wEx.id, 'down')}
                          disabled={exIdx === session.exercises.length - 1}
                          aria-label={`Move ${exDef.name} down`}
                          className="calm-press btn-ghost flex h-8 w-8 items-center justify-center disabled:opacity-25"
                        >
                          <ArrowDown className="h-4 w-4 stroke-[1.5]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeExerciseFromActiveWorkout(wEx.id)}
                          aria-label={`Remove ${exDef.name}`}
                          className="calm-press flex h-8 w-8 items-center justify-center rounded-lg text-[var(--ink-muted)] hover:bg-[var(--accent-clay-tint)] hover:text-[var(--accent-clay)]"
                        >
                          <X className="h-4 w-4 stroke-[1.5]" />
                        </button>
                      </div>
                    </div>

                    {/* Exercise Notes */}
                    <input
                      type="text"
                      value={wEx.notes}
                      onChange={(e) => updateActiveExerciseNotes(wEx.id, e.target.value)}
                      placeholder="Add exercise cues or notes"
                      aria-label={`${exDef.name} notes`}
                      className="w-full rounded-lg bg-transparent px-2 py-2 text-xs text-[var(--ink-secondary)] placeholder-[var(--ink-muted)] transition-colors focus:bg-[var(--recessed)] focus:text-[var(--ink-primary)] focus:outline-none"
                    />

                    {/* Set Table Header */}
                    <div
                      className={`grid items-center gap-1 sm:gap-2 pl-2 pr-1 pb-1 text-xs font-medium text-[var(--ink-muted)] ${
                        tracking === 'bodyweight' || tracking === 'duration'
                          ? 'grid-cols-[36px_1fr_92px_40px_28px]'
                          : tracking === 'distance'
                          ? 'grid-cols-[36px_minmax(52px,1fr)_74px_60px_38px_28px] sm:grid-cols-[40px_1fr_92px_80px_40px_32px]'
                          : 'grid-cols-[32px_minmax(48px,1fr)_92px_46px_36px_26px] sm:grid-cols-[40px_1fr_124px_80px_40px_32px]'
                      }`}
                    >
                      <span className="text-center">Set</span>
                      <span>Prev</span>
                      {tracking === 'duration' ? (
                        <span className="text-center">Sec</span>
                      ) : tracking === 'bodyweight' ? (
                        <span className="text-center">Reps</span>
                      ) : tracking === 'distance' ? (
                        <>
                          <span className="text-center">{db.settings.distanceUnit}</span>
                          <span className="text-center">Sec</span>
                        </>
                      ) : (
                        <>
                          <span className="text-center">
                            {tracking === 'assisted_bodyweight' ? '-Weight' : 'Weight'}
                          </span>
                          <span className="text-center">Reps</span>
                        </>
                      )}
                      <span className="text-center">Done</span>
                      <span />
                    </div>

                    {/* Sets */}
                    <div className="divide-y divide-[var(--border-hairline)]">
                      {wEx.sets.map((s, rowIdx) => {
                        if (s.setType === 'normal') normalCounter += 1;
                        const displayIdx = normalCounter || 1;
                        const prevForRow = previousSets[rowIdx];
                        return (
                          <SetRow
                            key={s.id}
                            workoutExerciseId={wEx.id}
                            exercise={exDef}
                            exerciseWeightUnit={wEx.weightUnit}
                            set={s}
                            displayIndex={displayIdx}
                            rowNumber={rowIdx + 1}
                            previousSet={prevForRow}
                          />
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => addSetToActiveExercise(wEx.id)}
                      className="calm-press flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border-hairline)] bg-transparent text-xs font-medium text-[var(--ink-secondary)] hover:border-[var(--border-focus)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink-primary)]"
                    >
                      <Plus className="h-4 w-4 stroke-[1.5]" />
                      Add set
                    </button>
                  </section>
                );
              })
            )}

            {/* Bottom Action Buttons */}
            <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="calm-press btn-primary flex h-11 items-center justify-center gap-2 text-sm font-medium whitespace-nowrap"
              >
                <Plus className="h-4 w-4 stroke-[1.5]" />
                Add exercise
              </button>
              <button
                type="button"
                onClick={() => setDiscardConfirmOpen(true)}
                className="calm-press btn-danger flex h-11 items-center justify-center gap-2 text-sm font-medium whitespace-nowrap"
              >
                Discard workout
              </button>
            </div>
          </div>
        </div>
      </div>

      <ExercisePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAddExercises={addExercisesToActiveWorkout}
        onCreateCustomClick={() => setCustomModalOpen(true)}
      />

      <CustomExerciseModal
        open={customModalOpen}
        onClose={() => setCustomModalOpen(false)}
        onSaved={(ex) => addExercisesToActiveWorkout([ex.id])}
      />

      <ExerciseDetailModal
        exercise={detailExercise}
        onClose={() => setDetailExercise(null)}
      />

      <WorkoutSummaryModal
        open={summaryData !== null}
        session={summaryData?.annotatedSession ?? null}
        prs={summaryData?.prs ?? []}
        sourceRoutineName={sourceRoutine?.name ?? null}
        routineModified={routineModified}
        onCancel={() => setSummaryData(null)}
        onConfirm={(finalNotes, updateRoutine) => {
          confirmFinishWorkout(finalNotes, updateRoutine);
          setSummaryData(null);
        }}
      />

      <ConfirmDialog
        open={discardConfirmOpen}
        title="Discard active workout"
        description="All logged sets in this session will be lost. Saved routines and history remain intact"
        confirmLabel="Discard workout"
        destructive
        onCancel={() => setDiscardConfirmOpen(false)}
        onConfirm={() => {
          setDiscardConfirmOpen(false);
          discardActiveWorkout();
        }}
      />

      <ConfirmDialog
        open={emptyFinishWarning}
        title="No completed sets"
        description="Check off at least one set before finishing, or discard the session"
        confirmLabel="Keep logging"
        cancelLabel="Discard"
        onConfirm={() => setEmptyFinishWarning(false)}
        onCancel={() => {
          setEmptyFinishWarning(false);
          discardActiveWorkout();
        }}
      />
    </>
  );
}
