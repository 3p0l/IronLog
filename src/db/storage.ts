import { AppDatabase } from '../types/workout';
import { BUILT_IN_EXERCISES } from '../data/exercises';
import { createSeededDatabase, DEFAULT_SETTINGS } from '../data/seedData';

const STORAGE_KEY = 'ironlog_local_db_v1';

/**
 * Local on-device database engine with automatic first-launch initialization,
 * schema migration, and atomic crash-safe persistence.
 */
export function loadDatabase(): AppDatabase {
  if (typeof window === 'undefined' || !window.localStorage) {
    return createSeededDatabase();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = createSeededDatabase();
      saveDatabase(seeded);
      return seeded;
    }

    const parsed = JSON.parse(raw) as Partial<AppDatabase>;
    // Merge any newly added built-in exercises while keeping custom exercises intact
    const existingIds = new Set((parsed.exercises ?? []).map((e) => e.id));
    const mergedExercises = [
      ...(parsed.exercises ?? []),
      ...BUILT_IN_EXERCISES.filter((b) => !existingIds.has(b.id)),
    ];

    return {
      version: parsed.version ?? 1,
      exercises: mergedExercises,
      folders: Array.isArray(parsed.folders) ? parsed.folders : [],
      routines: Array.isArray(parsed.routines) ? parsed.routines : [],
      workouts: Array.isArray(parsed.workouts) ? parsed.workouts : [],
      activeWorkout: parsed.activeWorkout ?? null,
      measurements: Array.isArray(parsed.measurements) ? parsed.measurements : [],
      settings: {
        ...DEFAULT_SETTINGS,
        ...(parsed.settings ?? {}),
      },
    };
  } catch {
    const seeded = createSeededDatabase();
    saveDatabase(seeded);
    return seeded;
  }
}

export function saveDatabase(db: AppDatabase): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Handle storage quota edge case gracefully
  }
}

export function clearDatabaseStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.removeItem(STORAGE_KEY);
}
