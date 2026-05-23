import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { formatCurrency, cn } from '../lib/utils';
import { format } from 'date-fns';
import { Plus, MoreVertical, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { ProjectStatus } from '../types';
import { ProjectModal } from '../components/ProjectModal';
import { TaskModal } from '../components/TaskModal';
import { PageShell } from '../components/layout/PageShell';

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
    <PageShell className="lg:pb-0">
      <header className="page-block flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0">
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
      </header>

      <div className="page-block segmented-control segmented-control-full">
        {(['all', 'lead', 'active', 'completed', 'on-hold'] as const).map(f => (
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

      <section className="page-block flex-1">
        <h2 className="section-label mb-3">Project List</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 w-full min-w-0">
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
                      project.status === 'lead' && "status-badge-neutral",
                      project.status === 'active' && "status-badge-success",
                      project.status === 'completed' && "status-badge-neutral",
                      project.status === 'on-hold' && "status-badge-warning",
                      project.status === 'cancelled' && "status-badge-warning",
                    )}>
                      {project.status}
                    </span>
                    <h3 className="text-base font-medium text-[var(--color-ink)] break-words">{project.name}</h3>
                    <p className="page-subtitle">{project.clientName}</p>
                  </div>
                  <div className="relative">
                    <button 
                      className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-1 rounded-md hover:bg-[var(--color-surface-muted)] transition-colors" 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === project.id ? null : project.id);
                      }}
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                    
                    {openMenuId === project.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--color-surface)] rounded-[10px] shadow-[var(--shadow-elevated)] border border-[var(--color-border-subtle)] py-1 z-50">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedProjectIdForTask(project.id);
                            setIsTaskModalOpen(true);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)] transition-colors border-b border-[var(--color-border-soft)]"
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
                          className="w-full text-left px-4 py-2 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)] transition-colors"
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
                          className="w-full text-left px-4 py-2 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)] transition-colors"
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
                    <p className="text-xs text-[var(--color-ink-secondary)] mb-1">Project Value</p>
                    <p className="text-sm font-semibold text-[var(--color-ink)]">{formatCurrency(project.value)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-ink-secondary)] mb-1">Pending Amount</p>
                    <p className="text-sm font-semibold text-orange-600">{formatCurrency(project.amountPending)}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-xs font-medium mb-1.5">
                    <span className="text-[var(--color-ink)]">Progress</span>
                    <span className={project.progress === 100 ? "text-emerald-600" : "text-blue-600"}>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-[var(--color-surface-muted)] rounded-full h-2">
                    <div 
                      className={cn("h-2 rounded-full", project.progress === 100 ? "bg-emerald-500" : "bg-[var(--color-ink)]")}
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="px-5 py-3 bg-[var(--color-surface-muted)] rounded-b-[calc(var(--radius-card)-1px)] flex items-center justify-between">
                <div className="flex items-center text-xs text-[var(--color-ink-secondary)]">
                  <Calendar className="mr-1.5 h-3.5 w-3.5" />
                  Due {format(new Date(project.deadline), 'MMM dd')}
                </div>
                <div className="flex items-center text-xs text-[var(--color-ink-secondary)]">
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  {project.milestones.filter(m => m.completed).length}/{project.milestones.length} Milestones
                </div>
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="col-span-full py-12 text-center text-[var(--color-ink-secondary)] border-2 border-dashed border-[var(--color-border-subtle)] rounded-xl bg-[var(--color-surface)]/50">
              No projects found for the selected filter.
            </div>
          )}
        </div>
      </section>

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
    </PageShell>
  );
}
