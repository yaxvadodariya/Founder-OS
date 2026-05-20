import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Project, ProjectStatus } from '../types';
import { X, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';

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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col my-8 max-h-[90vh]">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">{projectToEdit ? 'Edit Project' : 'New Project'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Email</label>
              <input 
                type="email" 
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="input-field"
                placeholder="hello@client.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field resize-y"
                placeholder="Brief description of the project..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Value (INR) *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IndianRupee className="h-4 w-4 text-gray-400" />
                </div>
                <input 
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount Received (INR)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IndianRupee className="h-4 w-4 text-gray-400" />
                </div>
                <input 
                  type="number"
                  min="0"
                  step="1"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input 
                type="date" 
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline *</label>
              <input 
                type="date" 
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-between gap-3 mt-4">
            {projectToEdit ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this project?')) {
                    store.deleteProject(projectToEdit.id);
                    onClose();
                  }
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
                className="btn-secondary !text-sm"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="btn-primary !text-sm"
              >
                Save Project
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
