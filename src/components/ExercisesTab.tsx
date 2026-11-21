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
import { SegmentedControl } from './ui/LinearPrimitives';

export function ExercisesTab() {
  const { db } = useWorkout();
  const [query, setQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | 'ALL'>('ALL');
  const [equipmentFilter, setEquipmentFilter] = useState<EquipmentType | 'ALL'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'custom' | 'builtin'>('all');

  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

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

  const customCount = useMemo(
    () => db.exercises.filter((e) => e.isCustom).length,
    [db.exercises]
  );

  const liveSelectedExercise = useMemo(
    () =>
      selectedExercise
        ? db.exercises.find((e) => e.id === selectedExercise.id) ?? null
        : null,
    [selectedExercise, db.exercises]
  );

  return (
    <div className="max-w-[880px] space-y-8">
      {/* Page Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--ink-primary)]">
          Exercises
        </h1>
        <button
          type="button"
          onClick={() => {
            setEditingExercise(null);
            setCustomModalOpen(true);
          }}
          className="calm-press btn-primary inline-flex h-10 items-center gap-2 px-4 text-sm font-medium whitespace-nowrap"
        >
          <span className="flex h-5 w-5 items-center justify-center">
            <Plus className="h-4 w-4 stroke-[1.5]" />
          </span>
          Create exercise
        </button>
      </header>

      {/* De-boxed Filter Bar */}
      <section aria-label="Exercise filters" className="space-y-3 border-b border-[var(--border-hairline)] pb-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_192px_192px]">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-[var(--ink-muted)]">
              <Search className="h-4 w-4 stroke-[1.5]" />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search exercises, muscles, or equipment"
              aria-label="Search exercise library"
              className="matte-input h-10 w-full pl-10 pr-3 text-sm"
            />
          </div>

          <select
            value={muscleFilter}
            onChange={(e) => setMuscleFilter(e.target.value as MuscleGroup | 'ALL')}
            aria-label="Filter library by muscle"
            className="matte-input h-10 px-3 text-sm"
          >
            <option value="ALL">All muscle groups</option>
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
            className="matte-input h-10 px-3 text-sm"
          >
            <option value="ALL">All equipment</option>
            {ALL_EQUIPMENT_TYPES.map((eq) => (
              <option key={eq} value={eq}>
                {eq}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedControl
            layoutId="exercises-source-seg"
            ariaLabel="Filter exercises by source"
            value={sourceFilter}
            onChange={setSourceFilter}
            options={[
              { value: 'all', label: `All (${db.exercises.length})` },
              { value: 'builtin', label: 'Built-in' },
              { value: 'custom', label: `Custom (${customCount})` },
            ]}
          />

          <span className="font-mono text-xs tabular-nums text-[var(--ink-muted)]">
            {filtered.length} shown
          </span>
        </div>
      </section>

      {/* De-boxed Movement Directory directly on canvas */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm font-medium text-[var(--ink-primary)]">
            No matching exercises
          </p>
          <p className="mt-1 text-xs text-[var(--ink-secondary)]">
            Adjust active filters or create a custom exercise
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--border-hairline)]">
          {filtered.map((ex) => {
            const logs = sessionCounts.get(ex.id) ?? 0;
            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => setSelectedExercise(ex)}
                className="calm-press group flex min-h-[52px] w-full items-center justify-between gap-4 rounded-lg px-3 py-3 text-left transition-colors hover:bg-[var(--surface-hover)]"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-[var(--ink-primary)]">
                      {ex.name}
                    </p>
                    {ex.isCustom && (
                      <span className="rounded-[6px] border border-[var(--border-hairline)] bg-[var(--surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--ink-secondary)]">
                        Custom
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-xs text-[var(--ink-secondary)]">
                    {ex.primaryMuscle} · {ex.equipment}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {logs > 0 && (
                    <span className="font-mono text-xs tabular-nums text-[var(--ink-muted)]">
                      {logs} {logs === 1 ? 'log' : 'logs'}
                    </span>
                  )}
                  <span className="flex h-5 w-5 items-center justify-center text-[var(--ink-muted)] transition-colors group-hover:text-[var(--ink-primary)]">
                    <ChevronRight className="h-4 w-4 stroke-[1.5]" />
                  </span>
                </div>
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
