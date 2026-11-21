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
import { Exercise, PRRecord, SetType, WeightUnit, WorkoutSession, WorkoutSet } from '../types/workout';
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

  const formatPrev = (): string => {
    if (!previousSet) return '—';
    if (tracking === 'duration') {
      return previousSet.durationSec ? formatDuration(previousSet.durationSec) : '—';
    }
    if (tracking === 'distance') {
      const dist = convertDistanceFromKm(previousSet.distanceKm, distUnit);
      return dist !== null ? `${dist} ${distUnit}` : '—';
    }
    if (tracking === 'bodyweight') {
      return previousSet.reps !== null ? `${previousSet.reps} reps` : '—';
    }
    const prevUnit = resolveSetWeightUnit(previousSet.weightUnit, exerciseWeightUnit, globalUnit);
    const wt = formatWeight(previousSet.weightKg, prevUnit, true);
    if (wt === '—' && previousSet.reps === null) return '—';
    return `${wt} × ${previousSet.reps ?? 0}`;
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

  // Zero-color semantic encoding for set types via border grammar & monochrome patterns
  const setBadgeStyle =
    set.setType === 'warmup'
      ? 'border border-dashed border-[#737373] bg-transparent text-[#737373]'
      : set.setType === 'drop'
      ? 'hud-hatch border border-[#000000] dark:border-[#FFFFFF] text-[#000000] dark:text-[#FFFFFF]'
      : set.setType === 'failure'
      ? 'border-2 border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#000000] text-[#000000] dark:text-[#FFFFFF]'
      : set.completed
      ? 'border border-[#000000] dark:border-[#FFFFFF] bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]'
      : 'border border-[#E5E5E5] dark:border-[#262626] bg-[#F5F5F5] dark:bg-[#141414] text-[#000000] dark:text-[#FFFFFF]';

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
      className={`group relative grid items-center gap-1.5 sm:gap-2 px-1.5 py-1.5 transition-colors duration-[180ms] ${
        tracking === 'bodyweight' || tracking === 'duration'
          ? 'grid-cols-[38px_1fr_92px_44px_30px]'
          : tracking === 'distance'
          ? 'grid-cols-[38px_minmax(56px,1fr)_74px_62px_40px_28px] sm:grid-cols-[42px_1fr_92px_82px_44px_36px]'
          : 'grid-cols-[34px_minmax(52px,1fr)_96px_46px_38px_26px] sm:grid-cols-[42px_1fr_124px_80px_44px_36px]'
      } ${
        set.completed
          ? 'hud-hatch border-l-[3px] border-l-[#000000] dark:border-l-[#FFFFFF] bg-[#F5F5F5] dark:bg-[#141414]'
          : 'border-l-[3px] border-l-transparent bg-transparent hover:bg-[#F5F5F5]/70 dark:hover:bg-[#141414]/70'
      }`}
    >
      {/* Set # / Type */}
      <button
        type="button"
        onClick={() => updateActiveSet(workoutExerciseId, set.id, { setType: cycleSetType(set.setType) })}
        title="Tap to change set type (Normal, Warmup, Drop, Failure)"
        aria-label={`Set ${rowNumber} type ${set.setType}`}
        className={`mech-press flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-[2px] font-mono text-xs font-bold ${setBadgeStyle}`}
      >
        {setBadgeLabel}
      </button>

      {/* Previous Session Value */}
      <button
        type="button"
        onClick={applyPrevious}
        disabled={!previousSet}
        title={previousSet ? 'Tap to copy previous session value' : 'No previous session'}
        className="mech-press truncate text-left font-mono text-xs tabular-nums text-[#737373] hover:text-[#000000] dark:hover:text-[#FFFFFF] disabled:cursor-default disabled:hover:text-[#737373]"
      >
        {formatPrev()}
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
          className="h-10 w-full rounded-[2px] border border-[#E5E5E5] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#0A0A0A] px-2.5 text-center font-mono text-sm font-semibold tabular-nums text-[#000000] dark:text-[#FFFFFF] focus:border-[#000000] dark:focus:border-[#FFFFFF] focus:outline-none"
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
          className="h-10 w-full rounded-[2px] border border-[#E5E5E5] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#0A0A0A] px-2.5 text-center font-mono text-sm font-semibold tabular-nums text-[#000000] dark:text-[#FFFFFF] focus:border-[#000000] dark:focus:border-[#FFFFFF] focus:outline-none"
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
            className="h-10 w-full rounded-[2px] border border-[#E5E5E5] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#0A0A0A] px-2 text-center font-mono text-sm font-semibold tabular-nums text-[#000000] dark:text-[#FFFFFF] focus:border-[#000000] dark:focus:border-[#FFFFFF] focus:outline-none"
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
            className="h-10 w-full rounded-[2px] border border-[#E5E5E5] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#0A0A0A] px-2 text-center font-mono text-sm font-semibold tabular-nums text-[#000000] dark:text-[#FFFFFF] focus:border-[#000000] dark:focus:border-[#FFFFFF] focus:outline-none"
          />
        </>
      ) : (
        <>
          <div className="flex h-10 w-full items-stretch overflow-hidden rounded-[2px] border border-[#D4D4D4] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#0A0A0A] focus-within:border-[#000000] dark:focus-within:border-[#FFFFFF]">
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
              className="min-w-0 flex-1 bg-transparent px-1 sm:px-1.5 text-center font-mono text-[13px] sm:text-sm font-semibold tabular-nums text-[#000000] dark:text-[#FFFFFF] focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={toggleSetUnit}
              title={`Switch set ${rowNumber} to ${setUnit === 'kg' ? 'lbs' : 'kg'}`}
              aria-label={`${exercise.name} set ${rowNumber} unit ${setUnit}`}
              className={`mech-press flex w-8 sm:w-10 shrink-0 items-center justify-center border-l border-[#D4D4D4] dark:border-[#262626] font-mono text-[10px] sm:text-[11px] font-bold uppercase ${
                setUnit === 'lbs'
                  ? 'bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]'
                  : 'bg-[#F5F5F5] dark:bg-[#141414] text-[#000000] dark:text-[#FFFFFF] hover:bg-[#E5E5E5] dark:hover:bg-[#262626]'
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
            className="h-10 w-full rounded-[2px] border border-[#D4D4D4] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#0A0A0A] px-1 sm:px-1.5 text-center font-mono text-[13px] sm:text-sm font-semibold tabular-nums text-[#000000] dark:text-[#FFFFFF] focus:border-[#000000] dark:focus:border-[#FFFFFF] focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </>
      )}

      {/* Completion Polarity Toggle */}
      <button
        type="button"
        onClick={() => toggleActiveSetComplete(workoutExerciseId, set.id)}
        aria-label={`${set.completed ? 'Uncheck' : 'Complete'} ${exercise.name} set ${rowNumber}`}
        aria-pressed={set.completed}
        className={`mech-press flex h-10 w-10 sm:h-10 sm:w-11 items-center justify-center rounded-[2px] border ${
          set.completed
            ? 'border-[#000000] dark:border-[#FFFFFF] bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]'
            : 'border-[#D4D4D4] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#0A0A0A] text-[#737373] hover:border-[#000000] dark:hover:border-[#FFFFFF] hover:text-[#000000] dark:hover:text-[#FFFFFF]'
        }`}
      >
        <Check className="h-4 w-4 stroke-[2.75]" />
      </button>

      {/* Delete Set Button */}
      <button
        type="button"
        onClick={() => deleteSetFromActiveExercise(workoutExerciseId, set.id)}
        aria-label={`Delete ${exercise.name} set ${rowNumber}`}
        className={`mech-press flex h-9 w-7 sm:w-8 items-center justify-center rounded-[2px] ${
          swipedOpen
            ? 'bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]'
            : 'text-[#A3A3A3] dark:text-[#525252] hover:bg-[#000000] dark:hover:bg-[#FFFFFF] hover:text-[#FFFFFF] dark:hover:text-[#000000]'
        }`}
      >
        <Trash2 className="h-3.5 w-3.5" />
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

  const totalVolumeKg = useMemo(() => (session ? calculateWorkoutVolumeKg(session) : 0), [session]);
  const completedSets = useMemo(() => (session ? calculateWorkoutCompletedSets(session) : 0), [session]);
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
        className="hud-view-enter fixed inset-0 z-40 flex flex-col bg-[#FFFFFF] dark:bg-[#000000]"
        role="region"
        aria-label="Active workout logger"
      >
        {/* PITCH-BLACK INVERTED ACTIVE TELEMETRY CONSOLE HEADER */}
        <header className="sticky top-0 z-20 border-b-2 border-[#000000] dark:border-[#FFFFFF] bg-[#000000] text-[#FFFFFF]">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveWorkoutOpen(false)}
                aria-label="Minimize active workout"
                className="mech-press flex h-10 w-10 shrink-0 items-center justify-center rounded-[2px] border border-[#262626] bg-[#0A0A0A] text-[#FFFFFF] hover:border-[#FFFFFF]"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <p className="font-mono text-[9px] font-bold tracking-[0.12em] uppercase text-[#737373]">
                  ■ ACTIVE LOG
                </p>
                <input
                  type="text"
                  value={session.title}
                  onChange={(e) => updateActiveWorkoutTitle(e.target.value)}
                  aria-label="Workout title"
                  className="w-full min-w-0 truncate bg-transparent text-sm font-bold tracking-tight text-[#FFFFFF] focus:outline-none sm:text-base"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => startRestTimer('manual', db.settings.defaultRestSeconds)}
                aria-label="Start rest timer"
                title="Start Rest Timer"
                className="mech-press flex h-10 w-10 items-center justify-center rounded-[2px] border border-[#262626] bg-[#0A0A0A] text-[#FFFFFF] hover:border-[#FFFFFF]"
              >
                <Timer className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleFinishClick}
                className="mech-press min-h-[40px] rounded-[2px] border border-[#FFFFFF] bg-[#FFFFFF] px-4 font-mono text-xs font-bold tracking-[0.08em] uppercase text-[#000000] hover:bg-[#E5E5E5] whitespace-nowrap"
              >
                Finish
              </button>
            </div>
          </div>

          {/* Live Metrics Strip */}
          <div className="border-t border-[#262626] bg-[#0A0A0A]">
            <div className="mx-auto grid max-w-4xl grid-cols-3 divide-x divide-[#262626] px-4 sm:px-6">
              <div className="py-2 pr-3">
                <p className="font-mono text-[9px] font-semibold tracking-[0.1em] uppercase text-[#737373]">
                  DURATION
                </p>
                <p
                  data-testid="active-workout-duration"
                  className="font-mono text-sm font-bold tabular-nums text-[#FFFFFF]"
                >
                  {formatTimerClock(elapsedSec)}
                </p>
              </div>
              <div className="py-2 px-3">
                <p className="font-mono text-[9px] font-semibold tracking-[0.1em] uppercase text-[#737373]">
                  VOLUME
                </p>
                <p
                  data-testid="active-workout-volume"
                  className="font-mono text-sm font-bold tabular-nums text-[#FFFFFF]"
                >
                  {formatVolume(totalVolumeKg, db.settings.weightUnit)}
                </p>
              </div>
              <div className="py-2 pl-3">
                <p className="font-mono text-[9px] font-semibold tracking-[0.1em] uppercase text-[#737373]">
                  SETS
                </p>
                <p
                  data-testid="active-workout-sets"
                  className="font-mono text-sm font-bold tabular-nums text-[#FFFFFF]"
                >
                  {completedSets}
                  <span className="text-[#737373]"> / {plannedSets}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Live Rest Countdown HUD Bar */}
          {restTimer && restSecondsRemaining > 0 && (
            <div
              data-testid="rest-timer-bar"
              className="hud-expand-enter border-t border-[#262626] bg-[#141414]"
            >
              <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
                <div className="flex items-center gap-2.5">
                  <Clock className="h-3.5 w-3.5 text-[#FFFFFF]" />
                  <span className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-[#A3A3A3]">
                    REST //
                  </span>
                  <span className="font-mono text-base font-bold tabular-nums text-[#FFFFFF]">
                    {formatTimerClock(restSecondsRemaining)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => adjustRestTimer(-15)}
                    className="mech-press min-h-[34px] rounded-[2px] border border-[#262626] bg-[#000000] px-2.5 font-mono text-[11px] font-bold text-[#FFFFFF] hover:border-[#FFFFFF]"
                  >
                    -15s
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustRestTimer(15)}
                    className="mech-press min-h-[34px] rounded-[2px] border border-[#262626] bg-[#000000] px-2.5 font-mono text-[11px] font-bold text-[#FFFFFF] hover:border-[#FFFFFF]"
                  >
                    +15s
                  </button>
                  <button
                    type="button"
                    onClick={skipRestTimer}
                    className="mech-press min-h-[34px] rounded-[2px] border border-[#FFFFFF] bg-[#FFFFFF] px-3 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-[#000000] hover:bg-[#E5E5E5]"
                  >
                    Skip
                  </button>
                </div>
              </div>
              <div className="h-1 w-full bg-[#262626]">
                <div
                  className="h-full bg-[#FFFFFF]"
                  style={{ width: `${restProgressPct}%` }}
                />
              </div>
              <div className="hud-ruler h-1.5 w-full text-[#262626]" aria-hidden="true" />
            </div>
          )}
        </header>

        {/* Scrollable Stark-White Exercise Modules */}
        <div className="flex-1 overflow-y-auto bg-[#F5F5F5] dark:bg-[#000000]">
          <div className="mx-auto max-w-4xl space-y-4 px-3 py-5 pb-20 sm:px-6">
            {session.exercises.length === 0 ? (
              <div className="hud-dot-matrix border border-dashed border-[#D4D4D4] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#0A0A0A] px-6 py-12 text-center">
                <span className="inline-block border border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#000000] px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                  00 // READY TO LOG
                </span>
                <h3 className="mt-3 text-base font-bold text-[#000000] dark:text-[#FFFFFF]">
                  Ready to lift
                </h3>
                <p className="mt-1.5 text-xs text-[#737373]">
                  Add exercises below to start recording sets, weights, and reps.
                </p>
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="mech-press mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-[2px] bg-[#000000] dark:bg-[#FFFFFF] px-6 font-mono text-xs font-bold tracking-[0.06em] uppercase text-[#FFFFFF] dark:text-[#000000]"
                >
                  <Plus className="h-4 w-4" />
                  Add Exercise
                </button>
              </div>
            ) : (
              session.exercises.map((wEx, exIdx) => {
                const exDef = exerciseMap.get(wEx.exerciseId);
                if (!exDef) return null;
                const previousSets = getPreviousExerciseSets(exDef.id, db.workouts, session.startedAt);
                const tracking = exDef.trackingType;
                const isWeighted = tracking === 'weight_reps' || tracking === 'assisted_bodyweight';
                const exerciseUnit = wEx.weightUnit ?? db.settings.weightUnit;
                const hasMixedSetUnits =
                  isWeighted &&
                  new Set(wEx.sets.map((s) => resolveSetWeightUnit(s.weightUnit, wEx.weightUnit, db.settings.weightUnit))).size > 1;

                let normalCounter = 0;

                return (
                  <section
                    key={wEx.id}
                    className="hud-frame border border-[#E5E5E5] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#0A0A0A] p-3 sm:p-4 space-y-3"
                  >
                    {/* Exercise Header */}
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#E5E5E5] dark:border-[#262626] pb-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold tracking-[0.08em] text-[#737373] tabular-nums">
                            {String(exIdx + 1).padStart(2, '0')} //
                          </span>
                          <button
                            type="button"
                            onClick={() => setDetailExercise(exDef)}
                            className="truncate text-left text-sm sm:text-base font-bold text-[#000000] dark:text-[#FFFFFF] underline-offset-4 hover:underline"
                          >
                            {exDef.name}
                          </button>
                        </div>
                        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[#737373]">
                          {exDef.primaryMuscle} · {exDef.equipment}
                          {hasMixedSetUnits ? ' · Mixed kg/lbs' : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {isWeighted && (
                          <div
                            className="flex items-center border border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#0A0A0A]"
                            role="group"
                            aria-label={`${exDef.name} weight unit`}
                          >
                            {(['kg', 'lbs'] as const).map((u) => {
                              const active = !hasMixedSetUnits && exerciseUnit === u;
                              return (
                                <button
                                  key={u}
                                  type="button"
                                  onClick={() => updateActiveExerciseWeightUnit(wEx.id, u)}
                                  aria-label={`Set ${exDef.name} to ${u}`}
                                  aria-pressed={active}
                                  className={`mech-press h-8 px-2 font-mono text-[10px] font-bold uppercase ${
                                    active
                                      ? 'bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]'
                                      : 'text-[#737373] hover:text-[#000000] dark:hover:text-[#FFFFFF]'
                                  }`}
                                >
                                  {u}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        <select
                          value={wEx.restSeconds}
                          onChange={(e) => updateActiveExerciseRest(wEx.id, Number(e.target.value))}
                          aria-label={`${exDef.name} rest timer`}
                          className="h-8 rounded-[2px] border border-[#E5E5E5] dark:border-[#262626] bg-[#F5F5F5] dark:bg-[#141414] px-2 font-mono text-[11px] font-semibold text-[#000000] dark:text-[#FFFFFF]"
                        >
                          {[0, 30, 45, 60, 75, 90, 120, 150, 180, 240, 300].map((sec) => (
                            <option key={sec} value={sec}>
                              {sec === 0 ? 'Rest Off' : `Rest ${sec}s`}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => moveActiveWorkoutExercise(wEx.id, 'up')}
                          disabled={exIdx === 0}
                          aria-label={`Move ${exDef.name} up`}
                          className="mech-press flex h-8 w-7 items-center justify-center rounded-[2px] text-[#737373] hover:bg-[#F5F5F5] dark:hover:bg-[#141414] hover:text-[#000000] dark:hover:text-[#FFFFFF] disabled:opacity-25"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveActiveWorkoutExercise(wEx.id, 'down')}
                          disabled={exIdx === session.exercises.length - 1}
                          aria-label={`Move ${exDef.name} down`}
                          className="mech-press flex h-8 w-7 items-center justify-center rounded-[2px] text-[#737373] hover:bg-[#F5F5F5] dark:hover:bg-[#141414] hover:text-[#000000] dark:hover:text-[#FFFFFF] disabled:opacity-25"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeExerciseFromActiveWorkout(wEx.id)}
                          aria-label={`Remove ${exDef.name}`}
                          className="mech-press flex h-8 w-7 items-center justify-center rounded-[2px] text-[#737373] hover:bg-[#000000] dark:hover:bg-[#FFFFFF] hover:text-[#FFFFFF] dark:hover:text-[#000000]"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Exercise Notes */}
                    <input
                      type="text"
                      value={wEx.notes}
                      onChange={(e) => updateActiveExerciseNotes(wEx.id, e.target.value)}
                      placeholder="// Add exercise cues or notes..."
                      aria-label={`${exDef.name} notes`}
                      className="w-full rounded-[2px] bg-transparent px-1 py-1 font-mono text-xs text-[#737373] placeholder-[#A3A3A3] dark:placeholder-[#525252] focus:bg-[#F5F5F5] dark:focus:bg-[#141414] focus:text-[#000000] dark:focus:text-[#FFFFFF] focus:outline-none"
                    />

                    {/* Set Table Header */}
                    <div
                      className={`grid items-center gap-1.5 sm:gap-2 border-b border-[#E5E5E5] dark:border-[#262626] px-1.5 pb-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#737373] ${
                        tracking === 'bodyweight' || tracking === 'duration'
                          ? 'grid-cols-[38px_1fr_92px_44px_30px]'
                          : tracking === 'distance'
                          ? 'grid-cols-[38px_minmax(56px,1fr)_74px_62px_40px_28px] sm:grid-cols-[42px_1fr_92px_82px_44px_36px]'
                          : 'grid-cols-[34px_minmax(52px,1fr)_96px_46px_38px_26px] sm:grid-cols-[42px_1fr_124px_80px_44px_36px]'
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
                    <div className="divide-y divide-[#F5F5F5] dark:divide-[#141414]">
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
                      className="mech-press flex h-10 w-full items-center justify-center gap-1.5 rounded-[2px] border border-dashed border-[#D4D4D4] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#0A0A0A] font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-[#000000] dark:text-[#FFFFFF] hover:border-[#000000] dark:hover:border-[#FFFFFF] hover:bg-[#F5F5F5] dark:hover:bg-[#141414]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Set
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
                className="mech-press flex h-12 items-center justify-center gap-2 rounded-[2px] border border-[#000000] dark:border-[#FFFFFF] bg-[#000000] dark:bg-[#FFFFFF] font-mono text-xs font-bold uppercase tracking-[0.08em] text-[#FFFFFF] dark:text-[#000000] hover:bg-[#262626] dark:hover:bg-[#E5E5E5]"
              >
                <Plus className="h-4 w-4" />
                Add Exercise
              </button>
              <button
                type="button"
                onClick={() => setDiscardConfirmOpen(true)}
                className="mech-press flex h-12 items-center justify-center gap-2 rounded-[2px] border border-[#000000] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#0A0A0A] font-mono text-xs font-bold uppercase tracking-[0.08em] text-[#000000] dark:text-[#FFFFFF] hover:bg-[#F5F5F5] dark:hover:bg-[#141414]"
              >
                Discard Workout
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
        title="Discard active workout?"
        description="All logged sets in this session will be lost. Your routines and past workouts will not be affected."
        confirmLabel="Discard Workout"
        destructive
        onCancel={() => setDiscardConfirmOpen(false)}
        onConfirm={() => {
          setDiscardConfirmOpen(false);
          discardActiveWorkout();
        }}
      />

      <ConfirmDialog
        open={emptyFinishWarning}
        title="No completed sets yet"
        description="Check off at least one set before finishing your workout, or discard the session if you want to cancel."
        confirmLabel="Keep Logging"
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
