import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { formatCurrency, cn } from '../lib/utils';
import { format } from 'date-fns';
import { Plus, MoreVertical, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { ProjectStatus } from '../types';

export function Projects() {
  const store = useStore();
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all');
  
  const projects = store.projects.filter(p => filter === 'all' ? true : p.status === filter);

  return (
    <div className="space-y-6 pb-20 lg:pb-0 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500">Manage client projects and deliverables</p>
        </div>
        <button className="btn-quick-add focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
          <Plus className="h-[16px] w-[16px]" />
          <span>New Project</span>
        </button>
      </div>

      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit overflow-x-auto max-w-full">
        {(['all', 'active', 'completed', 'on-hold'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-all",
              filter === f ? "bg-white text-gray-900" : "text-gray-500 hover:text-gray-700"
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-[#272625]/[0.03] p-[17px] rounded-[19px] flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-4 px-1">
          <h2 className="text-[#8C8684] text-xs font-medium tracking-tight uppercase">Project List</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 content-start">
          {projects.map(project => (
            <Link key={project.id} to={`/projects/${project.id}`} className="design-card transition-all hover:ring-2 hover:ring-gray-200 flex flex-col cursor-pointer group">
              <div className="p-5 border-b border-gray-100 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mb-2 w-fit",
                      project.status === 'active' && "bg-emerald-100 text-emerald-800",
                      project.status === 'completed' && "bg-gray-100 text-gray-800",
                      project.status === 'on-hold' && "bg-orange-100 text-orange-800",
                      project.status === 'cancelled' && "bg-red-100 text-red-800",
                    )}>
                      {project.status.toUpperCase()}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{project.name}</h3>
                    <p className="text-sm text-gray-500">{project.clientName}</p>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600" onClick={(e) => e.preventDefault()}>
                    <MoreVertical className="h-5 w-5" />
                  </button>
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
                      className={cn("h-2 rounded-full", project.progress === 100 ? "bg-emerald-500" : "bg-blue-600")}
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
            </Link>
          ))}
          {projects.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-xl bg-white/50">
              No projects found for the selected filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
