import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateEstimated1RM,
  calculateSetVolume,
  calculateWorkoutVolumeKg,
  checkRoutineDiff,
  convertWeightFromKg,
  convertWeightToKg,
  detectWorkoutPRs,
  getExerciseProgressSeries,
  getMuscleGroupDistribution,
  getPreviousExerciseSets,
} from './calculations';
import { BUILT_IN_EXERCISES } from '../data/exercises';
import { createSeededDatabase } from '../data/seedData';
import { WorkoutSession } from '../types/workout';

test('Epley estimated 1RM formula computes accurate values', () => {
  assert.equal(calculateEstimated1RM(100, 1), 100);
  assert.equal(calculateEstimated1RM(100, 30), 200);
  assert.ok(Math.abs(calculateEstimated1RM(80, 8) - 80 * (1 + 8 / 30)) < 1e-6);
  assert.equal(calculateEstimated1RM(null, 10), 0);
  assert.equal(calculateEstimated1RM(100, 0), 0);
});

test('kg/lbs unit conversion preserves base kg precision without drift', () => {
  const baseKg = convertWeightToKg(225, 'lbs');
  assert.ok(baseKg !== null);
  assert.equal(convertWeightFromKg(baseKg, 'lbs'), 225);
  assert.equal(convertWeightFromKg(82.5, 'kg'), 82.5);
});

test('set volume and workout volume only sum completed sets', () => {
  assert.equal(calculateSetVolume(80, 10), 800);
  const mockWorkout: WorkoutSession = {
    id: 'w-test',
    routineId: null,
    title: 'Test',
    notes: '',
    startedAt: Date.now(),
    finishedAt: Date.now(),
    durationSeconds: 1800,
    exercises: [
      {
        id: 'we-1',
        exerciseId: 'ex-bench-barbell',
        sortOrder: 0,
        notes: '',
        restSeconds: 90,
        sets: [
          { id: 's1', setType: 'normal', weightKg: 100, reps: 5, durationSec: null, distanceKm: null, completed: true },
          { id: 's2', setType: 'normal', weightKg: 100, reps: 5, durationSec: null, distanceKm: null, completed: false },
        ],
      },
    ],
  };
  assert.equal(calculateWorkoutVolumeKg(mockWorkout), 500);
});

test('PR detector identifies Heaviest Weight, Best Est. 1RM, and Best Set Volume', () => {
  const now = 1_760_000_000_000;
  const db = createSeededDatabase(now);
  // Existing best bench in seed is 85kg x 6 (1RM = 102kg, set vol = 510kg) and 82.5kg x 8 (set vol = 660kg)
  const newSession: WorkoutSession = {
    id: 'wk-new-pr',
    routineId: 'rtn-push-a',
    title: 'Push PR Day',
    notes: '',
    startedAt: now + 10_000,
    finishedAt: now + 3_600_000,
    durationSeconds: 3590,
    exercises: [
      {
        id: 'we-pr',
        exerciseId: 'ex-bench-barbell',
        sortOrder: 0,
        notes: '',
        restSeconds: 120,
        sets: [
          { id: 'sp-1', setType: 'normal', weightKg: 90, reps: 8, durationSec: null, distanceKm: null, completed: true },
        ],
      },
    ],
  };

  const { annotatedSession, prs } = detectWorkoutPRs(newSession, db.workouts, BUILT_IN_EXERCISES);
  assert.equal(prs.length, 3);
  assert.equal(annotatedSession.exercises[0].sets[0].isWeightPR, true);
  assert.equal(annotatedSession.exercises[0].sets[0].is1RMPR, true);
  assert.equal(annotatedSession.exercises[0].sets[0].isVolumePR, true);
});

test('previous session lookup fetches sets from the most recent completed workout', () => {
  const now = 1_760_000_000_000;
  const db = createSeededDatabase(now);
  const prev = getPreviousExerciseSets('ex-bench-barbell', db.workouts);
  assert.equal(prev.length, 4);
  assert.equal(prev[3].weightKg, 85);
  assert.equal(prev[3].reps, 6);
});

test('muscle group distribution excludes warmup sets and ranks primary muscles', () => {
  const now = 1_760_000_000_000;
  const db = createSeededDatabase(now);
  const dist = getMuscleGroupDistribution(db.workouts, BUILT_IN_EXERCISES, '30D', now);
  assert.ok(dist.length > 0);
  const chest = dist.find((d) => d.muscle === 'Chest');
  assert.ok(chest !== undefined);
  assert.ok(chest.workingSets > 0);
  // Warmups should not be counted
  const benchSets = getExerciseProgressSeries('ex-bench-barbell', db.workouts, '3M', now);
  assert.equal(benchSets.length, 4);
});

test('checkRoutineDiff detects added sets or changed weights', () => {
  const db = createSeededDatabase();
  const pushRoutine = db.routines.find((r) => r.id === 'rtn-push-a')!;
  const identicalSession: WorkoutSession = {
    id: 'w-diff',
    routineId: pushRoutine.id,
    title: pushRoutine.name,
    notes: '',
    startedAt: Date.now(),
    finishedAt: Date.now(),
    durationSeconds: 1000,
    exercises: pushRoutine.exercises.map((e) => ({
      id: e.id,
      exerciseId: e.exerciseId,
      sortOrder: e.sortOrder,
      notes: e.notes,
      restSeconds: e.restSeconds,
      sets: e.sets.map((s) => ({ ...s, completed: true })),
    })),
  };
  assert.equal(checkRoutineDiff(identicalSession, pushRoutine), false);

  identicalSession.exercises[0].sets[1].weightKg = 90;
  assert.equal(checkRoutineDiff(identicalSession, pushRoutine), true);
});

test('mixed kg and lbs sets inside the same exercise compute accurate volume and PRs', () => {
  const mixedWorkout: WorkoutSession = {
    id: 'wk-mixed',
    routineId: null,
    title: 'Mixed Units Push',
    notes: '',
    startedAt: Date.now(),
    finishedAt: Date.now(),
    durationSeconds: 1800,
    exercises: [
      {
        id: 'we-mixed-1',
        exerciseId: 'ex-bench-barbell',
        sortOrder: 0,
        notes: '',
        restSeconds: 120,
        weightUnit: 'kg',
        sets: [
          // Set 1 logged in kg (100 kg x 5 = 500 kg)
          {
            id: 'ms-1',
            setType: 'normal',
            weightKg: convertWeightToKg(100, 'kg'),
            weightUnit: 'kg',
            reps: 5,
            durationSec: null,
            distanceKm: null,
            completed: true,
          },
          // Set 2 logged in lbs (225 lbs ~= 102.0583 kg x 5 ~= 510.29 kg)
          {
            id: 'ms-2',
            setType: 'normal',
            weightKg: convertWeightToKg(225, 'lbs'),
            weightUnit: 'lbs',
            reps: 5,
            durationSec: null,
            distanceKm: null,
            completed: true,
          },
        ],
      },
    ],
  };

  // Total volume accurately combines kg + lbs in base kg
  const vol = calculateWorkoutVolumeKg(mixedWorkout);
  assert.ok(Math.abs(vol - (500 + (225 / 2.2046226218) * 5)) < 0.05);

  // Set 2 (225 lbs = 102.06 kg) beats Set 1 (100 kg) for Weight PR, 1RM PR, and Set Volume PR
  const { annotatedSession } = detectWorkoutPRs(mixedWorkout, [], BUILT_IN_EXERCISES);
  assert.equal(annotatedSession.exercises[0].sets[0].isWeightPR, false);
  assert.equal(annotatedSession.exercises[0].sets[1].isWeightPR, true);
  assert.equal(annotatedSession.exercises[0].sets[1].is1RMPR, true);
  assert.equal(annotatedSession.exercises[0].sets[1].isVolumePR, true);

  // Display round-trip preserves exact 100 kg on set 1 and exact 225 lbs on set 2
  assert.equal(convertWeightFromKg(mixedWorkout.exercises[0].sets[0].weightKg, 'kg'), 100);
  assert.equal(convertWeightFromKg(mixedWorkout.exercises[0].sets[1].weightKg, 'lbs'), 225);
});
