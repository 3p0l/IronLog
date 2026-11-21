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
      setImportError(err instanceof Error ? err.message : 'Unable to parse CSV file.');
    }
    e.target.value = '';
  };

  const handleLoadSampleHevyCsv = () => {
    setImportError('');
    try {
      const parsed = parseHevyCsv(SAMPLE_HEVY_CSV, db.exercises);
      setHevyPreview(parsed);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Sample parse failed.');
    }
  };

  const confirmHevyImport = () => {
    if (!hevyPreview) return;
    importWorkoutsAndExercises(hevyPreview.workouts, hevyPreview.newExercises);
    showToast(
      `Imported ${hevyPreview.workouts.length} workouts (${hevyPreview.totalSets} sets) and ${hevyPreview.newExercises.length} new exercises.`
    );
    setHevyPreview(null);
  };

  const handleExportCsv = () => {
    const csv = exportWorkoutsToCsv(db.workouts, db.exercises);
    const dateStamp = new Date().toISOString().slice(0, 10);
    downloadTextFile(`ironlog-workouts-${dateStamp}.csv`, csv, 'text/csv;charset=utf-8');
    showToast('Workout history CSV exported.');
  };

  const handleExportJson = () => {
    const dateStamp = new Date().toISOString().slice(0, 10);
    downloadTextFile(
      `ironlog-backup-${dateStamp}.json`,
      JSON.stringify(db, null, 2),
      'application/json'
    );
    showToast('Full local database JSON backup downloaded.');
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
        `Restored backup with ${validated.workouts.length} workouts and ${validated.routines.length} routines.`
      );
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Invalid JSON backup file.');
    }
    e.target.value = '';
  };

  const { settings } = db;

  return (
    <div className="space-y-6">
      <div className="border-b border-[#000000] dark:border-[#FFFFFF] pb-3">
        <p className="font-mono text-[10px] font-bold tracking-[0.12em] uppercase text-[#737373]">
          05 // SYSTEM CONFIGURATION
        </p>
        <h2 className="mt-0.5 text-lg font-bold tracking-tight text-[#000000] dark:text-[#FFFFFF]">
          Settings
        </h2>
        <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.04em] text-[#737373]">
          100% LOCAL ON-DEVICE STORAGE // ZERO ACCOUNTS // ZERO PAYWALLS
        </p>
      </div>

      {statusMessage && (
        <div
          role="status"
          className="hud-expand-enter flex items-center gap-2.5 border-2 border-[#000000] dark:border-[#FFFFFF] bg-[#000000] dark:bg-[#FFFFFF] px-4 py-3 font-mono text-xs font-bold text-[#FFFFFF] dark:text-[#000000]"
        >
          <Check className="h-4 w-4 shrink-0 stroke-[2.5]" />
          <span>{statusMessage}</span>
        </div>
      )}

      {importError && (
        <div
          role="alert"
          className="hud-expand-enter border-2 border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#0A0A0A] px-4 py-3 font-mono text-xs font-bold text-[#000000] dark:text-[#FFFFFF]"
        >
          [!] {importError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Preferences Module */}
        <section className="hud-frame border border-[#E5E5E5] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#0A0A0A] p-5 space-y-5">
          <div className="border-b border-[#E5E5E5] dark:border-[#262626] pb-3">
            <p className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-[#737373]">
              01 // CALIBRATION
            </p>
            <h3 className="mt-0.5 text-sm font-bold text-[#000000] dark:text-[#FFFFFF]">
              Units &amp; Polarity
            </h3>
          </div>

          {/* Theme Polarity Toggle */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#000000] dark:text-[#FFFFFF]">Theme</p>
              <p className="text-xs text-[#737373]">
                Switch canvas polarity between light and dark monochrome
              </p>
            </div>
            <div className="flex items-center border border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#0A0A0A]">
              <button
                type="button"
                onClick={() => updateSettings({ theme: 'light' })}
                aria-pressed={settings.theme === 'light'}
                className={`mech-press inline-flex min-h-[36px] items-center gap-1.5 px-3 font-mono text-[11px] font-bold uppercase ${
                  settings.theme === 'light'
                    ? 'bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]'
                    : 'text-[#737373] hover:text-[#000000] dark:hover:text-[#FFFFFF]'
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
                Light
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ theme: 'dark' })}
                aria-pressed={settings.theme === 'dark'}
                className={`mech-press inline-flex min-h-[36px] items-center gap-1.5 px-3 font-mono text-[11px] font-bold uppercase ${
                  settings.theme === 'dark'
                    ? 'bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]'
                    : 'text-[#737373] hover:text-[#000000] dark:hover:text-[#FFFFFF]'
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
                Dark
              </button>
            </div>
          </div>

          {/* Weight Unit */}
          <div className="flex items-center justify-between gap-4 border-t border-[#E5E5E5] dark:border-[#262626] pt-4">
            <div>
              <p className="text-sm font-semibold text-[#000000] dark:text-[#FFFFFF]">Default Weight Unit</p>
              <p className="text-xs text-[#737373]">
                Override per-exercise or per-set anytime during logging
              </p>
            </div>
            <div className="flex items-center border border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#0A0A0A]">
              {(['kg', 'lbs'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => updateSettings({ weightUnit: u })}
                  aria-pressed={settings.weightUnit === u}
                  className={`mech-press min-h-[36px] min-w-[50px] px-3 font-mono text-[11px] font-bold uppercase ${
                    settings.weightUnit === u
                      ? 'bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]'
                      : 'text-[#737373] hover:text-[#000000] dark:hover:text-[#FFFFFF]'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Body Measurement Unit */}
          <div className="flex items-center justify-between gap-4 border-t border-[#E5E5E5] dark:border-[#262626] pt-4">
            <div>
              <p className="text-sm font-semibold text-[#000000] dark:text-[#FFFFFF]">
                Body Measurements
              </p>
              <p className="text-xs text-[#737373]">
                Circumference metrics (chest, waist, biceps)
              </p>
            </div>
            <div className="flex items-center border border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#0A0A0A]">
              {(['cm', 'in'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => updateSettings({ measurementUnit: u })}
                  aria-pressed={settings.measurementUnit === u}
                  className={`mech-press min-h-[36px] min-w-[50px] px-3 font-mono text-[11px] font-bold uppercase ${
                    settings.measurementUnit === u
                      ? 'bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]'
                      : 'text-[#737373] hover:text-[#000000] dark:hover:text-[#FFFFFF]'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Distance Unit */}
          <div className="flex items-center justify-between gap-4 border-t border-[#E5E5E5] dark:border-[#262626] pt-4">
            <div>
              <p className="text-sm font-semibold text-[#000000] dark:text-[#FFFFFF]">Distance Unit</p>
              <p className="text-xs text-[#737373]">Cardio and running tracking</p>
            </div>
            <div className="flex items-center border border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#0A0A0A]">
              {(['km', 'mi'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => updateSettings({ distanceUnit: u })}
                  aria-pressed={settings.distanceUnit === u}
                  className={`mech-press min-h-[36px] min-w-[50px] px-3 font-mono text-[11px] font-bold uppercase ${
                    settings.distanceUnit === u
                      ? 'bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]'
                      : 'text-[#737373] hover:text-[#000000] dark:hover:text-[#FFFFFF]'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Default Rest Timer */}
          <div className="flex items-center justify-between gap-4 border-t border-[#E5E5E5] dark:border-[#262626] pt-4">
            <div>
              <label htmlFor="default-rest-select" className="text-sm font-semibold text-[#000000] dark:text-[#FFFFFF]">
                Default Rest Timer
              </label>
              <p className="text-xs text-[#737373]">
                Auto-starts after completing any set
              </p>
            </div>
            <select
              id="default-rest-select"
              value={settings.defaultRestSeconds}
              onChange={(e) => updateSettings({ defaultRestSeconds: Number(e.target.value) })}
              className="h-9 rounded-[2px] border border-[#000000] dark:border-[#262626] bg-[#F5F5F5] dark:bg-[#141414] px-3 font-mono text-xs font-bold text-[#000000] dark:text-[#FFFFFF]"
            >
              {[30, 45, 60, 75, 90, 120, 150, 180, 240, 300].map((sec) => (
                <option key={sec} value={sec}>
                  {sec} seconds
                </option>
              ))}
            </select>
          </div>

          {/* Rest Sound Alert (Mechanical Square Switch) */}
          <div className="flex items-center justify-between gap-4 border-t border-[#E5E5E5] dark:border-[#262626] pt-4">
            <div>
              <p className="text-sm font-semibold text-[#000000] dark:text-[#FFFFFF]">
                Rest Timer Alert Chime
              </p>
              <p className="text-xs text-[#737373]">
                Play acoustic chime when rest countdown finishes
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.restSoundEnabled}
              onClick={() => updateSettings({ restSoundEnabled: !settings.restSoundEnabled })}
              className={`mech-press relative inline-flex h-7 w-12 shrink-0 items-center rounded-[2px] border border-[#000000] dark:border-[#FFFFFF] ${
                settings.restSoundEnabled
                  ? 'bg-[#000000] dark:bg-[#FFFFFF]'
                  : 'bg-[#FFFFFF] dark:bg-[#0A0A0A]'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform transition-transform duration-150 ${
                  settings.restSoundEnabled
                    ? 'translate-x-6 bg-[#FFFFFF] dark:bg-[#000000]'
                    : 'translate-x-1 bg-[#000000] dark:bg-[#FFFFFF]'
                }`}
              />
            </button>
          </div>
        </section>

        {/* Data Portability & Hevy Migration */}
        <section className="space-y-5">
          {/* Hevy CSV Importer */}
          <div className="hud-frame border border-[#E5E5E5] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#0A0A0A] p-5 space-y-4">
            <div className="border-b border-[#E5E5E5] dark:border-[#262626] pb-3">
              <p className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-[#737373]">
                02 // MIGRATION
              </p>
              <h3 className="mt-0.5 text-sm font-bold text-[#000000] dark:text-[#FFFFFF]">
                Hevy CSV Importer
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-[#737373]">
                Import standard Hevy workout export CSV files directly into local storage. Missing exercises are created automatically.
              </p>
            </div>

            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleHevyFileChange}
              className="hidden"
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => csvInputRef.current?.click()}
                className="mech-press inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-[2px] border border-[#000000] dark:border-[#FFFFFF] bg-[#000000] dark:bg-[#FFFFFF] px-4 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-[#FFFFFF] dark:text-[#000000] hover:bg-[#262626] dark:hover:bg-[#E5E5E5] whitespace-nowrap"
              >
                <Upload className="h-3.5 w-3.5" />
                Upload Hevy CSV
              </button>
              <button
                type="button"
                onClick={handleLoadSampleHevyCsv}
                className="mech-press inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[2px] border border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#0A0A0A] px-4 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-[#000000] dark:text-[#FFFFFF] hover:bg-[#000000] hover:text-[#FFFFFF] dark:hover:bg-[#FFFFFF] dark:hover:text-[#000000] whitespace-nowrap"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Test Sample CSV
              </button>
            </div>

            {hevyPreview && (
              <div className="hud-expand-enter border-2 border-[#000000] dark:border-[#FFFFFF] bg-[#F5F5F5] dark:bg-[#141414] p-4 space-y-3">
                <div className="text-xs leading-relaxed text-[#000000] dark:text-[#FFFFFF]">
                  <p className="font-mono text-[11px] font-bold uppercase tracking-[0.06em]">
                    ■ READY TO IMPORT HEVY HISTORY
                  </p>
                  <p className="mt-1 font-mono text-xs tabular-nums text-[#737373]">
                    {hevyPreview.workouts.length} {hevyPreview.workouts.length === 1 ? 'workout' : 'workouts'} //{' '}
                    {hevyPreview.totalSets} sets // {hevyPreview.newExercises.length} new custom{' '}
                    {hevyPreview.newExercises.length === 1 ? 'exercise' : 'exercises'}
                  </p>
                  {hevyPreview.newExercises.length > 0 && (
                    <p className="mt-1 font-mono text-[11px] text-[#000000] dark:text-[#FFFFFF]">
                      NEW: {hevyPreview.newExercises.map((e) => e.name).join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={confirmHevyImport}
                    className="mech-press min-h-[38px] rounded-[2px] bg-[#000000] dark:bg-[#FFFFFF] px-4 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-[#FFFFFF] dark:text-[#000000]"
                  >
                    Confirm Import
                  </button>
                  <button
                    type="button"
                    onClick={() => setHevyPreview(null)}
                    className="mech-press min-h-[38px] rounded-[2px] border border-[#D4D4D4] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#0A0A0A] px-3 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-[#000000] dark:text-[#FFFFFF]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Backup & Export */}
          <div className="hud-frame border border-[#E5E5E5] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#0A0A0A] p-5 space-y-4">
            <div className="border-b border-[#E5E5E5] dark:border-[#262626] pb-3">
              <p className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-[#737373]">
                03 // PORTABILITY
              </p>
              <h3 className="mt-0.5 text-sm font-bold text-[#000000] dark:text-[#FFFFFF]">
                Backup &amp; Export
              </h3>
              <p className="mt-0.5 text-xs text-[#737373]">
                Move your entire local database to a new device or export spreadsheets anytime.
              </p>
            </div>

            <input
              ref={jsonInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleRestoreJsonFile}
              className="hidden"
            />

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={handleExportJson}
                className="mech-press inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[2px] border border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#0A0A0A] px-3 font-mono text-[11px] font-bold uppercase tracking-[0.04em] text-[#000000] dark:text-[#FFFFFF] hover:bg-[#000000] hover:text-[#FFFFFF] dark:hover:bg-[#FFFFFF] dark:hover:text-[#000000]"
              >
                <Download className="h-3.5 w-3.5" />
                JSON Backup
              </button>
              <button
                type="button"
                onClick={() => jsonInputRef.current?.click()}
                className="mech-press inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[2px] border border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#0A0A0A] px-3 font-mono text-[11px] font-bold uppercase tracking-[0.04em] text-[#000000] dark:text-[#FFFFFF] hover:bg-[#000000] hover:text-[#FFFFFF] dark:hover:bg-[#FFFFFF] dark:hover:text-[#000000]"
              >
                <Upload className="h-3.5 w-3.5" />
                Restore JSON
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                className="mech-press inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[2px] border border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#0A0A0A] px-3 font-mono text-[11px] font-bold uppercase tracking-[0.04em] text-[#000000] dark:text-[#FFFFFF] hover:bg-[#000000] hover:text-[#FFFFFF] dark:hover:bg-[#FFFFFF] dark:hover:text-[#000000]"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Export CSV
              </button>
            </div>

            <div className="border-t border-[#E5E5E5] dark:border-[#262626] pt-4">
              <div className="hud-hatch-strong mb-3 h-1.5 w-full" aria-hidden="true" />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmResetOpen(true)}
                  className="mech-press inline-flex min-h-[38px] items-center gap-1.5 rounded-[2px] border border-[#D4D4D4] dark:border-[#262626] px-3 font-mono text-[11px] font-bold uppercase tracking-[0.04em] text-[#737373] hover:border-[#000000] dark:hover:border-[#FFFFFF] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset Demo Data
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearOpen(true)}
                  className="mech-press inline-flex min-h-[38px] items-center gap-1.5 rounded-[2px] border border-[#000000] dark:border-[#FFFFFF] px-3 font-mono text-[11px] font-bold uppercase tracking-[0.04em] text-[#000000] dark:text-[#FFFFFF] hover:bg-[#000000] hover:text-[#FFFFFF] dark:hover:bg-[#FFFFFF] dark:hover:text-[#000000]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Start Fresh (Clear All)
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={confirmResetOpen}
        title="Reset to sample data?"
        description="This replaces your local workout logs and routines with the default demo training block."
        confirmLabel="Reset Data"
        destructive
        onCancel={() => setConfirmResetOpen(false)}
        onConfirm={() => {
          resetToSampleData();
          setConfirmResetOpen(false);
          showToast('Sample training data restored.');
        }}
      />

      <ConfirmDialog
        open={confirmClearOpen}
        title="Clear all workout data?"
        description="This removes all routines, folders, workout logs, custom exercises, and body measurements, leaving only the 128 built-in exercises."
        confirmLabel="Clear Everything"
        destructive
        onCancel={() => setConfirmClearOpen(false)}
        onConfirm={() => {
          clearAllData();
          setConfirmClearOpen(false);
          showToast('Local database cleared. Fresh start ready.');
        }}
      />
    </div>
  );
}
