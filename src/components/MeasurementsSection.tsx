import React, { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import {
  BodyMeasurementEntry,
  MEASUREMENT_FIELDS,
  MeasurementKey,
  TimeframeFilter,
} from '../types/workout';
import { useWorkout } from '../context/WorkoutContext';
import {
  convertMeasurementFromBase,
  convertMeasurementToBase,
  getMeasurementSeries,
  getMeasurementUnitLabel,
  toLocalDateKey,
} from '../utils/calculations';
import { ProgressChart } from './charts/ProgressChart';
import { ConfirmDialog } from './ConfirmDialog';
import { SegmentedControl } from './ui/LinearPrimitives';

const TIMEFRAMES: TimeframeFilter[] = ['1M', '3M', '6M', '1Y', 'ALL'];

export function MeasurementsSection() {
  const { db, saveMeasurementEntry, deleteMeasurementEntry } = useWorkout();
  const [selectedMetric, setSelectedMetric] = useState<MeasurementKey>('bodyWeightKg');
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BodyMeasurementEntry | null>(null);
  const [entryDate, setEntryDate] = useState(() => toLocalDateKey(Date.now()));
  const [entryNotes, setEntryNotes] = useState('');
  const [formValues, setFormValues] = useState<Partial<Record<MeasurementKey, string>>>({});
  const [formError, setFormError] = useState('');
  const [deletingEntry, setDeletingEntry] = useState<BodyMeasurementEntry | null>(null);

  const { weightUnit, measurementUnit } = db.settings;

  const activeMeta = useMemo(
    () => MEASUREMENT_FIELDS.find((f) => f.key === selectedMetric) ?? MEASUREMENT_FIELDS[0],
    [selectedMetric]
  );

  const activeUnitLabel = getMeasurementUnitLabel(activeMeta.kind, weightUnit, measurementUnit);

  const chartSeries = useMemo(() => {
    const raw = getMeasurementSeries(db.measurements, selectedMetric, timeframe);
    return raw.map((pt) => ({
      label: pt.dateLabel,
      value: convertMeasurementFromBase(pt.value, activeMeta.kind, weightUnit, measurementUnit),
      sublabel: pt.date,
    }));
  }, [db.measurements, selectedMetric, timeframe, activeMeta.kind, weightUnit, measurementUnit]);

  const latestByKey = useMemo(() => {
    const sorted = [...db.measurements].sort((a, b) => b.timestamp - a.timestamp);
    const map = new Map<MeasurementKey, { value: number; date: string }>();
    for (const entry of sorted) {
      for (const field of MEASUREMENT_FIELDS) {
        if (!map.has(field.key) && typeof entry.values[field.key] === 'number') {
          map.set(field.key, { value: entry.values[field.key]!, date: entry.date });
        }
      }
    }
    return map;
  }, [db.measurements]);

  const sortedEntries = useMemo(
    () => [...db.measurements].sort((a, b) => b.timestamp - a.timestamp),
    [db.measurements]
  );

  const openLogModal = (entry?: BodyMeasurementEntry) => {
    if (entry) {
      setEditingEntry(entry);
      setEntryDate(entry.date);
      setEntryNotes(entry.notes ?? '');
      const initial: Partial<Record<MeasurementKey, string>> = {};
      for (const field of MEASUREMENT_FIELDS) {
        const base = entry.values[field.key];
        if (typeof base === 'number') {
          initial[field.key] = String(
            convertMeasurementFromBase(base, field.kind, weightUnit, measurementUnit)
          );
        }
      }
      setFormValues(initial);
    } else {
      setEditingEntry(null);
      setEntryDate(toLocalDateKey(Date.now()));
      setEntryNotes('');
      setFormValues({});
    }
    setFormError('');
    setModalOpen(true);
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const values: Partial<Record<MeasurementKey, number>> = {};
    for (const field of MEASUREMENT_FIELDS) {
      const raw = formValues[field.key]?.trim();
      if (!raw) continue;
      const num = Number(raw);
      if (Number.isFinite(num) && num > 0) {
        values[field.key] = convertMeasurementToBase(num, field.kind, weightUnit, measurementUnit);
      }
    }

    if (Object.keys(values).length === 0) {
      setFormError('Enter at least one measurement value before saving');
      return;
    }

    const [y, m, d] = entryDate.split('-').map(Number);
    const timestamp = new Date(y, m - 1, d, 12, 0, 0).getTime();

    saveMeasurementEntry({
      id: editingEntry?.id,
      date: entryDate,
      timestamp,
      values,
      notes: entryNotes.trim() || undefined,
    });
    setModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-hairline)] pb-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--ink-primary)]">
            Body measurements
          </h2>
          <p className="mt-1 text-xs text-[var(--ink-secondary)]">
            Bodyweight, body fat, and circumference trends
          </p>
        </div>
        <button
          type="button"
          onClick={() => openLogModal()}
          className="calm-press btn-primary inline-flex h-9 items-center gap-2 px-4 text-sm font-medium whitespace-nowrap"
        >
          <Plus className="h-4 w-4 stroke-[1.5]" />
          Log measurements
        </button>
      </div>

      {/* Split: De-boxed Metric Selector + Matte Sand Trend Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        {/* Metric Selector List directly on canvas */}
        <div className="max-h-[380px] divide-y divide-[var(--border-hairline)] overflow-y-auto pr-1">
          {MEASUREMENT_FIELDS.map((field) => {
            const latest = latestByKey.get(field.key);
            const u = getMeasurementUnitLabel(field.kind, weightUnit, measurementUnit);
            const isSelected = field.key === selectedMetric;
            return (
              <button
                key={field.key}
                type="button"
                onClick={() => setSelectedMetric(field.key)}
                className={`calm-press flex min-h-[44px] w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors ${
                  isSelected
                    ? 'status-tick status-tick-sand bg-[var(--surface-active)] text-[var(--ink-primary)]'
                    : 'text-[var(--ink-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink-primary)]'
                }`}
              >
                <span className="text-xs font-medium">{field.label}</span>
                <span
                  className={`font-mono text-xs tabular-nums ${
                    isSelected ? 'font-semibold text-[var(--ink-primary)]' : 'text-[var(--ink-muted)]'
                  }`}
                >
                  {latest
                    ? `${convertMeasurementFromBase(latest.value, field.kind, weightUnit, measurementUnit)} ${u}`
                    : '—'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Trend Chart (Matte interactive chart container) */}
        <div className="matte-surface p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[var(--ink-primary)]">
                {activeMeta.label} trend
              </h3>
              <p className="mt-1 text-xs text-[var(--ink-muted)]">
                Measured in {activeUnitLabel}
              </p>
            </div>
            <SegmentedControl<TimeframeFilter>
              value={timeframe}
              onChange={setTimeframe}
              layoutId="measurements-tf-pill"
              size="xs"
              ariaLabel="Body measurement timeframe"
              options={TIMEFRAMES.map((tf) => ({
                value: tf,
                label: tf === 'ALL' ? 'All' : tf,
              }))}
            />
          </div>

          <ProgressChart
            data={chartSeries}
            unit={activeUnitLabel}
            mode="line"
            tone="sand"
            height={232}
            emptyMessage={`No ${activeMeta.label.toLowerCase()} entries logged in range`}
          />
        </div>
      </div>

      {/* De-boxed Entry History List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
          <h3 className="text-sm font-semibold text-[var(--ink-primary)]">Measurement log</h3>
          <span className="font-mono text-xs tabular-nums text-[var(--ink-muted)]">
            {sortedEntries.length} {sortedEntries.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>
        {sortedEntries.length === 0 ? (
          <p className="py-10 text-center text-sm text-[var(--ink-muted)]">
            No body measurements logged yet
          </p>
        ) : (
          <div className="divide-y divide-[var(--border-hairline)]">
            {sortedEntries.map((entry) => {
              const summaryPairs = MEASUREMENT_FIELDS.filter(
                (f) => typeof entry.values[f.key] === 'number'
              ).map((f) => {
                const v = convertMeasurementFromBase(
                  entry.values[f.key]!,
                  f.kind,
                  weightUnit,
                  measurementUnit
                );
                const u = getMeasurementUnitLabel(f.kind, weightUnit, measurementUnit);
                return `${f.label}: ${v}${u}`;
              });

              return (
                <div
                  key={entry.id}
                  className="flex min-h-[52px] flex-col justify-between gap-2 py-3 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-semibold tabular-nums text-[var(--ink-primary)]">
                      {entry.date}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--ink-secondary)]">
                      {summaryPairs.join(' · ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openLogModal(entry)}
                      aria-label={`Edit measurement ${entry.date}`}
                      className="calm-press btn-ghost flex h-8 w-8 items-center justify-center"
                    >
                      <Pencil className="h-4 w-4 stroke-[1.5]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingEntry(entry)}
                      aria-label={`Delete measurement ${entry.date}`}
                      className="calm-press flex h-8 w-8 items-center justify-center rounded-lg text-[var(--ink-muted)] hover:bg-[var(--accent-clay-tint)] hover:text-[var(--accent-clay)]"
                    >
                      <Trash2 className="h-4 w-4 stroke-[1.5]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Log / Edit Measurement Modal */}
      {modalOpen && (
        <div
          className="matte-scrim scrim-enter fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={editingEntry ? 'Edit body measurements' : 'Log body measurements'}
        >
          <form
            onSubmit={handleSaveEntry}
            className="matte-modal modal-enter flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] px-5 py-4">
              <div>
                <h3 className="text-base font-semibold tracking-[-0.01em] text-[var(--ink-primary)]">
                  {editingEntry ? 'Edit measurement entry' : 'Log body measurements'}
                </h3>
                <p className="mt-1 text-xs text-[var(--ink-secondary)]">
                  Enter any metrics to record for this date
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close measurement modal"
                className="calm-press btn-ghost flex h-8 w-8 items-center justify-center"
              >
                <X className="h-4 w-4 stroke-[1.5]" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="bm-date"
                    className="mb-2 block text-xs font-medium text-[var(--ink-secondary)]"
                  >
                    Date
                  </label>
                  <input
                    id="bm-date"
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="matte-input h-10 w-full px-3 font-mono text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label
                    htmlFor="bm-notes"
                    className="mb-2 block text-xs font-medium text-[var(--ink-secondary)]"
                  >
                    Notes (optional)
                  </label>
                  <input
                    id="bm-notes"
                    type="text"
                    value={entryNotes}
                    onChange={(e) => setEntryNotes(e.target.value)}
                    placeholder="e.g. Morning weigh-in"
                    className="matte-input h-10 w-full px-3 text-sm"
                  />
                </div>
              </div>

              {formError && (
                <p className="rounded-lg border border-[var(--accent-clay-border)] bg-[var(--accent-clay-tint)] px-3 py-2 text-xs font-medium text-[var(--accent-clay)]">
                  {formError}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {MEASUREMENT_FIELDS.map((field) => {
                  const u = getMeasurementUnitLabel(field.kind, weightUnit, measurementUnit);
                  return (
                    <div key={field.key}>
                      <label
                        htmlFor={`bm-field-${field.key}`}
                        className="mb-2 block text-xs font-medium text-[var(--ink-secondary)]"
                      >
                        {field.label}{' '}
                        <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                          ({u})
                        </span>
                      </label>
                      <input
                        id={`bm-field-${field.key}`}
                        type="number"
                        step="any"
                        min="0"
                        value={formValues[field.key] ?? ''}
                        onChange={(e) => {
                          setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }));
                          if (formError) setFormError('');
                        }}
                        placeholder="—"
                        className="matte-input h-10 w-full px-3 font-mono text-sm tabular-nums"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[var(--border-hairline)] px-5 py-4">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="calm-press btn-secondary h-9 px-4 text-sm font-medium whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="calm-press btn-primary h-9 px-4 text-sm font-medium whitespace-nowrap"
              >
                Save entry
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={deletingEntry !== null}
        title="Delete measurement entry"
        description={`Remove the measurement log from ${deletingEntry?.date}`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setDeletingEntry(null)}
        onConfirm={() => {
          if (deletingEntry) deleteMeasurementEntry(deletingEntry.id);
          setDeletingEntry(null);
        }}
      />
    </div>
  );
}
