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
      setFormError('Enter at least one measurement value before saving.');
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#000000] dark:border-[#FFFFFF] pb-3">
        <div>
          <p className="font-mono text-[10px] font-bold tracking-[0.12em] uppercase text-[#737373]">
            BIOMETRICS // 15 METRICS
          </p>
          <h3 className="mt-0.5 text-base font-bold text-[#000000] dark:text-[#FFFFFF]">
            Body Measurements
          </h3>
        </div>
        <button
          type="button"
          onClick={() => openLogModal()}
          className="mech-press inline-flex min-h-[40px] items-center gap-2 rounded-[2px] border border-[#000000] dark:border-[#FFFFFF] bg-[#000000] dark:bg-[#FFFFFF] px-4 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-[#FFFFFF] dark:text-[#000000] hover:bg-[#262626] dark:hover:bg-[#E5E5E5] whitespace-nowrap"
        >
          <Plus className="h-3.5 w-3.5" />
          Log Measurements
        </button>
      </div>

      {/* Main Split: Metric Selector + Trend Chart */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[290px_1fr]">
        {/* Metric Selector List */}
        <div className="border border-[#E5E5E5] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#0A0A0A]">
          <div className="max-h-[380px] divide-y divide-[#E5E5E5] dark:divide-[#262626] overflow-y-auto">
            {MEASUREMENT_FIELDS.map((field) => {
              const latest = latestByKey.get(field.key);
              const u = getMeasurementUnitLabel(field.kind, weightUnit, measurementUnit);
              const isSelected = field.key === selectedMetric;
              return (
                <button
                  key={field.key}
                  type="button"
                  onClick={() => setSelectedMetric(field.key)}
                  className={`mech-press flex min-h-[42px] w-full items-center justify-between px-3.5 py-2 text-left ${
                    isSelected
                      ? 'bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]'
                      : 'text-[#000000] dark:text-[#FFFFFF] hover:bg-[#F5F5F5] dark:hover:bg-[#141414]'
                  }`}
                >
                  <span className="text-xs font-semibold">{field.label}</span>
                  <span
                    className={`font-mono text-xs font-bold tabular-nums ${
                      isSelected ? 'text-[#FFFFFF] dark:text-[#000000]' : 'text-[#737373]'
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
        </div>

        {/* Trend Chart */}
        <div className="hud-frame border border-[#E5E5E5] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#0A0A0A] p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-[#737373]">
                TREND // {activeUnitLabel}
              </p>
              <h4 className="mt-0.5 text-base font-bold text-[#000000] dark:text-[#FFFFFF]">
                {activeMeta.label} Trend
              </h4>
            </div>
            <div className="flex items-center border border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#0A0A0A]">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`mech-press min-h-[32px] px-2.5 font-mono text-[10px] font-bold uppercase ${
                    timeframe === tf
                      ? 'bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]'
                      : 'text-[#737373] hover:text-[#000000] dark:hover:text-[#FFFFFF]'
                  }`}
                >
                  {tf === 'ALL' ? 'All' : tf}
                </button>
              ))}
            </div>
          </div>

          <ProgressChart
            data={chartSeries}
            unit={activeUnitLabel}
            mode="line"
            height={230}
            emptyMessage={`No ${activeMeta.label.toLowerCase()} entries logged in this timeframe.`}
          />
        </div>
      </div>

      {/* Entry History List */}
      <div className="border border-[#E5E5E5] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#0A0A0A]">
        <div className="border-b border-[#E5E5E5] dark:border-[#262626] bg-[#F5F5F5] dark:bg-[#141414] px-4 py-2.5">
          <h4 className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[#000000] dark:text-[#FFFFFF]">
            MEASUREMENT LOG ({sortedEntries.length})
          </h4>
        </div>
        {sortedEntries.length === 0 ? (
          <p className="px-4 py-8 text-center font-mono text-xs text-[#737373]">
            No body measurements logged yet. Click &ldquo;Log Measurements&rdquo; to record your baseline.
          </p>
        ) : (
          <div className="divide-y divide-[#E5E5E5] dark:divide-[#262626]">
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
                  className="flex flex-col justify-between gap-2 px-4 py-3 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-bold tabular-nums text-[#000000] dark:text-[#FFFFFF]">
                      {entry.date}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#737373]">
                      {summaryPairs.join(' · ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openLogModal(entry)}
                      aria-label={`Edit measurement ${entry.date}`}
                      className="mech-press flex h-9 w-9 items-center justify-center rounded-[2px] text-[#737373] hover:bg-[#F5F5F5] dark:hover:bg-[#141414] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingEntry(entry)}
                      aria-label={`Delete measurement ${entry.date}`}
                      className="mech-press flex h-9 w-9 items-center justify-center rounded-[2px] text-[#737373] hover:bg-[#000000] dark:hover:bg-[#FFFFFF] hover:text-[#FFFFFF] dark:hover:text-[#000000]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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
          className="hud-scrim hud-scrim-enter fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={editingEntry ? 'Edit body measurements' : 'Log body measurements'}
        >
          <form
            onSubmit={handleSaveEntry}
            className="hud-modal-enter hud-frame flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden border-2 border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#0A0A0A]"
          >
            <div className="flex items-center justify-between border-b border-[#000000] dark:border-[#262626] bg-[#000000] px-5 py-3.5 text-[#FFFFFF]">
              <div>
                <p className="font-mono text-[9px] font-bold tracking-[0.12em] uppercase text-[#737373]">
                  BIOMETRICS // ENTRY
                </p>
                <h3 className="text-sm font-bold">
                  {editingEntry ? 'Edit Measurement Entry' : 'Log Body Measurements'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close measurement modal"
                className="mech-press flex h-9 w-9 items-center justify-center rounded-[2px] border border-[#262626] text-[#FFFFFF] hover:border-[#FFFFFF]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="bm-date" className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#737373]">
                    Date
                  </label>
                  <input
                    id="bm-date"
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="h-10 w-full rounded-[2px] border border-[#D4D4D4] dark:border-[#262626] bg-[#F5F5F5] dark:bg-[#141414] px-3 font-mono text-sm text-[#000000] dark:text-[#FFFFFF] focus:border-[#000000] dark:focus:border-[#FFFFFF] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="bm-notes" className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#737373]">
                    Notes (Optional)
                  </label>
                  <input
                    id="bm-notes"
                    type="text"
                    value={entryNotes}
                    onChange={(e) => setEntryNotes(e.target.value)}
                    placeholder="e.g. Fasted morning weigh-in"
                    className="h-10 w-full rounded-[2px] border border-[#D4D4D4] dark:border-[#262626] bg-[#F5F5F5] dark:bg-[#141414] px-3 text-sm text-[#000000] dark:text-[#FFFFFF] focus:border-[#000000] dark:focus:border-[#FFFFFF] focus:outline-none"
                  />
                </div>
              </div>

              {formError && (
                <p className="border-l-2 border-[#000000] dark:border-[#FFFFFF] pl-2.5 font-mono text-xs font-bold text-[#000000] dark:text-[#FFFFFF]">
                  [!] {formError}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {MEASUREMENT_FIELDS.map((field) => {
                  const u = getMeasurementUnitLabel(field.kind, weightUnit, measurementUnit);
                  return (
                    <div key={field.key}>
                      <label
                        htmlFor={`bm-field-${field.key}`}
                        className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-[#737373]"
                      >
                        {field.label} ({u})
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
                        className="h-10 w-full rounded-[2px] border border-[#D4D4D4] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#141414] px-3 font-mono text-sm tabular-nums text-[#000000] dark:text-[#FFFFFF] focus:border-[#000000] dark:focus:border-[#FFFFFF] focus:outline-none"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#E5E5E5] dark:border-[#262626] px-5 py-3.5">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="mech-press min-h-[40px] rounded-[2px] border border-[#E5E5E5] dark:border-[#262626] px-4 font-mono text-xs font-bold uppercase tracking-[0.06em] text-[#000000] dark:text-[#FFFFFF] hover:border-[#000000] dark:hover:border-[#FFFFFF]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="mech-press min-h-[40px] rounded-[2px] bg-[#000000] dark:bg-[#FFFFFF] px-5 font-mono text-xs font-bold uppercase tracking-[0.06em] text-[#FFFFFF] dark:text-[#000000]"
              >
                Save Entry
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={deletingEntry !== null}
        title="Delete measurement entry?"
        description={`Remove the measurement log from ${deletingEntry?.date}?`}
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
