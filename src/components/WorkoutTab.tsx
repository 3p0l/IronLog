import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Copy,
  FolderPlus,
  Pencil,
  Play,
  Plus,
  Trash2,
} from 'lucide-react';
import { Routine, RoutineFolder } from '../types/workout';
import { useWorkout } from '../context/WorkoutContext';
import {
  calculateWorkoutVolumeKg,
  formatVolume,
  getGlobalTrainingStats,
  resolveSetWeightUnit,
  toLocalDateKey,
} from '../utils/calculations';
import { RoutineEditorModal } from './RoutineEditorModal';
import { ConfirmDialog } from './ConfirmDialog';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function WorkoutTab() {
  const {
    db,
    exerciseMap,
    setActiveWorkoutOpen,
    startEmptyWorkout,
    startRoutineWorkout,
    createFolder,
    renameFolder,
    toggleFolderCollapse,
    moveFolder,
    deleteFolder,
    duplicateRoutine,
    deleteRoutine,
    moveRoutine,
  } = useWorkout();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [defaultFolderId, setDefaultFolderId] = useState<string | null>(null);

  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false);
  const [folderNameInput, setFolderNameInput] = useState('');
  const [renamingFolder, setRenamingFolder] = useState<RoutineFolder | null>(null);

  const [pendingDeleteRoutine, setPendingDeleteRoutine] = useState<Routine | null>(null);
  const [pendingDeleteFolder, setPendingDeleteFolder] = useState<RoutineFolder | null>(null);
  const [replaceActiveTarget, setReplaceActiveTarget] = useState<string | null>(null);

  const unit = db.settings.weightUnit;

  const sortedFolders = useMemo(
    () => [...db.folders].sort((a, b) => a.sortOrder - b.sortOrder),
    [db.folders]
  );

  const uncategorizedRoutines = useMemo(
    () =>
      db.routines
        .filter((r) => !r.folderId || !db.folders.some((f) => f.id === r.folderId))
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [db.routines, db.folders]
  );

  const weeklyTelemetry = useMemo(() => {
    const completed = db.workouts.filter((w) => w.finishedAt !== null);
    const stats = getGlobalTrainingStats(completed, 'ALL');
    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
    monday.setHours(0, 0, 0, 0);

    const workoutDayKeys = new Set(completed.map((w) => toLocalDateKey(w.startedAt)));
    const days = DAY_LABELS.map((label, idx) => {
      const d = new Date(monday.getTime() + idx * 86_400_000);
      const key = toLocalDateKey(d.getTime());
      return {
        label,
        short: label[0],
        key,
        active: workoutDayKeys.has(key),
        isToday: idx === dayOfWeek,
      };
    });

    const weekStartMs = monday.getTime();
    const prevWeekStartMs = weekStartMs - 7 * 86_400_000;
    const weekVolumeKg = completed
      .filter((w) => w.startedAt >= weekStartMs)
      .reduce((acc, w) => acc + calculateWorkoutVolumeKg(w), 0);
    const prevWeekVolumeKg = completed
      .filter((w) => w.startedAt >= prevWeekStartMs && w.startedAt < weekStartMs)
      .reduce((acc, w) => acc + calculateWorkoutVolumeKg(w), 0);

    const completedDaysCount = days.filter((d) => d.active).length;

    return {
      days,
      completedDaysCount,
      weekVolumeKg,
      prevWeekVolumeKg,
      streak: stats.currentWeekStreak,
      totalWorkouts: completed.length,
    };
  }, [db.workouts]);

  const openNewRoutine = (folderId: string | null = null) => {
    setEditingRoutine(null);
    setDefaultFolderId(folderId);
    setEditorOpen(true);
  };

  const openEditRoutine = (routine: Routine) => {
    setEditingRoutine(routine);
    setDefaultFolderId(routine.folderId);
    setEditorOpen(true);
  };

  const handleStartRoutine = (routineId: string) => {
    if (db.activeWorkout) {
      setReplaceActiveTarget(routineId);
      return;
    }
    startRoutineWorkout(routineId);
  };

  const handleSaveFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderNameInput.trim()) return;
    if (renamingFolder) {
      renameFolder(renamingFolder.id, folderNameInput.trim());
    } else {
      createFolder(folderNameInput.trim());
    }
    setFolderNameInput('');
    setRenamingFolder(null);
    setNewFolderModalOpen(false);
  };

  const renderRoutinePanel = (routine: Routine, idx: number, total: number) => {
    const exerciseNames = routine.exercises
      .map((re) => exerciseMap.get(re.exerciseId)?.name)
      .filter(Boolean) as string[];
    const totalSets = routine.exercises.reduce((acc, e) => acc + e.sets.length, 0);
    const unitsInRoutine = new Set(
      routine.exercises.flatMap((e) =>
        e.sets.map((s) => resolveSetWeightUnit(s.weightUnit, e.weightUnit, unit))
      )
    );
    const unitBadge =
      unitsInRoutine.size > 1 ? 'kg / lbs' : [...unitsInRoutine][0] ?? unit;

    return (
      <article
        key={routine.id}
        className="matte-surface matte-surface-hover flex flex-col justify-between p-5"
      >
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-[var(--ink-primary)]">
              {routine.name}
            </h3>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => moveRoutine(routine.id, 'up')}
                disabled={idx === 0}
                aria-label={`Move ${routine.name} up`}
                className="calm-press btn-ghost flex h-7 w-7 items-center justify-center disabled:opacity-25"
              >
                <ArrowUp className="h-4 w-4 stroke-[1.5]" />
              </button>
              <button
                type="button"
                onClick={() => moveRoutine(routine.id, 'down')}
                disabled={idx === total - 1}
                aria-label={`Move ${routine.name} down`}
                className="calm-press btn-ghost flex h-7 w-7 items-center justify-center disabled:opacity-25"
              >
                <ArrowDown className="h-4 w-4 stroke-[1.5]" />
              </button>
              <button
                type="button"
                onClick={() => openEditRoutine(routine)}
                aria-label={`Edit ${routine.name}`}
                className="calm-press btn-ghost flex h-7 w-7 items-center justify-center"
              >
                <Pencil className="h-4 w-4 stroke-[1.5]" />
              </button>
              <button
                type="button"
                onClick={() => duplicateRoutine(routine.id)}
                aria-label={`Duplicate ${routine.name}`}
                className="calm-press btn-ghost flex h-7 w-7 items-center justify-center"
              >
                <Copy className="h-4 w-4 stroke-[1.5]" />
              </button>
              <button
                type="button"
                onClick={() => setPendingDeleteRoutine(routine)}
                aria-label={`Delete ${routine.name}`}
                className="calm-press flex h-7 w-7 items-center justify-center rounded-lg text-[var(--ink-muted)] hover:bg-[var(--accent-clay-tint)] hover:text-[var(--accent-clay)]"
              >
                <Trash2 className="h-4 w-4 stroke-[1.5]" />
              </button>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2 text-xs text-[var(--ink-muted)]">
            <span className="font-mono tabular-nums">
              {routine.exercises.length} {routine.exercises.length === 1 ? 'exercise' : 'exercises'}
            </span>
            <span>·</span>
            <span className="font-mono tabular-nums">
              {totalSets} {totalSets === 1 ? 'set' : 'sets'}
            </span>
            <span>·</span>
            <span className="rounded-[6px] border border-[var(--border-hairline)] bg-[var(--recessed)] px-2 py-0.5 font-mono text-[11px] font-medium text-[var(--ink-secondary)]">
              {unitBadge}
            </span>
          </div>

          <p className="mt-3 line-clamp-2 border-t border-[var(--border-hairline)] pt-3 text-xs leading-relaxed text-[var(--ink-secondary)]">
            {exerciseNames.length > 0
              ? exerciseNames.join(' · ')
              : 'No exercises configured yet'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleStartRoutine(routine.id)}
          className="calm-press btn-secondary mt-4 flex h-9 w-full items-center justify-center gap-2 text-xs font-medium whitespace-nowrap"
        >
          <Play className="h-4 w-4 stroke-[1.5]" />
          Start routine
        </button>
      </article>
    );
  };

  const volumeDeltaKg = weeklyTelemetry.weekVolumeKg - weeklyTelemetry.prevWeekVolumeKg;

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--ink-primary)]">
          Workout
        </h1>
        {db.activeWorkout ? (
          <button
            type="button"
            onClick={() => setActiveWorkoutOpen(true)}
            className="calm-press btn-primary inline-flex h-10 items-center gap-2 px-4 text-sm font-medium whitespace-nowrap"
          >
            <span className="flex h-5 w-5 items-center justify-center">
              <Play className="h-4 w-4 stroke-[1.5]" />
            </span>
            Resume {db.activeWorkout.title}
          </button>
        ) : (
          <button
            type="button"
            onClick={startEmptyWorkout}
            className="calm-press btn-primary inline-flex h-10 items-center gap-2 px-4 text-sm font-medium whitespace-nowrap"
          >
            <span className="flex h-5 w-5 items-center justify-center">
              <Plus className="h-4 w-4 stroke-[1.5]" />
            </span>
            Start empty workout
          </button>
        )}
      </header>

      {/* De-boxed Weekly Summary Strip directly on canvas */}
      <section className="grid grid-cols-1 gap-6 border-y border-[var(--border-hairline)] py-6 md:grid-cols-3 md:gap-0 md:divide-x md:divide-[var(--border-hairline)]">
        {/* Weekly Volume */}
        <div className="md:pr-6">
          <p className="text-xs font-medium text-[var(--ink-secondary)]">Weekly volume</p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-[var(--ink-primary)]">
            {formatVolume(weeklyTelemetry.weekVolumeKg, unit)}
          </p>
          <p className="mt-2 font-mono text-xs tabular-nums text-[var(--ink-muted)]">
            {weeklyTelemetry.prevWeekVolumeKg > 0
              ? `${volumeDeltaKg >= 0 ? '+' : '-'}${formatVolume(Math.abs(volumeDeltaKg), unit)} vs last week`
              : 'Current week total'}
          </p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--recessed)]">
            <div
              className="h-full rounded-full bg-[var(--accent-steel)] transition-[width] duration-200"
              style={{
                width: `${Math.min(100, Math.max(8, (weeklyTelemetry.completedDaysCount / 5) * 100))}%`,
              }}
            />
          </div>
        </div>

        {/* 7-Day Consistency */}
        <div className="md:px-6">
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-medium text-[var(--ink-secondary)]">This week</p>
            <span className="font-mono text-xs tabular-nums text-[var(--ink-primary)]">
              {weeklyTelemetry.completedDaysCount} / 7 days
            </span>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-2">
            {weeklyTelemetry.days.map((d) => (
              <div key={d.key} className="flex flex-col items-center gap-1">
                <span
                  className={`flex h-8 w-full items-center justify-center rounded-lg border text-xs transition-colors ${
                    d.active
                      ? 'border-[var(--accent-sage-border)] bg-[var(--accent-sage-tint)]'
                      : d.isToday
                      ? 'border-[var(--accent-steel-border)] bg-[var(--accent-steel-tint)]'
                      : 'border-[var(--border-hairline)] bg-[var(--recessed)]'
                  }`}
                >
                  {d.active ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-sage)]" />
                  ) : d.isToday ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-steel)]" />
                  ) : null}
                </span>
                <span className="font-mono text-[11px] text-[var(--ink-muted)]">{d.short}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Streak & Completed */}
        <div className="grid grid-cols-2 gap-4 md:pl-6">
          <div>
            <p className="text-xs font-medium text-[var(--ink-secondary)]">Weekly streak</p>
            <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-[var(--ink-primary)]">
              {weeklyTelemetry.streak}
              <span className="ml-1 font-sans text-xs font-normal text-[var(--ink-muted)]">
                wks
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--ink-secondary)]">Completed</p>
            <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-[var(--ink-primary)]">
              {weeklyTelemetry.totalWorkouts}
              <span className="ml-1 font-sans text-xs font-normal text-[var(--ink-muted)]">
                logs
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Routines Section */}
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--ink-primary)]">
              Routines
            </h2>
            <span className="font-mono text-xs tabular-nums text-[var(--ink-muted)]">
              {db.routines.length} {db.routines.length === 1 ? 'routine' : 'routines'} ·{' '}
              {db.folders.length} {db.folders.length === 1 ? 'folder' : 'folders'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setRenamingFolder(null);
                setFolderNameInput('');
                setNewFolderModalOpen(true);
              }}
              className="calm-press btn-secondary inline-flex h-9 items-center gap-2 px-3 text-xs font-medium whitespace-nowrap"
            >
              <FolderPlus className="h-4 w-4 stroke-[1.5]" />
              New folder
            </button>
            <button
              type="button"
              onClick={() => openNewRoutine(null)}
              className="calm-press btn-primary inline-flex h-9 items-center gap-2 px-3 text-xs font-medium whitespace-nowrap"
            >
              <Plus className="h-4 w-4 stroke-[1.5]" />
              New routine
            </button>
          </div>
        </div>

        {/* Empty State */}
        {db.routines.length === 0 && db.folders.length === 0 && (
          <div className="border-t border-[var(--border-hairline)] py-12 text-center">
            <h3 className="text-sm font-semibold text-[var(--ink-primary)]">No routines yet</h3>
            <p className="mx-auto mt-1 max-w-md text-xs text-[var(--ink-secondary)]">
              Create routines and organize them into folders for your training split
            </p>
            <button
              type="button"
              onClick={() => openNewRoutine(null)}
              className="calm-press btn-primary mt-4 inline-flex h-9 items-center gap-2 px-4 text-xs font-medium whitespace-nowrap"
            >
              <Plus className="h-4 w-4 stroke-[1.5]" />
              Create routine
            </button>
          </div>
        )}

        {/* Routine Folders */}
        <div className="space-y-8">
          {sortedFolders.map((folder, fIdx) => {
            const folderRoutines = db.routines
              .filter((r) => r.folderId === folder.id)
              .sort((a, b) => a.sortOrder - b.sortOrder);

            return (
              <section key={folder.id} className="space-y-4">
                <div className="flex min-h-[44px] items-center justify-between gap-2 border-b border-[var(--border-hairline)] pb-2">
                  <button
                    type="button"
                    onClick={() => toggleFolderCollapse(folder.id)}
                    aria-expanded={!folder.isCollapsed}
                    className="calm-press flex min-h-[36px] min-w-0 items-center gap-2 text-left"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[var(--ink-muted)]">
                      <ChevronRight
                        className={`h-4 w-4 stroke-[1.5] transition-transform duration-200 ${
                          folder.isCollapsed ? '' : 'rotate-90'
                        }`}
                      />
                    </span>
                    <span className="truncate text-sm font-semibold text-[var(--ink-primary)]">
                      {folder.name}
                    </span>
                    <span className="font-mono text-xs tabular-nums text-[var(--ink-muted)]">
                      {folderRoutines.length}
                    </span>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openNewRoutine(folder.id)}
                      aria-label={`Add routine to ${folder.name}`}
                      className="calm-press btn-secondary mr-1 inline-flex h-8 items-center gap-1 px-3 text-xs font-medium whitespace-nowrap"
                    >
                      <Plus className="h-4 w-4 stroke-[1.5]" />
                      <span className="hidden sm:inline">Add</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveFolder(folder.id, 'up')}
                      disabled={fIdx === 0}
                      aria-label={`Move folder ${folder.name} up`}
                      className="calm-press btn-ghost flex h-8 w-8 items-center justify-center disabled:opacity-25"
                    >
                      <ArrowUp className="h-4 w-4 stroke-[1.5]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveFolder(folder.id, 'down')}
                      disabled={fIdx === sortedFolders.length - 1}
                      aria-label={`Move folder ${folder.name} down`}
                      className="calm-press btn-ghost flex h-8 w-8 items-center justify-center disabled:opacity-25"
                    >
                      <ArrowDown className="h-4 w-4 stroke-[1.5]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRenamingFolder(folder);
                        setFolderNameInput(folder.name);
                        setNewFolderModalOpen(true);
                      }}
                      aria-label={`Rename folder ${folder.name}`}
                      className="calm-press btn-ghost flex h-8 w-8 items-center justify-center"
                    >
                      <Pencil className="h-4 w-4 stroke-[1.5]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteFolder(folder)}
                      aria-label={`Delete folder ${folder.name}`}
                      className="calm-press flex h-8 w-8 items-center justify-center rounded-lg text-[var(--ink-muted)] hover:bg-[var(--accent-clay-tint)] hover:text-[var(--accent-clay)]"
                    >
                      <Trash2 className="h-4 w-4 stroke-[1.5]" />
                    </button>
                  </div>
                </div>

                <div className="calm-accordion" data-open={!folder.isCollapsed}>
                  <div>
                    {folderRoutines.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-[var(--border-hairline)] px-4 py-5 text-xs text-[var(--ink-muted)]">
                        Empty folder — select Add to assign a routine
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {folderRoutines.map((r, idx) =>
                          renderRoutinePanel(r, idx, folderRoutines.length)
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            );
          })}

          {/* Uncategorized Routines */}
          {uncategorizedRoutines.length > 0 && (
            <section className="space-y-4">
              {sortedFolders.length > 0 && (
                <div className="border-b border-[var(--border-hairline)] pb-2 text-xs font-medium text-[var(--ink-secondary)]">
                  Other routines ({uncategorizedRoutines.length})
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {uncategorizedRoutines.map((r, idx) =>
                  renderRoutinePanel(r, idx, uncategorizedRoutines.length)
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Routine Builder Modal */}
      <RoutineEditorModal
        open={editorOpen}
        editingRoutine={editingRoutine}
        defaultFolderId={defaultFolderId}
        onClose={() => setEditorOpen(false)}
      />

      {/* New / Rename Folder Modal */}
      {newFolderModalOpen && (
        <div
          className="matte-scrim scrim-enter fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={renamingFolder ? 'Rename folder' : 'New folder'}
        >
          <form
            onSubmit={handleSaveFolder}
            className="matte-modal modal-enter w-full max-w-sm p-6"
          >
            <h3 className="text-base font-semibold tracking-[-0.01em] text-[var(--ink-primary)]">
              {renamingFolder ? 'Rename folder' : 'New routine folder'}
            </h3>
            <p className="mt-1 text-xs text-[var(--ink-secondary)]">
              Group routines by split, phase, or training block
            </p>
            <label htmlFor="folder-name-input" className="sr-only">
              Folder name
            </label>
            <input
              id="folder-name-input"
              type="text"
              autoFocus
              value={folderNameInput}
              onChange={(e) => setFolderNameInput(e.target.value)}
              placeholder="e.g. Hypertrophy block"
              className="matte-input mt-4 h-10 w-full px-3 text-sm"
            />
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNewFolderModalOpen(false)}
                className="calm-press btn-secondary h-9 px-4 text-xs font-medium whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!folderNameInput.trim()}
                className="calm-press btn-primary h-9 px-4 text-xs font-medium whitespace-nowrap disabled:opacity-40"
              >
                {renamingFolder ? 'Save' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Routine Confirm */}
      <ConfirmDialog
        open={pendingDeleteRoutine !== null}
        title="Delete routine"
        description={`"${pendingDeleteRoutine?.name}" will be deleted permanently. Logged workout history remains intact`}
        confirmLabel="Delete routine"
        destructive
        onCancel={() => setPendingDeleteRoutine(null)}
        onConfirm={() => {
          if (pendingDeleteRoutine) deleteRoutine(pendingDeleteRoutine.id);
          setPendingDeleteRoutine(null);
        }}
      />

      {/* Delete Folder Confirm */}
      <ConfirmDialog
        open={pendingDeleteFolder !== null}
        title="Delete folder"
        description={`"${pendingDeleteFolder?.name}" will be removed. Routines inside will move to Other routines`}
        confirmLabel="Delete folder"
        destructive
        onCancel={() => setPendingDeleteFolder(null)}
        onConfirm={() => {
          if (pendingDeleteFolder) deleteFolder(pendingDeleteFolder.id);
          setPendingDeleteFolder(null);
        }}
      />

      {/* Replace Active Workout Confirm */}
      <ConfirmDialog
        open={replaceActiveTarget !== null}
        title="Workout in progress"
        description="Starting this routine will replace your active workout session"
        confirmLabel="Start new"
        cancelLabel="Resume current"
        destructive
        onCancel={() => {
          setReplaceActiveTarget(null);
          setActiveWorkoutOpen(true);
        }}
        onConfirm={() => {
          if (replaceActiveTarget) startRoutineWorkout(replaceActiveTarget);
          setReplaceActiveTarget(null);
        }}
      />
    </div>
  );
}
