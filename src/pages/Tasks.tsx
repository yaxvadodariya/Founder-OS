import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { format, isToday, isTomorrow, isPast, isSameDay } from 'date-fns';
import { Plus, CheckSquare, Calendar, Flag, AlertCircle } from 'lucide-react';
import { Task } from '../types';
import { TaskModal } from '../components/TaskModal';
import { PageShell } from '../components/layout/PageShell';

export function Tasks() {
  const store = useStore();
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('today');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const today = new Date();
  
  const tasks = store.tasks.filter(t => {
    if (filter === 'all') return !t.completed;
    if (filter === 'completed') return t.completed;
    if (!t.dueDate) return filter === 'today';
    
    const dueDate = new Date(t.dueDate);
    if (filter === 'today') return isSameDay(dueDate, today) || (isPast(dueDate) && !t.completed);
    if (filter === 'upcoming') return !isPast(dueDate) && !isSameDay(dueDate, today) && !t.completed;
    return true;
  }).sort((a, b) => {
    const pWeight = { high: 3, medium: 2, low: 1 };
    if (pWeight[a.priority] !== pWeight[b.priority]) {
      return pWeight[b.priority] - pWeight[a.priority];
    }
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <PageShell className="lg:pb-0">
      <header className="page-block flex flex-row justify-between items-center gap-4">
        <div className="min-w-0">
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle hidden sm:block">Manage your to-dos and daily focus</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setTaskToEdit(null);
            setIsModalOpen(true);
          }}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </button>
      </header>

      <div className="page-block segmented-control segmented-control-full max-w-full">
        <FilterButton active={filter === 'today'} onClick={() => setFilter('today')}>Today</FilterButton>
        <FilterButton active={filter === 'upcoming'} onClick={() => setFilter('upcoming')}>Upcoming</FilterButton>
        <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>Pending</FilterButton>
        <FilterButton active={filter === 'completed'} onClick={() => setFilter('completed')}>Done</FilterButton>
      </div>

      <section className="page-block flex-1 min-h-0 flex flex-col">
        <h2 className="section-label mb-3">Task List</h2>
        <div className="section-panel-flat w-full min-w-0 flex-1 flex flex-col overflow-hidden">
          {tasks.length > 0 ? (
            <div className="overflow-y-auto flex-1 min-h-0 -mx-0">
              <div className="divide-y divide-[var(--color-border-soft)]">
                {tasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => { setTaskToEdit(task); setIsModalOpen(true); }}
                    className="cursor-pointer w-full min-w-0"
                  >
                    <TaskItem task={task} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-10 text-center">
              <CheckSquare className="h-10 w-10 text-[var(--color-ink-muted)] mb-2 opacity-40" />
              <p className="text-sm font-medium text-[var(--color-ink)]">All caught up!</p>
              <p className="page-subtitle mt-1">No tasks in this view.</p>
            </div>
          )}
        </div>
      </section>
      
      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskToEdit={taskToEdit}
      />
      
      <button
        type="button"
        onClick={() => {
          setTaskToEdit(null);
          setIsModalOpen(true);
        }}
        className="sm:hidden fixed bottom-[5.25rem] right-5 h-14 w-14 flex items-center justify-center fab-mobile z-40"
        aria-label="Add task"
      >
        <Plus className="h-6 w-6" strokeWidth={2} />
      </button>
    </PageShell>
  );
}

export const FilterButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('segmented-item', active && 'segmented-item-active')}
    >
      {children}
    </button>
  );
}

export const TaskItem: React.FC<{ task: Task }> = ({ task }) => {
  const store = useStore();
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) && !task.completed;
  
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 w-full min-w-0 max-w-full box-border transition-colors',
        task.completed ? 'opacity-70' : 'hover:bg-[var(--color-surface-muted)]'
      )}
    >
      <button 
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          store.toggleTaskCompletion(task.id);
        }}
        className={cn(
          'mt-0.5 flex-shrink-0 h-5 w-5 rounded border flex items-center justify-center transition-colors',
          task.completed
            ? 'bg-[var(--color-ink-muted)] border-[var(--color-ink-muted)]'
            : task.priority === 'high'
              ? 'bg-[var(--color-surface)] border-red-400 dark:border-red-500'
              : 'bg-[var(--color-surface)] border-[var(--color-border-subtle)]'
        )}
      >
        {task.completed && <CheckSquare className="h-3 w-3 text-white" />}
      </button>
      
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex justify-between items-start gap-2">
          <p
            className={cn(
              'text-sm font-normal leading-snug break-words',
              task.completed
                ? 'text-[var(--color-ink-muted)] line-through'
                : 'text-[var(--color-ink)]'
            )}
          >
            {task.title}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            {task.timeSpent ? (
              <span className="text-[10px] bg-[var(--color-surface-muted)] text-[var(--color-ink-secondary)] px-1.5 py-0.5 rounded font-mono">
                {(() => {
                  const hrs = Math.floor(task.timeSpent / 3600);
                  const mins = Math.floor((task.timeSpent % 3600) / 60);
                  const secs = task.timeSpent % 60;
                  return `${hrs}h ${mins}m ${secs}s`;
                })()}
              </span>
            ) : null}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const isTaskTimerActive = store.activeTimer?.id === task.id && store.activeTimer?.type === 'task';
                if (isTaskTimerActive) {
                  store.stopTimer();
                } else {
                  store.startTimer(task.id, 'task');
                }
              }}
              className={cn(
                "px-2 py-0.5 rounded text-[10px] font-medium transition-all",
                store.activeTimer?.id === task.id && store.activeTimer?.type === 'task'
                  ? "text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400"
                  : "bg-[var(--color-surface-muted)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
              )}
              title={store.activeTimer?.id === task.id && store.activeTimer?.type === 'task' ? "Stop Timer" : "Start Timer"}
            >
              {store.activeTimer?.id === task.id && store.activeTimer?.type === 'task' ? "STOP" : "TRACK"}
            </button>
          </div>
        </div>
        
        {(!task.completed && (task.description || task.dueDate || task.tags.length > 0 || task.projectId)) && (
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {task.dueDate && (
              <span
                className={cn(
                  'inline-flex items-center text-xs font-medium',
                  isOverdue ? 'text-red-600 dark:text-red-400' : isToday(new Date(task.dueDate)) ? 'text-orange-600 dark:text-orange-400' : 'text-[var(--color-ink-muted)]'
                )}
              >
                {isOverdue ? <AlertCircle className="mr-1 h-3 w-3 shrink-0" /> : <Calendar className="mr-1 h-3 w-3 shrink-0" />}
                {isOverdue ? 'Overdue' : isToday(new Date(task.dueDate)) ? 'Today' : isTomorrow(new Date(task.dueDate)) ? 'Tomorrow' : format(new Date(task.dueDate), 'MMM d')}
              </span>
            )}
            
            {task.priority === 'high' && (
              <span className="status-badge status-badge-warning">
                <Flag className="h-3 w-3 mr-0.5" />
                High
              </span>
            )}

            {task.projectId && (
              <span className="status-badge status-badge-neutral">Project</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
