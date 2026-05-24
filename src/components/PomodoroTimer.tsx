import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  Timer, 
  CheckCircle2, 
  X,
  Plus,
  Compass,
  Trophy
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

const MODE_CONFIGS = {
  focus: { label: 'Focus Session', duration: 25 * 60, color: 'text-orange-500 bg-orange-500/10' },
  shortBreak: { label: 'Short Break', duration: 5 * 60, color: 'text-emerald-500 bg-emerald-500/10' },
  longBreak: { label: 'Long Break', duration: 15 * 60, color: 'text-blue-500 bg-blue-500/10' }
};

export function PomodoroTimer() {
  const store = useStore();
  const tasks = store.tasks.filter(t => !t.completed);

  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(MODE_CONFIGS.focus.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Play audio beep using oscillator (no external audio assets required)
  const triggerAlarm = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Play 3 successive beeps
      const playBeep = (delay: number, freq: number, duration: number) => {
        setTimeout(() => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
          gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
          
          osc.start();
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
          setTimeout(() => {
            osc.stop();
          }, duration * 1000);
        }, delay);
      };

      playBeep(0, 880, 0.4);
      playBeep(500, 880, 0.4);
      playBeep(1000, 1200, 0.6);
      
      setTimeout(() => {
        audioCtx.close();
      }, 2000);
    } catch (e) {
      console.warn('Web Audio alarm failed', e);
    }
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            triggerAlarm();
            
            // Log session focus time to selected task if applicable
            if (mode === 'focus') {
              setSessionsCompleted(s => s + 1);
              if (selectedTaskId) {
                const elapsedMins = Math.round(MODE_CONFIGS.focus.duration / 60);
                const currentTask = store.tasks.find(t => t.id === selectedTaskId);
                if (currentTask) {
                  const existingTime = currentTask.timeSpent || 0;
                  store.updateTask(selectedTaskId, { timeSpent: existingTime + elapsedMins });
                }
              }
            }
            
            // Switch mode automatically
            if (mode === 'focus') {
              const nextMode = (sessionsCompleted + 1) % 4 === 0 ? 'longBreak' : 'shortBreak';
              setMode(nextMode);
              return MODE_CONFIGS[nextMode].duration;
            } else {
              setMode('focus');
              return MODE_CONFIGS.focus.duration;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode, selectedTaskId, sessionsCompleted]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(MODE_CONFIGS[mode].duration);
  };

  const changeMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(MODE_CONFIGS[newMode].duration);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const config = MODE_CONFIGS[mode];
  const maxDuration = config.duration;
  const progressPercent = ((maxDuration - timeLeft) / maxDuration) * 100;

  // Circular progress math
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="fixed bottom-24 right-5 lg:bottom-8 lg:right-[5.5rem] z-50 flex flex-col items-end">
      {/* Expanded Panel */}
      {isExpanded && (
        <div className="mb-3 w-80 design-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.3)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/95 backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center justify-between mb-4 border-b border-[var(--color-border-soft)] pb-2.5">
            <div className="flex items-center gap-2">
              <Timer className="h-4.5 w-4.5 text-orange-500" />
              <span className="font-semibold text-sm text-[var(--color-ink)]">Focus Timer</span>
            </div>
            <button 
              type="button" 
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded-md text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-muted)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[var(--color-surface-muted)] rounded-lg mb-4 text-xs font-medium">
            {(['focus', 'shortBreak', 'longBreak'] as TimerMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => changeMode(m)}
                className={cn(
                  "py-1.5 px-2 rounded-md transition-all text-center",
                  mode === m 
                    ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-sm"
                    : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                )}
              >
                {m === 'focus' ? 'Focus' : m === 'shortBreak' ? 'Short' : 'Long'}
              </button>
            ))}
          </div>

          {/* Core Display */}
          <div className="flex flex-col items-center justify-center my-2">
            <div className="relative h-32 w-32 flex items-center justify-center">
              <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 64 64">
                {/* Background Ring */}
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  className="stroke-[var(--color-border-soft)]"
                  strokeWidth="3.5"
                  fill="transparent"
                />
                {/* Progress Ring */}
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  stroke={mode === 'focus' ? '#F97316' : mode === 'shortBreak' ? '#10B981' : '#3B82F6'}
                  strokeWidth="3.5"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              </svg>
              <div className="text-center z-10">
                <span className="text-3xl font-bold tracking-tight tabular-nums text-[var(--color-ink)]">
                  {formatTime(timeLeft)}
                </span>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-ink-muted)] mt-0.5">
                  {config.label}
                </p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center items-center gap-4 mt-3">
            <button
              type="button"
              onClick={resetTimer}
              className="p-2 rounded-full border border-[var(--color-border-subtle)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-muted)] transition-colors"
              title="Reset Timer"
            >
              <RotateCcw className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              onClick={toggleTimer}
              className={cn(
                "h-11 w-11 rounded-full flex items-center justify-center shadow-md transition-all active:scale-95 text-white",
                isRunning 
                  ? "bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-700 dark:hover:bg-zinc-600" 
                  : "bg-orange-500 hover:bg-orange-600"
              )}
            >
              {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-white ml-0.5" />}
            </button>
            <div className="h-8.5 w-8.5 flex items-center justify-center text-xs font-semibold text-[var(--color-ink-secondary)] bg-[var(--color-surface-muted)] rounded-full" title="Completed Focus Sessions">
              <Trophy className="h-4 w-4 text-amber-500 mr-0.5" />
              <span>{sessionsCompleted}</span>
            </div>
          </div>

          {/* Task Linker */}
          {mode === 'focus' && (
            <div className="mt-4 pt-3 border-t border-[var(--color-border-soft)]">
              <label className="block text-[11px] font-semibold text-[var(--color-ink-muted)] uppercase mb-1">
                Link to Task
              </label>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full text-xs font-medium text-[var(--color-ink)] bg-[var(--color-surface-muted)] border border-[var(--color-border-subtle)] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
              >
                <option value="">No task selected</option>
                {tasks.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.priority === 'high' ? '🔴 ' : ''}{t.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Floating Minimize Button / Bubble */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "h-12 w-12 rounded-full flex items-center justify-center shadow-lg border backdrop-blur-md transition-all hover:scale-105 active:scale-95",
          isRunning
            ? "border-orange-500/30 bg-orange-500/10 text-orange-500 animate-pulse"
            : "border-[var(--color-border-subtle)] bg-[var(--color-surface)]/90 text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
        )}
      >
        <Timer className="h-6 w-6 stroke-[1.75]" />
        {isRunning && (
          <span className="absolute -top-1 -right-1 h-4.5 min-w-4.5 px-1 rounded-full bg-orange-500 text-[10px] text-white font-bold flex items-center justify-center tabular-nums">
            {Math.ceil(timeLeft / 60)}
          </span>
        )}
      </button>
    </div>
  );
}
