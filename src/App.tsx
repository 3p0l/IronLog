import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  Dumbbell,
  Library,
  Play,
  Settings,
} from 'lucide-react';
import { motion } from 'motion/react';
import { AppTab } from './types/workout';
import { WorkoutProvider, useWorkout } from './context/WorkoutContext';
import { WorkoutTab } from './components/WorkoutTab';
import { HistoryTab } from './components/HistoryTab';
import { ExercisesTab } from './components/ExercisesTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { SettingsTab } from './components/SettingsTab';
import { ActiveWorkoutModal } from './components/ActiveWorkoutModal';
import { formatTimerClock } from './utils/calculations';

const NAV_ITEMS: {
  id: AppTab;
  index: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'workout', index: '01', label: 'Workout', icon: Dumbbell },
  { id: 'history', index: '02', label: 'History', icon: CalendarDays },
  { id: 'exercises', index: '03', label: 'Exercises', icon: Library },
  { id: 'analytics', index: '04', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', index: '05', label: 'Settings', icon: Settings },
];

const MECH_TRANSITION = { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const };

function IronLogShell() {
  const { db, activeWorkoutOpen, setActiveWorkoutOpen } = useWorkout();
  const [activeTab, setActiveTab] = useState<AppTab>('workout');
  const [miniElapsed, setMiniElapsed] = useState(0);

  useEffect(() => {
    if (!db.activeWorkout) {
      setMiniElapsed(0);
      return;
    }
    const update = () => {
      setMiniElapsed(Math.max(0, Math.floor((Date.now() - db.activeWorkout!.startedAt) / 1000)));
    };
    update();
    const t = window.setInterval(update, 1000);
    return () => window.clearInterval(t);
  }, [db.activeWorkout?.id, db.activeWorkout?.startedAt]);

  const currentTabMeta = NAV_ITEMS.find((n) => n.id === activeTab) ?? NAV_ITEMS[0];

  return (
    <div className="min-h-screen bg-[#FFFFFF] dark:bg-[#000000] text-[#000000] dark:text-[#FFFFFF]">
      <div className="flex min-h-screen">
        {/* Desktop Left Telemetry Navigation Rail */}
        <aside className="hidden lg:flex lg:w-60 lg:shrink-0 lg:flex-col lg:border-r lg:border-[#E5E5E5] dark:lg:border-[#262626] lg:bg-[#FFFFFF] dark:lg:bg-[#0A0A0A] lg:sticky lg:top-0 lg:h-screen">
          {/* Brand Console Header (Inverted Pitch-Black Block) */}
          <div className="flex h-16 items-center justify-between border-b border-[#000000] dark:border-[#262626] bg-[#000000] dark:bg-[#000000] px-5 text-[#FFFFFF]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center border border-[#FFFFFF] bg-[#FFFFFF] text-[#000000]">
                <Dumbbell className="h-3.5 w-3.5 stroke-[2.5]" />
              </div>
              <div className="leading-none">
                <span className="block text-sm font-extrabold tracking-[0.06em] uppercase">
                  IronLog
                </span>
                <span className="mt-0.5 block font-mono text-[9px] tracking-[0.1em] text-[#737373] uppercase">
                  HUD // LOCAL
                </span>
              </div>
            </div>
            <span className="h-2 w-2 bg-[#FFFFFF]" aria-hidden="true" />
          </div>

          <nav aria-label="Primary navigation" className="flex-1 divide-y divide-[#E5E5E5] dark:divide-[#262626] border-b border-[#E5E5E5] dark:border-[#262626]">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`mech-press relative flex min-h-[50px] w-full items-center justify-between px-5 text-left whitespace-nowrap ${
                    isActive
                      ? 'text-[#FFFFFF] dark:text-[#000000]'
                      : 'text-[#000000] dark:text-[#FFFFFF] hover:bg-[#F5F5F5] dark:hover:bg-[#141414]'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="desktop-nav-polarity"
                      transition={MECH_TRANSITION}
                      className="absolute inset-0 bg-[#000000] dark:bg-[#FFFFFF]"
                      aria-hidden="true"
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-3">
                    <span
                      className={`font-mono text-[10px] font-semibold tracking-[0.08em] tabular-nums ${
                        isActive ? 'text-[#A3A3A3] dark:text-[#525252]' : 'text-[#737373]'
                      }`}
                    >
                      {item.index}
                    </span>
                    <Icon className="h-4 w-4 shrink-0 stroke-[2]" />
                    <span className="text-xs font-semibold tracking-[0.06em] uppercase">
                      {item.label}
                    </span>
                  </span>
                  {isActive && (
                    <span className="relative z-10 font-mono text-[10px] font-bold">
                      ■
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Minimized Active Session Telemetry Strip */}
          {db.activeWorkout && !activeWorkoutOpen && (
            <div className="p-3">
              <button
                type="button"
                onClick={() => setActiveWorkoutOpen(true)}
                className="mech-press hud-frame flex w-full items-center justify-between gap-2 border border-[#000000] dark:border-[#FFFFFF] bg-[#000000] dark:bg-[#FFFFFF] px-3.5 py-3 text-left text-[#FFFFFF] dark:text-[#000000]"
              >
                <div className="min-w-0">
                  <p className="font-mono text-[9px] font-semibold tracking-[0.1em] uppercase text-[#A3A3A3] dark:text-[#525252]">
                    ■ ACTIVE SESSION
                  </p>
                  <p className="mt-0.5 truncate text-xs font-bold">
                    {db.activeWorkout.title}
                  </p>
                  <p className="mt-0.5 font-mono text-xs font-semibold tabular-nums">
                    {formatTimerClock(miniElapsed)}
                  </p>
                </div>
                <Play className="h-3.5 w-3.5 shrink-0 fill-current" />
              </button>
            </div>
          )}

          {/* Minimal Static Footer Spec */}
          <div className="mt-auto border-t border-[#E5E5E5] dark:border-[#262626] px-5 py-3 font-mono text-[10px] tracking-[0.08em] text-[#737373] uppercase">
            <div className="flex items-center justify-between">
              <span>UNIT</span>
              <span className="font-semibold text-[#000000] dark:text-[#FFFFFF]">
                {db.settings.weightUnit} / {db.settings.measurementUnit}
              </span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Compact Mobile Header (Opaque Monochrome HUD Bar) */}
          <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-[#000000] dark:border-[#262626] bg-[#000000] px-4 text-[#FFFFFF] lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center bg-[#FFFFFF] text-[#000000]">
                <Dumbbell className="h-3.5 w-3.5 stroke-[2.5]" />
              </div>
              <span className="text-xs font-extrabold tracking-[0.08em] uppercase">
                IronLog
              </span>
            </div>
            <span className="font-mono text-[11px] font-semibold tracking-[0.08em] uppercase text-[#D4D4D4]">
              {currentTabMeta.index} // {currentTabMeta.label}
            </span>
          </header>

          {/* Minimized Active Workout Bar on Mobile */}
          {db.activeWorkout && !activeWorkoutOpen && (
            <div className="border-b border-[#000000] dark:border-[#FFFFFF] bg-[#F5F5F5] dark:bg-[#141414] px-4 py-2 lg:hidden">
              <button
                type="button"
                onClick={() => setActiveWorkoutOpen(true)}
                className="mech-press flex w-full items-center justify-between font-mono text-xs font-bold text-[#000000] dark:text-[#FFFFFF]"
              >
                <span className="truncate uppercase tracking-[0.04em]">
                  ■ RESUME: {db.activeWorkout.title}
                </span>
                <span className="tabular-nums">{formatTimerClock(miniElapsed)}</span>
              </button>
            </div>
          )}

          {/* Main Scroll Workspace */}
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:py-8 lg:pb-10">
            <div key={activeTab} className="hud-view-enter">
              {activeTab === 'workout' && <WorkoutTab />}
              {activeTab === 'history' && <HistoryTab />}
              {activeTab === 'exercises' && <ExercisesTab />}
              {activeTab === 'analytics' && <AnalyticsTab />}
              {activeTab === 'settings' && <SettingsTab />}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Fixed Bottom 5-Tab Navigation Bar (Opaque Polarity Bar) */}
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#000000] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#0A0A0A] pb-safe lg:hidden"
      >
        <div className="grid h-15 grid-cols-5 divide-x divide-[#E5E5E5] dark:divide-[#262626]">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`mech-press relative flex h-full min-h-[44px] flex-col items-center justify-center gap-1 ${
                  isActive
                    ? 'text-[#FFFFFF] dark:text-[#000000]'
                    : 'text-[#737373] hover:text-[#000000] dark:hover:text-[#FFFFFF]'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="mobile-nav-polarity"
                    transition={MECH_TRANSITION}
                    className="absolute inset-0 bg-[#000000] dark:bg-[#FFFFFF]"
                    aria-hidden="true"
                  />
                )}
                <Icon className={`relative z-10 h-4 w-4 ${isActive ? 'stroke-[2.25]' : 'stroke-[1.75]'}`} />
                <span className="relative z-10 font-mono text-[9px] font-bold tracking-[0.06em] uppercase">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Active Workout Full-Screen Logger */}
      <ActiveWorkoutModal />
    </div>
  );
}

export default function App() {
  return (
    <WorkoutProvider>
      <IronLogShell />
    </WorkoutProvider>
  );
}
