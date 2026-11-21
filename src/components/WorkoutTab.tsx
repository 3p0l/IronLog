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

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

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

  // Weekly telemetry matrix (Mon-Sun for current week)
  const weeklyTelemetry = useMemo(() => {
    const completed = db.workouts.filter((w) => w.finishedAt !== null);
    const stats = getGlobalTrainingStats(completed, 'ALL');
    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7; // Mon=0 .. Sun=6
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
    monday.setHours(0, 0, 0, 0);

    const workoutDayKeys = new Set(completed.map((w) => toLocalDateKey(w.startedAt)));
    const days = DAY_LABELS.map((label, idx) => {
      const d = new Date(monday.getTime() + idx * 86_400_000);
      const key = toLocalDateKey(d.getTime());
      return {
        label,
        key,
        active: workoutDayKeys.has(key),
        isToday: idx === dayOfWeek,
      };
    });

    const weekStartMs = monday.getTime();
    const weekVolumeKg = completed
      .filter((w) => w.startedAt >= weekStartMs)
      .reduce((acc, w) => acc + calculateWorkoutVolumeKg(w), 0);

    const completedDaysCount = days.filter((d) => d.active).length;

    return {
      days,
      completedDaysCount,
      weekVolumeKg,
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

  const renderRoutineCard = (routine: Routine, idx: number, total: number) => {
    const exerciseNames = routine.exercises
      .map((re) => exerciseMap.get(re.exerciseId)?.name)
      .filter(Boolean) as string[];
    const totalSets = routine.exercises.reduce((acc, e) => acc + e.sets.length, 0);
    const unitsInRoutine = new Set(
      routine.exercises.flatMap((e) =>
        e.sets.map((s) => resolveSetWeightUnit(s.weightUnit, e.weightUnit, unit))
      )
    );
    const unitBadge = unitsInRoutine.size > 1 ? 'MIXED KG/LBS' : ([...unitsInRoutine][0] ?? unit).toUpperCase();

    return (
      <article
        key={routine.id}
        className="group flex flex-col justify-between border border-[#E5E5E5] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#0A0A0A] p-4 transition-colors duration-[180ms] hover:border-[#000000] dark:hover:border-[#FFFFFF]"
      >
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="font-mono text-[10px] font-semibold tracking-[0.08em] text-[#737373] tabular-nums shrink-0">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <h3 className="truncate text-sm font-bold tracking-tight text-[#000000] dark:text-[#FFFFFF]">
                {routine.name}
              </h3>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => moveRoutine(routine.id, 'up')}
                disabled={idx === 0}
                aria-label={`Move ${routine.name} up`}
                className="mech-press flex h-8 w-7 items-center justify-center rounded-[2px] text-[#737373] hover:bg-[#F5F5F5] dark:hover:bg-[#141414] hover:text-[#000000] dark:hover:text-[#FFFFFF] disabled:opacity-25"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => moveRoutine(routine.id, 'down')}
                disabled={idx === total - 1}
                aria-label={`Move ${routine.name} down`}
                className="mech-press flex h-8 w-7 items-center justify-center rounded-[2px] text-[#737373] hover:bg-[#F5F5F5] dark:hover:bg-[#141414] hover:text-[#000000] dark:hover:text-[#FFFFFF] disabled:opacity-25"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => openEditRoutine(routine)}
                aria-label={`Edit ${routine.name}`}
                className="mech-press flex h-8 w-7 items-center justify-center rounded-[2px] text-[#737373] hover:bg-[#F5F5F5] dark:hover:bg-[#141414] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => duplicateRoutine(routine.id)}
                aria-label={`Duplicate ${routine.name}`}
                className="mech-press flex h-8 w-7 items-center justify-center rounded-[2px] text-[#737373] hover:bg-[#F5F5F5] dark:hover:bg-[#141414] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPendingDeleteRoutine(routine)}
                aria-label={`Delete ${routine.name}`}
                className="mech-press flex h-8 w-7 items-center justify-center rounded-[2px] text-[#737373] hover:bg-[#000000] dark:hover:bg-[#FFFFFF] hover:text-[#FFFFFF] dark:hover:text-[#000000]"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.05em] tabular-nums text-[#737373] whitespace-nowrap">
            {routine.exercises.length} {routine.exercises.length === 1 ? 'EX' : 'EXS'} // {totalSets}{' '}
            {totalSets === 1 ? 'SET' : 'SETS'} // {unitBadge}
          </p>

          <p className="mt-3 line-clamp-2 border-t border-[#E5E5E5] dark:border-[#262626] pt-2.5 text-xs leading-relaxed text-[#737373]">
            {exerciseNames.length > 0
              ? exerciseNames.join(' · ')
              : 'No exercises configured. Open editor to add sets.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleStartRoutine(routine.id)}
          className="mech-press mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-[2px] border border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#0A0A0A] font-mono text-xs font-bold tracking-[0.06em] uppercase text-[#000000] dark:text-[#FFFFFF] hover:bg-[#000000] hover:text-[#FFFFFF] dark:hover:bg-[#FFFFFF] dark:hover:text-[#000000]"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          Start Routine
        </button>
      </article>
    );
  };

  return (
    <div className="space-y-8">
      {/* 01 // PITCH-BLACK INVERTED TELEMETRY CONSOLE */}
      <section className="hud-frame border border-[#000000] dark:border-[#262626] bg-[#000000] dark:bg-[#0A0A0A] text-[#FFFFFF]">
        {/* Top Indexed Header Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#262626] px-5 py-3">
          <span className="font-mono text-[10px] font-bold tracking-[0.12em] uppercase text-[#FFFFFF]">
            01 // TELEMETRY OVERVIEW
          </span>
          <span className="font-mono text-[10px] tracking-[0.08em] uppercase tabular-nums text-[#737373]">
            STREAK {String(weeklyTelemetry.streak).padStart(2, '0')}W // TOTAL {String(weeklyTelemetry.totalWorkouts).padStart(2, '0')} LOGS
          </span>
        </div>

        {/* Metrics + 7-Day Consistency Matrix */}
        <div className="grid grid-cols-1 divide-y divide-[#262626] md:grid-cols-[1fr_1fr_auto] md:divide-x md:divide-y-0">
          {/* Weekly Volume & Ruler */}
          <div className="p-5">
            <p className="font-mono text-[10px] font-semibold tracking-[0.08em] uppercase text-[#737373]">
              WEEKLY VOLUME
            </p>
            <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-[#FFFFFF]">
              {formatVolume(weeklyTelemetry.weekVolumeKg, unit)}
            </p>
            <div className="mt-3 space-y-1">
              <div className="h-1.5 w-full bg-[#141414] border border-[#262626]">
                <div
                  className="h-full bg-[#FFFFFF] transition-[width] duration-200"
                  style={{ width: `${Math.min(100, Math.max(8, (weeklyTelemetry.completedDaysCount / 5) * 100))}%` }}
                />
              </div>
              <div className="hud-ruler h-1.5 w-full text-[#262626]" aria-hidden="true" />
            </div>
          </div>

          {/* 7-Day Cadence Matrix */}
          <div className="p-5">
            <div className="flex items-baseline justify-between">
              <p className="font-mono text-[10px] font-semibold tracking-[0.08em] uppercase text-[#737373]">
                7-DAY MATRIX
              </p>
              <span className="font-mono text-[10px] font-bold tabular-nums text-[#FFFFFF]">
                {weeklyTelemetry.completedDaysCount} / 7 DAYS
              </span>
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1.5">
              {weeklyTelemetry.days.map((d) => (
                <div key={d.key} className="flex flex-col items-center gap-1.5">
                  <span
                    className={`flex h-7 w-full items-center justify-center border font-mono text-[10px] font-bold ${
                      d.active
                        ? 'border-[#FFFFFF] bg-[#FFFFFF] text-[#000000]'
                        : d.isToday
                        ? 'border-[#FFFFFF] border-dashed bg-[#141414] text-[#FFFFFF]'
                        : 'border-[#262626] bg-[#0A0A0A] text-[#737373]'
                    }`}
                  >
                    {d.active ? '■' : d.isToday ? '□' : '·'}
                  </span>
                  <span className="font-mono text-[9px] text-[#737373]">{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick-Start Primary Trigger */}
          <div className="flex flex-col justify-between gap-3 p-5 md:w-72">
            <div>
              <h2 className="font-mono text-xs font-bold tracking-[0.08em] uppercase text-[#FFFFFF]">
                QUICK START
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-[#737373]">
                Launch a freestyle session or pick a programmed routine below.
              </p>
            </div>
            {db.activeWorkout ? (
              <button
                type="button"
                onClick={() => setActiveWorkoutOpen(true)}
                className="mech-press inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[2px] border border-[#FFFFFF] bg-[#FFFFFF] px-4 font-mono text-xs font-bold tracking-[0.06em] uppercase text-[#000000] hover:bg-[#E5E5E5] whitespace-nowrap"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                Resume &ldquo;{db.activeWorkout.title}&rdquo;
              </button>
            ) : (
              <button
                type="button"
                onClick={startEmptyWorkout}
                className="mech-press inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[2px] border border-[#FFFFFF] bg-[#FFFFFF] px-4 font-mono text-xs font-bold tracking-[0.06em] uppercase text-[#000000] hover:bg-[#E5E5E5] whitespace-nowrap"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                Start Empty Workout
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 02 // ROUTINES DIRECTORY TOOLBAR */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#000000] dark:border-[#FFFFFF] pb-3">
        <div>
          <p className="font-mono text-[10px] font-bold tracking-[0.12em] uppercase text-[#737373]">
            02 // PROGRAM DIRECTORY
          </p>
          <div className="mt-1 flex items-baseline gap-2.5">
            <h2 className="text-lg font-bold tracking-tight text-[#000000] dark:text-[#FFFFFF]">
              Routines
            </h2>
            <span className="font-mono text-xs tabular-nums text-[#737373]">
              {db.routines.length} {db.routines.length === 1 ? 'routine' : 'routines'} · {db.folders.length}{' '}
              {db.folders.length === 1 ? 'folder' : 'folders'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setRenamingFolder(null);
              setFolderNameInput('');
              setNewFolderModalOpen(true);
            }}
            className="mech-press inline-flex min-h-[40px] items-center gap-2 rounded-[2px] border border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#0A0A0A] px-3.5 font-mono text-[11px] font-bold tracking-[0.06em] uppercase text-[#000000] dark:text-[#FFFFFF] hover:bg-[#000000] hover:text-[#FFFFFF] dark:hover:bg-[#FFFFFF] dark:hover:text-[#000000] whitespace-nowrap"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            New Folder
          </button>
          <button
            type="button"
            onClick={() => openNewRoutine(null)}
            className="mech-press inline-flex min-h-[40px] items-center gap-2 rounded-[2px] border border-[#000000] dark:border-[#FFFFFF] bg-[#000000] dark:bg-[#FFFFFF] px-3.5 font-mono text-[11px] font-bold tracking-[0.06em] uppercase text-[#FFFFFF] dark:text-[#000000] hover:bg-[#262626] dark:hover:bg-[#E5E5E5] whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            New Routine
          </button>
        </div>
      </div>

      {/* Empty State */}
      {db.routines.length === 0 && db.folders.length === 0 && (
        <div className="hud-dot-matrix border border-dashed border-[#D4D4D4] dark:border-[#262626] px-6 py-14 text-center">
          <span className="inline-block border border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#000000] px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
            00 // DIRECTORY EMPTY
          </span>
          <h3 className="mt-3 text-base font-bold text-[#000000] dark:text-[#FFFFFF]">No routines yet</h3>
          <p className="mx-auto mt-1.5 max-w-md text-xs text-[#737373]">
            Create unlimited routines and organize them into folders for Push/Pull/Legs, Upper/Lower, or full-body blocks.
          </p>
          <button
            type="button"
            onClick={() => openNewRoutine(null)}
            className="mech-press mt-5 inline-flex min-h-[42px] items-center gap-2 rounded-[2px] bg-[#000000] dark:bg-[#FFFFFF] px-5 font-mono text-xs font-bold tracking-[0.06em] uppercase text-[#FFFFFF] dark:text-[#000000]"
          >
            <Plus className="h-4 w-4" />
            Create Your First Routine
          </button>
        </div>
      )}

      {/* Routine Folders */}
      <div className="space-y-6">
        {sortedFolders.map((folder, fIdx) => {
          const folderRoutines = db.routines
            .filter((r) => r.folderId === folder.id)
            .sort((a, b) => a.sortOrder - b.sortOrder);

          return (
            <section key={folder.id} className="space-y-3">
              <div className="flex items-center justify-between gap-2 border border-[#E5E5E5] dark:border-[#262626] bg-[#F5F5F5] dark:bg-[#141414] px-3 py-1.5">
                <button
                  type="button"
                  onClick={() => toggleFolderCollapse(folder.id)}
                  aria-expanded={!folder.isCollapsed}
                  className="mech-press flex min-h-[36px] min-w-0 items-center gap-2 text-left"
                >
                  <ChevronRight
                    className={`h-4 w-4 shrink-0 text-[#000000] dark:text-[#FFFFFF] transition-transform duration-200 ${
                      folder.isCollapsed ? '' : 'rotate-90'
                    }`}
                  />
                  <span className="font-mono text-[10px] font-bold tracking-[0.08em] text-[#737373] tabular-nums">
                    F{String(fIdx + 1).padStart(2, '0')}
                  </span>
                  <span className="truncate text-xs font-bold uppercase tracking-[0.06em] text-[#000000] dark:text-[#FFFFFF]">
                    {folder.name}
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-[#737373]">
                    ({folderRoutines.length})
                  </span>
                </button>

                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => openNewRoutine(folder.id)}
                    aria-label={`Add routine to ${folder.name}`}
                    className="mech-press flex h-8 items-center gap-1 rounded-[2px] border border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#0A0A0A] px-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-[#000000] dark:text-[#FFFFFF] hover:bg-[#000000] hover:text-[#FFFFFF] dark:hover:bg-[#FFFFFF] dark:hover:text-[#000000]"
                  >
                    <Plus className="h-3 w-3" />
                    <span className="hidden sm:inline">Add</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveFolder(folder.id, 'up')}
                    disabled={fIdx === 0}
                    aria-label={`Move folder ${folder.name} up`}
                    className="mech-press flex h-8 w-7 items-center justify-center rounded-[2px] text-[#737373] hover:text-[#000000] dark:hover:text-[#FFFFFF] disabled:opacity-25"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveFolder(folder.id, 'down')}
                    disabled={fIdx === sortedFolders.length - 1}
                    aria-label={`Move folder ${folder.name} down`}
                    className="mech-press flex h-8 w-7 items-center justify-center rounded-[2px] text-[#737373] hover:text-[#000000] dark:hover:text-[#FFFFFF] disabled:opacity-25"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRenamingFolder(folder);
                      setFolderNameInput(folder.name);
                      setNewFolderModalOpen(true);
                    }}
                    aria-label={`Rename folder ${folder.name}`}
                    className="mech-press flex h-8 w-7 items-center justify-center rounded-[2px] text-[#737373] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDeleteFolder(folder)}
                    aria-label={`Delete folder ${folder.name}`}
                    className="mech-press flex h-8 w-7 items-center justify-center rounded-[2px] text-[#737373] hover:bg-[#000000] hover:text-[#FFFFFF] dark:hover:bg-[#FFFFFF] dark:hover:text-[#000000]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="hud-accordion" data-open={!folder.isCollapsed}>
                <div>
                  {folderRoutines.length === 0 ? (
                    <p className="border border-dashed border-[#E5E5E5] dark:border-[#262626] px-4 py-4 font-mono text-xs text-[#737373]">
                      Empty folder — click &ldquo;Add&rdquo; to assign a routine.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {folderRoutines.map((r, idx) => renderRoutineCard(r, idx, folderRoutines.length))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        })}

        {/* Uncategorized Routines */}
        {uncategorizedRoutines.length > 0 && (
          <section className="space-y-3">
            {sortedFolders.length > 0 && (
              <div className="border border-[#E5E5E5] dark:border-[#262626] bg-[#F5F5F5] dark:bg-[#141414] px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[#737373]">
                UNASSIGNED // OTHER ROUTINES ({uncategorizedRoutines.length})
              </div>
            )}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {uncategorizedRoutines.map((r, idx) =>
                renderRoutineCard(r, idx, uncategorizedRoutines.length)
              )}
            </div>
          </section>
        )}
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
          className="hud-scrim hud-scrim-enter fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={renamingFolder ? 'Rename folder' : 'New folder'}
        >
          <form
            onSubmit={handleSaveFolder}
            className="hud-modal-enter hud-frame w-full max-w-sm border-2 border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#0A0A0A] p-5"
          >
            <p className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-[#737373]">
              DIRECTORY // FOLDER
            </p>
            <h3 className="mt-1 text-base font-bold text-[#000000] dark:text-[#FFFFFF]">
              {renamingFolder ? 'Rename Folder' : 'New Routine Folder'}
            </h3>
            <label htmlFor="folder-name-input" className="sr-only">
              Folder name
            </label>
            <input
              id="folder-name-input"
              type="text"
              autoFocus
              value={folderNameInput}
              onChange={(e) => setFolderNameInput(e.target.value)}
              placeholder="e.g. Hypertrophy Block"
              className="mt-4 h-11 w-full rounded-[2px] border border-[#000000] dark:border-[#262626] bg-[#F5F5F5] dark:bg-[#141414] px-3.5 text-sm text-[#000000] dark:text-[#FFFFFF] focus:border-[#000000] dark:focus:border-[#FFFFFF] focus:bg-[#FFFFFF] dark:focus:bg-[#000000] focus:outline-none"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNewFolderModalOpen(false)}
                className="mech-press min-h-[40px] rounded-[2px] border border-[#E5E5E5] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#141414] px-4 font-mono text-xs font-bold uppercase tracking-[0.06em] text-[#000000] dark:text-[#FFFFFF] hover:border-[#000000] dark:hover:border-[#FFFFFF]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!folderNameInput.trim()}
                className="mech-press min-h-[40px] rounded-[2px] bg-[#000000] dark:bg-[#FFFFFF] px-4 font-mono text-xs font-bold uppercase tracking-[0.06em] text-[#FFFFFF] dark:text-[#000000] disabled:opacity-40"
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
        title="Delete routine?"
        description={`"${pendingDeleteRoutine?.name}" will be deleted permanently. Logged workout history will not be affected.`}
        confirmLabel="Delete Routine"
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
        title="Delete folder?"
        description={`"${pendingDeleteFolder?.name}" will be removed. Any routines inside will be moved to Other Routines.`}
        confirmLabel="Delete Folder"
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
        title="Workout already in progress"
        description="Starting this routine will replace your current active workout session. Would you like to replace it or resume your active workout?"
        confirmLabel="Start New"
        cancelLabel="Resume Current"
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
