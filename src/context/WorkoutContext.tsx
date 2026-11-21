import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActiveRestTimer,
  AppDatabase,
  BodyMeasurementEntry,
  Exercise,
  PRRecord,
  Routine,
  RoutineFolder,
  SetType,
  UserSettings,
  WeightUnit,
  WorkoutExercise,
  WorkoutSession,
  WorkoutSet,
} from '../types/workout';
import { loadDatabase, saveDatabase } from '../db/storage';
import { createEmptyDatabase, createSeededDatabase } from '../data/seedData';
import { detectWorkoutPRs, getPreviousExerciseSets } from '../utils/calculations';
import { playRestCompleteTone, triggerHaptic } from '../utils/feedback';

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

interface PendingWorkoutFinish {
  annotatedSession: WorkoutSession;
  prs: PRRecord[];
}

interface WorkoutContextValue {
  db: AppDatabase;
  exerciseMap: Map<string, Exercise>;
  activeWorkoutOpen: boolean;
  setActiveWorkoutOpen: (open: boolean) => void;
  restTimer: ActiveRestTimer | null;
  restSecondsRemaining: number;
  startRestTimer: (exerciseId: string, seconds: number) => void;
  adjustRestTimer: (deltaSeconds: number) => void;
  skipRestTimer: () => void;

  // Folders
  createFolder: (name: string) => void;
  renameFolder: (id: string, name: string) => void;
  toggleFolderCollapse: (id: string) => void;
  moveFolder: (id: string, direction: 'up' | 'down') => void;
  deleteFolder: (id: string) => void;

  // Routines
  saveRoutine: (routine: Omit<Routine, 'id' | 'updatedAt' | 'sortOrder'> & { id?: string }) => void;
  duplicateRoutine: (id: string) => void;
  deleteRoutine: (id: string) => void;
  moveRoutine: (id: string, direction: 'up' | 'down') => void;
  moveRoutineToFolder: (routineId: string, folderId: string | null) => void;

  // Exercises
  saveExercise: (exercise: Omit<Exercise, 'id' | 'isCustom'> & { id?: string }) => Exercise;
  deleteExercise: (id: string) => void;

  // Active Workout
  startEmptyWorkout: () => void;
  startRoutineWorkout: (routineId: string) => void;
  updateActiveWorkoutTitle: (title: string) => void;
  updateActiveWorkoutNotes: (notes: string) => void;
  addExercisesToActiveWorkout: (exerciseIds: string[]) => void;
  removeExerciseFromActiveWorkout: (workoutExerciseId: string) => void;
  moveActiveWorkoutExercise: (workoutExerciseId: string, direction: 'up' | 'down') => void;
  updateActiveExerciseNotes: (workoutExerciseId: string, notes: string) => void;
  updateActiveExerciseRest: (workoutExerciseId: string, restSeconds: number) => void;
  updateActiveExerciseWeightUnit: (workoutExerciseId: string, weightUnit: WeightUnit) => void;
  addSetToActiveExercise: (workoutExerciseId: string) => void;
  deleteSetFromActiveExercise: (workoutExerciseId: string, setId: string) => void;
  updateActiveSet: (
    workoutExerciseId: string,
    setId: string,
    patch: Partial<Pick<WorkoutSet, 'weightKg' | 'weightUnit' | 'reps' | 'durationSec' | 'distanceKm' | 'setType'>>
  ) => void;
  toggleActiveSetComplete: (workoutExerciseId: string, setId: string) => void;
  prepareFinishWorkout: () => PendingWorkoutFinish | null;
  confirmFinishWorkout: (finalNotes: string, updateSourceRoutine: boolean) => void;
  discardActiveWorkout: () => void;

  // History
  deleteWorkout: (workoutId: string) => void;
  updateWorkoutMeta: (workoutId: string, title: string, notes: string) => void;

  // Measurements
  saveMeasurementEntry: (entry: Omit<BodyMeasurementEntry, 'id'> & { id?: string }) => void;
  deleteMeasurementEntry: (id: string) => void;

  // Settings & Data Portability
  updateSettings: (patch: Partial<UserSettings>) => void;
  importWorkoutsAndExercises: (workouts: WorkoutSession[], newExercises: Exercise[]) => void;
  restoreDatabase: (nextDb: AppDatabase) => void;
  resetToSampleData: () => void;
  clearAllData: () => void;
}

const WorkoutContext = createContext<WorkoutContextValue | null>(null);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<AppDatabase>(() => loadDatabase());
  const [activeWorkoutOpen, setActiveWorkoutOpen] = useState<boolean>(false);
  const [restTimer, setRestTimer] = useState<ActiveRestTimer | null>(null);
  const [restSecondsRemaining, setRestSecondsRemaining] = useState<number>(0);

  const restAlertPlayedRef = useRef<boolean>(false);

  // Sync database to localStorage atomically on every state change
  useEffect(() => {
    saveDatabase(db);
  }, [db]);

  // Sync Tailwind dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (db.settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [db.settings.theme]);

  // Countdown rest timer ticker
  useEffect(() => {
    if (!restTimer) {
      setRestSecondsRemaining(0);
      return;
    }

    const tick = () => {
      const remaining = Math.ceil((restTimer.endsAt - Date.now()) / 1000);
      if (remaining <= 0) {
        setRestSecondsRemaining(0);
        setRestTimer(null);
        if (!restAlertPlayedRef.current) {
          restAlertPlayedRef.current = true;
          triggerHaptic([80, 60, 80]);
          if (db.settings.restSoundEnabled) {
            playRestCompleteTone();
          }
        }
      } else {
        setRestSecondsRemaining(remaining);
      }
    };

    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [restTimer, db.settings.restSoundEnabled]);

  const exerciseMap = useMemo(
    () => new Map(db.exercises.map((e) => [e.id, e])),
    [db.exercises]
  );

  const startRestTimer = useCallback((exerciseId: string, seconds: number) => {
    if (seconds <= 0) return;
    restAlertPlayedRef.current = false;
    setRestTimer({
      exerciseId,
      totalSeconds: seconds,
      endsAt: Date.now() + seconds * 1000,
    });
    setRestSecondsRemaining(seconds);
  }, []);

  const adjustRestTimer = useCallback((deltaSeconds: number) => {
    setRestTimer((prev) => {
      if (!prev) return null;
      const nextEnds = prev.endsAt + deltaSeconds * 1000;
      const remaining = Math.ceil((nextEnds - Date.now()) / 1000);
      if (remaining <= 0) {
        setRestSecondsRemaining(0);
        return null;
      }
      setRestSecondsRemaining(remaining);
      return {
        ...prev,
        totalSeconds: Math.max(prev.totalSeconds, remaining),
        endsAt: nextEnds,
      };
    });
  }, []);

  const skipRestTimer = useCallback(() => {
    setRestTimer(null);
    setRestSecondsRemaining(0);
  }, []);

  // Folders
  const createFolder = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setDb((prev) => ({
      ...prev,
      folders: [
        ...prev.folders,
        { id: uid('folder'), name: trimmed, sortOrder: prev.folders.length, isCollapsed: false },
      ],
    }));
  }, []);

  const renameFolder = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setDb((prev) => ({
      ...prev,
      folders: prev.folders.map((f) => (f.id === id ? { ...f, name: trimmed } : f)),
    }));
  }, []);

  const toggleFolderCollapse = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      folders: prev.folders.map((f) => (f.id === id ? { ...f, isCollapsed: !f.isCollapsed } : f)),
    }));
  }, []);

  const moveFolder = useCallback((id: string, direction: 'up' | 'down') => {
    setDb((prev) => {
      const sorted = [...prev.folders].sort((a, b) => a.sortOrder - b.sortOrder);
      const idx = sorted.findIndex((f) => f.id === id);
      if (idx === -1) return prev;
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return prev;
      const temp = sorted[idx];
      sorted[idx] = sorted[swapIdx];
      sorted[swapIdx] = temp;
      return {
        ...prev,
        folders: sorted.map((f, i) => ({ ...f, sortOrder: i })),
      };
    });
  }, []);

  const deleteFolder = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      folders: prev.folders.filter((f) => f.id !== id),
      routines: prev.routines.map((r) => (r.folderId === id ? { ...r, folderId: null } : r)),
    }));
  }, []);

  // Routines
  const saveRoutine = useCallback(
    (routineInput: Omit<Routine, 'id' | 'updatedAt' | 'sortOrder'> & { id?: string }) => {
      setDb((prev) => {
        if (routineInput.id) {
          return {
            ...prev,
            routines: prev.routines.map((r) =>
              r.id === routineInput.id
                ? {
                    ...r,
                    ...routineInput,
                    id: r.id,
                    updatedAt: Date.now(),
                  }
                : r
            ),
          };
        }
        const siblingCount = prev.routines.filter((r) => r.folderId === routineInput.folderId).length;
        const created: Routine = {
          ...routineInput,
          id: uid('rtn'),
          sortOrder: siblingCount,
          updatedAt: Date.now(),
        };
        return {
          ...prev,
          routines: [...prev.routines, created],
        };
      });
    },
    []
  );

  const duplicateRoutine = useCallback((id: string) => {
    setDb((prev) => {
      const source = prev.routines.find((r) => r.id === id);
      if (!source) return prev;
      const copy: Routine = {
        ...source,
        id: uid('rtn'),
        name: `${source.name} (Copy)`,
        sortOrder: prev.routines.length,
        updatedAt: Date.now(),
        exercises: source.exercises.map((e) => ({
          ...e,
          id: uid('re'),
          sets: e.sets.map((s) => ({ ...s, id: uid('rs') })),
        })),
      };
      return { ...prev, routines: [...prev.routines, copy] };
    });
  }, []);

  const deleteRoutine = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      routines: prev.routines.filter((r) => r.id !== id),
    }));
  }, []);

  const moveRoutine = useCallback((id: string, direction: 'up' | 'down') => {
    setDb((prev) => {
      const target = prev.routines.find((r) => r.id === id);
      if (!target) return prev;
      const siblings = prev.routines
        .filter((r) => r.folderId === target.folderId)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      const idx = siblings.findIndex((r) => r.id === id);
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= siblings.length) return prev;
      const tmp = siblings[idx];
      siblings[idx] = siblings[swapIdx];
      siblings[swapIdx] = tmp;
      const orderMap = new Map(siblings.map((r, i) => [r.id, i]));
      return {
        ...prev,
        routines: prev.routines.map((r) =>
          orderMap.has(r.id) ? { ...r, sortOrder: orderMap.get(r.id)! } : r
        ),
      };
    });
  }, []);

  const moveRoutineToFolder = useCallback((routineId: string, folderId: string | null) => {
    setDb((prev) => ({
      ...prev,
      routines: prev.routines.map((r) => (r.id === routineId ? { ...r, folderId } : r)),
    }));
  }, []);

  // Exercises
  const saveExercise = useCallback(
    (input: Omit<Exercise, 'id' | 'isCustom'> & { id?: string }): Exercise => {
      let saved: Exercise | null = null;
      setDb((prev) => {
        if (input.id) {
          const updated = prev.exercises.map((e) => {
            if (e.id === input.id) {
              saved = { ...e, ...input, id: e.id };
              return saved;
            }
            return e;
          });
          return { ...prev, exercises: updated };
        }
        saved = {
          ...input,
          id: uid('ex-custom'),
          isCustom: true,
        };
        return { ...prev, exercises: [saved, ...prev.exercises] };
      });
      return (
        saved ?? {
          ...input,
          id: input.id ?? uid('ex-custom'),
          isCustom: true,
        }
      );
    },
    []
  );

  const deleteExercise = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((e) => e.id !== id || !e.isCustom),
    }));
  }, []);

  // Active Workout
  const startEmptyWorkout = useCallback(() => {
    setDb((prev) => {
      if (prev.activeWorkout) return prev;
      const now = Date.now();
      const hour = new Date(now).getHours();
      const label = hour < 12 ? 'Morning Workout' : hour < 17 ? 'Afternoon Workout' : 'Evening Workout';
      const session: WorkoutSession = {
        id: uid('wk'),
        routineId: null,
        title: label,
        notes: '',
        startedAt: now,
        finishedAt: null,
        durationSeconds: 0,
        exercises: [],
      };
      return { ...prev, activeWorkout: session };
    });
    setActiveWorkoutOpen(true);
  }, []);

  const startRoutineWorkout = useCallback((routineId: string) => {
    setDb((prev) => {
      const routine = prev.routines.find((r) => r.id === routineId);
      if (!routine) return prev;
      const now = Date.now();
      const exercises: WorkoutExercise[] = routine.exercises.map((re, idx) => ({
        id: uid('wex'),
        exerciseId: re.exerciseId,
        sortOrder: idx,
        notes: re.notes,
        restSeconds: re.restSeconds || prev.settings.defaultRestSeconds,
        weightUnit: re.weightUnit,
        sets: re.sets.map((s) => ({
          id: uid('wset'),
          setType: s.setType,
          weightKg: s.weightKg,
          weightUnit: s.weightUnit ?? re.weightUnit,
          reps: s.reps,
          durationSec: s.durationSec,
          distanceKm: s.distanceKm,
          completed: false,
        })),
      }));

      const session: WorkoutSession = {
        id: uid('wk'),
        routineId: routine.id,
        title: routine.name,
        notes: routine.notes,
        startedAt: now,
        finishedAt: null,
        durationSeconds: 0,
        exercises,
      };
      return { ...prev, activeWorkout: session };
    });
    setActiveWorkoutOpen(true);
  }, []);

  const updateActiveWorkoutTitle = useCallback((title: string) => {
    setDb((prev) =>
      prev.activeWorkout
        ? { ...prev, activeWorkout: { ...prev.activeWorkout, title } }
        : prev
    );
  }, []);

  const updateActiveWorkoutNotes = useCallback((notes: string) => {
    setDb((prev) =>
      prev.activeWorkout
        ? { ...prev, activeWorkout: { ...prev.activeWorkout, notes } }
        : prev
    );
  }, []);

  const addExercisesToActiveWorkout = useCallback((exerciseIds: string[]) => {
    if (exerciseIds.length === 0) return;
    setDb((prev) => {
      if (!prev.activeWorkout) return prev;
      const baseLen = prev.activeWorkout.exercises.length;
      const added: WorkoutExercise[] = exerciseIds.map((exId, idx) => {
        const prevSets = getPreviousExerciseSets(exId, prev.workouts);
        const prevUnit = prevSets[0]?.weightUnit;
        const initialSets: WorkoutSet[] =
          prevSets.length > 0
            ? prevSets.slice(0, 3).map((ps) => ({
                id: uid('wset'),
                setType: ps.setType,
                weightKg: ps.weightKg,
                weightUnit: ps.weightUnit,
                reps: ps.reps,
                durationSec: ps.durationSec,
                distanceKm: ps.distanceKm,
                completed: false,
              }))
            : [
                {
                  id: uid('wset'),
                  setType: 'normal',
                  weightKg: null,
                  weightUnit: prev.settings.weightUnit,
                  reps: null,
                  durationSec: null,
                  distanceKm: null,
                  completed: false,
                },
              ];

        return {
          id: uid('wex'),
          exerciseId: exId,
          sortOrder: baseLen + idx,
          notes: '',
          restSeconds: prev.settings.defaultRestSeconds,
          weightUnit: prevUnit ?? prev.settings.weightUnit,
          sets: initialSets,
        };
      });

      return {
        ...prev,
        activeWorkout: {
          ...prev.activeWorkout,
          exercises: [...prev.activeWorkout.exercises, ...added],
        },
      };
    });
  }, []);

  const removeExerciseFromActiveWorkout = useCallback((workoutExerciseId: string) => {
    setDb((prev) => {
      if (!prev.activeWorkout) return prev;
      return {
        ...prev,
        activeWorkout: {
          ...prev.activeWorkout,
          exercises: prev.activeWorkout.exercises
            .filter((e) => e.id !== workoutExerciseId)
            .map((e, i) => ({ ...e, sortOrder: i })),
        },
      };
    });
  }, []);

  const moveActiveWorkoutExercise = useCallback((workoutExerciseId: string, direction: 'up' | 'down') => {
    setDb((prev) => {
      if (!prev.activeWorkout) return prev;
      const list = [...prev.activeWorkout.exercises];
      const idx = list.findIndex((e) => e.id === workoutExerciseId);
      const swap = direction === 'up' ? idx - 1 : idx + 1;
      if (idx === -1 || swap < 0 || swap >= list.length) return prev;
      const tmp = list[idx];
      list[idx] = list[swap];
      list[swap] = tmp;
      return {
        ...prev,
        activeWorkout: {
          ...prev.activeWorkout,
          exercises: list.map((e, i) => ({ ...e, sortOrder: i })),
        },
      };
    });
  }, []);

  const updateActiveExerciseNotes = useCallback((workoutExerciseId: string, notes: string) => {
    setDb((prev) => {
      if (!prev.activeWorkout) return prev;
      return {
        ...prev,
        activeWorkout: {
          ...prev.activeWorkout,
          exercises: prev.activeWorkout.exercises.map((e) =>
            e.id === workoutExerciseId ? { ...e, notes } : e
          ),
        },
      };
    });
  }, []);

  const updateActiveExerciseRest = useCallback((workoutExerciseId: string, restSeconds: number) => {
    setDb((prev) => {
      if (!prev.activeWorkout) return prev;
      return {
        ...prev,
        activeWorkout: {
          ...prev.activeWorkout,
          exercises: prev.activeWorkout.exercises.map((e) =>
            e.id === workoutExerciseId ? { ...e, restSeconds } : e
          ),
        },
      };
    });
  }, []);

  const updateActiveExerciseWeightUnit = useCallback(
    (workoutExerciseId: string, weightUnit: WeightUnit) => {
      setDb((prev) => {
        if (!prev.activeWorkout) return prev;
        return {
          ...prev,
          activeWorkout: {
            ...prev.activeWorkout,
            exercises: prev.activeWorkout.exercises.map((e) =>
              e.id === workoutExerciseId
                ? {
                    ...e,
                    weightUnit,
                    sets: e.sets.map((s) => ({ ...s, weightUnit })),
                  }
                : e
            ),
          },
        };
      });
    },
    []
  );

  const addSetToActiveExercise = useCallback((workoutExerciseId: string) => {
    setDb((prev) => {
      if (!prev.activeWorkout) return prev;
      return {
        ...prev,
        activeWorkout: {
          ...prev.activeWorkout,
          exercises: prev.activeWorkout.exercises.map((e) => {
            if (e.id !== workoutExerciseId) return e;
            const last = e.sets[e.sets.length - 1];
            const nextSet: WorkoutSet = {
              id: uid('wset'),
              setType: 'normal',
              weightKg: last?.weightKg ?? null,
              weightUnit: last?.weightUnit ?? e.weightUnit ?? prev.settings.weightUnit,
              reps: last?.reps ?? null,
              durationSec: last?.durationSec ?? null,
              distanceKm: last?.distanceKm ?? null,
              completed: false,
            };
            return { ...e, sets: [...e.sets, nextSet] };
          }),
        },
      };
    });
  }, []);

  const deleteSetFromActiveExercise = useCallback((workoutExerciseId: string, setId: string) => {
    setDb((prev) => {
      if (!prev.activeWorkout) return prev;
      return {
        ...prev,
        activeWorkout: {
          ...prev.activeWorkout,
          exercises: prev.activeWorkout.exercises.map((e) =>
            e.id === workoutExerciseId ? { ...e, sets: e.sets.filter((s) => s.id !== setId) } : e
          ),
        },
      };
    });
  }, []);

  const updateActiveSet = useCallback(
    (
      workoutExerciseId: string,
      setId: string,
      patch: Partial<
        Pick<WorkoutSet, 'weightKg' | 'weightUnit' | 'reps' | 'durationSec' | 'distanceKm' | 'setType'>
      >
    ) => {
      setDb((prev) => {
        if (!prev.activeWorkout) return prev;
        return {
          ...prev,
          activeWorkout: {
            ...prev.activeWorkout,
            exercises: prev.activeWorkout.exercises.map((e) =>
              e.id === workoutExerciseId
                ? {
                    ...e,
                    sets: e.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
                  }
                : e
            ),
          },
        };
      });
    },
    []
  );

  const toggleActiveSetComplete = useCallback(
    (workoutExerciseId: string, setId: string) => {
      let triggerRestFor: { exerciseId: string; restSeconds: number } | null = null;
      setDb((prev) => {
        if (!prev.activeWorkout) return prev;
        return {
          ...prev,
          activeWorkout: {
            ...prev.activeWorkout,
            exercises: prev.activeWorkout.exercises.map((e) => {
              if (e.id !== workoutExerciseId) return e;
              return {
                ...e,
                sets: e.sets.map((s) => {
                  if (s.id !== setId) return s;
                  const nextCompleted = !s.completed;
                  if (nextCompleted) {
                    triggerRestFor = {
                      exerciseId: e.exerciseId,
                      restSeconds: e.restSeconds || prev.settings.defaultRestSeconds,
                    };
                  }
                  return { ...s, completed: nextCompleted };
                }),
              };
            }),
          },
        };
      });

      // Defer side effects cleanly outside state updater
      setTimeout(() => {
        if (triggerRestFor) {
          triggerHaptic(22);
          startRestTimer(triggerRestFor.exerciseId, triggerRestFor.restSeconds);
        }
      }, 0);
    },
    [startRestTimer]
  );

  const prepareFinishWorkout = useCallback((): PendingWorkoutFinish | null => {
    if (!db.activeWorkout) return null;
    const now = Date.now();
    const durationSeconds = Math.max(1, Math.round((now - db.activeWorkout.startedAt) / 1000));
    // Keep only exercises with at least one completed set (or keep all if none completed yet)
    const completedOnlyExercises = db.activeWorkout.exercises
      .map((ex) => ({
        ...ex,
        sets: ex.sets.filter((s) => s.completed),
      }))
      .filter((ex) => ex.sets.length > 0);

    const candidate: WorkoutSession = {
      ...db.activeWorkout,
      finishedAt: now,
      durationSeconds,
      exercises: completedOnlyExercises,
    };

    return detectWorkoutPRs(candidate, db.workouts, db.exercises);
  }, [db.activeWorkout, db.workouts, db.exercises]);

  const confirmFinishWorkout = useCallback(
    (finalNotes: string, updateSourceRoutine: boolean) => {
      setDb((prev) => {
        if (!prev.activeWorkout) return prev;
        const now = Date.now();
        const durationSeconds = Math.max(1, Math.round((now - prev.activeWorkout.startedAt) / 1000));
        const completedExercises = prev.activeWorkout.exercises
          .map((ex) => ({
            ...ex,
            sets: ex.sets.filter((s) => s.completed),
          }))
          .filter((ex) => ex.sets.length > 0);

        const candidate: WorkoutSession = {
          ...prev.activeWorkout,
          notes: finalNotes,
          finishedAt: now,
          durationSeconds,
          exercises: completedExercises,
        };

        const { annotatedSession } = detectWorkoutPRs(candidate, prev.workouts, prev.exercises);

        let nextRoutines = prev.routines;
        if (updateSourceRoutine && prev.activeWorkout.routineId) {
          const activeRef = prev.activeWorkout;
          nextRoutines = prev.routines.map((r) => {
            if (r.id !== activeRef.routineId) return r;
            return {
              ...r,
              updatedAt: now,
              exercises: activeRef.exercises.map((we, idx) => ({
                id: uid('re'),
                exerciseId: we.exerciseId,
                sortOrder: idx,
                notes: we.notes,
                restSeconds: we.restSeconds,
                weightUnit: we.weightUnit,
                sets: we.sets.map((ws) => ({
                  id: uid('rs'),
                  setType: ws.setType as SetType,
                  weightKg: ws.weightKg,
                  weightUnit: ws.weightUnit,
                  reps: ws.reps,
                  durationSec: ws.durationSec,
                  distanceKm: ws.distanceKm,
                })),
              })),
            };
          });
        }

        return {
          ...prev,
          routines: nextRoutines,
          workouts: [annotatedSession, ...prev.workouts],
          activeWorkout: null,
        };
      });

      setRestTimer(null);
      setRestSecondsRemaining(0);
      setActiveWorkoutOpen(false);
    },
    []
  );

  const discardActiveWorkout = useCallback(() => {
    setDb((prev) => ({ ...prev, activeWorkout: null }));
    setRestTimer(null);
    setRestSecondsRemaining(0);
    setActiveWorkoutOpen(false);
  }, []);

  // History
  const deleteWorkout = useCallback((workoutId: string) => {
    setDb((prev) => ({
      ...prev,
      workouts: prev.workouts.filter((w) => w.id !== workoutId),
    }));
  }, []);

  const updateWorkoutMeta = useCallback((workoutId: string, title: string, notes: string) => {
    setDb((prev) => ({
      ...prev,
      workouts: prev.workouts.map((w) =>
        w.id === workoutId ? { ...w, title: title.trim() || w.title, notes } : w
      ),
    }));
  }, []);

  // Measurements
  const saveMeasurementEntry = useCallback(
    (entry: Omit<BodyMeasurementEntry, 'id'> & { id?: string }) => {
      setDb((prev) => {
        if (entry.id) {
          return {
            ...prev,
            measurements: prev.measurements.map((m) =>
              m.id === entry.id ? { ...entry, id: m.id } : m
            ),
          };
        }
        return {
          ...prev,
          measurements: [{ ...entry, id: uid('bm') }, ...prev.measurements],
        };
      });
    },
    []
  );

  const deleteMeasurementEntry = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      measurements: prev.measurements.filter((m) => m.id !== id),
    }));
  }, []);

  // Settings & Data Portability
  const updateSettings = useCallback((patch: Partial<UserSettings>) => {
    setDb((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...patch },
    }));
  }, []);

  const importWorkoutsAndExercises = useCallback(
    (workouts: WorkoutSession[], newExercises: Exercise[]) => {
      setDb((prev) => {
        const existingExIds = new Set(prev.exercises.map((e) => e.id));
        const mergedExercises = [
          ...prev.exercises,
          ...newExercises.filter((e) => !existingExIds.has(e.id)),
        ];
        const mergedWorkouts = [...workouts, ...prev.workouts].sort(
          (a, b) => b.startedAt - a.startedAt
        );
        return {
          ...prev,
          exercises: mergedExercises,
          workouts: mergedWorkouts,
        };
      });
    },
    []
  );

  const restoreDatabase = useCallback((nextDb: AppDatabase) => {
    setDb(nextDb);
    setRestTimer(null);
    setActiveWorkoutOpen(false);
  }, []);

  const resetToSampleData = useCallback(() => {
    setDb(createSeededDatabase());
    setRestTimer(null);
    setActiveWorkoutOpen(false);
  }, []);

  const clearAllData = useCallback(() => {
    setDb(createEmptyDatabase());
    setRestTimer(null);
    setActiveWorkoutOpen(false);
  }, []);

  const value = useMemo<WorkoutContextValue>(
    () => ({
      db,
      exerciseMap,
      activeWorkoutOpen,
      setActiveWorkoutOpen,
      restTimer,
      restSecondsRemaining,
      startRestTimer,
      adjustRestTimer,
      skipRestTimer,
      createFolder,
      renameFolder,
      toggleFolderCollapse,
      moveFolder,
      deleteFolder,
      saveRoutine,
      duplicateRoutine,
      deleteRoutine,
      moveRoutine,
      moveRoutineToFolder,
      saveExercise,
      deleteExercise,
      startEmptyWorkout,
      startRoutineWorkout,
      updateActiveWorkoutTitle,
      updateActiveWorkoutNotes,
      addExercisesToActiveWorkout,
      removeExerciseFromActiveWorkout,
      moveActiveWorkoutExercise,
      updateActiveExerciseNotes,
      updateActiveExerciseRest,
      updateActiveExerciseWeightUnit,
      addSetToActiveExercise,
      deleteSetFromActiveExercise,
      updateActiveSet,
      toggleActiveSetComplete,
      prepareFinishWorkout,
      confirmFinishWorkout,
      discardActiveWorkout,
      deleteWorkout,
      updateWorkoutMeta,
      saveMeasurementEntry,
      deleteMeasurementEntry,
      updateSettings,
      importWorkoutsAndExercises,
      restoreDatabase,
      resetToSampleData,
      clearAllData,
    }),
    [
      db,
      exerciseMap,
      activeWorkoutOpen,
      restTimer,
      restSecondsRemaining,
      startRestTimer,
      adjustRestTimer,
      skipRestTimer,
      createFolder,
      renameFolder,
      toggleFolderCollapse,
      moveFolder,
      deleteFolder,
      saveRoutine,
      duplicateRoutine,
      deleteRoutine,
      moveRoutine,
      moveRoutineToFolder,
      saveExercise,
      deleteExercise,
      startEmptyWorkout,
      startRoutineWorkout,
      updateActiveWorkoutTitle,
      updateActiveWorkoutNotes,
      addExercisesToActiveWorkout,
      removeExerciseFromActiveWorkout,
      moveActiveWorkoutExercise,
      updateActiveExerciseNotes,
      updateActiveExerciseRest,
      updateActiveExerciseWeightUnit,
      addSetToActiveExercise,
      deleteSetFromActiveExercise,
      updateActiveSet,
      toggleActiveSetComplete,
      prepareFinishWorkout,
      confirmFinishWorkout,
      discardActiveWorkout,
      deleteWorkout,
      updateWorkoutMeta,
      saveMeasurementEntry,
      deleteMeasurementEntry,
      updateSettings,
      importWorkoutsAndExercises,
      restoreDatabase,
      resetToSampleData,
      clearAllData,
    ]
  );

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
}

export function useWorkout(): WorkoutContextValue {
  const ctx = useContext(WorkoutContext);
  if (!ctx) {
    throw new Error('useWorkout must be used inside WorkoutProvider');
  }
  return ctx;
}
