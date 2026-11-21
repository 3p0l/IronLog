import React, { useRef, useState } from 'react';
import {
  Check,
  Download,
  FileSpreadsheet,
  Moon,
  RotateCcw,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import {
  HevyImportResult,
  SAMPLE_HEVY_CSV,
  exportWorkoutsToCsv,
  parseHevyCsv,
  validateBackupJson,
} from '../utils/hevyCsv';
import { downloadTextFile } from '../utils/feedback';
import { ConfirmDialog } from './ConfirmDialog';
import { SegmentedControl, ToggleSwitch } from './ui/LinearPrimitives';

export function SettingsTab() {
  const {
    db,
    updateSettings,
    importWorkoutsAndExercises,
    restoreDatabase,
    resetToSampleData,
    clearAllData,
  } = useWorkout();

  const csvInputRef = useRef<HTMLInputElement | null>(null);
  const jsonInputRef = useRef<HTMLInputElement | null>(null);

  const [hevyPreview, setHevyPreview] = useState<HevyImportResult | null>(null);
  const [importError, setImportError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    window.setTimeout(() => {
      setStatusMessage((cur) => (cur === msg ? '' : cur));
    }, 4500);
  };

  const handleHevyFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    try {
      const text = await file.text();
      const parsed = parseHevyCsv(text, db.exercises);
      setHevyPreview(parsed);
    } catch (err) {
      setHevyPreview(null);
      setImportError(err instanceof Error ? err.message : 'Unable to parse CSV file');
    }
    e.target.value = '';
  };

  const handleLoadSampleHevyCsv = () => {
    setImportError('');
    try {
      const parsed = parseHevyCsv(SAMPLE_HEVY_CSV, db.exercises);
      setHevyPreview(parsed);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Sample parse failed');
    }
  };

  const confirmHevyImport = () => {
    if (!hevyPreview) return;
    importWorkoutsAndExercises(hevyPreview.workouts, hevyPreview.newExercises);
    showToast(
      `Imported ${hevyPreview.workouts.length} workouts (${hevyPreview.totalSets} sets) and ${hevyPreview.newExercises.length} new exercises`
    );
    setHevyPreview(null);
  };

  const handleExportCsv = () => {
    const csv = exportWorkoutsToCsv(db.workouts, db.exercises);
    const dateStamp = new Date().toISOString().slice(0, 10);
    downloadTextFile(`ironlog-workouts-${dateStamp}.csv`, csv, 'text/csv;charset=utf-8');
    showToast('Workout history CSV exported');
  };

  const handleExportJson = () => {
    const dateStamp = new Date().toISOString().slice(0, 10);
    downloadTextFile(
      `ironlog-backup-${dateStamp}.json`,
      JSON.stringify(db, null, 2),
      'application/json'
    );
    showToast('Local database JSON backup downloaded');
  };

  const handleRestoreJsonFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    try {
      const text = await file.text();
      const validated = validateBackupJson(text);
      restoreDatabase(validated);
      showToast(
        `Restored ${validated.workouts.length} workouts and ${validated.routines.length} routines`
      );
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Invalid JSON backup file');
    }
    e.target.value = '';
  };

  const { settings } = db;

  return (
    <div className="max-w-[760px] space-y-10">
      {/* Page Header */}
      <header>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--ink-primary)]">
          Settings
        </h1>
      </header>

      {statusMessage && (
        <div
          role="status"
          className="view-enter status-tick status-tick-sage flex items-center gap-3 rounded-lg border border-[var(--accent-sage-border)] bg-[var(--accent-sage-tint)] py-3 pl-4 pr-4 text-sm text-[var(--ink-primary)]"
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[var(--accent-sage)]">
            <Check className="h-4 w-4 stroke-[1.5]" />
          </span>
          <span>{statusMessage}</span>
        </div>
      )}

      {importError && (
        <div
          role="alert"
          className="view-enter rounded-lg border border-[var(--accent-clay-border)] bg-[var(--accent-clay-tint)] px-4 py-3 text-sm text-[var(--accent-clay)]"
        >
          {importError}
        </div>
      )}

      {/* Section 1: Preferences (De-boxed on canvas with hairline dividers) */}
      <section aria-labelledby="settings-preferences-heading" className="space-y-4">
        <div className="border-b border-[var(--border-hairline)] pb-3">
          <h2
            id="settings-preferences-heading"
            className="text-sm font-semibold text-[var(--ink-primary)]"
          >
            Preferences
          </h2>
        </div>

        <div className="divide-y divide-[var(--border-hairline)]">
          {/* Theme */}
          <div className="flex min-h-[52px] flex-wrap items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--ink-primary)]">Theme</p>
              <p className="mt-1 text-xs text-[var(--ink-secondary)]">
                Switch between dark charcoal and light stone
              </p>
            </div>
            <SegmentedControl
              layoutId="settings-theme-seg"
              ariaLabel="Theme"
              value={settings.theme}
              onChange={(theme) => updateSettings({ theme })}
              options={[
                {
                  value: 'light',
                  label: (
                    <>
                      <Sun className="h-4 w-4 stroke-[1.5]" />
                      Light
                    </>
                  ),
                },
                {
                  value: 'dark',
                  label: (
                    <>
                      <Moon className="h-4 w-4 stroke-[1.5]" />
                      Dark
                    </>
                  ),
                },
              ]}
            />
          </div>

          {/* Default Weight Unit */}
          <div className="flex min-h-[52px] flex-wrap items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--ink-primary)]">
                Default weight unit
              </p>
              <p className="mt-1 text-xs text-[var(--ink-secondary)]">
                Can be overridden per exercise or per set while logging
              </p>
            </div>
            <SegmentedControl
              layoutId="settings-weight-seg"
              ariaLabel="Default weight unit"
              value={settings.weightUnit}
              onChange={(weightUnit) => updateSettings({ weightUnit })}
              options={[
                { value: 'kg', label: <span className="font-mono">kg</span> },
                { value: 'lbs', label: <span className="font-mono">lbs</span> },
              ]}
            />
          </div>

          {/* Body Measurements */}
          <div className="flex min-h-[52px] flex-wrap items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--ink-primary)]">
                Body measurements
              </p>
              <p className="mt-1 text-xs text-[var(--ink-secondary)]">
                Circumference metrics for chest, waist, and limbs
              </p>
            </div>
            <SegmentedControl
              layoutId="settings-measure-seg"
              ariaLabel="Body measurement unit"
              value={settings.measurementUnit}
              onChange={(measurementUnit) => updateSettings({ measurementUnit })}
              options={[
                { value: 'cm', label: <span className="font-mono">cm</span> },
                { value: 'in', label: <span className="font-mono">in</span> },
              ]}
            />
          </div>

          {/* Distance Unit */}
          <div className="flex min-h-[52px] flex-wrap items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--ink-primary)]">Distance unit</p>
              <p className="mt-1 text-xs text-[var(--ink-secondary)]">
                Cardio and running distance
              </p>
            </div>
            <SegmentedControl
              layoutId="settings-distance-seg"
              ariaLabel="Distance unit"
              value={settings.distanceUnit}
              onChange={(distanceUnit) => updateSettings({ distanceUnit })}
              options={[
                { value: 'km', label: <span className="font-mono">km</span> },
                { value: 'mi', label: <span className="font-mono">mi</span> },
              ]}
            />
          </div>

          {/* Default Rest Timer */}
          <div className="flex min-h-[52px] flex-wrap items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <label
                htmlFor="default-rest-select"
                className="text-sm font-medium text-[var(--ink-primary)]"
              >
                Default rest timer
              </label>
              <p className="mt-1 text-xs text-[var(--ink-secondary)]">
                Starts automatically after completing a set
              </p>
            </div>
            <select
              id="default-rest-select"
              value={settings.defaultRestSeconds}
              onChange={(e) => updateSettings({ defaultRestSeconds: Number(e.target.value) })}
              className="matte-input h-9 px-3 text-xs font-medium tabular-nums"
            >
              {[30, 45, 60, 75, 90, 120, 150, 180, 240, 300].map((sec) => (
                <option key={sec} value={sec}>
                  {sec} seconds
                </option>
              ))}
            </select>
          </div>

          {/* Rest Timer Alert Chime */}
          <div className="flex min-h-[52px] items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--ink-primary)]">
                Rest timer chime
              </p>
              <p className="mt-1 text-xs text-[var(--ink-secondary)]">
                Play a tone when rest countdown ends
              </p>
            </div>
            <ToggleSwitch
              checked={settings.restSoundEnabled}
              onChange={(restSoundEnabled) => updateSettings({ restSoundEnabled })}
              ariaLabel="Rest timer chime"
            />
          </div>
        </div>
      </section>

      {/* Section 2: Hevy CSV Import */}
      <section aria-labelledby="settings-hevy-heading" className="space-y-4">
        <div className="border-b border-[var(--border-hairline)] pb-3">
          <h2
            id="settings-hevy-heading"
            className="text-sm font-semibold text-[var(--ink-primary)]"
          >
            Hevy CSV import
          </h2>
          <p className="mt-1 text-xs text-[var(--ink-secondary)]">
            Import Hevy workout export files into local storage with automatic exercise matching
          </p>
        </div>

        <input
          ref={csvInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleHevyFileChange}
          className="hidden"
        />

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => csvInputRef.current?.click()}
            className="calm-press btn-primary inline-flex h-10 items-center gap-2 px-4 text-sm font-medium whitespace-nowrap"
          >
            <span className="flex h-5 w-5 items-center justify-center">
              <Upload className="h-4 w-4 stroke-[1.5]" />
            </span>
            Upload Hevy CSV
          </button>
          <button
            type="button"
            onClick={handleLoadSampleHevyCsv}
            className="calm-press btn-secondary inline-flex h-10 items-center gap-2 px-4 text-sm font-medium whitespace-nowrap"
          >
            <span className="flex h-5 w-5 items-center justify-center text-[var(--ink-secondary)]">
              <FileSpreadsheet className="h-4 w-4 stroke-[1.5]" />
            </span>
            Load sample
          </button>
        </div>

        {hevyPreview && (
          <div className="view-enter matte-surface p-4 space-y-3">
            <div className="text-sm text-[var(--ink-primary)]">
              <p className="font-medium">Ready to import</p>
              <p className="mt-1 font-mono text-xs tabular-nums text-[var(--ink-secondary)]">
                {hevyPreview.workouts.length}{' '}
                {hevyPreview.workouts.length === 1 ? 'workout' : 'workouts'} ·{' '}
                {hevyPreview.totalSets} sets · {hevyPreview.newExercises.length} new{' '}
                {hevyPreview.newExercises.length === 1 ? 'exercise' : 'exercises'}
              </p>
              {hevyPreview.newExercises.length > 0 && (
                <p className="mt-2 text-xs text-[var(--ink-secondary)]">
                  New exercises: {hevyPreview.newExercises.map((e) => e.name).join(', ')}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={confirmHevyImport}
                className="calm-press btn-primary h-9 px-4 text-sm font-medium whitespace-nowrap"
              >
                Confirm import
              </button>
              <button
                type="button"
                onClick={() => setHevyPreview(null)}
                className="calm-press btn-secondary h-9 px-4 text-sm font-medium whitespace-nowrap"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Section 3: Backup and Export */}
      <section aria-labelledby="settings-backup-heading" className="space-y-4">
        <div className="border-b border-[var(--border-hairline)] pb-3">
          <h2
            id="settings-backup-heading"
            className="text-sm font-semibold text-[var(--ink-primary)]"
          >
            Backup and export
          </h2>
          <p className="mt-1 text-xs text-[var(--ink-secondary)]">
            Transfer local data between devices or export workout logs as CSV
          </p>
        </div>

        <input
          ref={jsonInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleRestoreJsonFile}
          className="hidden"
        />

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportJson}
            className="calm-press btn-secondary inline-flex h-10 items-center gap-2 px-4 text-sm font-medium whitespace-nowrap"
          >
            <span className="flex h-5 w-5 items-center justify-center text-[var(--ink-secondary)]">
              <Download className="h-4 w-4 stroke-[1.5]" />
            </span>
            Backup JSON
          </button>
          <button
            type="button"
            onClick={() => jsonInputRef.current?.click()}
            className="calm-press btn-secondary inline-flex h-10 items-center gap-2 px-4 text-sm font-medium whitespace-nowrap"
          >
            <span className="flex h-5 w-5 items-center justify-center text-[var(--ink-secondary)]">
              <Upload className="h-4 w-4 stroke-[1.5]" />
            </span>
            Restore JSON
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="calm-press btn-secondary inline-flex h-10 items-center gap-2 px-4 text-sm font-medium whitespace-nowrap"
          >
            <span className="flex h-5 w-5 items-center justify-center text-[var(--ink-secondary)]">
              <FileSpreadsheet className="h-4 w-4 stroke-[1.5]" />
            </span>
            Export CSV
          </button>
        </div>
      </section>

      {/* Section 4: Data Management */}
      <section aria-labelledby="settings-data-heading" className="space-y-4">
        <div className="border-b border-[var(--border-hairline)] pb-3">
          <h2
            id="settings-data-heading"
            className="text-sm font-semibold text-[var(--ink-primary)]"
          >
            Data management
          </h2>
          <p className="mt-1 text-xs text-[var(--ink-secondary)]">
            Restore sample workouts or clear all stored local records
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setConfirmResetOpen(true)}
            className="calm-press btn-secondary inline-flex h-10 items-center gap-2 px-4 text-sm font-medium whitespace-nowrap"
          >
            <span className="flex h-5 w-5 items-center justify-center text-[var(--ink-secondary)]">
              <RotateCcw className="h-4 w-4 stroke-[1.5]" />
            </span>
            Reset demo data
          </button>
          <button
            type="button"
            onClick={() => setConfirmClearOpen(true)}
            className="calm-press btn-danger inline-flex h-10 items-center gap-2 px-4 text-sm font-medium whitespace-nowrap"
          >
            <span className="flex h-5 w-5 items-center justify-center">
              <Trash2 className="h-4 w-4 stroke-[1.5]" />
            </span>
            Clear all data
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={confirmResetOpen}
        title="Reset to sample data"
        description="This replaces local workout logs and routines with the default training block"
        confirmLabel="Reset demo data"
        destructive
        onCancel={() => setConfirmResetOpen(false)}
        onConfirm={() => {
          resetToSampleData();
          setConfirmResetOpen(false);
          showToast('Sample training data restored');
        }}
      />

      <ConfirmDialog
        open={confirmClearOpen}
        title="Clear all data"
        description="This removes all routines, folders, workout logs, custom exercises, and body measurements, keeping built-in exercises intact"
        confirmLabel="Clear all data"
        destructive
        onCancel={() => setConfirmClearOpen(false)}
        onConfirm={() => {
          clearAllData();
          setConfirmClearOpen(false);
          showToast('Local database cleared');
        }}
      />
    </div>
  );
}
