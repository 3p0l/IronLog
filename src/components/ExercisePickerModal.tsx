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
      className="hud-scrim hud-scrim-enter fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Add exercises"
    >
      <div className="hud-modal-enter hud-frame flex h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2px] border-2 border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#0A0A0A] sm:h-[82vh]">
        {/* Pitch-Black Header + Search Console */}
        <div className="bg-[#000000] text-[#FFFFFF] border-b border-[#262626]">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#262626]">
            <div className="flex items-center gap-3">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A3A3A3]">
                  SELECT // MOVEMENT INDEX ({filtered.length})
                </p>
                <h2 className="text-base font-bold tracking-tight text-[#FFFFFF]">Add Exercises</h2>
              </div>
              {onCreateCustomClick && (
                <button
                  type="button"
                  onClick={onCreateCustomClick}
                  className="mech-press inline-flex min-h-[34px] items-center gap-1 rounded-[2px] border border-[#FFFFFF] bg-[#000000] px-2.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[#FFFFFF] hover:bg-[#FFFFFF] hover:text-[#000000] whitespace-nowrap"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Custom
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close exercise picker"
              className="mech-press flex h-10 w-10 items-center justify-center rounded-[2px] border border-[#262626] bg-[#0A0A0A] text-[#FFFFFF] hover:border-[#FFFFFF]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2.5 px-5 py-3.5 bg-[#0A0A0A]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#737373]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search 120+ exercises..."
                aria-label="Search exercises"
                className="h-10 w-full rounded-[2px] border border-[#262626] bg-[#000000] pl-9 pr-4 font-mono text-xs text-[#FFFFFF] placeholder-[#737373] focus:border-[#FFFFFF] focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <select
                value={muscleFilter}
                onChange={(e) => setMuscleFilter(e.target.value as MuscleGroup | 'ALL')}
                aria-label="Filter by muscle group"
                className="h-10 rounded-[2px] border border-[#262626] bg-[#000000] px-3 font-mono text-xs font-medium text-[#FFFFFF] focus:border-[#FFFFFF] focus:outline-none"
              >
                <option value="ALL">All Muscles</option>
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
                className="h-10 rounded-[2px] border border-[#262626] bg-[#000000] px-3 font-mono text-xs font-medium text-[#FFFFFF] focus:border-[#FFFFFF] focus:outline-none"
              >
                <option value="ALL">All Equipment</option>
                {ALL_EQUIPMENT_TYPES.map((eq) => (
                  <option key={eq} value={eq}>
                    {eq}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Hairline-Divided Exercise Directory */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#E5E5E5] dark:divide-[#262626]">
          {filtered.length === 0 ? (
            <div className="hud-dot-matrix px-6 py-12 text-center">
              <p className="inline-block bg-[#FFFFFF] dark:bg-[#0A0A0A] border border-[#E5E5E5] dark:border-[#262626] px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-[#737373]">
                00 // No exercises match your filters
              </p>
            </div>
          ) : (
            filtered.map((ex, idx) => {
              const isSelected = selectedIds.includes(ex.id);
              return (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => toggleSelect(ex.id)}
                  className={`flex min-h-[58px] w-full items-center justify-between gap-3 px-5 py-3 text-left transition-colors ${
                    isSelected
                      ? 'bg-[#000000] text-[#FFFFFF] dark:bg-[#FFFFFF] dark:text-[#000000]'
                      : 'bg-transparent text-[#000000] dark:text-[#FFFFFF] hover:bg-[#F5F5F5] dark:hover:bg-[#141414]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`font-mono text-[10px] font-semibold tabular-nums shrink-0 ${
                        isSelected ? 'text-[#A3A3A3] dark:text-[#525252]' : 'text-[#737373]'
                      }`}
                    >
                      [{String(idx + 1).padStart(3, '0')}]
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {ex.name}
                      </p>
                      <p
                        className={`mt-0.5 truncate font-mono text-[11px] uppercase tracking-wider ${
                          isSelected ? 'text-[#D4D4D4] dark:text-[#525252]' : 'text-[#737373]'
                        }`}
                      >
                        {ex.primaryMuscle} // {ex.equipment}
                        {ex.isCustom ? ' // CUSTOM' : ''}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[2px] border transition-colors ${
                      isSelected
                        ? 'border-[#FFFFFF] bg-[#FFFFFF] text-[#000000] dark:border-[#000000] dark:bg-[#000000] dark:text-[#FFFFFF]'
                        : 'border-[#000000] dark:border-[#525252]'
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Sticky Bottom CTA */}
        <div className="border-t border-[#E5E5E5] dark:border-[#262626] bg-[#F5F5F5] dark:bg-[#000000] p-4">
          <button
            type="button"
            disabled={selectedIds.length === 0}
            onClick={handleConfirm}
            className="mech-press flex h-12 w-full items-center justify-center rounded-[2px] border border-[#000000] dark:border-[#FFFFFF] bg-[#000000] dark:bg-[#FFFFFF] px-5 font-mono text-xs font-bold uppercase tracking-widest text-[#FFFFFF] dark:text-[#000000] hover:bg-[#1A1A1A] dark:hover:bg-[#E5E5E5] disabled:cursor-not-allowed disabled:opacity-35"
          >
            {selectedIds.length === 0
              ? 'Select exercises to add'
              : `Add ${selectedIds.length} ${selectedIds.length === 1 ? 'Exercise' : 'Exercises'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
