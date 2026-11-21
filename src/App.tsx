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
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'workout', label: 'Workout', icon: Dumbbell },
  { id: 'history', label: 'History', icon: CalendarDays },
  { id: 'exercises', label: 'Exercises', icon: Library },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const NAV_TRANSITION = { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const };

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
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink-primary)]">
      <div className="flex min-h-screen">
        {/* Desktop Slim Matte Sidebar (220px) */}
        <aside className="hidden lg:flex lg:w-[220px] lg:shrink-0 lg:flex-col lg:border-r lg:border-[var(--border-hairline)] lg:bg-[var(--recessed)] lg:sticky lg:top-0 lg:h-screen">
          {/* Unboxed Wordmark Header */}
          <div className="flex h-14 items-center gap-3 px-4">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[var(--ink-primary)]">
              <Dumbbell className="h-[18px] w-[18px] stroke-[1.5]" />
            </span>
            <span className="text-sm font-semibold tracking-[-0.02em] text-[var(--ink-primary)]">
              IronLog
            </span>
          </div>

          <div className="mx-4 border-t border-[var(--border-hairline)]" />

          {/* Navigation Links (36px uniform height, 20px icon alignment boxes, 2px left status tick) */}
          <nav aria-label="Primary navigation" className="flex-1 space-y-1 p-3">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`calm-press relative flex h-9 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'text-[var(--ink-primary)]'
                      : 'text-[var(--ink-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink-primary)]'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="desktop-nav-active"
                      transition={NAV_TRANSITION}
                      className="absolute inset-0 rounded-lg bg-[var(--surface-active)]"
                      aria-hidden="true"
                    >
                      <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-[var(--accent-steel)]" />
                    </motion.span>
                  )}
                  <span
                    className={`relative z-10 flex h-5 w-5 shrink-0 items-center justify-center ${
                      isActive ? 'text-[var(--ink-primary)]' : 'text-[var(--ink-muted)]'
                    }`}
                  >
                    <Icon className="h-4 w-4 stroke-[1.5]" />
                  </span>
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Minimized Active Session Resume Strip (with 2px steel tick) */}
          {db.activeWorkout && !activeWorkoutOpen && (
            <div className="px-3 pb-3">
              <button
                type="button"
                onClick={() => setActiveWorkoutOpen(true)}
                className="calm-press status-tick status-tick-steel matte-surface matte-surface-hover flex w-full items-center justify-between gap-3 py-3 pl-4 pr-3 text-left"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--accent-steel)]">
                    Active session
                  </p>
                  <p className="mt-1 truncate text-xs font-medium text-[var(--ink-primary)]">
                    {db.activeWorkout.title}
                  </p>
                  <p className="mt-1 font-mono text-xs tabular-nums text-[var(--ink-secondary)]">
                    {formatTimerClock(miniElapsed)}
                  </p>
                </div>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--accent-steel-tint)] text-[var(--accent-steel)]">
                  <Play className="h-4 w-4 stroke-[1.5]" />
                </span>
              </button>
            </div>
          )}

          {/* Minimal Static Footer Spec */}
          <div className="mt-auto border-t border-[var(--border-hairline)] px-4 py-3 text-xs text-[var(--ink-muted)]">
            <div className="flex items-center justify-between">
              <span>Units</span>
              <span className="font-mono tabular-nums text-[var(--ink-secondary)]">
                {db.settings.weightUnit} · {db.settings.measurementUnit}
              </span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Compact Solid Matte Mobile Header (zero glassmorphism) */}
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--border-hairline)] bg-[var(--recessed)] px-4 lg:hidden">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center text-[var(--ink-primary)]">
                <Dumbbell className="h-[18px] w-[18px] stroke-[1.5]" />
              </span>
              <span className="text-sm font-semibold tracking-[-0.02em] text-[var(--ink-primary)]">
                IronLog
              </span>
            </div>
            <span className="text-xs font-medium text-[var(--ink-secondary)]">
              {currentTabMeta.label}
            </span>
          </header>

          {/* Minimized Active Workout Bar on Mobile */}
          {db.activeWorkout && !activeWorkoutOpen && (
            <div className="status-tick status-tick-steel border-b border-[var(--border-hairline)] bg-[var(--surface)] px-4 py-3 lg:hidden">
              <button
                type="button"
                onClick={() => setActiveWorkoutOpen(true)}
                className="calm-press flex w-full items-center justify-between text-xs font-medium text-[var(--ink-primary)]"
              >
                <span className="truncate text-[var(--ink-primary)]">
                  Resume {db.activeWorkout.title}
                </span>
                <span className="font-mono tabular-nums text-[var(--accent-steel)]">
                  {formatTimerClock(miniElapsed)}
                </span>
              </button>
            </div>
          )}

          {/* Main Scroll Workspace */}
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-10 lg:py-8 lg:pb-12">
            <div key={activeTab} className="view-enter">
              {activeTab === 'workout' && <WorkoutTab />}
              {activeTab === 'history' && <HistoryTab />}
              {activeTab === 'exercises' && <ExercisesTab />}
              {activeTab === 'analytics' && <AnalyticsTab />}
              {activeTab === 'settings' && <SettingsTab />}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Fixed Bottom 5-Tab Navigation Bar (solid matte, zero blur) */}
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--border-hairline)] bg-[var(--recessed)] pb-safe lg:hidden"
      >
        <div className="grid h-16 grid-cols-5 gap-1 px-2 py-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`calm-press relative flex h-full min-h-[44px] flex-col items-center justify-center gap-1 rounded-lg transition-colors ${
                  isActive
                    ? 'text-[var(--ink-primary)]'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="mobile-nav-active"
                    transition={NAV_TRANSITION}
                    className="absolute inset-0 rounded-lg bg-[var(--surface-active)]"
                    aria-hidden="true"
                  />
                )}
                <span className="relative z-10 flex h-5 w-5 items-center justify-center">
                  <Icon className="h-4 w-4 stroke-[1.5]" />
                </span>
                <span className="relative z-10 text-[11px] font-medium">
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
