import {
  AppDatabase,
  Exercise,
  SetType,
  WorkoutExercise,
  WorkoutSession,
  WorkoutSet,
} from '../types/workout';
import { lbsToKg, miToKm } from './calculations';

/**
 * RFC-4180 compliant CSV parser supporting quoted commas, escaped quotes, and multiline values.
 */
export function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  const normalized = csvText.replace(/^\uFEFF/, ''); // Strip UTF-8 BOM if present

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    const next = normalized[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(field.trim());
        field = '';
      } else if (ch === '\r' && next === '\n') {
        row.push(field.trim());
        if (row.some((cell) => cell !== '')) rows.push(row);
        row = [];
        field = '';
        i += 1;
      } else if (ch === '\n' || ch === '\r') {
        row.push(field.trim());
        if (row.some((cell) => cell !== '')) rows.push(row);
        row = [];
        field = '';
      } else {
        field += ch;
      }
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field.trim());
    if (row.some((cell) => cell !== '')) rows.push(row);
  }

  return rows;
}

export function parseHevyTimestamp(raw: string): number {
  if (!raw) return Date.now();
  // Standard Hevy format: "24 Jan 2026, 17:30" or "24 Jan 2026 17:30"
  const cleaned = raw.replace(',', '').trim();
  const parsed = Date.parse(cleaned);
  if (!Number.isNaN(parsed)) return parsed;
  const fallback = Date.parse(raw);
  return Number.isNaN(fallback) ? Date.now() : fallback;
}

function normalizeSetType(raw: string | undefined): SetType {
  const val = (raw ?? '').toLowerCase().trim();
  if (val === 'warmup' || val === 'w') return 'warmup';
  if (val === 'dropset' || val === 'drop' || val === 'd') return 'drop';
  if (val === 'failure' || val === 'f') return 'failure';
  return 'normal';
}

function parseNullableNumber(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export interface HevyImportResult {
  workouts: WorkoutSession[];
  newExercises: Exercise[];
  totalSets: number;
  skippedRows: number;
}

export function parseHevyCsv(
  csvText: string,
  existingExercises: Exercise[]
): HevyImportResult {
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) {
    throw new Error('CSV file must include a header row and at least one logged set.');
  }

  const headers = rows[0].map((h) => h.toLowerCase().replace(/\s+/g, '_'));
  const colIdx = (names: string[]): number => {
    for (const name of names) {
      const idx = headers.indexOf(name);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const iTitle = colIdx(['title', 'workout_title', 'workout_name']);
  const iStart = colIdx(['start_time', 'date', 'started_at']);
  const iEnd = colIdx(['end_time', 'finished_at']);
  const iDesc = colIdx(['description', 'workout_notes']);
  const iExTitle = colIdx(['exercise_title', 'exercise_name', 'exercise']);
  const iExNotes = colIdx(['exercise_notes', 'notes']);
  const iSetType = colIdx(['set_type']);
  const iWeightKg = colIdx(['weight_kg']);
  const iWeightLbs = colIdx(['weight_lbs', 'weight']);
  const iReps = colIdx(['reps']);
  const iDistKm = colIdx(['distance_km']);
  const iDistMi = colIdx(['distance_miles', 'distance_mi']);
  const iDurSec = colIdx(['duration_seconds', 'duration']);

  if (iExTitle === -1) {
    throw new Error('Missing required "exercise_title" column. Please upload a valid Hevy CSV export.');
  }

  const exByName = new Map<string, Exercise>(
    existingExercises.map((e) => [e.name.toLowerCase().trim(), e])
  );
  const newExercises: Exercise[] = [];

  const getOrCreateExercise = (name: string): Exercise => {
    const key = name.toLowerCase().trim();
    const found = exByName.get(key);
    if (found) return found;

    const created: Exercise = {
      id: `ex-imported-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim(),
      primaryMuscle: 'Full Body',
      secondaryMuscles: [],
      equipment: 'Other',
      trackingType: 'weight_reps',
      isCustom: true,
      notes: 'Imported from Hevy CSV',
    };
    exByName.set(key, created);
    newExercises.push(created);
    return created;
  };

  interface GroupedWorkout {
    title: string;
    notes: string;
    startedAt: number;
    finishedAt: number;
    exercisesOrder: string[];
    exercisesMap: Map<string, { exerciseId: string; notes: string; sets: WorkoutSet[] }>;
  }

  const grouped = new Map<string, GroupedWorkout>();
  let totalSets = 0;
  let skippedRows = 0;

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const exName = row[iExTitle]?.trim();
    if (!exName) {
      skippedRows += 1;
      continue;
    }

    const title = (iTitle !== -1 ? row[iTitle] : '') || 'Imported Workout';
    const startRaw = iStart !== -1 ? row[iStart] : '';
    const endRaw = iEnd !== -1 ? row[iEnd] : '';
    const startedAt = parseHevyTimestamp(startRaw);
    const finishedAt = endRaw ? parseHevyTimestamp(endRaw) : startedAt + 45 * 60 * 1000;
    const workoutKey = `${title}__${startRaw || startedAt}`;

    let group = grouped.get(workoutKey);
    if (!group) {
      group = {
        title,
        notes: iDesc !== -1 ? row[iDesc] ?? '' : '',
        startedAt,
        finishedAt: Math.max(finishedAt, startedAt + 60_000),
        exercisesOrder: [],
        exercisesMap: new Map(),
      };
      grouped.set(workoutKey, group);
    }

    const exDef = getOrCreateExercise(exName);
    if (!group.exercisesMap.has(exDef.id)) {
      group.exercisesOrder.push(exDef.id);
      group.exercisesMap.set(exDef.id, {
        exerciseId: exDef.id,
        notes: iExNotes !== -1 ? row[iExNotes] ?? '' : '',
        sets: [],
      });
    }

    const weightKgRaw = iWeightKg !== -1 ? parseNullableNumber(row[iWeightKg]) : null;
    const weightLbsRaw = iWeightLbs !== -1 ? parseNullableNumber(row[iWeightLbs]) : null;
    const weightKg =
      weightKgRaw !== null
        ? weightKgRaw
        : weightLbsRaw !== null
        ? Number(lbsToKg(weightLbsRaw).toFixed(4))
        : null;

    const reps = iReps !== -1 ? parseNullableNumber(row[iReps]) : null;
    const distKmRaw = iDistKm !== -1 ? parseNullableNumber(row[iDistKm]) : null;
    const distMiRaw = iDistMi !== -1 ? parseNullableNumber(row[iDistMi]) : null;
    const distanceKm =
      distKmRaw !== null
        ? distKmRaw
        : distMiRaw !== null
        ? Number(miToKm(distMiRaw).toFixed(4))
        : null;
    const durationSec = iDurSec !== -1 ? parseNullableNumber(row[iDurSec]) : null;

    const setEntry: WorkoutSet = {
      id: `set-imp-${r}-${Math.random().toString(36).slice(2, 6)}`,
      setType: normalizeSetType(iSetType !== -1 ? row[iSetType] : 'normal'),
      weightKg,
      reps,
      durationSec,
      distanceKm,
      completed: true,
    };

    group.exercisesMap.get(exDef.id)!.sets.push(setEntry);
    totalSets += 1;
  }

  const workouts: WorkoutSession[] = Array.from(grouped.values()).map((g, idx) => {
    const exercises: WorkoutExercise[] = g.exercisesOrder.map((exId, orderIdx) => {
      const entry = g.exercisesMap.get(exId)!;
      return {
        id: `wex-imp-${idx}-${orderIdx}-${Math.random().toString(36).slice(2, 6)}`,
        exerciseId: exId,
        sortOrder: orderIdx,
        notes: entry.notes,
        restSeconds: 90,
        sets: entry.sets,
      };
    });

    return {
      id: `wk-imp-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      routineId: null,
      title: g.title,
      notes: g.notes,
      startedAt: g.startedAt,
      finishedAt: g.finishedAt,
      durationSeconds: Math.max(60, Math.round((g.finishedAt - g.startedAt) / 1000)),
      exercises,
    };
  });

  return { workouts, newExercises, totalSets, skippedRows };
}

function escapeCsvCell(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportWorkoutsToCsv(
  workouts: WorkoutSession[],
  exercises: Exercise[]
): string {
  const exNameMap = new Map(exercises.map((e) => [e.id, e.name]));
  const headers = [
    'title',
    'start_time',
    'end_time',
    'description',
    'exercise_title',
    'exercise_notes',
    'set_index',
    'set_type',
    'weight_kg',
    'reps',
    'distance_km',
    'duration_seconds',
  ];

  const lines: string[] = [headers.join(',')];
  const finished = [...workouts]
    .filter((w) => w.finishedAt !== null)
    .sort((a, b) => b.startedAt - a.startedAt);

  for (const w of finished) {
    const startStr = new Date(w.startedAt).toISOString();
    const endStr = new Date(w.finishedAt ?? w.startedAt + w.durationSeconds * 1000).toISOString();
    for (const ex of w.exercises) {
      const exName = exNameMap.get(ex.exerciseId) ?? 'Unknown Exercise';
      ex.sets.forEach((s, idx) => {
        if (!s.completed) return;
        const row = [
          w.title,
          startStr,
          endStr,
          w.notes,
          exName,
          ex.notes,
          idx,
          s.setType === 'drop' ? 'dropset' : s.setType,
          s.weightKg !== null ? Number(s.weightKg.toFixed(2)) : '',
          s.reps ?? '',
          s.distanceKm !== null ? Number(s.distanceKm.toFixed(3)) : '',
          s.durationSec ?? '',
        ];
        lines.push(row.map(escapeCsvCell).join(','));
      });
    }
  }

  return lines.join('\n');
}

export function validateBackupJson(rawText: string): AppDatabase {
  const parsed = JSON.parse(rawText);
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !Array.isArray(parsed.exercises) ||
    !Array.isArray(parsed.routines) ||
    !Array.isArray(parsed.workouts) ||
    !parsed.settings
  ) {
    throw new Error('Invalid IronLog JSON backup format.');
  }
  return {
    version: typeof parsed.version === 'number' ? parsed.version : 1,
    exercises: parsed.exercises,
    folders: Array.isArray(parsed.folders) ? parsed.folders : [],
    routines: parsed.routines,
    workouts: parsed.workouts,
    activeWorkout: parsed.activeWorkout ?? null,
    measurements: Array.isArray(parsed.measurements) ? parsed.measurements : [],
    settings: {
      weightUnit: parsed.settings.weightUnit === 'lbs' ? 'lbs' : 'kg',
      distanceUnit: parsed.settings.distanceUnit === 'mi' ? 'mi' : 'km',
      measurementUnit: parsed.settings.measurementUnit === 'in' ? 'in' : 'cm',
      defaultRestSeconds:
        typeof parsed.settings.defaultRestSeconds === 'number'
          ? parsed.settings.defaultRestSeconds
          : 90,
      theme: parsed.settings.theme === 'light' ? 'light' : 'dark',
      restSoundEnabled: parsed.settings.restSoundEnabled !== false,
    },
  };
}

export const SAMPLE_HEVY_CSV = `title,start_time,end_time,description,exercise_title,superset_id,exercise_notes,set_index,set_type,weight_lbs,reps,distance_miles,duration_seconds,rpe
"Upper Body Hypertrophy","12 Nov 2026, 18:15","12 Nov 2026, 19:10","Felt strong today","Bench Press (Barbell)",,"Paused reps on last set",0,warmup,135,10,,,
"Upper Body Hypertrophy","12 Nov 2026, 18:15","12 Nov 2026, 19:10","Felt strong today","Bench Press (Barbell)",,"Paused reps on last set",1,normal,195,8,,,8
"Upper Body Hypertrophy","12 Nov 2026, 18:15","12 Nov 2026, 19:10","Felt strong today","Bench Press (Barbell)",,"Paused reps on last set",2,normal,195,8,,,8.5
"Upper Body Hypertrophy","12 Nov 2026, 18:15","12 Nov 2026, 19:10","Felt strong today","Cable Lat Pullover",,Slow eccentric,0,normal,65,12,,,8
"Upper Body Hypertrophy","12 Nov 2026, 18:15","12 Nov 2026, 19:10","Felt strong today","Cable Lat Pullover",,Slow eccentric,1,failure,65,14,,,10`;
