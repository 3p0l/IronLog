import test from 'node:test';
import assert from 'node:assert/strict';
import {
  exportWorkoutsToCsv,
  parseCsvRows,
  parseHevyCsv,
  SAMPLE_HEVY_CSV,
  validateBackupJson,
} from './hevyCsv';
import { BUILT_IN_EXERCISES } from '../data/exercises';
import { createSeededDatabase } from '../data/seedData';

test('built-in exercise library has 120+ tagged exercises', () => {
  assert.ok(BUILT_IN_EXERCISES.length >= 120, `Expected 120+ exercises, got ${BUILT_IN_EXERCISES.length}`);
});

test('RFC-4180 CSV parser handles quoted commas and escaped quotes', () => {
  const rows = parseCsvRows(`a,b,c\n"hello, world","she said ""hi""",42`);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[1], ['hello, world', 'she said "hi"', '42']);
});

test('Hevy CSV importer parses workouts, converts lbs to kg, and creates missing exercises', () => {
  const result = parseHevyCsv(SAMPLE_HEVY_CSV, BUILT_IN_EXERCISES);
  assert.equal(result.workouts.length, 1);
  assert.equal(result.totalSets, 5);
  assert.equal(result.newExercises.length, 1);
  assert.equal(result.newExercises[0].name, 'Cable Lat Pullover');

  const workout = result.workouts[0];
  assert.equal(workout.title, 'Upper Body Hypertrophy');
  assert.equal(workout.exercises.length, 2);
  // First exercise matched built-in Bench Press (Barbell)
  assert.equal(workout.exercises[0].exerciseId, 'ex-bench-barbell');
  assert.equal(workout.exercises[0].sets[0].setType, 'warmup');
  // 195 lbs ~= 88.45 kg
  const workingKg = workout.exercises[0].sets[1].weightKg!;
  assert.ok(Math.abs(workingKg - 88.4505) < 0.05);
  assert.equal(workout.exercises[1].sets[1].setType, 'failure');
});

test('CSV export and JSON backup validation round-trip cleanly', () => {
  const db = createSeededDatabase();
  const csv = exportWorkoutsToCsv(db.workouts, db.exercises);
  assert.ok(csv.startsWith('title,start_time,end_time'));
  assert.ok(csv.includes('Bench Press (Barbell)'));

  const reImported = parseHevyCsv(csv, db.exercises);
  assert.equal(reImported.workouts.length, db.workouts.length);
  assert.equal(reImported.newExercises.length, 0);

  const restored = validateBackupJson(JSON.stringify(db));
  assert.equal(restored.workouts.length, db.workouts.length);
  assert.equal(restored.routines.length, db.routines.length);
});
