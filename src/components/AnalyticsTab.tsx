import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
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

type AnalyticsSubTab = 'overview' | 'exercises' | 'measurements';
type ExMetric = '1rm' | 'weight' | 'setVolume' | 'sessionVolume';

const TIMEFRAMES: TimeframeFilter[] = ['1M', '3M', '6M', '1Y', 'ALL'];
const MUSCLE_TIMEFRAMES: MuscleTimeframeFilter[] = ['7D', '30D', '90D', 'ALL'];
const MECH_SLIDE = { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const };

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

  const [selectedExId, setSelectedExId] = useState<string>(() => loggedExercises[0]?.id ?? 'ex-bench-barbell');
  const [exTf, setExTf] = useState<TimeframeFilter>('ALL');
  const [exMetric, setExMetric] = useState<ExMetric>('1rm');

  const unit = db.settings.weightUnit;
  const toUnit = (kg: number) => roundDisplay(unit === 'lbs' ? kgToLbs(kg) : kg, 1);

  const stats = useMemo(() => getGlobalTrainingStats(db.workouts, globalTf), [db.workouts, globalTf]);

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
    <div className="space-y-6">
      {/* Pitch-Black Inverted Analytics Header + Sub-Nav */}
      <section className="hud-frame border border-[#000000] dark:border-[#262626] bg-[#000000] dark:bg-[#0A0A0A] text-[#FFFFFF]">
        <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="font-mono text-[10px] font-bold tracking-[0.12em] uppercase text-[#737373]">
              04 // PERFORMANCE TELEMETRY
            </p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-[#FFFFFF]">
              Training Analytics
            </h2>
          </div>

          <div className="grid grid-cols-3 border border-[#262626] bg-[#0A0A0A] p-0.5">
            {([
              { id: 'overview', label: 'Overview' },
              { id: 'exercises', label: 'Exercises' },
              { id: 'measurements', label: 'Body' },
            ] as const).map((tab) => {
              const active = subTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSubTab(tab.id)}
                  className={`mech-press relative min-h-[36px] px-4 font-mono text-[11px] font-bold uppercase tracking-[0.06em] whitespace-nowrap ${
                    active ? 'text-[#000000]' : 'text-[#A3A3A3] hover:text-[#FFFFFF]'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="analytics-subtab-polarity"
                      transition={MECH_SLIDE}
                      className="absolute inset-0 bg-[#FFFFFF]"
                      aria-hidden="true"
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Inverted KPI Telemetry Strip */}
        {subTab === 'overview' && (
          <div className="grid grid-cols-2 divide-x divide-y divide-[#262626] border-t border-[#262626] bg-[#0A0A0A] lg:grid-cols-4 lg:divide-y-0">
            <div className="p-4">
              <p className="font-mono text-[10px] font-semibold tracking-[0.08em] uppercase text-[#737373]">
                WORKOUTS ({globalTf})
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#FFFFFF]">
                {stats.totalWorkouts}
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase text-[#737373]">
                {stats.workoutsThisMonth} THIS MONTH
              </p>
            </div>
            <div className="p-4">
              <p className="font-mono text-[10px] font-semibold tracking-[0.08em] uppercase text-[#737373]">
                WEEKLY STREAK
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#FFFFFF]">
                {stats.currentWeekStreak} {stats.currentWeekStreak === 1 ? 'WK' : 'WKS'}
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase text-[#737373]">
                {stats.workoutsThisWeek} THIS WEEK
              </p>
            </div>
            <div className="p-4">
              <p className="font-mono text-[10px] font-semibold tracking-[0.08em] uppercase text-[#737373]">
                VOLUME LIFTED
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#FFFFFF]">
                {formatVolume(stats.totalVolumeKg, unit)}
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase text-[#737373]">
                {stats.totalSets} COMPLETED SETS
              </p>
            </div>
            <div className="p-4">
              <p className="font-mono text-[10px] font-semibold tracking-[0.08em] uppercase text-[#737373]">
                TRAINING TIME
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#FFFFFF]">
                {formatDuration(stats.totalDurationSeconds)}
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase text-[#737373]">
                AVG{' '}
                {stats.totalWorkouts > 0
                  ? `${Math.round(stats.totalDurationSeconds / stats.totalWorkouts / 60)}M / SESSION`
                  : '0M'}
              </p>
            </div>
          </div>
        )}
      </section>

      {subTab === 'overview' && (
        <div key="overview" className="hud-view-enter grid grid-cols-1 gap-5 xl:grid-cols-2">
          {/* Weekly Volume / Frequency Bar Chart */}
          <section className="hud-frame border border-[#E5E5E5] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#0A0A0A] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-[#737373]">
                  01 // LOAD CURVE
                </p>
                <h3 className="mt-0.5 text-sm font-bold text-[#000000] dark:text-[#FFFFFF]">
                  Weekly Training Load
                </h3>
              </div>
              <div className="flex items-center border border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#0A0A0A]">
                <button
                  type="button"
                  onClick={() => setGlobalChartMetric('volume')}
                  className={`mech-press min-h-[32px] px-3 font-mono text-[10px] font-bold uppercase tracking-[0.06em] ${
                    globalChartMetric === 'volume'
                      ? 'bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]'
                      : 'text-[#737373] hover:text-[#000000] dark:hover:text-[#FFFFFF]'
                  }`}
                >
                  Volume
                </button>
                <button
                  type="button"
                  onClick={() => setGlobalChartMetric('workouts')}
                  className={`mech-press min-h-[32px] px-3 font-mono text-[10px] font-bold uppercase tracking-[0.06em] ${
                    globalChartMetric === 'workouts'
                      ? 'bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]'
                      : 'text-[#737373] hover:text-[#000000] dark:hover:text-[#FFFFFF]'
                  }`}
                >
                  Sessions
                </button>
              </div>
            </div>

            <ProgressChart
              data={weeklyChartData}
              unit={globalChartMetric === 'volume' ? unit : 'workouts'}
              mode="bar"
              height={220}
            />

            <div className="flex items-center justify-center gap-1 border-t border-[#E5E5E5] dark:border-[#262626] pt-3">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setGlobalTf(tf)}
                  className={`mech-press min-h-[32px] min-w-[44px] rounded-[2px] border px-3 font-mono text-[11px] font-bold uppercase ${
                    globalTf === tf
                      ? 'border-[#000000] dark:border-[#FFFFFF] bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]'
                      : 'border-transparent text-[#737373] hover:border-[#E5E5E5] dark:hover:border-[#262626] hover:text-[#000000] dark:hover:text-[#FFFFFF]'
                  }`}
                >
                  {tf === 'ALL' ? 'All' : tf}
                </button>
              ))}
            </div>
          </section>

          {/* Muscle Group Distribution */}
          <section className="hud-frame border border-[#E5E5E5] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#0A0A0A] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-[#737373]">
                  02 // MUSCLE BALANCE
                </p>
                <h3 className="mt-0.5 text-sm font-bold text-[#000000] dark:text-[#FFFFFF]">
                  Muscle Group Distribution
                </h3>
              </div>
              <div className="flex items-center border border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#0A0A0A]">
                {(['bar', 'radar'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setMuscleView(v)}
                    className={`mech-press min-h-[32px] px-3 font-mono text-[10px] font-bold uppercase tracking-[0.06em] ${
                      muscleView === v
                        ? 'bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]'
                        : 'text-[#737373] hover:text-[#000000] dark:hover:text-[#FFFFFF]'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <MuscleCharts data={muscleDistribution} viewMode={muscleView} />

            <div className="flex items-center justify-center gap-1 border-t border-[#E5E5E5] dark:border-[#262626] pt-3">
              {MUSCLE_TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setMuscleTf(tf)}
                  className={`mech-press min-h-[32px] rounded-[2px] border px-3 font-mono text-[11px] font-bold uppercase ${
                    muscleTf === tf
                      ? 'border-[#000000] dark:border-[#FFFFFF] bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]'
                      : 'border-transparent text-[#737373] hover:border-[#E5E5E5] dark:hover:border-[#262626] hover:text-[#000000] dark:hover:text-[#FFFFFF]'
                  }`}
                >
                  {tf === 'ALL' ? 'All Time' : `Last ${tf}`}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {subTab === 'exercises' && (
        <section
          key="exercises"
          className="hud-view-enter hud-frame border border-[#E5E5E5] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#0A0A0A] p-5 space-y-5"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="w-full md:max-w-md">
              <label
                htmlFor="analytics-ex-select"
                className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[#737373]"
              >
                01 // TARGET MOVEMENT
              </label>
              <select
                id="analytics-ex-select"
                value={selectedExId}
                onChange={(e) => setSelectedExId(e.target.value)}
                className="h-11 w-full rounded-[2px] border border-[#000000] dark:border-[#262626] bg-[#F5F5F5] dark:bg-[#141414] px-3 text-sm font-semibold text-[#000000] dark:text-[#FFFFFF] focus:border-[#000000] dark:focus:border-[#FFFFFF] focus:outline-none"
              >
                {loggedExercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} ({ex.primaryMuscle})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center border border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#0A0A0A]">
              {([
                { id: '1rm', label: 'Est. 1RM' },
                { id: 'weight', label: 'Heaviest' },
                { id: 'setVolume', label: 'Best Set Vol' },
                { id: 'sessionVolume', label: 'Session Vol' },
              ] as const).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setExMetric(m.id)}
                  className={`mech-press min-h-[36px] px-3 font-mono text-[10px] font-bold uppercase tracking-[0.06em] whitespace-nowrap ${
                    exMetric === m.id
                      ? 'bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]'
                      : 'text-[#737373] hover:text-[#000000] dark:hover:text-[#FFFFFF]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <ProgressChart
            data={exerciseChartData}
            unit={unit}
            mode="line"
            height={250}
            emptyMessage="No completed weighted sets found for this exercise in the selected timeframe."
          />

          <div className="flex items-center justify-center gap-1 border-t border-[#E5E5E5] dark:border-[#262626] pt-3">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setExTf(tf)}
                className={`mech-press min-h-[34px] min-w-[44px] rounded-[2px] border px-3 font-mono text-[11px] font-bold uppercase ${
                  exTf === tf
                    ? 'border-[#000000] dark:border-[#FFFFFF] bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]'
                    : 'border-transparent text-[#737373] hover:border-[#E5E5E5] dark:hover:border-[#262626] hover:text-[#000000] dark:hover:text-[#FFFFFF]'
                }`}
              >
                {tf === 'ALL' ? 'All' : tf}
              </button>
            ))}
          </div>
        </section>
      )}

      {subTab === 'measurements' && (
        <div key="measurements" className="hud-view-enter">
          <MeasurementsSection />
        </div>
      )}
    </div>
  );
}
