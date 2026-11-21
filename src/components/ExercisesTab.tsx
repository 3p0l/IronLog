import React, { useMemo, useState } from 'react';
import { ChevronRight, Plus, Search } from 'lucide-react';
import {
  ALL_EQUIPMENT_TYPES,
  ALL_MUSCLE_GROUPS,
  EquipmentType,
  Exercise,
  MuscleGroup,
} from '../types/workout';
import { useWorkout } from '../context/WorkoutContext';
import { CustomExerciseModal } from './CustomExerciseModal';
import { ExerciseDetailModal } from './ExerciseDetailModal';

export function ExercisesTab() {
  const { db } = useWorkout();
  const [query, setQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | 'ALL'>('ALL');
  const [equipmentFilter, setEquipmentFilter] = useState<EquipmentType | 'ALL'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'custom' | 'builtin'>('all');

  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  // Count how many completed sessions include each exercise
  const sessionCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const w of db.workouts) {
      if (w.finishedAt === null) continue;
      for (const ex of w.exercises) {
        if (ex.sets.some((s) => s.completed)) {
          map.set(ex.exerciseId, (map.get(ex.exerciseId) ?? 0) + 1);
        }
      }
    }
    return map;
  }, [db.workouts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return db.exercises
      .filter((ex) => {
        if (sourceFilter === 'custom' && !ex.isCustom) return false;
        if (sourceFilter === 'builtin' && ex.isCustom) return false;
        if (muscleFilter !== 'ALL' && ex.primaryMuscle !== muscleFilter) return false;
        if (equipmentFilter !== 'ALL' && ex.equipment !== equipmentFilter) return false;
        if (
          q &&
          !ex.name.toLowerCase().includes(q) &&
          !ex.primaryMuscle.toLowerCase().includes(q) &&
          !ex.equipment.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const countDiff = (sessionCounts.get(b.id) ?? 0) - (sessionCounts.get(a.id) ?? 0);
        if (countDiff !== 0) return countDiff;
        return a.name.localeCompare(b.name);
      });
  }, [db.exercises, query, muscleFilter, equipmentFilter, sourceFilter, sessionCounts]);

  const customCount = useMemo(() => db.exercises.filter((e) => e.isCustom).length, [db.exercises]);

  const liveSelectedExercise = useMemo(
    () => (selectedExercise ? db.exercises.find((e) => e.id === selectedExercise.id) ?? null : null),
    [selectedExercise, db.exercises]
  );

  return (
    <div className="space-y-6">
      {/* Pitch-Black Inverted Control & Filter Console */}
      <section className="hud-frame border border-[#000000] dark:border-[#262626] bg-[#000000] dark:bg-[#0A0A0A] text-[#FFFFFF]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#262626] px-5 py-4">
          <div>
            <p className="font-mono text-[10px] font-bold tracking-[0.12em] uppercase text-[#737373]">
              03 // MOVEMENT INDEX
            </p>
            <h2 className="mt-0.5 text-lg font-bold tracking-tight text-[#FFFFFF]">
              Exercise Library
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingExercise(null);
              setCustomModalOpen(true);
            }}
            className="mech-press inline-flex min-h-[40px] items-center gap-2 rounded-[2px] border border-[#FFFFFF] bg-[#FFFFFF] px-4 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-[#000000] hover:bg-[#E5E5E5] whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            Create Exercise
          </button>
        </div>

        <div className="space-y-3 p-5">
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-[1fr_190px_190px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#737373]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by exercise, muscle, or equipment..."
                aria-label="Search exercise library"
                className="h-10 w-full rounded-[2px] border border-[#262626] bg-[#141414] pl-9 pr-3 text-sm text-[#FFFFFF] placeholder-[#737373] focus:border-[#FFFFFF] focus:outline-none"
              />
            </div>

            <select
              value={muscleFilter}
              onChange={(e) => setMuscleFilter(e.target.value as MuscleGroup | 'ALL')}
              aria-label="Filter library by muscle"
              className="h-10 rounded-[2px] border border-[#262626] bg-[#141414] px-3 font-mono text-xs font-semibold text-[#FFFFFF] focus:border-[#FFFFFF] focus:outline-none"
            >
              <option value="ALL">All Muscle Groups</option>
              {ALL_MUSCLE_GROUPS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={equipmentFilter}
              onChange={(e) => setEquipmentFilter(e.target.value as EquipmentType | 'ALL')}
              aria-label="Filter library by equipment"
              className="h-10 rounded-[2px] border border-[#262626] bg-[#141414] px-3 font-mono text-xs font-semibold text-[#FFFFFF] focus:border-[#FFFFFF] focus:outline-none"
            >
              <option value="ALL">All Equipment</option>
              {ALL_EQUIPMENT_TYPES.map((eq) => (
                <option key={eq} value={eq}>
                  {eq}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center border border-[#262626] bg-[#0A0A0A]">
              {([
                { id: 'all', label: `All (${db.exercises.length})` },
                { id: 'builtin', label: 'Built-in' },
                { id: 'custom', label: `Custom (${customCount})` },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSourceFilter(tab.id)}
                  className={`mech-press min-h-[32px] px-3 font-mono text-[10px] font-bold uppercase tracking-[0.06em] whitespace-nowrap ${
                    sourceFilter === tab.id
                      ? 'bg-[#FFFFFF] text-[#000000]'
                      : 'text-[#737373] hover:text-[#FFFFFF]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <span className="font-mono text-[11px] uppercase tracking-[0.08em] tabular-nums text-[#737373]">
              {filtered.length} SHOWN
            </span>
          </div>
        </div>
      </section>

      {/* Hairline-Divided Indexed Directory */}
      {filtered.length === 0 ? (
        <div className="hud-dot-matrix border border-dashed border-[#D4D4D4] dark:border-[#262626] px-6 py-14 text-center">
          <span className="inline-block border border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#000000] px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
            00 // NO MATCHES
          </span>
          <p className="mt-2 font-mono text-xs text-[#737373]">
            Adjust your filters or create a custom exercise with your exact movement metadata.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 border-t border-l border-[#E5E5E5] dark:border-[#262626] md:grid-cols-2">
          {filtered.map((ex, idx) => {
            const logs = sessionCounts.get(ex.id) ?? 0;
            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => setSelectedExercise(ex)}
                className="mech-press group flex min-h-[62px] items-center justify-between gap-3 border-r border-b border-[#E5E5E5] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#0A0A0A] px-4 py-3 text-left hover:bg-[#000000] hover:text-[#FFFFFF] dark:hover:bg-[#FFFFFF] dark:hover:text-[#000000]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="font-mono text-[10px] font-semibold tabular-nums text-[#737373] group-hover:text-[#A3A3A3] dark:group-hover:text-[#525252]">
                    {String(idx + 1).padStart(3, '0')}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      {ex.name}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.06em] text-[#737373] group-hover:text-[#A3A3A3] dark:group-hover:text-[#525252]">
                      {ex.primaryMuscle} // {ex.equipment}
                      {ex.isCustom ? ' // CUSTOM' : ''}
                      {logs > 0 ? ` // ${logs} ${logs === 1 ? 'LOG' : 'LOGS'}` : ''}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-[#737373] group-hover:text-[#FFFFFF] dark:group-hover:text-[#000000]" />
              </button>
            );
          })}
        </div>
      )}

      <CustomExerciseModal
        open={customModalOpen}
        editingExercise={editingExercise}
        onClose={() => {
          setCustomModalOpen(false);
          setEditingExercise(null);
        }}
      />

      <ExerciseDetailModal
        exercise={liveSelectedExercise}
        onClose={() => setSelectedExercise(null)}
        onEditCustom={(ex) => {
          setEditingExercise(ex);
          setCustomModalOpen(true);
        }}
      />
    </div>
  );
}
