import {
  AppDatabase,
  BodyMeasurementEntry,
  Routine,
  RoutineFolder,
  UserSettings,
  WorkoutSession,
} from '../types/workout';
import { BUILT_IN_EXERCISES } from './exercises';
import { toLocalDateKey } from '../utils/calculations';

export const DEFAULT_SETTINGS: UserSettings = {
  weightUnit: 'kg',
  distanceUnit: 'km',
  measurementUnit: 'cm',
  defaultRestSeconds: 90,
  theme: 'dark',
  restSoundEnabled: true,
};

export function createEmptyDatabase(): AppDatabase {
  return {
    version: 1,
    exercises: [...BUILT_IN_EXERCISES],
    folders: [],
    routines: [],
    workouts: [],
    activeWorkout: null,
    measurements: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

export function createSeededDatabase(now = Date.now()): AppDatabase {
  const dayMs = 86_400_000;

  const folders: RoutineFolder[] = [
    { id: 'folder-ppl', name: 'Push / Pull / Legs', sortOrder: 0, isCollapsed: false },
    { id: 'folder-upper-lower', name: 'Upper / Lower Strength', sortOrder: 1, isCollapsed: false },
  ];

  const routines: Routine[] = [
    {
      id: 'rtn-push-a',
      folderId: 'folder-ppl',
      name: 'Push Day A',
      notes: 'Focus on controlled eccentric on bench and full lockouts.',
      sortOrder: 0,
      updatedAt: now - 3 * dayMs,
      exercises: [
        {
          id: 're-push-1',
          exerciseId: 'ex-bench-barbell',
          sortOrder: 0,
          notes: 'Pause 1s on chest on working sets',
          restSeconds: 150,
          sets: [
            { id: 'rs-p1-1', setType: 'warmup', weightKg: 50, reps: 10, durationSec: null, distanceKm: null },
            { id: 'rs-p1-2', setType: 'normal', weightKg: 82.5, reps: 8, durationSec: null, distanceKm: null },
            { id: 'rs-p1-3', setType: 'normal', weightKg: 82.5, reps: 8, durationSec: null, distanceKm: null },
            { id: 'rs-p1-4', setType: 'normal', weightKg: 85, reps: 6, durationSec: null, distanceKm: null },
          ],
        },
        {
          id: 're-push-2',
          exerciseId: 'ex-incline-bench-db',
          sortOrder: 1,
          notes: '30 degree bench angle',
          restSeconds: 120,
          sets: [
            { id: 'rs-p2-1', setType: 'normal', weightKg: 30, reps: 10, durationSec: null, distanceKm: null },
            { id: 'rs-p2-2', setType: 'normal', weightKg: 30, reps: 10, durationSec: null, distanceKm: null },
            { id: 'rs-p2-3', setType: 'normal', weightKg: 32.5, reps: 8, durationSec: null, distanceKm: null },
          ],
        },
        {
          id: 're-push-3',
          exerciseId: 'ex-lateral-raise-db',
          sortOrder: 2,
          notes: 'Slight forward lean',
          restSeconds: 75,
          sets: [
            { id: 'rs-p3-1', setType: 'normal', weightKg: 12, reps: 15, durationSec: null, distanceKm: null },
            { id: 'rs-p3-2', setType: 'normal', weightKg: 12, reps: 15, durationSec: null, distanceKm: null },
            { id: 'rs-p3-3', setType: 'drop', weightKg: 10, reps: 15, durationSec: null, distanceKm: null },
          ],
        },
        {
          id: 're-push-4',
          exerciseId: 'ex-tricep-pushdown-rope',
          sortOrder: 3,
          notes: 'Flare rope at bottom',
          restSeconds: 75,
          sets: [
            { id: 'rs-p4-1', setType: 'normal', weightKg: 27.5, reps: 12, durationSec: null, distanceKm: null },
            { id: 'rs-p4-2', setType: 'normal', weightKg: 27.5, reps: 12, durationSec: null, distanceKm: null },
            { id: 'rs-p4-3', setType: 'failure', weightKg: 27.5, reps: 14, durationSec: null, distanceKm: null },
          ],
        },
      ],
    },
    {
      id: 'rtn-pull-a',
      folderId: 'folder-ppl',
      name: 'Pull Day A',
      notes: 'Lead with elbows, avoid swinging on curls.',
      sortOrder: 1,
      updatedAt: now - 5 * dayMs,
      exercises: [
        {
          id: 're-pull-1',
          exerciseId: 'ex-barbell-row',
          sortOrder: 0,
          notes: 'Torso at 45 degrees',
          restSeconds: 120,
          sets: [
            { id: 'rs-pl1-1', setType: 'warmup', weightKg: 50, reps: 10, durationSec: null, distanceKm: null },
            { id: 'rs-pl1-2', setType: 'normal', weightKg: 75, reps: 8, durationSec: null, distanceKm: null },
            { id: 'rs-pl1-3', setType: 'normal', weightKg: 75, reps: 8, durationSec: null, distanceKm: null },
            { id: 'rs-pl1-4', setType: 'normal', weightKg: 77.5, reps: 8, durationSec: null, distanceKm: null },
          ],
        },
        {
          id: 're-pull-2',
          exerciseId: 'ex-lat-pulldown',
          sortOrder: 1,
          notes: 'Full stretch at top',
          restSeconds: 90,
          sets: [
            { id: 'rs-pl2-1', setType: 'normal', weightKg: 65, reps: 10, durationSec: null, distanceKm: null },
            { id: 'rs-pl2-2', setType: 'normal', weightKg: 65, reps: 10, durationSec: null, distanceKm: null },
            { id: 'rs-pl2-3', setType: 'normal', weightKg: 70, reps: 9, durationSec: null, distanceKm: null },
          ],
        },
        {
          id: 're-pull-3',
          exerciseId: 'ex-face-pull',
          sortOrder: 2,
          notes: 'External rotation at peak',
          restSeconds: 60,
          sets: [
            { id: 'rs-pl3-1', setType: 'normal', weightKg: 22.5, reps: 15, durationSec: null, distanceKm: null },
            { id: 'rs-pl3-2', setType: 'normal', weightKg: 22.5, reps: 15, durationSec: null, distanceKm: null },
            { id: 'rs-pl3-3', setType: 'normal', weightKg: 25, reps: 14, durationSec: null, distanceKm: null },
          ],
        },
        {
          id: 're-pull-4',
          exerciseId: 'ex-ez-bar-curl',
          sortOrder: 3,
          notes: '',
          restSeconds: 75,
          sets: [
            { id: 'rs-pl4-1', setType: 'normal', weightKg: 32.5, reps: 10, durationSec: null, distanceKm: null },
            { id: 'rs-pl4-2', setType: 'normal', weightKg: 32.5, reps: 10, durationSec: null, distanceKm: null },
            { id: 'rs-pl4-3', setType: 'failure', weightKg: 32.5, reps: 11, durationSec: null, distanceKm: null },
          ],
        },
      ],
    },
    {
      id: 'rtn-legs-a',
      folderId: 'folder-ppl',
      name: 'Leg Day A',
      notes: 'Depth below parallel on all squat sets.',
      sortOrder: 2,
      updatedAt: now - 7 * dayMs,
      exercises: [
        {
          id: 're-leg-1',
          exerciseId: 'ex-squat-barbell',
          sortOrder: 0,
          notes: 'Belt on top sets',
          restSeconds: 180,
          sets: [
            { id: 'rs-l1-1', setType: 'warmup', weightKg: 60, reps: 8, durationSec: null, distanceKm: null },
            { id: 'rs-l1-2', setType: 'normal', weightKg: 110, reps: 6, durationSec: null, distanceKm: null },
            { id: 'rs-l1-3', setType: 'normal', weightKg: 110, reps: 6, durationSec: null, distanceKm: null },
            { id: 'rs-l1-4', setType: 'normal', weightKg: 115, reps: 5, durationSec: null, distanceKm: null },
          ],
        },
        {
          id: 're-leg-2',
          exerciseId: 'ex-rdl-barbell',
          sortOrder: 1,
          notes: 'Hinge hips back, soft knees',
          restSeconds: 120,
          sets: [
            { id: 'rs-l2-1', setType: 'normal', weightKg: 95, reps: 8, durationSec: null, distanceKm: null },
            { id: 'rs-l2-2', setType: 'normal', weightKg: 95, reps: 8, durationSec: null, distanceKm: null },
            { id: 'rs-l2-3', setType: 'normal', weightKg: 100, reps: 8, durationSec: null, distanceKm: null },
          ],
        },
        {
          id: 're-leg-3',
          exerciseId: 'ex-leg-extension',
          sortOrder: 2,
          notes: 'Hold 1s at peak contraction',
          restSeconds: 75,
          sets: [
            { id: 'rs-l3-1', setType: 'normal', weightKg: 55, reps: 12, durationSec: null, distanceKm: null },
            { id: 'rs-l3-2', setType: 'normal', weightKg: 55, reps: 12, durationSec: null, distanceKm: null },
            { id: 'rs-l3-3', setType: 'drop', weightKg: 45, reps: 14, durationSec: null, distanceKm: null },
          ],
        },
        {
          id: 're-leg-4',
          exerciseId: 'ex-standing-calf-raise',
          sortOrder: 3,
          notes: '2s pause at bottom stretch',
          restSeconds: 60,
          sets: [
            { id: 'rs-l4-1', setType: 'normal', weightKg: 80, reps: 15, durationSec: null, distanceKm: null },
            { id: 'rs-l4-2', setType: 'normal', weightKg: 80, reps: 15, durationSec: null, distanceKm: null },
            { id: 'rs-l4-3', setType: 'normal', weightKg: 85, reps: 14, durationSec: null, distanceKm: null },
          ],
        },
      ],
    },
    {
      id: 'rtn-upper-power',
      folderId: 'folder-upper-lower',
      name: 'Upper Power',
      notes: 'Heavy compound focus.',
      sortOrder: 0,
      updatedAt: now - 9 * dayMs,
      exercises: [
        {
          id: 're-up-1',
          exerciseId: 'ex-ohp-barbell',
          sortOrder: 0,
          notes: 'Brace core tight',
          restSeconds: 150,
          sets: [
            { id: 'rs-u1-1', setType: 'normal', weightKg: 55, reps: 6, durationSec: null, distanceKm: null },
            { id: 'rs-u1-2', setType: 'normal', weightKg: 55, reps: 6, durationSec: null, distanceKm: null },
            { id: 'rs-u1-3', setType: 'normal', weightKg: 57.5, reps: 5, durationSec: null, distanceKm: null },
          ],
        },
        {
          id: 're-up-2',
          exerciseId: 'ex-pullup',
          sortOrder: 1,
          notes: 'Full dead hang each rep',
          restSeconds: 120,
          sets: [
            { id: 'rs-u2-1', setType: 'normal', weightKg: null, reps: 10, durationSec: null, distanceKm: null },
            { id: 'rs-u2-2', setType: 'normal', weightKg: null, reps: 10, durationSec: null, distanceKm: null },
            { id: 'rs-u2-3', setType: 'normal', weightKg: null, reps: 9, durationSec: null, distanceKm: null },
          ],
        },
      ],
    },
  ];

  // Historical completed workouts showing genuine progressive overload over 5 weeks
  const makeSession = (
    id: string,
    daysAgo: number,
    durationMin: number,
    routineId: string | null,
    title: string,
    notes: string,
    exercises: WorkoutSession['exercises']
  ): WorkoutSession => {
    const startedAt = now - daysAgo * dayMs;
    const durationSeconds = durationMin * 60;
    return {
      id,
      routineId,
      title,
      notes,
      startedAt,
      finishedAt: startedAt + durationSeconds * 1000,
      durationSeconds,
      exercises,
    };
  };

  const workouts: WorkoutSession[] = [
    // Most recent: 2 days ago — Push Day A
    makeSession('wk-seed-8', 2, 58, 'rtn-push-a', 'Push Day A', 'Strong top set on bench, shoulders felt locked in.', [
      {
        id: 'w8-e1',
        exerciseId: 'ex-bench-barbell',
        sortOrder: 0,
        notes: 'Clean pause on chest',
        restSeconds: 150,
        sets: [
          { id: 'w8-s1', setType: 'warmup', weightKg: 50, reps: 10, durationSec: null, distanceKm: null, completed: true },
          { id: 'w8-s2', setType: 'normal', weightKg: 82.5, reps: 8, durationSec: null, distanceKm: null, completed: true },
          { id: 'w8-s3', setType: 'normal', weightKg: 82.5, reps: 8, durationSec: null, distanceKm: null, completed: true },
          { id: 'w8-s4', setType: 'normal', weightKg: 85, reps: 6, durationSec: null, distanceKm: null, completed: true, isWeightPR: true, is1RMPR: true },
        ],
      },
      {
        id: 'w8-e2',
        exerciseId: 'ex-incline-bench-db',
        sortOrder: 1,
        notes: '',
        restSeconds: 120,
        sets: [
          { id: 'w8-s5', setType: 'normal', weightKg: 30, reps: 10, durationSec: null, distanceKm: null, completed: true },
          { id: 'w8-s6', setType: 'normal', weightKg: 30, reps: 10, durationSec: null, distanceKm: null, completed: true },
          { id: 'w8-s7', setType: 'normal', weightKg: 32.5, reps: 8, durationSec: null, distanceKm: null, completed: true, isWeightPR: true },
        ],
      },
      {
        id: 'w8-e3',
        exerciseId: 'ex-lateral-raise-db',
        sortOrder: 2,
        notes: '',
        restSeconds: 75,
        sets: [
          { id: 'w8-s8', setType: 'normal', weightKg: 12, reps: 15, durationSec: null, distanceKm: null, completed: true },
          { id: 'w8-s9', setType: 'normal', weightKg: 12, reps: 15, durationSec: null, distanceKm: null, completed: true },
          { id: 'w8-s10', setType: 'drop', weightKg: 10, reps: 16, durationSec: null, distanceKm: null, completed: true },
        ],
      },
      {
        id: 'w8-e4',
        exerciseId: 'ex-tricep-pushdown-rope',
        sortOrder: 3,
        notes: '',
        restSeconds: 75,
        sets: [
          { id: 'w8-s11', setType: 'normal', weightKg: 27.5, reps: 12, durationSec: null, distanceKm: null, completed: true },
          { id: 'w8-s12', setType: 'normal', weightKg: 27.5, reps: 12, durationSec: null, distanceKm: null, completed: true },
          { id: 'w8-s13', setType: 'failure', weightKg: 27.5, reps: 14, durationSec: null, distanceKm: null, completed: true, isVolumePR: true },
        ],
      },
    ]),

    // 4 days ago — Pull Day A
    makeSession('wk-seed-7', 4, 54, 'rtn-pull-a', 'Pull Day A', 'Great back pump, straps on last row set.', [
      {
        id: 'w7-e1',
        exerciseId: 'ex-barbell-row',
        sortOrder: 0,
        notes: '',
        restSeconds: 120,
        sets: [
          { id: 'w7-s1', setType: 'warmup', weightKg: 50, reps: 10, durationSec: null, distanceKm: null, completed: true },
          { id: 'w7-s2', setType: 'normal', weightKg: 75, reps: 8, durationSec: null, distanceKm: null, completed: true },
          { id: 'w7-s3', setType: 'normal', weightKg: 75, reps: 8, durationSec: null, distanceKm: null, completed: true },
          { id: 'w7-s4', setType: 'normal', weightKg: 77.5, reps: 8, durationSec: null, distanceKm: null, completed: true, isWeightPR: true },
        ],
      },
      {
        id: 'w7-e2',
        exerciseId: 'ex-lat-pulldown',
        sortOrder: 1,
        notes: '',
        restSeconds: 90,
        sets: [
          { id: 'w7-s5', setType: 'normal', weightKg: 65, reps: 10, durationSec: null, distanceKm: null, completed: true },
          { id: 'w7-s6', setType: 'normal', weightKg: 65, reps: 10, durationSec: null, distanceKm: null, completed: true },
          { id: 'w7-s7', setType: 'normal', weightKg: 70, reps: 9, durationSec: null, distanceKm: null, completed: true, isWeightPR: true },
        ],
      },
      {
        id: 'w7-e3',
        exerciseId: 'ex-face-pull',
        sortOrder: 2,
        notes: '',
        restSeconds: 60,
        sets: [
          { id: 'w7-s8', setType: 'normal', weightKg: 22.5, reps: 15, durationSec: null, distanceKm: null, completed: true },
          { id: 'w7-s9', setType: 'normal', weightKg: 25, reps: 14, durationSec: null, distanceKm: null, completed: true },
        ],
      },
      {
        id: 'w7-e4',
        exerciseId: 'ex-ez-bar-curl',
        sortOrder: 3,
        notes: '',
        restSeconds: 75,
        sets: [
          { id: 'w7-s10', setType: 'normal', weightKg: 32.5, reps: 10, durationSec: null, distanceKm: null, completed: true },
          { id: 'w7-s11', setType: 'normal', weightKg: 32.5, reps: 10, durationSec: null, distanceKm: null, completed: true },
          { id: 'w7-s12', setType: 'failure', weightKg: 32.5, reps: 11, durationSec: null, distanceKm: null, completed: true },
        ],
      },
    ]),

    // 7 days ago — Leg Day A
    makeSession('wk-seed-6', 7, 64, 'rtn-legs-a', 'Leg Day A', 'Squats moved fast.', [
      {
        id: 'w6-e1',
        exerciseId: 'ex-squat-barbell',
        sortOrder: 0,
        notes: '',
        restSeconds: 180,
        sets: [
          { id: 'w6-s1', setType: 'warmup', weightKg: 60, reps: 8, durationSec: null, distanceKm: null, completed: true },
          { id: 'w6-s2', setType: 'normal', weightKg: 110, reps: 6, durationSec: null, distanceKm: null, completed: true },
          { id: 'w6-s3', setType: 'normal', weightKg: 110, reps: 6, durationSec: null, distanceKm: null, completed: true },
          { id: 'w6-s4', setType: 'normal', weightKg: 115, reps: 5, durationSec: null, distanceKm: null, completed: true, isWeightPR: true, is1RMPR: true },
        ],
      },
      {
        id: 'w6-e2',
        exerciseId: 'ex-rdl-barbell',
        sortOrder: 1,
        notes: '',
        restSeconds: 120,
        sets: [
          { id: 'w6-s5', setType: 'normal', weightKg: 95, reps: 8, durationSec: null, distanceKm: null, completed: true },
          { id: 'w6-s6', setType: 'normal', weightKg: 100, reps: 8, durationSec: null, distanceKm: null, completed: true },
        ],
      },
      {
        id: 'w6-e3',
        exerciseId: 'ex-leg-extension',
        sortOrder: 2,
        notes: '',
        restSeconds: 75,
        sets: [
          { id: 'w6-s7', setType: 'normal', weightKg: 55, reps: 12, durationSec: null, distanceKm: null, completed: true },
          { id: 'w6-s8', setType: 'normal', weightKg: 55, reps: 12, durationSec: null, distanceKm: null, completed: true },
        ],
      },
      {
        id: 'w6-e4',
        exerciseId: 'ex-standing-calf-raise',
        sortOrder: 3,
        notes: '',
        restSeconds: 60,
        sets: [
          { id: 'w6-s9', setType: 'normal', weightKg: 80, reps: 15, durationSec: null, distanceKm: null, completed: true },
          { id: 'w6-s10', setType: 'normal', weightKg: 85, reps: 14, durationSec: null, distanceKm: null, completed: true },
        ],
      },
    ]),

    // 10 days ago — Push Day A
    makeSession('wk-seed-5', 10, 55, 'rtn-push-a', 'Push Day A', 'Added 2.5kg to working sets.', [
      {
        id: 'w5-e1',
        exerciseId: 'ex-bench-barbell',
        sortOrder: 0,
        notes: '',
        restSeconds: 150,
        sets: [
          { id: 'w5-s1', setType: 'warmup', weightKg: 50, reps: 10, durationSec: null, distanceKm: null, completed: true },
          { id: 'w5-s2', setType: 'normal', weightKg: 80, reps: 8, durationSec: null, distanceKm: null, completed: true },
          { id: 'w5-s3', setType: 'normal', weightKg: 80, reps: 8, durationSec: null, distanceKm: null, completed: true },
          { id: 'w5-s4', setType: 'normal', weightKg: 82.5, reps: 6, durationSec: null, distanceKm: null, completed: true },
        ],
      },
      {
        id: 'w5-e2',
        exerciseId: 'ex-incline-bench-db',
        sortOrder: 1,
        notes: '',
        restSeconds: 120,
        sets: [
          { id: 'w5-s5', setType: 'normal', weightKg: 27.5, reps: 10, durationSec: null, distanceKm: null, completed: true },
          { id: 'w5-s6', setType: 'normal', weightKg: 30, reps: 9, durationSec: null, distanceKm: null, completed: true },
        ],
      },
      {
        id: 'w5-e3',
        exerciseId: 'ex-lateral-raise-db',
        sortOrder: 2,
        notes: '',
        restSeconds: 75,
        sets: [
          { id: 'w5-s7', setType: 'normal', weightKg: 12, reps: 14, durationSec: null, distanceKm: null, completed: true },
          { id: 'w5-s8', setType: 'normal', weightKg: 12, reps: 14, durationSec: null, distanceKm: null, completed: true },
        ],
      },
    ]),

    // 14 days ago — Upper Power
    makeSession('wk-seed-4', 14, 48, 'rtn-upper-power', 'Upper Power', 'Crisp overhead pressing.', [
      {
        id: 'w4-e1',
        exerciseId: 'ex-ohp-barbell',
        sortOrder: 0,
        notes: '',
        restSeconds: 150,
        sets: [
          { id: 'w4-s1', setType: 'normal', weightKg: 52.5, reps: 6, durationSec: null, distanceKm: null, completed: true },
          { id: 'w4-s2', setType: 'normal', weightKg: 55, reps: 6, durationSec: null, distanceKm: null, completed: true },
          { id: 'w4-s3', setType: 'normal', weightKg: 55, reps: 5, durationSec: null, distanceKm: null, completed: true },
        ],
      },
      {
        id: 'w4-e2',
        exerciseId: 'ex-pullup',
        sortOrder: 1,
        notes: '',
        restSeconds: 120,
        sets: [
          { id: 'w4-s4', setType: 'normal', weightKg: null, reps: 10, durationSec: null, distanceKm: null, completed: true },
          { id: 'w4-s5', setType: 'normal', weightKg: null, reps: 9, durationSec: null, distanceKm: null, completed: true },
        ],
      },
      {
        id: 'w4-e3',
        exerciseId: 'ex-cable-crunch',
        sortOrder: 2,
        notes: '',
        restSeconds: 60,
        sets: [
          { id: 'w4-s6', setType: 'normal', weightKg: 35, reps: 15, durationSec: null, distanceKm: null, completed: true },
          { id: 'w4-s7', setType: 'normal', weightKg: 35, reps: 15, durationSec: null, distanceKm: null, completed: true },
        ],
      },
    ]),

    // 18 days ago — Leg Day A
    makeSession('wk-seed-3', 18, 60, 'rtn-legs-a', 'Leg Day A', '', [
      {
        id: 'w3-e1',
        exerciseId: 'ex-squat-barbell',
        sortOrder: 0,
        notes: '',
        restSeconds: 180,
        sets: [
          { id: 'w3-s1', setType: 'warmup', weightKg: 60, reps: 8, durationSec: null, distanceKm: null, completed: true },
          { id: 'w3-s2', setType: 'normal', weightKg: 105, reps: 6, durationSec: null, distanceKm: null, completed: true },
          { id: 'w3-s3', setType: 'normal', weightKg: 105, reps: 6, durationSec: null, distanceKm: null, completed: true },
          { id: 'w3-s4', setType: 'normal', weightKg: 110, reps: 5, durationSec: null, distanceKm: null, completed: true },
        ],
      },
      {
        id: 'w3-e2',
        exerciseId: 'ex-rdl-barbell',
        sortOrder: 1,
        notes: '',
        restSeconds: 120,
        sets: [
          { id: 'w3-s5', setType: 'normal', weightKg: 90, reps: 8, durationSec: null, distanceKm: null, completed: true },
          { id: 'w3-s6', setType: 'normal', weightKg: 95, reps: 8, durationSec: null, distanceKm: null, completed: true },
        ],
      },
    ]),

    // 22 days ago — Push Day A
    makeSession('wk-seed-2', 22, 52, 'rtn-push-a', 'Push Day A', '', [
      {
        id: 'w2-e1',
        exerciseId: 'ex-bench-barbell',
        sortOrder: 0,
        notes: '',
        restSeconds: 150,
        sets: [
          { id: 'w2-s1', setType: 'normal', weightKg: 77.5, reps: 8, durationSec: null, distanceKm: null, completed: true },
          { id: 'w2-s2', setType: 'normal', weightKg: 77.5, reps: 8, durationSec: null, distanceKm: null, completed: true },
          { id: 'w2-s3', setType: 'normal', weightKg: 80, reps: 6, durationSec: null, distanceKm: null, completed: true },
        ],
      },
      {
        id: 'w2-e2',
        exerciseId: 'ex-incline-bench-db',
        sortOrder: 1,
        notes: '',
        restSeconds: 120,
        sets: [
          { id: 'w2-s4', setType: 'normal', weightKg: 27.5, reps: 10, durationSec: null, distanceKm: null, completed: true },
          { id: 'w2-s5', setType: 'normal', weightKg: 27.5, reps: 10, durationSec: null, distanceKm: null, completed: true },
        ],
      },
    ]),

    // 29 days ago — Push Day A
    makeSession('wk-seed-1', 29, 50, 'rtn-push-a', 'Push Day A', 'Baseline block start.', [
      {
        id: 'w1-e1',
        exerciseId: 'ex-bench-barbell',
        sortOrder: 0,
        notes: '',
        restSeconds: 150,
        sets: [
          { id: 'w1-s1', setType: 'normal', weightKg: 75, reps: 8, durationSec: null, distanceKm: null, completed: true },
          { id: 'w1-s2', setType: 'normal', weightKg: 75, reps: 8, durationSec: null, distanceKm: null, completed: true },
          { id: 'w1-s3', setType: 'normal', weightKg: 77.5, reps: 6, durationSec: null, distanceKm: null, completed: true },
        ],
      },
      {
        id: 'w1-e2',
        exerciseId: 'ex-squat-barbell',
        sortOrder: 1,
        notes: '',
        restSeconds: 180,
        sets: [
          { id: 'w1-s4', setType: 'normal', weightKg: 100, reps: 6, durationSec: null, distanceKm: null, completed: true },
          { id: 'w1-s5', setType: 'normal', weightKg: 102.5, reps: 6, durationSec: null, distanceKm: null, completed: true },
        ],
      },
    ]),
  ];

  const makeMeasurement = (
    id: string,
    daysAgo: number,
    values: BodyMeasurementEntry['values']
  ): BodyMeasurementEntry => {
    const ts = now - daysAgo * dayMs;
    return {
      id,
      date: toLocalDateKey(ts),
      timestamp: ts,
      values,
    };
  };

  const measurements: BodyMeasurementEntry[] = [
    makeMeasurement('bm-1', 35, {
      bodyWeightKg: 81.4,
      bodyFatPct: 16.2,
      chestCm: 103.0,
      waistCm: 84.5,
      leftBicepCm: 36.8,
      rightBicepCm: 37.0,
      leftThighCm: 59.0,
      rightThighCm: 59.2,
    }),
    makeMeasurement('bm-2', 28, {
      bodyWeightKg: 80.8,
      bodyFatPct: 15.8,
      chestCm: 103.2,
      waistCm: 83.8,
      leftBicepCm: 37.0,
      rightBicepCm: 37.1,
    }),
    makeMeasurement('bm-3', 21, {
      bodyWeightKg: 80.3,
      bodyFatPct: 15.4,
      chestCm: 103.5,
      waistCm: 83.2,
      leftBicepCm: 37.1,
      rightBicepCm: 37.3,
    }),
    makeMeasurement('bm-4', 14, {
      bodyWeightKg: 79.9,
      bodyFatPct: 15.0,
      chestCm: 103.8,
      waistCm: 82.6,
      leftBicepCm: 37.3,
      rightBicepCm: 37.5,
      shouldersCm: 121.5,
    }),
    makeMeasurement('bm-5', 7, {
      bodyWeightKg: 79.4,
      bodyFatPct: 14.6,
      chestCm: 104.0,
      waistCm: 82.0,
      leftBicepCm: 37.5,
      rightBicepCm: 37.7,
    }),
    makeMeasurement('bm-6', 1, {
      bodyWeightKg: 79.1,
      bodyFatPct: 14.3,
      chestCm: 104.3,
      waistCm: 81.5,
      leftBicepCm: 37.7,
      rightBicepCm: 37.9,
      leftThighCm: 59.6,
      rightThighCm: 59.8,
    }),
  ];

  return {
    version: 1,
    exercises: [...BUILT_IN_EXERCISES],
    folders,
    routines,
    workouts,
    activeWorkout: null,
    measurements,
    settings: { ...DEFAULT_SETTINGS },
  };
}
