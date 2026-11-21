import React, { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import {
  ALL_EQUIPMENT_TYPES,
  ALL_MUSCLE_GROUPS,
  EquipmentType,
  Exercise,
  MuscleGroup,
  TRACKING_TYPE_LABELS,
  TrackingType,
} from '../types/workout';
import { useWorkout } from '../context/WorkoutContext';

interface CustomExerciseModalProps {
  open: boolean;
  editingExercise?: Exercise | null;
  onClose: () => void;
  onSaved?: (exercise: Exercise) => void;
}

export function CustomExerciseModal({
  open,
  editingExercise,
  onClose,
  onSaved,
}: CustomExerciseModalProps) {
  const { saveExercise } = useWorkout();
  const [name, setName] = useState('');
  const [primaryMuscle, setPrimaryMuscle] = useState<MuscleGroup>('Chest');
  const [secondaryMuscles, setSecondaryMuscles] = useState<MuscleGroup[]>([]);
  const [equipment, setEquipment] = useState<EquipmentType>('Dumbbell');
  const [trackingType, setTrackingType] = useState<TrackingType>('weight_reps');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (editingExercise) {
      setName(editingExercise.name);
      setPrimaryMuscle(editingExercise.primaryMuscle);
      setSecondaryMuscles(editingExercise.secondaryMuscles);
      setEquipment(editingExercise.equipment);
      setTrackingType(editingExercise.trackingType);
      setNotes(editingExercise.notes ?? '');
    } else {
      setName('');
      setPrimaryMuscle('Chest');
      setSecondaryMuscles([]);
      setEquipment('Dumbbell');
      setTrackingType('weight_reps');
      setNotes('');
    }
    setError('');
  }, [open, editingExercise]);

  if (!open) return null;

  const toggleSecondary = (muscle: MuscleGroup) => {
    if (muscle === primaryMuscle) return;
    setSecondaryMuscles((prev) =>
      prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Enter an exercise name');
      return;
    }

    const saved = saveExercise({
      id: editingExercise?.id,
      name: trimmed,
      primaryMuscle,
      secondaryMuscles: secondaryMuscles.filter((m) => m !== primaryMuscle),
      equipment,
      trackingType,
      notes: notes.trim(),
    });
    onSaved?.(saved);
    onClose();
  };

  return (
    <div
      className="matte-scrim scrim-enter fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={editingExercise ? 'Edit custom exercise' : 'Create custom exercise'}
    >
      <form
        onSubmit={handleSubmit}
        className="matte-modal modal-enter flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-[var(--border-hairline)] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--ink-primary)]">
              {editingExercise ? 'Edit custom exercise' : 'Create custom exercise'}
            </h2>
            <p className="mt-1 text-xs text-[var(--ink-secondary)]">
              Movement group, equipment, and tracking mode
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close custom exercise form"
            className="calm-press btn-ghost flex h-8 w-8 items-center justify-center"
          >
            <X className="h-4 w-4 stroke-[1.5]" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <div>
            <label
              htmlFor="custom-ex-name"
              className="mb-2 block text-xs font-medium text-[var(--ink-secondary)]"
            >
              Exercise name
            </label>
            <input
              id="custom-ex-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Meadow's Row (Landmine)"
              className="matte-input h-10 w-full bg-[var(--recessed)] px-3 text-sm"
            />
            {error && (
              <p className="mt-2 text-xs font-medium text-[var(--accent-clay)]">{error}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="custom-ex-primary"
                className="mb-2 block text-xs font-medium text-[var(--ink-secondary)]"
              >
                Primary muscle group
              </label>
              <select
                id="custom-ex-primary"
                value={primaryMuscle}
                onChange={(e) => {
                  const next = e.target.value as MuscleGroup;
                  setPrimaryMuscle(next);
                  setSecondaryMuscles((prev) => prev.filter((m) => m !== next));
                }}
                className="matte-input h-10 w-full bg-[var(--recessed)] px-3 text-sm"
              >
                {ALL_MUSCLE_GROUPS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="custom-ex-equipment"
                className="mb-2 block text-xs font-medium text-[var(--ink-secondary)]"
              >
                Equipment
              </label>
              <select
                id="custom-ex-equipment"
                value={equipment}
                onChange={(e) => setEquipment(e.target.value as EquipmentType)}
                className="matte-input h-10 w-full bg-[var(--recessed)] px-3 text-sm"
              >
                {ALL_EQUIPMENT_TYPES.map((eq) => (
                  <option key={eq} value={eq}>
                    {eq}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="custom-ex-tracking"
              className="mb-2 block text-xs font-medium text-[var(--ink-secondary)]"
            >
              Tracking type
            </label>
            <select
              id="custom-ex-tracking"
              value={trackingType}
              onChange={(e) => setTrackingType(e.target.value as TrackingType)}
              className="matte-input h-10 w-full bg-[var(--recessed)] px-3 text-sm"
            >
              {(Object.keys(TRACKING_TYPE_LABELS) as TrackingType[]).map((key) => (
                <option key={key} value={key}>
                  {TRACKING_TYPE_LABELS[key]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="mb-2 block text-xs font-medium text-[var(--ink-secondary)]">
              Secondary muscles (optional)
            </span>
            <div className="flex flex-wrap gap-2">
              {ALL_MUSCLE_GROUPS.filter((m) => m !== primaryMuscle).map((muscle) => {
                const active = secondaryMuscles.includes(muscle);
                return (
                  <button
                    key={muscle}
                    type="button"
                    onClick={() => toggleSecondary(muscle)}
                    aria-pressed={active}
                    className={`calm-press inline-flex h-8 items-center gap-1 rounded-[6px] border px-3 text-xs font-medium whitespace-nowrap transition-colors ${
                      active
                        ? 'border-[var(--accent-steel-border)] bg-[var(--accent-steel-tint)] text-[var(--accent-steel)]'
                        : 'border-[var(--border-hairline)] bg-[var(--recessed)] text-[var(--ink-secondary)] hover:border-[var(--border-focus)] hover:text-[var(--ink-primary)]'
                    }`}
                  >
                    {active && <Check className="h-3 w-3 stroke-[1.5]" />}
                    {muscle}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="custom-ex-notes"
              className="mb-2 block text-xs font-medium text-[var(--ink-secondary)]"
            >
              Form cues and notes
            </label>
            <textarea
              id="custom-ex-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional setup or form cues"
              className="matte-input w-full bg-[var(--recessed)] p-3 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--border-hairline)] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="calm-press btn-secondary h-9 px-4 text-sm font-medium whitespace-nowrap"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="calm-press btn-primary h-9 px-4 text-sm font-medium whitespace-nowrap"
          >
            {editingExercise ? 'Save changes' : 'Create exercise'}
          </button>
        </div>
      </form>
    </div>
  );
}
