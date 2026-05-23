import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Project, ProjectStatus } from '../types';
import { IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
import { SidePanel } from './SidePanel';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectToEdit?: Project | null;
}

export function ProjectModal({ isOpen, onClose, projectToEdit = null }: ProjectModalProps) {
  const store = useStore();
  
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('lead');
  const [value, setValue] = useState('');
  const [amountReceived, setAmountReceived] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [deadline, setDeadline] = useState(format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name);
      setClientName(projectToEdit.clientName);
      setClientEmail(projectToEdit.clientEmail || '');
      setStatus(projectToEdit.status);
      setValue(projectToEdit.value.toString());
      setAmountReceived(projectToEdit.amountReceived.toString());
      setStartDate(format(new Date(projectToEdit.startDate), 'yyyy-MM-dd'));
      setDeadline(format(new Date(projectToEdit.deadline), 'yyyy-MM-dd'));
      setDescription(projectToEdit.description || '');
    } else {
      setName('');
      setClientName('');
      setClientEmail('');
      setStatus('lead');
      setValue('');
      setAmountReceived('0');
      setStartDate(format(new Date(), 'yyyy-MM-dd'));
      setDeadline(format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
      setDescription('');
    }
  }, [projectToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !clientName || !value) return;
    
    const parsedValue = parseFloat(value);
    const parsedReceived = parseFloat(amountReceived) || 0;
    const amountPending = Math.max(0, parsedValue - parsedReceived);
    
    if (projectToEdit) {
      store.updateProject(projectToEdit.id, {
        name,
        clientName,
        clientEmail,
        status,
        value: parsedValue,
        amountReceived: parsedReceived,
        amountPending,
        startDate: new Date(startDate).toISOString(),
        deadline: new Date(deadline).toISOString(),
        description,
        ...(status === 'completed' && projectToEdit.status !== 'completed' ? { completedDate: new Date().toISOString() } : {})
      });
    } else {
      store.addProject({
        id: Math.random().toString(36).substring(2, 11),
        name,
        clientName,
        clientEmail,
        status,
        value: parsedValue,
        amountReceived: parsedReceived,
        amountPending,
        startDate: new Date(startDate).toISOString(),
        deadline: new Date(deadline).toISOString(),
        progress: 0,
        description,
        deliverables: [],
        notes: '',
        milestones: []
      });
    }
    
    onClose();
  };

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={projectToEdit ? 'Edit Project' : 'New Project'}
      subtitle={projectToEdit ? `Editing ${projectToEdit.name}` : 'Create a new client project'}
      width="max-w-xl"
      footer={
        <div className="flex justify-between items-center">
          {projectToEdit ? (
            <button
              type="button"
              onClick={() => {
                if (confirm('Are you sure you want to delete this project?')) {
                  store.deleteProject(projectToEdit.id);
                  onClose();
                }
              }}
              className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
            >
              Delete
            </button>
          ) : <div />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" form="project-form" className="btn-primary">Save Project</button>
          </div>
        </div>
      }
    >
      <form id="project-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="form-label">Project Name *</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="e.g. Website Redesign"
            />
          </div>

          <div>
            <label className="form-label">Client Name *</label>
            <input 
              type="text" 
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="input-field"
              placeholder="Client or Company Name"
            />
          </div>

          <div>
            <label className="form-label">Client Email</label>
            <input 
              type="email" 
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              className="input-field"
              placeholder="hello@client.com"
            />
          </div>

          <div>
            <label className="form-label">Status *</label>
            <select 
              required
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="input-field"
            >
              <option value="lead">Lead / Proposal</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="form-label">Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field resize-y"
              placeholder="Brief description of the project..."
              rows={3}
            />
          </div>

          <div>
            <label className="form-label">Total Value (INR) *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IndianRupee className="h-4 w-4 text-[var(--color-ink-muted)]" />
              </div>
              <input 
                type="number"
                required
                min="0"
                step="1"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="input-field !pl-9"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Amount Received (INR)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IndianRupee className="h-4 w-4 text-[var(--color-ink-muted)]" />
              </div>
              <input 
                type="number"
                min="0"
                step="1"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                className="input-field !pl-9"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Start Date *</label>
            <input 
              type="date" 
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="form-label">Deadline *</label>
            <input 
              type="date" 
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </form>
    </SidePanel>
  );
}
