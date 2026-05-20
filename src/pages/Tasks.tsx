import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { format, isToday, isTomorrow, isPast, isSameDay } from 'date-fns';
import { Plus, CheckSquare, Calendar, Flag, AlertCircle, Briefcase } from 'lucide-react';
import { Task } from '../types';
import { TaskModal } from '../components/TaskModal';

export function Tasks() {
  const store = useStore();
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('today');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const today = new Date();
  
  const tasks = store.tasks.filter(t => {
    if (filter === 'all') return !t.completed;
    if (filter === 'completed') return t.completed;
    if (!t.dueDate) return filter === 'today'; // Tasks without due date show today
    
    const dueDate = new Date(t.dueDate);
    if (filter === 'today') return isSameDay(dueDate, today) || (isPast(dueDate) && !t.completed);
    if (filter === 'upcoming') return !isPast(dueDate) && !isSameDay(dueDate, today) && !t.completed;
    return true;
  }).sort((a, b) => {
    // Sort by priority first
    const pWeight = { high: 3, medium: 2, low: 1 };
    if (pWeight[a.priority] !== pWeight[b.priority]) {
      return pWeight[b.priority] - pWeight[a.priority];
    }
    // Then by due date
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <div className="space-y-6 pb-20 lg:pb-0 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">Manage your to-dos and daily focus</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => {
              setTaskToEdit(null);
              setIsModalOpen(true);
            }}
            className="hidden sm:inline-flex btn-primary"
          >
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      <div className="segmented-control w-fit overflow-x-auto max-w-full">
        <FilterButton active={filter === 'today'} onClick={() => setFilter('today')}>Today</FilterButton>
        <FilterButton active={filter === 'upcoming'} onClick={() => setFilter('upcoming')}>Upcoming</FilterButton>
        <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>All Pending</FilterButton>
        <FilterButton active={filter === 'completed'} onClick={() => setFilter('completed')}>Completed</FilterButton>
      </div>

      <div className="section-panel flex-1 overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4 px-1">
          <h2 className="section-label">Task List</h2>
        </div>
        <div className="design-card flex-1 overflow-hidden flex flex-col">
          <div className="overflow-y-auto flex-1 p-2">
            {tasks.length > 0 ? (
              <div className="space-y-1">
                {tasks.map(task => 
                  <div key={task.id} onClick={() => { setTaskToEdit(task); setIsModalOpen(true); }} className="cursor-pointer">
                    <TaskItem task={task} />
                  </div>
                )}
              </div>
            ) : (
               <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 rounded-lg border border-dashed border-gray-200 my-4 mx-2">
                <CheckSquare className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-900 font-medium">All caught up!</p>
                <p className="page-subtitle mt-1">No tasks in this view. Enjoy your day.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskToEdit={taskToEdit}
      />
      
      {/* Mobile FAB */}
      <button
        type="button"
        onClick={() => {
          setTaskToEdit(null);
          setIsModalOpen(true);
        }}
        className="sm:hidden fixed bottom-[88px] right-6 p-4 fab-mobile z-40"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}

export const FilterButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "segmented-item",
        active && "segmented-item-active"
      )}
    >
      {children}
    </button>
  );
}

export const TaskItem: React.FC<{ task: Task }> = ({ task }) => {
  const store = useStore();
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) && !task.completed;
  
  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-xl group transition-colors",
      task.completed ? "opacity-60" : "hover:bg-[var(--color-surface-muted)]"
    )}>
      <button 
        onClick={() => store.toggleTaskCompletion(task.id)}
        className={cn(
          "mt-0.5 flex-shrink-0 h-[22px] w-[22px] rounded border flex items-center justify-center transition-all",
          task.completed 
            ? "bg-gray-300 border-gray-300" 
            : task.priority === 'high' 
              ? "bg-white border-red-300 hover:border-red-500 hover:bg-red-50" 
              : "bg-white border-gray-300 hover:border-blue-500 hover:bg-blue-50"
        )}
      >
        {task.completed && <CheckSquare className="h-[14px] w-[14px] text-white" />}
      </button>
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium truncate transition-colors", 
          task.completed ? "text-gray-400 line-through" : "text-gray-900"
        )}>
          {task.title}
        </p>
        
        {(!task.completed && (task.description || task.dueDate || task.tags.length > 0)) && (
          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            {task.dueDate && (
              <div className={cn(
                "flex items-center text-xs font-medium",
                isOverdue ? "text-red-600" : isToday(new Date(task.dueDate)) ? "text-orange-600" : "text-gray-500"
              )}>
                {isOverdue ? <AlertCircle className="mr-1 h-3 w-3" /> : <Calendar className="mr-1 h-3 w-3" />}
                {isOverdue ? 'Overdue' : isToday(new Date(task.dueDate)) ? 'Today' : isTomorrow(new Date(task.dueDate)) ? 'Tomorrow' : format(new Date(task.dueDate), 'MMM d')}
              </div>
            )}
            
            {task.priority === 'high' && (
              <div className="flex items-center text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                <Flag className="mr-1 h-3 w-3" />
                High
              </div>
            )}

            {task.projectId && (
               <div className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                 Project
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
