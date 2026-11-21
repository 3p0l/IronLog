import React, { useMemo, useState } from 'react';
import { MuscleTimeframeFilter, TimeframeFilter } from '../types/workout';
import { useWorkout } from '../context/WorkoutContext';
import {
  formatDuration,
  formatVolume,
  getExerciseProgressSeries,
  getGlobalTrainingStats,
  getMuscleGroupDistribution,
  kgToLbs,
  roundDisplay,
} from '../utils/calculations';
import { ProgressChart } from './charts/ProgressChart';
import { MuscleCharts } from './charts/MuscleCharts';
import { MeasurementsSection } from './MeasurementsSection';
import { SegmentedControl } from './ui/LinearPrimitives';

type AnalyticsSubTab = 'overview' | 'exercises' | 'measurements';
type ExMetric = '1rm' | 'weight' | 'setVolume' | 'sessionVolume';

const TIMEFRAMES: TimeframeFilter[] = ['1M', '3M', '6M', '1Y', 'ALL'];
const MUSCLE_TIMEFRAMES: MuscleTimeframeFilter[] = ['7D', '30D', '90D', 'ALL'];

export function AnalyticsTab() {
  const { db } = useWorkout();
  const [subTab, setSubTab] = useState<AnalyticsSubTab>('overview');
  const [globalTf, setGlobalTf] = useState<TimeframeFilter>('3M');
  const [globalChartMetric, setGlobalChartMetric] = useState<'volume' | 'workouts'>('volume');

  const [muscleTf, setMuscleTf] = useState<MuscleTimeframeFilter>('30D');
  const [muscleView, setMuscleView] = useState<'bar' | 'radar'>('bar');

  // Exercise analytics explorer state
  const loggedExercises = useMemo(() => {
    const counts = new Map<string, number>();
    for (const w of db.workouts) {
      if (w.finishedAt === null) continue;
      for (const e of w.exercises) {
        if (e.sets.some((s) => s.completed)) {
          counts.set(e.exerciseId, (counts.get(e.exerciseId) ?? 0) + 1);
        }
      }
    }
    return [...db.exercises].sort((a, b) => {
      const diff = (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0);
      return diff !== 0 ? diff : a.name.localeCompare(b.name);
    });
  }, [db.exercises, db.workouts]);

  const [selectedExId, setSelectedExId] = useState<string>(
    () => loggedExercises[0]?.id ?? 'ex-bench-barbell'
  );
  const [exTf, setExTf] = useState<TimeframeFilter>('ALL');
  const [exMetric, setExMetric] = useState<ExMetric>('1rm');

  const unit = db.settings.weightUnit;
  const toUnit = (kg: number) => roundDisplay(unit === 'lbs' ? kgToLbs(kg) : kg, 1);

  const stats = useMemo(
    () => getGlobalTrainingStats(db.workouts, globalTf),
    [db.workouts, globalTf]
  );

  const muscleDistribution = useMemo(
    () => getMuscleGroupDistribution(db.workouts, db.exercises, muscleTf),
    [db.workouts, db.exercises, muscleTf]
  );

  const exerciseSeries = useMemo(
    () => getExerciseProgressSeries(selectedExId, db.workouts, exTf),
    [selectedExId, db.workouts, exTf]
  );

  const weeklyChartData = stats.weeklySeries.map((wk) => ({
    label: wk.weekLabel,
    value:
      globalChartMetric === 'volume'
        ? Math.round(unit === 'lbs' ? kgToLbs(wk.volumeKg) : wk.volumeKg)
        : wk.workouts,
    sublabel: `${wk.workouts} ${wk.workouts === 1 ? 'session' : 'sessions'}`,
  }));

  const exerciseChartData = exerciseSeries.map((pt) => {
    let valKg = pt.estimated1RMKg;
    if (exMetric === 'weight') valKg = pt.heaviestWeightKg;
    else if (exMetric === 'setVolume') valKg = pt.bestSetVolumeKg;
    else if (exMetric === 'sessionVolume') valKg = pt.totalVolumeKg;
    return {
      label: pt.dateLabel,
      value: toUnit(valKg),
      sublabel: pt.workoutTitle,
    };
  });

  return (
    <div className="space-y-8">
      {/* Page Header + Segmented View Switcher */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--ink-primary)]">
          Analytics
        </h1>

        <SegmentedControl<AnalyticsSubTab>
          value={subTab}
          onChange={setSubTab}
          layoutId="analytics-subtab-pill"
          size="md"
          ariaLabel="Analytics sections"
          options={[
            { value: 'overview', label: 'Overview' },
            { value: 'exercises', label: 'Exercises' },
            { value: 'measurements', label: 'Body' },
          ]}
        />
      </header>

      {subTab === 'overview' && (
        <div key="overview" className="view-enter space-y-8">
          {/* De-boxed 4-Up KPI Strip directly on canvas */}
          <section className="grid grid-cols-2 gap-6 border-y border-[var(--border-hairline)] py-6 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-[var(--border-hairline)]">
            <div className="lg:pr-6">
              <p className="text-xs font-medium text-[var(--ink-secondary)]">
                Workouts ({globalTf === 'ALL' ? 'All' : globalTf})
              </p>
              <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-[var(--ink-primary)]">
                {stats.totalWorkouts}
              </p>
              <p className="mt-1 font-mono text-xs tabular-nums text-[var(--ink-muted)]">
                {stats.workoutsThisMonth} this month
              </p>
            </div>

            <div className="lg:px-6">
              <p className="text-xs font-medium text-[var(--ink-secondary)]">Weekly streak</p>
              <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-[var(--ink-primary)]">
                {stats.currentWeekStreak}{' '}
                <span className="font-sans text-xs font-normal text-[var(--ink-muted)]">
                  {stats.currentWeekStreak === 1 ? 'wk' : 'wks'}
                </span>
              </p>
              <p className="mt-1 font-mono text-xs tabular-nums text-[var(--ink-muted)]">
                {stats.workoutsThisWeek} this week
              </p>
            </div>

            <div className="lg:px-6">
              <p className="text-xs font-medium text-[var(--ink-secondary)]">Volume lifted</p>
              <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-[var(--ink-primary)]">
                {formatVolume(stats.totalVolumeKg, unit)}
              </p>
              <p className="mt-1 font-mono text-xs tabular-nums text-[var(--ink-muted)]">
                {stats.totalSets} completed sets
              </p>
            </div>

            <div className="lg:pl-6">
              <p className="text-xs font-medium text-[var(--ink-secondary)]">Training time</p>
              <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-[var(--ink-primary)]">
                {formatDuration(stats.totalDurationSeconds)}
              </p>
              <p className="mt-1 font-mono text-xs tabular-nums text-[var(--ink-muted)]">
                Avg{' '}
                {stats.totalWorkouts > 0
                  ? `${Math.round(stats.totalDurationSeconds / stats.totalWorkouts / 60)}m per session`
                  : '0m'}
              </p>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* Weekly Training Load Chart (Matte interactive chart container) */}
            <section className="matte-surface p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--ink-primary)]">
                    Weekly training load
                  </h2>
                  <p className="mt-1 text-xs text-[var(--ink-muted)]">
                    {globalChartMetric === 'volume'
                      ? `Total weekly volume (${unit})`
                      : 'Completed sessions per week'}
                  </p>
                </div>
                <SegmentedControl<'volume' | 'workouts'>
                  value={globalChartMetric}
                  onChange={setGlobalChartMetric}
                  layoutId="analytics-load-metric"
                  size="xs"
                  ariaLabel="Load curve metric"
                  options={[
                    { value: 'volume', label: 'Volume' },
                    { value: 'workouts', label: 'Sessions' },
                  ]}
                />
              </div>

              <ProgressChart
                data={weeklyChartData}
                unit={globalChartMetric === 'volume' ? unit : 'workouts'}
                mode="bar"
                tone="steel"
                height={220}
              />

              <div className="flex justify-center border-t border-[var(--border-hairline)] pt-4">
                <SegmentedControl<TimeframeFilter>
                  value={globalTf}
                  onChange={setGlobalTf}
                  layoutId="analytics-global-tf"
                  size="xs"
                  ariaLabel="Weekly load timeframe"
                  options={TIMEFRAMES.map((tf) => ({
                    value: tf,
                    label: tf === 'ALL' ? 'All' : tf,
                  }))}
                />
              </div>
            </section>

            {/* Muscle Group Distribution (Matte interactive chart container) */}
            <section className="matte-surface p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--ink-primary)]">
                    Muscle distribution
                  </h2>
                  <p className="mt-1 text-xs text-[var(--ink-muted)]">
                    Working sets across primary and secondary muscles
                  </p>
                </div>
                <SegmentedControl<'bar' | 'radar'>
                  value={muscleView}
                  onChange={setMuscleView}
                  layoutId="analytics-muscle-view"
                  size="xs"
                  ariaLabel="Muscle distribution chart type"
                  options={[
                    { value: 'bar', label: 'Bar' },
                    { value: 'radar', label: 'Radar' },
                  ]}
                />
              </div>

              <MuscleCharts data={muscleDistribution} viewMode={muscleView} />

              <div className="flex justify-center border-t border-[var(--border-hairline)] pt-4">
                <SegmentedControl<MuscleTimeframeFilter>
                  value={muscleTf}
                  onChange={setMuscleTf}
                  layoutId="analytics-muscle-tf"
                  size="xs"
                  ariaLabel="Muscle distribution timeframe"
                  options={MUSCLE_TIMEFRAMES.map((tf) => ({
                    value: tf,
                    label: tf === 'ALL' ? 'All time' : `Last ${tf}`,
                  }))}
                />
              </div>
            </section>
          </div>
        </div>
      )}

      {subTab === 'exercises' && (
        <section key="exercises" className="view-enter matte-surface p-5 space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="w-full lg:max-w-md">
              <label
                htmlFor="analytics-ex-select"
                className="mb-2 block text-xs font-medium text-[var(--ink-secondary)]"
              >
                Exercise
              </label>
              <select
                id="analytics-ex-select"
                value={selectedExId}
                onChange={(e) => setSelectedExId(e.target.value)}
                className="matte-input h-10 w-full px-3 text-sm font-medium"
              >
                {loggedExercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} ({ex.primaryMuscle})
                  </option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto">
              <SegmentedControl<ExMetric>
                value={exMetric}
                onChange={setExMetric}
                layoutId="analytics-ex-metric"
                size="sm"
                ariaLabel="Exercise progress metric"
                options={[
                  { value: '1rm', label: 'Est. 1RM' },
                  { value: 'weight', label: 'Heaviest' },
                  { value: 'setVolume', label: 'Best set vol' },
                  { value: 'sessionVolume', label: 'Session vol' },
                ]}
              />
            </div>
          </div>

          <ProgressChart
            data={exerciseChartData}
            unit={unit}
            mode="line"
            tone="sage"
            height={252}
            emptyMessage="No completed weighted sets found for this exercise in range"
          />

          <div className="flex justify-center border-t border-[var(--border-hairline)] pt-4">
            <SegmentedControl<TimeframeFilter>
              value={exTf}
              onChange={setExTf}
              layoutId="analytics-ex-tf"
              size="xs"
              ariaLabel="Exercise progress timeframe"
              options={TIMEFRAMES.map((tf) => ({
                value: tf,
                label: tf === 'ALL' ? 'All' : tf,
              }))}
            />
          </div>
        </section>
      )}

      {subTab === 'measurements' && (
        <div key="measurements" className="view-enter">
          <MeasurementsSection />
        </div>
      )}
    </div>
  );
}
