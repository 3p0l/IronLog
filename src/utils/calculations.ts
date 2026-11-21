import {
  BodyMeasurementEntry,
  DistanceUnit,
  Exercise,
  MeasurementKey,
  MeasurementUnit,
  MuscleGroup,
  MuscleTimeframeFilter,
  PRRecord,
  Routine,
  TimeframeFilter,
  WeightUnit,
  WorkoutSession,
  WorkoutSet,
} from '../types/workout';

const LBS_PER_KG = 2.2046226218;
const IN_PER_CM = 0.3937007874;
const MI_PER_KM = 0.6213711922;

export function kgToLbs(kg: number): number {
  return kg * LBS_PER_KG;
}

export function lbsToKg(lbs: number): number {
  return lbs / LBS_PER_KG;
}

export function cmToIn(cm: number): number {
  return cm * IN_PER_CM;
}

export function inToCm(inches: number): number {
  return inches / IN_PER_CM;
}

export function kmToMi(km: number): number {
  return km * MI_PER_KM;
}

export function miToKm(miles: number): number {
  return miles / MI_PER_KM;
}

export function roundDisplay(val: number, decimals = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

export function convertWeightFromKg(weightKg: number | null, unit: WeightUnit): number | null {
  if (weightKg === null || Number.isNaN(weightKg)) return null;
  const converted = unit === 'lbs' ? kgToLbs(weightKg) : weightKg;
  return roundDisplay(converted, 1);
}

export function convertWeightToKg(displayWeight: number | null, unit: WeightUnit): number | null {
  if (displayWeight === null || Number.isNaN(displayWeight)) return null;
  if (displayWeight < 0) return 0;
  return unit === 'lbs' ? Number(lbsToKg(displayWeight).toFixed(4)) : Number(displayWeight.toFixed(4));
}

export function resolveSetWeightUnit(
  setUnit: WeightUnit | undefined,
  exerciseUnit: WeightUnit | undefined,
  globalUnit: WeightUnit
): WeightUnit {
  return setUnit ?? exerciseUnit ?? globalUnit;
}

export function formatWeight(weightKg: number | null, unit: WeightUnit, includeUnit = true): string {
  const val = convertWeightFromKg(weightKg, unit);
  if (val === null) return '—';
  const formatted = Number.isInteger(val) ? String(val) : val.toFixed(1);
  return includeUnit ? `${formatted} ${unit}` : formatted;
}

export function formatVolume(volumeKg: number, unit: WeightUnit): string {
  const converted = unit === 'lbs' ? kgToLbs(volumeKg) : volumeKg;
  const rounded = Math.round(converted);
  return `${rounded.toLocaleString()} ${unit}`;
}

export function convertDistanceFromKm(distanceKm: number | null, unit: DistanceUnit): number | null {
  if (distanceKm === null || Number.isNaN(distanceKm)) return null;
  const converted = unit === 'mi' ? kmToMi(distanceKm) : distanceKm;
  return roundDisplay(converted, 2);
}

export function convertDistanceToKm(displayVal: number | null, unit: DistanceUnit): number | null {
  if (displayVal === null || Number.isNaN(displayVal)) return null;
  if (displayVal < 0) return 0;
  return unit === 'mi' ? Number(miToKm(displayVal).toFixed(4)) : Number(displayVal.toFixed(4));
}

export function convertMeasurementFromBase(
  value: number,
  kind: 'weight' | 'percent' | 'length',
  weightUnit: WeightUnit,
  measurementUnit: MeasurementUnit
): number {
  if (kind === 'weight') return roundDisplay(weightUnit === 'lbs' ? kgToLbs(value) : value, 1);
  if (kind === 'length') return roundDisplay(measurementUnit === 'in' ? cmToIn(value) : value, 1);
  return roundDisplay(value, 1);
}

export function convertMeasurementToBase(
  displayValue: number,
  kind: 'weight' | 'percent' | 'length',
  weightUnit: WeightUnit,
  measurementUnit: MeasurementUnit
): number {
  if (kind === 'weight') {
    return weightUnit === 'lbs' ? Number(lbsToKg(displayValue).toFixed(4)) : Number(displayValue.toFixed(4));
  }
  if (kind === 'length') {
    return measurementUnit === 'in' ? Number(inToCm(displayValue).toFixed(4)) : Number(displayValue.toFixed(4));
  }
  return Number(displayValue.toFixed(2));
}

export function getMeasurementUnitLabel(
  kind: 'weight' | 'percent' | 'length',
  weightUnit: WeightUnit,
  measurementUnit: MeasurementUnit
): string {
  if (kind === 'weight') return weightUnit;
  if (kind === 'length') return measurementUnit;
  return '%';
}

export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  if (mins > 0) {
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  }
  return `${secs}s`;
}

export function formatTimerClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Epley Formula: weight * (1 + reps / 30)
 */
export function calculateEstimated1RM(weightKg: number | null, reps: number | null): number {
  if (weightKg === null || reps === null || weightKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

export function calculateSetVolume(weightKg: number | null, reps: number | null): number {
  if (weightKg === null || reps === null || weightKg <= 0 || reps <= 0) return 0;
  return weightKg * reps;
}

export function calculateWorkoutVolumeKg(workout: WorkoutSession): number {
  let total = 0;
  for (const ex of workout.exercises) {
    for (const set of ex.sets) {
      if (!set.completed) continue;
      total += calculateSetVolume(set.weightKg, set.reps);
    }
  }
  return total;
}

export function calculateWorkoutCompletedSets(workout: WorkoutSession): number {
  let count = 0;
  for (const ex of workout.exercises) {
    for (const set of ex.sets) {
      if (set.completed) count += 1;
    }
  }
  return count;
}

export function getPreviousExerciseSets(
  exerciseId: string,
  completedWorkouts: WorkoutSession[],
  beforeTimestamp?: number
): WorkoutSet[] {
  const sorted = [...completedWorkouts]
    .filter((w) => w.finishedAt !== null && (beforeTimestamp === undefined || w.startedAt < beforeTimestamp))
    .sort((a, b) => b.startedAt - a.startedAt);

  for (const workout of sorted) {
    const match = workout.exercises.find((e) => e.exerciseId === exerciseId);
    if (match) {
      const completed = match.sets.filter((s) => s.completed);
      if (completed.length > 0) return completed;
    }
  }
  return [];
}

/**
 * Detect Personal Records (Heaviest Weight, Best Est. 1RM, Best Set Volume)
 * for a newly finished workout against all historical completed workouts.
 */
export function detectWorkoutPRs(
  session: WorkoutSession,
  historyWorkouts: WorkoutSession[],
  exercises: Exercise[]
): { annotatedSession: WorkoutSession; prs: PRRecord[] } {
  const exerciseNameMap = new Map(exercises.map((e) => [e.id, e.name]));

  // Build historical bests per exercise strictly before this workout
  const histBests = new Map<
    string,
    { maxWeight: number; max1RM: number; maxSetVolume: number; hasHistory: boolean }
  >();

  for (const w of historyWorkouts) {
    if (w.id === session.id || w.finishedAt === null) continue;
    for (const ex of w.exercises) {
      const current = histBests.get(ex.exerciseId) ?? {
        maxWeight: 0,
        max1RM: 0,
        maxSetVolume: 0,
        hasHistory: false,
      };
      for (const s of ex.sets) {
        if (!s.completed) continue;
        const wt = s.weightKg ?? 0;
        const reps = s.reps ?? 0;
        if (wt > 0 && reps > 0) {
          current.hasHistory = true;
          if (wt > current.maxWeight) current.maxWeight = wt;
          const e1rm = calculateEstimated1RM(wt, reps);
          if (e1rm > current.max1RM) current.max1RM = e1rm;
          const vol = calculateSetVolume(wt, reps);
          if (vol > current.maxSetVolume) current.maxSetVolume = vol;
        }
      }
      histBests.set(ex.exerciseId, current);
    }
  }

  const prs: PRRecord[] = [];
  const annotatedExercises = session.exercises.map((ex) => {
    const hist = histBests.get(ex.exerciseId) ?? {
      maxWeight: 0,
      max1RM: 0,
      maxSetVolume: 0,
      hasHistory: false,
    };

    // Track bests within this session to award each PR badge to the single peak set
    let bestWeightIdx = -1;
    let bestWeightVal = hist.maxWeight;
    let best1RMIdx = -1;
    let best1RMVal = hist.max1RM;
    let bestVolIdx = -1;
    let bestVolVal = hist.maxSetVolume;

    ex.sets.forEach((s, idx) => {
      if (!s.completed) return;
      const wt = s.weightKg ?? 0;
      const reps = s.reps ?? 0;
      if (wt <= 0 || reps <= 0) return;

      if (wt > bestWeightVal) {
        bestWeightVal = wt;
        bestWeightIdx = idx;
      }
      const e1rm = calculateEstimated1RM(wt, reps);
      if (e1rm > best1RMVal) {
        best1RMVal = e1rm;
        best1RMIdx = idx;
      }
      const vol = calculateSetVolume(wt, reps);
      if (vol > bestVolVal) {
        bestVolVal = vol;
        bestVolIdx = idx;
      }
    });

    const exName = exerciseNameMap.get(ex.exerciseId) ?? 'Exercise';
    if (bestWeightIdx >= 0) {
      const s = ex.sets[bestWeightIdx];
      prs.push({
        exerciseId: ex.exerciseId,
        exerciseName: exName,
        type: 'weight',
        value: bestWeightVal,
        previousBest: hist.hasHistory ? hist.maxWeight : null,
        weightKg: s.weightKg,
        reps: s.reps,
      });
    }
    if (best1RMIdx >= 0) {
      const s = ex.sets[best1RMIdx];
      prs.push({
        exerciseId: ex.exerciseId,
        exerciseName: exName,
        type: '1rm',
        value: best1RMVal,
        previousBest: hist.hasHistory ? hist.max1RM : null,
        weightKg: s.weightKg,
        reps: s.reps,
      });
    }
    if (bestVolIdx >= 0) {
      const s = ex.sets[bestVolIdx];
      prs.push({
        exerciseId: ex.exerciseId,
        exerciseName: exName,
        type: 'volume',
        value: bestVolVal,
        previousBest: hist.hasHistory ? hist.maxSetVolume : null,
        weightKg: s.weightKg,
        reps: s.reps,
      });
    }

    const updatedSets = ex.sets.map((s, idx) => ({
      ...s,
      isWeightPR: idx === bestWeightIdx,
      is1RMPR: idx === best1RMIdx,
      isVolumePR: idx === bestVolIdx,
    }));

    return { ...ex, sets: updatedSets };
  });

  return {
    annotatedSession: { ...session, exercises: annotatedExercises },
    prs,
  };
}

export function getTimeframeCutoffMs(timeframe: TimeframeFilter, now = Date.now()): number {
  const dayMs = 86_400_000;
  switch (timeframe) {
    case '1M':
      return now - 30 * dayMs;
    case '3M':
      return now - 90 * dayMs;
    case '6M':
      return now - 180 * dayMs;
    case '1Y':
      return now - 365 * dayMs;
    case 'ALL':
    default:
      return 0;
  }
}

export function getMuscleTimeframeCutoffMs(timeframe: MuscleTimeframeFilter, now = Date.now()): number {
  const dayMs = 86_400_000;
  switch (timeframe) {
    case '7D':
      return now - 7 * dayMs;
    case '30D':
      return now - 30 * dayMs;
    case '90D':
      return now - 90 * dayMs;
    case 'ALL':
    default:
      return 0;
  }
}

export interface ExerciseSessionPoint {
  workoutId: string;
  workoutTitle: string;
  timestamp: number;
  dateLabel: string;
  estimated1RMKg: number;
  heaviestWeightKg: number;
  bestSetVolumeKg: number;
  totalVolumeKg: number;
  bestReps: number;
  completedSets: WorkoutSet[];
}

export function getExerciseProgressSeries(
  exerciseId: string,
  workouts: WorkoutSession[],
  timeframe: TimeframeFilter = 'ALL',
  now = Date.now()
): ExerciseSessionPoint[] {
  const cutoff = getTimeframeCutoffMs(timeframe, now);
  const points: ExerciseSessionPoint[] = [];

  const sorted = [...workouts]
    .filter((w) => w.finishedAt !== null && w.startedAt >= cutoff)
    .sort((a, b) => a.startedAt - b.startedAt);

  for (const w of sorted) {
    const ex = w.exercises.find((e) => e.exerciseId === exerciseId);
    if (!ex) continue;
    const completedSets = ex.sets.filter((s) => s.completed);
    if (completedSets.length === 0) continue;

    let estimated1RMKg = 0;
    let heaviestWeightKg = 0;
    let bestSetVolumeKg = 0;
    let totalVolumeKg = 0;
    let bestReps = 0;

    for (const s of completedSets) {
      const wt = s.weightKg ?? 0;
      const reps = s.reps ?? 0;
      if (reps > bestReps) bestReps = reps;
      if (wt > heaviestWeightKg) heaviestWeightKg = wt;
      const e1rm = calculateEstimated1RM(wt, reps);
      if (e1rm > estimated1RMKg) estimated1RMKg = e1rm;
      const setVol = calculateSetVolume(wt, reps);
      if (setVol > bestSetVolumeKg) bestSetVolumeKg = setVol;
      totalVolumeKg += setVol;
    }

    const d = new Date(w.startedAt);
    const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    points.push({
      workoutId: w.id,
      workoutTitle: w.title,
      timestamp: w.startedAt,
      dateLabel,
      estimated1RMKg,
      heaviestWeightKg,
      bestSetVolumeKg,
      totalVolumeKg,
      bestReps,
      completedSets,
    });
  }

  return points;
}

export interface MuscleDistributionItem {
  muscle: MuscleGroup;
  workingSets: number;
  percentage: number;
}

export function getMuscleGroupDistribution(
  workouts: WorkoutSession[],
  exercises: Exercise[],
  timeframe: MuscleTimeframeFilter = '30D',
  now = Date.now()
): MuscleDistributionItem[] {
  const cutoff = getMuscleTimeframeCutoffMs(timeframe, now);
  const exMap = new Map(exercises.map((e) => [e.id, e]));
  const counts = new Map<MuscleGroup, number>();
  let totalWorkingSets = 0;

  for (const w of workouts) {
    if (w.finishedAt === null || w.startedAt < cutoff) continue;
    for (const wEx of w.exercises) {
      const exDef = exMap.get(wEx.exerciseId);
      if (!exDef) continue;
      // Working sets exclude warmups
      const workingCount = wEx.sets.filter((s) => s.completed && s.setType !== 'warmup').length;
      if (workingCount === 0) continue;
      counts.set(exDef.primaryMuscle, (counts.get(exDef.primaryMuscle) ?? 0) + workingCount);
      totalWorkingSets += workingCount;
    }
  }

  return Array.from(counts.entries())
    .map(([muscle, workingSets]) => ({
      muscle,
      workingSets,
      percentage: totalWorkingSets > 0 ? Math.round((workingSets / totalWorkingSets) * 100) : 0,
    }))
    .sort((a, b) => b.workingSets - a.workingSets);
}

export function toLocalDateKey(timestamp: number): string {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getWeekStartKey(timestamp: number): string {
  const d = new Date(timestamp);
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  const monday = new Date(d.getFullYear(), d.getMonth(), diff);
  return toLocalDateKey(monday.getTime());
}

export interface GlobalTrainingStats {
  totalWorkouts: number;
  totalDurationSeconds: number;
  totalVolumeKg: number;
  totalSets: number;
  currentWeekStreak: number;
  workoutsThisWeek: number;
  workoutsThisMonth: number;
  weeklySeries: { weekLabel: string; workouts: number; volumeKg: number; durationMin: number }[];
}

export function getGlobalTrainingStats(
  workouts: WorkoutSession[],
  timeframe: TimeframeFilter = '3M',
  now = Date.now()
): GlobalTrainingStats {
  const finished = workouts.filter((w) => w.finishedAt !== null);
  const cutoff = getTimeframeCutoffMs(timeframe, now);
  const inRange = finished.filter((w) => w.startedAt >= cutoff);

  let totalDurationSeconds = 0;
  let totalVolumeKg = 0;
  let totalSets = 0;

  for (const w of inRange) {
    totalDurationSeconds += w.durationSeconds;
    totalVolumeKg += calculateWorkoutVolumeKg(w);
    totalSets += calculateWorkoutCompletedSets(w);
  }

  // Weekly streak (consecutive weeks with at least 1 workout)
  const weeksWithWorkouts = new Set(finished.map((w) => getWeekStartKey(w.startedAt)));
  let currentWeekStreak = 0;
  const cursor = new Date(now);
  // Check current week first; if 0 workouts yet this week, check starting from last week
  let checkKey = getWeekStartKey(cursor.getTime());
  if (!weeksWithWorkouts.has(checkKey)) {
    cursor.setDate(cursor.getDate() - 7);
    checkKey = getWeekStartKey(cursor.getTime());
  }
  while (weeksWithWorkouts.has(checkKey)) {
    currentWeekStreak += 1;
    cursor.setDate(cursor.getDate() - 7);
    checkKey = getWeekStartKey(cursor.getTime());
  }

  const currentWeekKey = getWeekStartKey(now);
  const nowDate = new Date(now);
  const workoutsThisWeek = finished.filter((w) => getWeekStartKey(w.startedAt) === currentWeekKey).length;
  const workoutsThisMonth = finished.filter((w) => {
    const d = new Date(w.startedAt);
    return d.getFullYear() === nowDate.getFullYear() && d.getMonth() === nowDate.getMonth();
  }).length;

  // Build weekly series (last 8-12 weeks depending on timeframe)
  const weekCount = timeframe === '1M' ? 5 : timeframe === '3M' ? 12 : timeframe === '6M' ? 24 : 12;
  const weeklyMap = new Map<string, { workouts: number; volumeKg: number; durationMin: number }>();

  for (const w of finished) {
    const wk = getWeekStartKey(w.startedAt);
    const existing = weeklyMap.get(wk) ?? { workouts: 0, volumeKg: 0, durationMin: 0 };
    existing.workouts += 1;
    existing.volumeKg += calculateWorkoutVolumeKg(w);
    existing.durationMin += Math.round(w.durationSeconds / 60);
    weeklyMap.set(wk, existing);
  }

  const weeklySeries: { weekLabel: string; workouts: number; volumeKg: number; durationMin: number }[] = [];
  for (let i = weekCount - 1; i >= 0; i--) {
    const d = new Date(now - i * 7 * 86_400_000);
    const key = getWeekStartKey(d.getTime());
    const [y, m, day] = key.split('-').map(Number);
    const labelDate = new Date(y, m - 1, day);
    const weekLabel = labelDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const stats = weeklyMap.get(key) ?? { workouts: 0, volumeKg: 0, durationMin: 0 };
    weeklySeries.push({ weekLabel, ...stats });
  }

  return {
    totalWorkouts: inRange.length,
    totalDurationSeconds,
    totalVolumeKg,
    totalSets,
    currentWeekStreak,
    workoutsThisWeek,
    workoutsThisMonth,
    weeklySeries,
  };
}

export function getMeasurementSeries(
  entries: BodyMeasurementEntry[],
  key: MeasurementKey,
  timeframe: TimeframeFilter = 'ALL',
  now = Date.now()
): { id: string; date: string; dateLabel: string; timestamp: number; value: number }[] {
  const cutoff = getTimeframeCutoffMs(timeframe, now);
  return [...entries]
    .filter((e) => e.timestamp >= cutoff && typeof e.values[key] === 'number')
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((e) => {
      const [y, m, d] = e.date.split('-').map(Number);
      const label = new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        id: e.id,
        date: e.date,
        dateLabel: label,
        timestamp: e.timestamp,
        value: e.values[key] as number,
      };
    });
}

export function checkRoutineDiff(session: WorkoutSession, routine: Routine | undefined): boolean {
  if (!routine) return false;
  if (session.exercises.length !== routine.exercises.length) return true;

  for (let i = 0; i < session.exercises.length; i++) {
    const sEx = session.exercises[i];
    const rEx = routine.exercises[i];
    if (sEx.exerciseId !== rEx.exerciseId) return true;
    if ((sEx.weightUnit ?? undefined) !== (rEx.weightUnit ?? undefined)) return true;
    if (sEx.sets.length !== rEx.sets.length) return true;
    for (let j = 0; j < sEx.sets.length; j++) {
      const ss = sEx.sets[j];
      const rs = rEx.sets[j];
      if (ss.setType !== rs.setType) return true;
      if ((ss.weightKg ?? null) !== (rs.weightKg ?? null)) return true;
      if ((ss.weightUnit ?? undefined) !== (rs.weightUnit ?? undefined)) return true;
      if ((ss.reps ?? null) !== (rs.reps ?? null)) return true;
    }
  }
  return false;
}
