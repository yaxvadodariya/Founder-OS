import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Task } from '../types';
import { Calendar, Flag, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { SidePanel } from './SidePanel';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
  defaultProjectId?: string;
}

export function TaskModal({ isOpen, onClose, taskToEdit = null, defaultProjectId }: TaskModalProps) {
  const store = useStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [projectId, setProjectId] = useState<string>('');
  const [dueDate, setDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [hasDueDate, setHasDueDate] = useState(true);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setPriority(taskToEdit.priority);
      setProjectId(taskToEdit.projectId || '');
      if (taskToEdit.dueDate) {
        setDueDate(format(new Date(taskToEdit.dueDate), 'yyyy-MM-dd'));
        setHasDueDate(true);
      } else {
        setHasDueDate(false);
      }
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setProjectId(defaultProjectId || '');
      setDueDate(format(new Date(), 'yyyy-MM-dd'));
      setHasDueDate(true);
    }
  }, [taskToEdit, isOpen, defaultProjectId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    
    if (taskToEdit) {
      store.updateTask(taskToEdit.id, {
        title,
        description: description || undefined,
        priority,
        projectId: projectId || undefined,
        dueDate: hasDueDate ? new Date(dueDate).toISOString() : undefined,
      });
    } else {
      store.addTask({
        id: Math.random().toString(36).substring(2, 11),
        title,
        description: description || undefined,
        priority,
        completed: false,
        tags: [],
        subtasks: [],
        projectId: projectId || undefined,
        dueDate: hasDueDate ? new Date(dueDate).toISOString() : undefined,
        createdAt: new Date().toISOString()
      });
    }
    
    onClose();
  };

  const projects = store.projects;

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? 'Edit Task' : 'New Task'}
      subtitle={taskToEdit ? 'Update task details' : 'Create a new task'}
      footer={
        <div className="flex justify-between items-center">
          {taskToEdit ? (
            <button
              type="button"
              onClick={() => {
                store.deleteTask(taskToEdit.id);
                onClose();
              }}
              className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
            >
              Delete
            </button>
          ) : <div />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" form="task-form" className="btn-primary">Save Task</button>
          </div>
        </div>
      }
    >
      <form id="task-form" onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="form-label">Title *</label>
          <input 
            type="text" 
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
            placeholder="What needs to be done?"
          />
        </div>

        <div>
          <label className="form-label">Description</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field resize-vertical"
            placeholder="Add more details..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label flex items-center gap-1">
              <Flag className="w-3.5 h-3.5" /> Priority
            </label>
            <select 
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
              className="input-field"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="form-label flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5" /> Project
            </label>
            <select 
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="input-field"
            >
              <option value="">Personal (None)</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
           <div className="flex items-center gap-2 mb-2">
              <input 
                type="checkbox" 
                id="hasDueDateCheckbox"
                checked={hasDueDate}
                onChange={(e) => setHasDueDate(e.target.checked)}
                className="rounded border-[var(--color-border-subtle)] text-[var(--color-ink)] focus:ring-[var(--color-ink-muted)]"
              />
              <label htmlFor="hasDueDateCheckbox" className="form-label !mb-0 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Set Due Date
              </label>
            </div>
          {hasDueDate && (
            <input 
              type="date" 
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input-field"
            />
          )}
        </div>
      </form>
    </SidePanel>
  );
}
