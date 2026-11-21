export type MuscleGroup =
  | 'Chest'
  | 'Upper Back'
  | 'Lats'
  | 'Lower Back'
  | 'Shoulders'
  | 'Biceps'
  | 'Triceps'
  | 'Forearms'
  | 'Quads'
  | 'Hamstrings'
  | 'Glutes'
  | 'Calves'
  | 'Abdominals'
  | 'Full Body'
  | 'Cardio';

export const ALL_MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest',
  'Upper Back',
  'Lats',
  'Lower Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Forearms',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Abdominals',
  'Full Body',
  'Cardio',
];

export type EquipmentType =
  | 'Barbell'
  | 'Dumbbell'
  | 'Machine'
  | 'Cable'
  | 'Bodyweight'
  | 'Kettlebell'
  | 'Band'
  | 'Other';

export const ALL_EQUIPMENT_TYPES: EquipmentType[] = [
  'Barbell',
  'Dumbbell',
  'Machine',
  'Cable',
  'Bodyweight',
  'Kettlebell',
  'Band',
  'Other',
];

export type TrackingType =
  | 'weight_reps'
  | 'bodyweight'
  | 'assisted_bodyweight'
  | 'duration'
  | 'distance';

export const TRACKING_TYPE_LABELS: Record<TrackingType, string> = {
  weight_reps: 'Weight & Reps',
  bodyweight: 'Bodyweight Reps',
  assisted_bodyweight: 'Assisted Bodyweight',
  duration: 'Duration',
  distance: 'Distance & Time',
};

export type SetType = 'normal' | 'warmup' | 'drop' | 'failure';

export interface Exercise {
  id: string;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: EquipmentType;
  trackingType: TrackingType;
  isCustom: boolean;
  notes?: string;
}

export interface RoutineFolder {
  id: string;
  name: string;
  sortOrder: number;
  isCollapsed: boolean;
}

export interface RoutineSetTemplate {
  id: string;
  setType: SetType;
  weightKg: number | null;
  weightUnit?: WeightUnit;
  reps: number | null;
  durationSec: number | null;
  distanceKm: number | null;
}

export interface RoutineExercise {
  id: string;
  exerciseId: string;
  sortOrder: number;
  notes: string;
  restSeconds: number;
  weightUnit?: WeightUnit;
  sets: RoutineSetTemplate[];
}

export interface Routine {
  id: string;
  folderId: string | null;
  name: string;
  notes: string;
  sortOrder: number;
  updatedAt: number;
  exercises: RoutineExercise[];
}

export interface WorkoutSet {
  id: string;
  setType: SetType;
  weightKg: number | null;
  weightUnit?: WeightUnit;
  reps: number | null;
  durationSec: number | null;
  distanceKm: number | null;
  completed: boolean;
  isWeightPR?: boolean;
  is1RMPR?: boolean;
  isVolumePR?: boolean;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  sortOrder: number;
  notes: string;
  restSeconds: number;
  weightUnit?: WeightUnit;
  sets: WorkoutSet[];
}

export interface WorkoutSession {
  id: string;
  routineId: string | null;
  title: string;
  notes: string;
  startedAt: number;
  finishedAt: number | null;
  durationSeconds: number;
  exercises: WorkoutExercise[];
}

export type MeasurementKey =
  | 'bodyWeightKg'
  | 'bodyFatPct'
  | 'neckCm'
  | 'shouldersCm'
  | 'chestCm'
  | 'leftBicepCm'
  | 'rightBicepCm'
  | 'leftForearmCm'
  | 'rightForearmCm'
  | 'waistCm'
  | 'hipsCm'
  | 'leftThighCm'
  | 'rightThighCm'
  | 'leftCalfCm'
  | 'rightCalfCm';

export interface MeasurementMeta {
  key: MeasurementKey;
  label: string;
  kind: 'weight' | 'percent' | 'length';
  group: 'Core' | 'Upper Body' | 'Lower Body';
}

export const MEASUREMENT_FIELDS: MeasurementMeta[] = [
  { key: 'bodyWeightKg', label: 'Body Weight', kind: 'weight', group: 'Core' },
  { key: 'bodyFatPct', label: 'Body Fat', kind: 'percent', group: 'Core' },
  { key: 'neckCm', label: 'Neck', kind: 'length', group: 'Upper Body' },
  { key: 'shouldersCm', label: 'Shoulders', kind: 'length', group: 'Upper Body' },
  { key: 'chestCm', label: 'Chest', kind: 'length', group: 'Upper Body' },
  { key: 'leftBicepCm', label: 'Left Bicep', kind: 'length', group: 'Upper Body' },
  { key: 'rightBicepCm', label: 'Right Bicep', kind: 'length', group: 'Upper Body' },
  { key: 'leftForearmCm', label: 'Left Forearm', kind: 'length', group: 'Upper Body' },
  { key: 'rightForearmCm', label: 'Right Forearm', kind: 'length', group: 'Upper Body' },
  { key: 'waistCm', label: 'Waist', kind: 'length', group: 'Core' },
  { key: 'hipsCm', label: 'Hips', kind: 'length', group: 'Lower Body' },
  { key: 'leftThighCm', label: 'Left Thigh', kind: 'length', group: 'Lower Body' },
  { key: 'rightThighCm', label: 'Right Thigh', kind: 'length', group: 'Lower Body' },
  { key: 'leftCalfCm', label: 'Left Calf', kind: 'length', group: 'Lower Body' },
  { key: 'rightCalfCm', label: 'Right Calf', kind: 'length', group: 'Lower Body' },
];

export interface BodyMeasurementEntry {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  values: Partial<Record<MeasurementKey, number>>;
  notes?: string;
}

export type WeightUnit = 'kg' | 'lbs';
export type DistanceUnit = 'km' | 'mi';
export type MeasurementUnit = 'cm' | 'in';
export type ThemeMode = 'dark' | 'light';
export type TimeframeFilter = '1M' | '3M' | '6M' | '1Y' | 'ALL';
export type MuscleTimeframeFilter = '7D' | '30D' | '90D' | 'ALL';
export type AppTab = 'workout' | 'history' | 'exercises' | 'analytics' | 'settings';

export interface UserSettings {
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
  measurementUnit: MeasurementUnit;
  defaultRestSeconds: number;
  theme: ThemeMode;
  restSoundEnabled: boolean;
}

export interface AppDatabase {
  version: number;
  exercises: Exercise[];
  folders: RoutineFolder[];
  routines: Routine[];
  workouts: WorkoutSession[];
  activeWorkout: WorkoutSession | null;
  measurements: BodyMeasurementEntry[];
  settings: UserSettings;
}

export interface PRRecord {
  exerciseId: string;
  exerciseName: string;
  type: 'weight' | '1rm' | 'volume';
  value: number;
  previousBest: number | null;
  weightKg: number | null;
  reps: number | null;
}

export interface ActiveRestTimer {
  exerciseId: string;
  totalSeconds: number;
  endsAt: number;
}
