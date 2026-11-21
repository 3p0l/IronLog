import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react';
import { Routine, RoutineExercise, SetType, WeightUnit } from '../types/workout';
import { useWorkout } from '../context/WorkoutContext';
import {
  convertWeightFromKg,
  convertWeightToKg,
  resolveSetWeightUnit,
} from '../utils/calculations';
import { ExercisePickerModal } from './ExercisePickerModal';
import { SegmentedControl } from './ui/LinearPrimitives';

interface RoutineEditorModalProps {
  open: boolean;
  editingRoutine: Routine | null;
  defaultFolderId?: string | null;
  onClose: () => void;
}

const SET_TYPE_CYCLE: SetType[] = ['normal', 'warmup', 'drop', 'failure'];

function nextSetType(cur: SetType): SetType {
  return SET_TYPE_CYCLE[(SET_TYPE_CYCLE.indexOf(cur) + 1) % SET_TYPE_CYCLE.length];
}

export function RoutineEditorModal({
  open,
  editingRoutine,
  defaultFolderId = null,
  onClose,
}: RoutineEditorModalProps) {
  const { db, exerciseMap, saveRoutine } = useWorkout();
  const [name, setName] = useState('');
  const [folderId, setFolderId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState('');

  const unit = db.settings.weightUnit;

  useEffect(() => {
    if (!open) return;
    if (editingRoutine) {
      setName(editingRoutine.name);
      setFolderId(editingRoutine.folderId);
      setNotes(editingRoutine.notes);
      setExercises(
        editingRoutine.exercises.map((e) => ({
          ...e,
          sets: e.sets.map((s) => ({ ...s })),
        }))
      );
    } else {
      setName('');
      setFolderId(defaultFolderId);
      setNotes('');
      setExercises([]);
    }
    setError('');
  }, [open, editingRoutine, defaultFolderId]);

  if (!open) return null;

  const handleAddExercises = (ids: string[]) => {
    setExercises((prev) => [
      ...prev,
      ...ids.map((exerciseId, i) => ({
        id: `re-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        exerciseId,
        sortOrder: prev.length + i,
        notes: '',
        restSeconds: db.settings.defaultRestSeconds,
        weightUnit: unit,
        sets: [
          {
            id: `rs-${Date.now()}-${i}-1`,
            setType: 'normal' as SetType,
            weightKg: null,
            weightUnit: unit,
            reps: 10,
            durationSec: null,
            distanceKm: null,
          },
          {
            id: `rs-${Date.now()}-${i}-2`,
            setType: 'normal' as SetType,
            weightKg: null,
            weightUnit: unit,
            reps: 10,
            durationSec: null,
            distanceKm: null,
          },
          {
            id: `rs-${Date.now()}-${i}-3`,
            setType: 'normal' as SetType,
            weightKg: null,
            weightUnit: unit,
            reps: 10,
            durationSec: null,
            distanceKm: null,
          },
        ],
      })),
    ]);
  };

  const moveExercise = (idx: number, dir: 'up' | 'down') => {
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= exercises.length) return;
    setExercises((prev) => {
      const next = [...prev];
      const tmp = next[idx];
      next[idx] = next[swap];
      next[swap] = tmp;
      return next.map((e, i) => ({ ...e, sortOrder: i }));
    });
  };

  const removeExercise = (id: string) => {
    setExercises((prev) =>
      prev.filter((e) => e.id !== id).map((e, i) => ({ ...e, sortOrder: i }))
    );
  };

  const addSet = (reId: string) => {
    setExercises((prev) =>
      prev.map((e) => {
        if (e.id !== reId) return e;
        const last = e.sets[e.sets.length - 1];
        return {
          ...e,
          sets: [
            ...e.sets,
            {
              id: `rs-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              setType: 'normal',
              weightKg: last?.weightKg ?? null,
              weightUnit: last?.weightUnit ?? e.weightUnit ?? unit,
              reps: last?.reps ?? 10,
              durationSec: last?.durationSec ?? null,
              distanceKm: last?.distanceKm ?? null,
            },
          ],
        };
      })
    );
  };

  const removeSet = (reId: string, setId: string) => {
    setExercises((prev) =>
      prev.map((e) =>
        e.id === reId ? { ...e, sets: e.sets.filter((s) => s.id !== setId) } : e
      )
    );
  };

  const setExerciseUnit = (reId: string, nextUnit: WeightUnit) => {
    setExercises((prev) =>
      prev.map((e) =>
        e.id === reId
          ? {
              ...e,
              weightUnit: nextUnit,
              sets: e.sets.map((s) => ({ ...s, weightUnit: nextUnit })),
            }
          : e
      )
    );
  };

  const updateSetField = (
    reId: string,
    setId: string,
    patch: Partial<{
      setType: SetType;
      weightKg: number | null;
      weightUnit: WeightUnit;
      reps: number | null;
    }>
  ) => {
    setExercises((prev) =>
      prev.map((e) =>
        e.id === reId
          ? { ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) }
          : e
      )
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Enter a routine title');
      return;
    }
    saveRoutine({
      id: editingRoutine?.id,
      name: name.trim(),
      folderId,
      notes: notes.trim(),
      exercises,
    });
    onClose();
  };

  return (
    <>
      <div
        className="matte-scrim scrim-enter fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-label={editingRoutine ? 'Edit routine' : 'Create routine'}
      >
        <form
          onSubmit={handleSave}
          className="matte-modal modal-enter flex h-[92vh] w-full max-w-3xl flex-col overflow-hidden sm:h-[88vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border-hairline)] px-5 py-4">
            <div>
              <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--ink-primary)]">
                {editingRoutine ? 'Edit routine' : 'New routine'}
              </h2>
              <p className="mt-1 text-xs text-[var(--ink-secondary)]">
                Configure exercises, targets, and per-set kg/lbs units
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="calm-press btn-primary h-9 px-4 text-sm font-medium whitespace-nowrap"
              >
                Save routine
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close routine editor"
                className="calm-press btn-ghost flex h-8 w-8 items-center justify-center"
              >
                <X className="h-4 w-4 stroke-[1.5]" />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto bg-[var(--canvas)] p-5">
            {/* De-boxed Meta Fields */}
            <div className="space-y-4 border-b border-[var(--border-hairline)] pb-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="routine-title"
                    className="mb-2 block text-xs font-medium text-[var(--ink-secondary)]"
                  >
                    Routine title
                  </label>
                  <input
                    id="routine-title"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="e.g. Push Day Hypertrophy"
                    className="matte-input h-10 w-full px-3 text-sm"
                  />
                  {error && (
                    <p className="mt-2 text-xs font-medium text-[var(--accent-clay)]">{error}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="routine-folder"
                    className="mb-2 block text-xs font-medium text-[var(--ink-secondary)]"
                  >
                    Folder
                  </label>
                  <select
                    id="routine-folder"
                    value={folderId ?? ''}
                    onChange={(e) => setFolderId(e.target.value || null)}
                    className="matte-input h-10 w-full px-3 text-sm"
                  >
                    <option value="">Uncategorized</option>
                    {db.folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="routine-notes"
                  className="mb-2 block text-xs font-medium text-[var(--ink-secondary)]"
                >
                  Routine notes
                </label>
                <input
                  id="routine-notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional cues or split notes"
                  className="matte-input h-10 w-full px-3 text-sm"
                />
              </div>
            </div>

            {/* Exercise list */}
            {exercises.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-[var(--ink-muted)]">No exercises added yet</p>
              </div>
            ) : (
              exercises.map((re, idx) => {
                const exDef = exerciseMap.get(re.exerciseId);
                const exUnit = re.weightUnit ?? unit;
                const hasMixed =
                  new Set(
                    re.sets.map((s) => resolveSetWeightUnit(s.weightUnit, re.weightUnit, unit))
                  ).size > 1;
                return (
                  <div key={re.id} className="matte-surface p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-hairline)] pb-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-[var(--ink-primary)]">
                          {exDef?.name ?? 'Unknown exercise'}
                        </h3>
                        <p className="mt-1 text-xs text-[var(--ink-secondary)]">
                          {exDef?.primaryMuscle} · Rest{' '}
                          <span className="font-mono tabular-nums">{re.restSeconds}s</span>
                          {hasMixed ? ' · Mixed kg/lbs' : ''}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <SegmentedControl<WeightUnit>
                          value={hasMixed ? null : exUnit}
                          onChange={(u) => setExerciseUnit(re.id, u)}
                          layoutId={`routine-ex-unit-${re.id}`}
                          size="xs"
                          ariaLabel={`${exDef?.name ?? 'Exercise'} unit`}
                          options={[
                            { value: 'kg', label: 'kg' },
                            { value: 'lbs', label: 'lbs' },
                          ]}
                        />
                        <select
                          value={re.restSeconds}
                          onChange={(e) =>
                            setExercises((prev) =>
                              prev.map((item) =>
                                item.id === re.id
                                  ? { ...item, restSeconds: Number(e.target.value) }
                                  : item
                              )
                            )
                          }
                          aria-label="Exercise rest timer"
                          className="matte-input h-8 bg-[var(--recessed)] px-2 font-mono text-xs tabular-nums"
                        >
                          {[30, 45, 60, 75, 90, 120, 150, 180, 240, 300].map((sec) => (
                            <option key={sec} value={sec}>
                              {sec}s
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => moveExercise(idx, 'up')}
                          disabled={idx === 0}
                          aria-label="Move exercise up"
                          className="calm-press btn-ghost flex h-8 w-8 items-center justify-center disabled:opacity-25"
                        >
                          <ArrowUp className="h-4 w-4 stroke-[1.5]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveExercise(idx, 'down')}
                          disabled={idx === exercises.length - 1}
                          aria-label="Move exercise down"
                          className="calm-press btn-ghost flex h-8 w-8 items-center justify-center disabled:opacity-25"
                        >
                          <ArrowDown className="h-4 w-4 stroke-[1.5]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeExercise(re.id)}
                          aria-label="Remove exercise"
                          className="calm-press flex h-8 w-8 items-center justify-center rounded-lg text-[var(--ink-muted)] hover:bg-[var(--accent-clay-tint)] hover:text-[var(--accent-clay)]"
                        >
                          <Trash2 className="h-4 w-4 stroke-[1.5]" />
                        </button>
                      </div>
                    </div>

                    {/* Sets Table */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-[40px_1.2fr_0.9fr_36px] gap-2 px-1 text-xs font-medium text-[var(--ink-muted)]">
                        <span className="text-center">Set</span>
                        <span>Target weight</span>
                        <span>Reps</span>
                        <span />
                      </div>
                      {re.sets.map((s, sIdx) => {
                        const setUnit = resolveSetWeightUnit(s.weightUnit, re.weightUnit, unit);
                        return (
                          <div
                            key={s.id}
                            className="grid grid-cols-[40px_1.2fr_0.9fr_36px] items-center gap-2"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                updateSetField(re.id, s.id, { setType: nextSetType(s.setType) })
                              }
                              title="Cycle set type (Normal / Warmup / Drop / Failure)"
                              className={`calm-press h-9 rounded-[6px] font-mono text-xs font-medium ${
                                s.setType === 'warmup'
                                  ? 'border border-dashed border-[var(--border-focus)] bg-transparent text-[var(--ink-secondary)]'
                                  : s.setType === 'drop'
                                  ? 'border border-[var(--accent-steel-border)] bg-[var(--accent-steel-tint)] text-[var(--accent-steel)]'
                                  : s.setType === 'failure'
                                  ? 'border border-[var(--accent-clay-border)] bg-[var(--accent-clay-tint)] text-[var(--accent-clay)]'
                                  : 'border border-[var(--border-hairline)] bg-[var(--recessed)] text-[var(--ink-secondary)]'
                              }`}
                            >
                              {s.setType === 'warmup'
                                ? 'W'
                                : s.setType === 'drop'
                                ? 'D'
                                : s.setType === 'failure'
                                ? 'F'
                                : sIdx + 1}
                            </button>
                            <div className="flex h-9 w-full items-stretch overflow-hidden rounded-lg border border-[var(--border-hairline)] bg-[var(--recessed)] transition-colors focus-within:border-[var(--accent-steel)]">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                value={convertWeightFromKg(s.weightKg, setUnit) ?? ''}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  updateSetField(re.id, s.id, {
                                    weightKg:
                                      raw === '' ? null : convertWeightToKg(Number(raw), setUnit),
                                    weightUnit: setUnit,
                                  });
                                }}
                                placeholder="—"
                                aria-label={`${exDef?.name ?? 'Exercise'} set ${sIdx + 1} target weight`}
                                className="min-w-0 flex-1 bg-transparent px-3 font-mono text-sm tabular-nums text-[var(--ink-primary)] placeholder-[var(--ink-muted)] focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  updateSetField(re.id, s.id, {
                                    weightUnit: setUnit === 'kg' ? 'lbs' : 'kg',
                                  })
                                }
                                aria-label={`${exDef?.name ?? 'Exercise'} set ${sIdx + 1} unit ${setUnit}`}
                                className={`calm-press flex w-10 shrink-0 items-center justify-center border-l border-[var(--border-hairline)] font-mono text-[11px] font-medium transition-colors ${
                                  setUnit === 'lbs'
                                    ? 'bg-[var(--surface-active)] text-[var(--ink-primary)]'
                                    : 'bg-[var(--surface)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                                }`}
                              >
                                {setUnit}
                              </button>
                            </div>
                            <input
                              type="number"
                              min="0"
                              value={s.reps ?? ''}
                              onChange={(e) => {
                                const raw = e.target.value;
                                updateSetField(re.id, s.id, {
                                  reps:
                                    raw === '' ? null : Math.max(0, Math.round(Number(raw))),
                                });
                              }}
                              placeholder="—"
                              aria-label={`${exDef?.name ?? 'Exercise'} set ${sIdx + 1} target reps`}
                              className="matte-input h-9 w-full bg-[var(--recessed)] px-3 font-mono text-sm tabular-nums"
                            />
                            <button
                              type="button"
                              onClick={() => removeSet(re.id, s.id)}
                              aria-label={`Remove set ${sIdx + 1}`}
                              className="calm-press flex h-9 w-9 items-center justify-center rounded-lg text-[var(--ink-muted)] hover:bg-[var(--accent-clay-tint)] hover:text-[var(--accent-clay)]"
                            >
                              <Trash2 className="h-4 w-4 stroke-[1.5]" />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => addSet(re.id)}
                      className="calm-press flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border-hairline)] bg-transparent text-xs font-medium text-[var(--ink-secondary)] hover:border-[var(--border-focus)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink-primary)]"
                    >
                      <Plus className="h-4 w-4 stroke-[1.5]" />
                      Add set
                    </button>
                  </div>
                );
              })
            )}

            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="calm-press btn-primary flex h-11 w-full items-center justify-center gap-2 text-sm font-medium whitespace-nowrap"
            >
              <Plus className="h-4 w-4 stroke-[1.5]" />
              Add exercise
            </button>
          </div>
        </form>
      </div>

      <ExercisePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAddExercises={handleAddExercises}
      />
    </>
  );
}
