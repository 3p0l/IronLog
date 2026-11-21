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
    setExercises((prev) => prev.filter((e) => e.id !== id).map((e, i) => ({ ...e, sortOrder: i })));
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
      prev.map((e) => (e.id === reId ? { ...e, sets: e.sets.filter((s) => s.id !== setId) } : e))
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
    patch: Partial<{ setType: SetType; weightKg: number | null; weightUnit: WeightUnit; reps: number | null }>
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
      setError('Please enter a routine title.');
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
        className="hud-scrim hud-scrim-enter fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-label={editingRoutine ? 'Edit routine' : 'Create routine'}
      >
        <form
          onSubmit={handleSave}
          className="hud-modal-enter hud-frame flex h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2px] border-2 border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#0A0A0A] sm:h-[88vh]"
        >
          {/* Pitch-Black Header */}
          <div className="flex items-center justify-between border-b border-[#262626] bg-[#000000] px-5 py-3.5 text-[#FFFFFF]">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A3A3A3]">
                PROGRAM EDITOR // TEMPLATE
              </p>
              <h2 className="mt-0.5 text-base font-bold tracking-tight text-[#FFFFFF]">
                {editingRoutine ? 'Edit Routine' : 'New Routine'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="mech-press min-h-[38px] rounded-[2px] border border-[#FFFFFF] bg-[#FFFFFF] px-4 font-mono text-xs font-bold uppercase tracking-wider text-[#000000] hover:bg-[#E5E5E5]"
              >
                Save Routine
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close routine editor"
                className="mech-press flex h-10 w-10 items-center justify-center rounded-[2px] border border-[#262626] bg-[#0A0A0A] text-[#FFFFFF] hover:border-[#FFFFFF]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5 bg-[#F5F5F5] dark:bg-[#000000]">
            {/* Meta card */}
            <div className="rounded-[2px] border border-[#E5E5E5] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#0A0A0A] p-4 space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="routine-title"
                    className="mb-1 block font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[#525252] dark:text-[#A3A3A3]"
                  >
                    Routine Title
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
                    className="h-10 w-full rounded-[2px] border border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#000000] px-3 text-sm font-medium text-[#000000] dark:text-[#FFFFFF] placeholder-[#737373] focus:outline-none"
                  />
                  {error && (
                    <p className="mt-1 font-mono text-xs font-bold text-[#000000] dark:text-[#FFFFFF]">
                      [!] {error}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="routine-folder"
                    className="mb-1 block font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[#525252] dark:text-[#A3A3A3]"
                  >
                    Folder
                  </label>
                  <select
                    id="routine-folder"
                    value={folderId ?? ''}
                    onChange={(e) => setFolderId(e.target.value || null)}
                    className="h-10 w-full rounded-[2px] border border-[#E5E5E5] dark:border-[#262626] bg-[#F5F5F5] dark:bg-[#141414] px-3 text-sm text-[#000000] dark:text-[#FFFFFF] focus:border-[#000000] dark:focus:border-[#FFFFFF] focus:outline-none"
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
                  className="mb-1 block font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[#525252] dark:text-[#A3A3A3]"
                >
                  Routine Notes
                </label>
                <input
                  id="routine-notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional focus cues or split notes..."
                  className="h-10 w-full rounded-[2px] border border-[#E5E5E5] dark:border-[#262626] bg-[#F5F5F5] dark:bg-[#141414] px-3 text-sm text-[#000000] dark:text-[#FFFFFF] placeholder-[#737373] focus:border-[#000000] dark:focus:border-[#FFFFFF] focus:outline-none"
                />
              </div>
            </div>

            {/* Exercise list */}
            {exercises.length === 0 ? (
              <div className="hud-dot-matrix rounded-[2px] border border-dashed border-[#000000] dark:border-[#262626] px-6 py-10 text-center">
                <p className="inline-block bg-[#FFFFFF] dark:bg-[#0A0A0A] border border-[#E5E5E5] dark:border-[#262626] px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-[#737373]">
                  00 // No exercises added yet. Build your routine below.
                </p>
              </div>
            ) : (
              exercises.map((re, idx) => {
                const exDef = exerciseMap.get(re.exerciseId);
                const exUnit = re.weightUnit ?? unit;
                const hasMixed =
                  new Set(re.sets.map((s) => resolveSetWeightUnit(s.weightUnit, re.weightUnit, unit))).size > 1;
                return (
                  <div
                    key={re.id}
                    className="hud-frame rounded-[2px] border border-[#000000] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#0A0A0A] p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E5E5] dark:border-[#262626] pb-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-[#737373]">
                            {String(idx + 1).padStart(2, '0')} //
                          </span>
                          <h3 className="truncate text-sm font-bold text-[#000000] dark:text-[#FFFFFF]">
                            {exDef?.name ?? 'Unknown Exercise'}
                          </h3>
                        </div>
                        <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-[#737373]">
                          {exDef?.primaryMuscle} · REST {re.restSeconds}S
                          {hasMixed ? ' · MIXED KG/LBS' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div
                          className="flex items-center rounded-[2px] border border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#000000] p-0.5"
                          role="group"
                          aria-label={`${exDef?.name ?? 'Exercise'} unit`}
                        >
                          {(['kg', 'lbs'] as const).map((u) => {
                            const active = !hasMixed && exUnit === u;
                            return (
                              <button
                                key={u}
                                type="button"
                                onClick={() => setExerciseUnit(re.id, u)}
                                aria-pressed={active}
                                className={`mech-press h-7 rounded-[2px] px-2 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors ${
                                  active
                                    ? 'bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]'
                                    : 'text-[#737373] hover:text-[#000000] dark:hover:text-[#FFFFFF]'
                                }`}
                              >
                                {u}
                              </button>
                            );
                          })}
                        </div>
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
                          className="h-8 rounded-[2px] border border-[#E5E5E5] dark:border-[#262626] bg-[#F5F5F5] dark:bg-[#141414] px-2 font-mono text-xs text-[#000000] dark:text-[#FFFFFF]"
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
                          className="mech-press flex h-8 w-8 items-center justify-center rounded-[2px] border border-[#E5E5E5] dark:border-[#262626] text-[#000000] dark:text-[#FFFFFF] hover:border-[#000000] dark:hover:border-[#FFFFFF] disabled:opacity-25"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveExercise(idx, 'down')}
                          disabled={idx === exercises.length - 1}
                          aria-label="Move exercise down"
                          className="mech-press flex h-8 w-8 items-center justify-center rounded-[2px] border border-[#E5E5E5] dark:border-[#262626] text-[#000000] dark:text-[#FFFFFF] hover:border-[#000000] dark:hover:border-[#FFFFFF] disabled:opacity-25"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeExercise(re.id)}
                          aria-label="Remove exercise"
                          className="mech-press flex h-8 w-8 items-center justify-center rounded-[2px] border border-[#E5E5E5] dark:border-[#262626] text-[#000000] dark:text-[#FFFFFF] hover:bg-[#000000] hover:text-[#FFFFFF] dark:hover:bg-[#FFFFFF] dark:hover:text-[#000000]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Sets Table */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-[44px_1.2fr_0.9fr_36px] gap-2 px-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#737373]">
                        <span>Set</span>
                        <span>Target Weight</span>
                        <span>Reps</span>
                        <span />
                      </div>
                      {re.sets.map((s, sIdx) => {
                        const setUnit = resolveSetWeightUnit(s.weightUnit, re.weightUnit, unit);
                        return (
                          <div
                            key={s.id}
                            className="grid grid-cols-[44px_1.2fr_0.9fr_36px] items-center gap-2"
                          >
                            <button
                              type="button"
                              onClick={() => updateSetField(re.id, s.id, { setType: nextSetType(s.setType) })}
                              title="Cycle set type (Normal / Warmup / Drop / Failure)"
                              className={`mech-press h-10 rounded-[2px] font-mono text-xs font-bold ${
                                s.setType === 'warmup'
                                  ? 'border border-dashed border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#0A0A0A] text-[#000000] dark:text-[#FFFFFF]'
                                  : s.setType === 'drop'
                                  ? 'hud-hatch border border-[#000000] dark:border-[#FFFFFF] text-[#000000] dark:text-[#FFFFFF]'
                                  : s.setType === 'failure'
                                  ? 'border-2 border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#0A0A0A] text-[#000000] dark:text-[#FFFFFF]'
                                  : 'border border-[#E5E5E5] dark:border-[#262626] bg-[#F5F5F5] dark:bg-[#141414] text-[#000000] dark:text-[#FFFFFF]'
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
                            <div className="flex h-10 w-full items-stretch overflow-hidden rounded-[2px] border border-[#E5E5E5] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#000000] focus-within:border-[#000000] dark:focus-within:border-[#FFFFFF]">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                value={convertWeightFromKg(s.weightKg, setUnit) ?? ''}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  updateSetField(re.id, s.id, {
                                    weightKg: raw === '' ? null : convertWeightToKg(Number(raw), setUnit),
                                    weightUnit: setUnit,
                                  });
                                }}
                                placeholder="—"
                                aria-label={`${exDef?.name ?? 'Exercise'} set ${sIdx + 1} target weight`}
                                className="min-w-0 flex-1 bg-transparent px-2.5 font-mono text-sm tabular-nums text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  updateSetField(re.id, s.id, {
                                    weightUnit: setUnit === 'kg' ? 'lbs' : 'kg',
                                  })
                                }
                                aria-label={`${exDef?.name ?? 'Exercise'} set ${sIdx + 1} unit ${setUnit}`}
                                className={`mech-press flex w-10 shrink-0 items-center justify-center border-l border-[#E5E5E5] dark:border-[#262626] font-mono text-[10px] font-bold uppercase tracking-wider transition-colors ${
                                  setUnit === 'lbs'
                                    ? 'bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]'
                                    : 'bg-[#F5F5F5] dark:bg-[#141414] text-[#525252] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]'
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
                                  reps: raw === '' ? null : Math.max(0, Math.round(Number(raw))),
                                });
                              }}
                              placeholder="—"
                              aria-label={`${exDef?.name ?? 'Exercise'} set ${sIdx + 1} target reps`}
                              className="h-10 w-full rounded-[2px] border border-[#E5E5E5] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#000000] px-3 font-mono text-sm tabular-nums text-[#000000] dark:text-[#FFFFFF] focus:border-[#000000] dark:focus:border-[#FFFFFF] focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => removeSet(re.id, s.id)}
                              aria-label={`Remove set ${sIdx + 1}`}
                              className="mech-press flex h-10 w-9 items-center justify-center rounded-[2px] text-[#737373] hover:bg-[#000000] hover:text-[#FFFFFF] dark:hover:bg-[#FFFFFF] dark:hover:text-[#000000]"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => addSet(re.id)}
                      className="mech-press flex h-9 w-full items-center justify-center gap-1.5 rounded-[2px] border border-dashed border-[#000000] dark:border-[#525252] bg-[#F5F5F5] dark:bg-[#141414] font-mono text-[11px] font-bold uppercase tracking-wider text-[#000000] dark:text-[#FFFFFF] hover:bg-[#000000] hover:text-[#FFFFFF] dark:hover:bg-[#FFFFFF] dark:hover:text-[#000000]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Set
                    </button>
                  </div>
                );
              })
            )}

            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="mech-press flex h-12 w-full items-center justify-center gap-2 rounded-[2px] border border-[#000000] dark:border-[#FFFFFF] bg-[#000000] dark:bg-[#FFFFFF] font-mono text-xs font-bold uppercase tracking-widest text-[#FFFFFF] dark:text-[#000000] hover:bg-[#1A1A1A] dark:hover:bg-[#E5E5E5]"
            >
              <Plus className="h-4 w-4" />
              Add Exercise
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
