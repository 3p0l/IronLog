import React, { useMemo, useState } from 'react';
import { Check, Plus, Search, X } from 'lucide-react';
import {
  ALL_EQUIPMENT_TYPES,
  ALL_MUSCLE_GROUPS,
  EquipmentType,
  MuscleGroup,
} from '../types/workout';
import { useWorkout } from '../context/WorkoutContext';

interface ExercisePickerModalProps {
  open: boolean;
  onClose: () => void;
  onAddExercises: (exerciseIds: string[]) => void;
  onCreateCustomClick?: () => void;
}

export function ExercisePickerModal({
  open,
  onClose,
  onAddExercises,
  onCreateCustomClick,
}: ExercisePickerModalProps) {
  const { db } = useWorkout();
  const [query, setQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | 'ALL'>('ALL');
  const [equipmentFilter, setEquipmentFilter] = useState<EquipmentType | 'ALL'>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return db.exercises
      .filter((ex) => {
        if (muscleFilter !== 'ALL' && ex.primaryMuscle !== muscleFilter) return false;
        if (equipmentFilter !== 'ALL' && ex.equipment !== equipmentFilter) return false;
        if (q && !ex.name.toLowerCase().includes(q) && !ex.primaryMuscle.toLowerCase().includes(q)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [db.exercises, query, muscleFilter, equipmentFilter]);

  if (!open) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    if (selectedIds.length === 0) return;
    onAddExercises(selectedIds);
    setSelectedIds([]);
    setQuery('');
    onClose();
  };

  return (
    <div
      className="matte-scrim scrim-enter fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Add exercises"
    >
      <div className="matte-modal modal-enter flex h-[88vh] w-full max-w-2xl flex-col overflow-hidden sm:h-[82vh]">
        {/* Header + Search */}
        <div className="border-b border-[var(--border-hairline)]">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--ink-primary)]">
                  Add exercises
                </h2>
                <p className="mt-1 text-xs text-[var(--ink-secondary)]">
                  <span className="font-mono tabular-nums">{filtered.length}</span> movements
                </p>
              </div>
              {onCreateCustomClick && (
                <button
                  type="button"
                  onClick={onCreateCustomClick}
                  className="calm-press btn-secondary inline-flex h-8 items-center gap-1 px-3 text-xs font-medium whitespace-nowrap"
                >
                  <Plus className="h-4 w-4 stroke-[1.5]" />
                  Custom
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close exercise picker"
              className="calm-press btn-ghost flex h-8 w-8 items-center justify-center"
            >
              <X className="h-4 w-4 stroke-[1.5]" />
            </button>
          </div>

          <div className="space-y-3 border-t border-[var(--border-hairline)] bg-[var(--recessed)] px-5 py-4">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-[var(--ink-muted)]">
                <Search className="h-4 w-4 stroke-[1.5]" />
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search exercises"
                aria-label="Search exercises"
                className="matte-input h-9 w-full pl-10 pr-4 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={muscleFilter}
                onChange={(e) => setMuscleFilter(e.target.value as MuscleGroup | 'ALL')}
                aria-label="Filter by muscle group"
                className="matte-input h-9 px-3 text-xs font-medium"
              >
                <option value="ALL">All muscles</option>
                {ALL_MUSCLE_GROUPS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                value={equipmentFilter}
                onChange={(e) => setEquipmentFilter(e.target.value as EquipmentType | 'ALL')}
                aria-label="Filter by equipment"
                className="matte-input h-9 px-3 text-xs font-medium"
              >
                <option value="ALL">All equipment</option>
                {ALL_EQUIPMENT_TYPES.map((eq) => (
                  <option key={eq} value={eq}>
                    {eq}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Hairline-Divided Exercise List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-hairline)]">
          {filtered.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-[var(--ink-muted)]">No exercises match active filters</p>
            </div>
          ) : (
            filtered.map((ex) => {
              const isSelected = selectedIds.includes(ex.id);
              return (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => toggleSelect(ex.id)}
                  className={`flex min-h-[52px] w-full items-center justify-between gap-3 px-5 py-3 text-left transition-colors ${
                    isSelected
                      ? 'status-tick status-tick-sage bg-[var(--surface-hover)]/60'
                      : 'bg-transparent hover:bg-[var(--surface-hover)]/40'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-[var(--ink-primary)]">
                        {ex.name}
                      </p>
                      {ex.isCustom && (
                        <span className="rounded-[6px] border border-[var(--border-hairline)] bg-[var(--recessed)] px-2 py-0.5 text-[11px] font-medium text-[var(--ink-secondary)]">
                          Custom
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-xs text-[var(--ink-secondary)]">
                      {ex.primaryMuscle} · {ex.equipment}
                    </p>
                  </div>
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border transition-colors ${
                      isSelected
                        ? 'border-[var(--accent-sage-border)] bg-[var(--accent-sage-tint)] text-[var(--accent-sage)]'
                        : 'border-[var(--border-focus)] bg-transparent'
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 stroke-[1.5]" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Sticky Bottom CTA */}
        <div className="border-t border-[var(--border-hairline)] p-4">
          <button
            type="button"
            disabled={selectedIds.length === 0}
            onClick={handleConfirm}
            className="calm-press btn-primary flex h-10 w-full items-center justify-center px-5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
          >
            {selectedIds.length === 0
              ? 'Select exercises to add'
              : `Add ${selectedIds.length} ${selectedIds.length === 1 ? 'exercise' : 'exercises'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
