import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Task } from '../types';
import { X, Calendar, Flag, Briefcase } from 'lucide-react';
import { format } from 'date-fns';

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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{taskToEdit ? 'Edit Task' : 'Add Task'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="What needs to be done?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
              placeholder="Add more details..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Flag className="w-4 h-4 text-gray-400" /> Priority
              </label>
              <select 
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Briefcase className="w-4 h-4 text-gray-400" /> Project
              </label>
              <select 
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Personal (None)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
             <div className="flex items-center gap-2 mb-2 mt-2">
                <input 
                  type="checkbox" 
                  id="hasDueDateCheckbox"
                  checked={hasDueDate}
                  onChange={(e) => setHasDueDate(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="hasDueDateCheckbox" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-gray-400" /> Need Due Date?
                </label>
              </div>
            {hasDueDate && (
              <input 
                type="date" 
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-between gap-3">
            {taskToEdit ? (
              <button
                type="button"
                onClick={() => {
                  store.deleteTask(taskToEdit.id);
                  onClose();
                }}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
              >
                Delete
              </button>
            ) : <div />}
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Save Task
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
