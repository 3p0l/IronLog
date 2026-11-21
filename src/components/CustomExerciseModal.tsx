import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
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
      setError('Please enter an exercise name.');
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
      className="hud-scrim hud-scrim-enter fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={editingExercise ? 'Edit custom exercise' : 'Create custom exercise'}
    >
      <form
        onSubmit={handleSubmit}
        className="hud-modal-enter hud-frame flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[2px] border-2 border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#0A0A0A]"
      >
        {/* Inverted Pitch-Black Header */}
        <div className="flex items-center justify-between border-b border-[#262626] bg-[#000000] px-5 py-3.5 text-[#FFFFFF]">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A3A3A3]">
              03 // CUSTOM MOVEMENT
            </p>
            <h2 className="mt-0.5 text-base font-bold tracking-tight text-[#FFFFFF]">
              {editingExercise ? 'Edit Custom Exercise' : 'Create Custom Exercise'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close custom exercise form"
            className="mech-press flex h-10 w-10 items-center justify-center rounded-[2px] border border-[#262626] bg-[#0A0A0A] text-[#FFFFFF] hover:border-[#FFFFFF]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <div>
            <label
              htmlFor="custom-ex-name"
              className="mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[#525252] dark:text-[#A3A3A3]"
            >
              Exercise Name
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
              className="h-11 w-full rounded-[2px] border border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#000000] px-3.5 text-sm font-medium text-[#000000] dark:text-[#FFFFFF] placeholder-[#737373] focus:outline-none focus:ring-1 focus:ring-[#000000] dark:focus:ring-[#FFFFFF]"
            />
            {error && (
              <p className="mt-1.5 font-mono text-xs font-bold text-[#000000] dark:text-[#FFFFFF]">
                [!] {error}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="custom-ex-primary"
                className="mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[#525252] dark:text-[#A3A3A3]"
              >
                Primary Muscle Group
              </label>
              <select
                id="custom-ex-primary"
                value={primaryMuscle}
                onChange={(e) => {
                  const next = e.target.value as MuscleGroup;
                  setPrimaryMuscle(next);
                  setSecondaryMuscles((prev) => prev.filter((m) => m !== next));
                }}
                className="h-11 w-full rounded-[2px] border border-[#E5E5E5] dark:border-[#262626] bg-[#F5F5F5] dark:bg-[#141414] px-3 text-sm font-medium text-[#000000] dark:text-[#FFFFFF] focus:border-[#000000] dark:focus:border-[#FFFFFF] focus:outline-none"
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
                className="mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[#525252] dark:text-[#A3A3A3]"
              >
                Equipment
              </label>
              <select
                id="custom-ex-equipment"
                value={equipment}
                onChange={(e) => setEquipment(e.target.value as EquipmentType)}
                className="h-11 w-full rounded-[2px] border border-[#E5E5E5] dark:border-[#262626] bg-[#F5F5F5] dark:bg-[#141414] px-3 text-sm font-medium text-[#000000] dark:text-[#FFFFFF] focus:border-[#000000] dark:focus:border-[#FFFFFF] focus:outline-none"
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
              className="mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[#525252] dark:text-[#A3A3A3]"
            >
              Tracking Type
            </label>
            <select
              id="custom-ex-tracking"
              value={trackingType}
              onChange={(e) => setTrackingType(e.target.value as TrackingType)}
              className="h-11 w-full rounded-[2px] border border-[#E5E5E5] dark:border-[#262626] bg-[#F5F5F5] dark:bg-[#141414] px-3 text-sm font-medium text-[#000000] dark:text-[#FFFFFF] focus:border-[#000000] dark:focus:border-[#FFFFFF] focus:outline-none"
            >
              {(Object.keys(TRACKING_TYPE_LABELS) as TrackingType[]).map((key) => (
                <option key={key} value={key}>
                  {TRACKING_TYPE_LABELS[key]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="mb-2 block font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[#525252] dark:text-[#A3A3A3]">
              Secondary Muscles (Optional)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {ALL_MUSCLE_GROUPS.filter((m) => m !== primaryMuscle).map((muscle) => {
                const active = secondaryMuscles.includes(muscle);
                return (
                  <button
                    key={muscle}
                    type="button"
                    onClick={() => toggleSecondary(muscle)}
                    aria-pressed={active}
                    className={`mech-press min-h-[34px] rounded-[2px] border px-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap ${
                      active
                        ? 'border-[#000000] dark:border-[#FFFFFF] bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]'
                        : 'border-[#E5E5E5] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#0A0A0A] text-[#525252] dark:text-[#A3A3A3] hover:border-[#000000] dark:hover:border-[#FFFFFF] hover:text-[#000000] dark:hover:text-[#FFFFFF]'
                    }`}
                  >
                    {active ? `[✓] ${muscle}` : muscle}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="custom-ex-notes"
              className="mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[#525252] dark:text-[#A3A3A3]"
            >
              Form Cues / Notes
            </label>
            <textarea
              id="custom-ex-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional setup or form cues..."
              className="w-full rounded-[2px] border border-[#E5E5E5] dark:border-[#262626] bg-[#F5F5F5] dark:bg-[#141414] p-3 text-sm text-[#000000] dark:text-[#FFFFFF] placeholder-[#737373] focus:border-[#000000] dark:focus:border-[#FFFFFF] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-[#E5E5E5] dark:border-[#262626] bg-[#F5F5F5] dark:bg-[#000000] px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="mech-press min-h-[42px] rounded-[2px] border border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#0A0A0A] px-4 font-mono text-xs font-bold uppercase tracking-wider text-[#000000] dark:text-[#FFFFFF] hover:bg-[#E5E5E5] dark:hover:bg-[#141414]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="mech-press min-h-[42px] rounded-[2px] border border-[#000000] dark:border-[#FFFFFF] bg-[#000000] dark:bg-[#FFFFFF] px-5 font-mono text-xs font-bold uppercase tracking-wider text-[#FFFFFF] dark:text-[#000000] hover:bg-[#1A1A1A] dark:hover:bg-[#E5E5E5]"
          >
            {editingExercise ? 'Save Changes' : 'Create Exercise'}
          </button>
        </div>
      </form>
    </div>
  );
}
