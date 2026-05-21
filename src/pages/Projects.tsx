import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { formatCurrency, cn } from '../lib/utils';
import { format } from 'date-fns';
import { Plus, MoreVertical, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { ProjectStatus } from '../types';
import { ProjectModal } from '../components/ProjectModal';
import { TaskModal } from '../components/TaskModal';

export function Projects() {
  const store = useStore();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<any>(null);
  const [selectedProjectIdForTask, setSelectedProjectIdForTask] = useState<string>('');

  React.useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);
  
  const projects = store.projects.filter(p => filter === 'all' ? true : p.status === filter);

  return (
    <div className="mobile-page lg:pb-0 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Manage client projects and deliverables</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setProjectToEdit(null);
              setIsModalOpen(true);
            }}
            className="hidden sm:inline-flex btn-primary"
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      <div className="segmented-control w-fit overflow-x-auto max-w-full">
        {(['all', 'active', 'completed', 'on-hold'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "segmented-item",
              filter === f && "segmented-item-active"
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="section-panel flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-4 px-1">
          <h2 className="section-label">Project List</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 content-start">
          {projects.map(project => (
            <div 
              key={project.id} 
              onClick={() => navigate(`/projects/${project.id}`)}
              className="design-card flex flex-col cursor-pointer group"
            >
              <div className="p-5 border-b border-[var(--color-border-soft)] flex-1">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col">
                    <span className={cn(
                      "status-badge mb-2 w-fit uppercase",
                      project.status === 'active' && "status-badge-success",
                      project.status === 'completed' && "status-badge-neutral",
                      project.status === 'on-hold' && "status-badge-warning",
                      project.status === 'cancelled' && "status-badge-warning",
                    )}>
                      {project.status}
                    </span>
                    <h3 className="text-lg font-semibold text-[var(--color-ink)] transition-colors">{project.name}</h3>
                    <p className="page-subtitle">{project.clientName}</p>
                  </div>
                  <div className="relative">
                    <button 
                      className="text-gray-400 hover:text-gray-900 p-1 rounded-md hover:bg-gray-100 transition-colors" 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === project.id ? null : project.id);
                      }}
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                    
                    {openMenuId === project.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedProjectIdForTask(project.id);
                            setIsTaskModalOpen(true);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
                        >
                          Add Task
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setProjectToEdit(project);
                            setIsModalOpen(true);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Edit Project
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            store.updateProject(project.id, { status: project.status === 'completed' ? 'active' : 'completed' });
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          {project.status === 'completed' ? 'Mark as Active' : 'Mark as Completed'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            store.deleteProject(project.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Delete Project
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Project Value</p>
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(project.value)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Pending Amount</p>
                    <p className="text-sm font-semibold text-orange-600">{formatCurrency(project.amountPending)}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-xs font-medium mb-1.5">
                    <span className="text-gray-700">Progress</span>
                    <span className={project.progress === 100 ? "text-emerald-600" : "text-blue-600"}>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className={cn("h-2 rounded-full", project.progress === 100 ? "bg-emerald-500" : "bg-[var(--color-ink)]")}
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="px-5 py-3 bg-gray-50 rounded-b-[24px] flex items-center justify-between">
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="mr-1.5 h-3.5 w-3.5" />
                  Due {format(new Date(project.deadline), 'MMM dd')}
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  {project.milestones.filter(m => m.completed).length}/{project.milestones.length} Milestones
                </div>
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-xl bg-white/50">
              No projects found for the selected filter.
            </div>
          )}
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        type="button"
        className="sm:hidden fixed bottom-[5.25rem] right-5 h-14 w-14 flex items-center justify-center fab-mobile z-40"
        onClick={() => {
          setProjectToEdit(null);
          setIsModalOpen(true);
        }}
      >
        <Plus className="h-6 w-6" />
      </button>

      <ProjectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectToEdit={projectToEdit}
      />
      
      <TaskModal 
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        defaultProjectId={selectedProjectIdForTask}
      />
    </div>
  );
}
