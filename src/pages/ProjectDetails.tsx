import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { formatCurrency, cn } from '../lib/utils';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, FileText, CheckCircle2, ChevronRight, CheckSquare, ExternalLink, MessageSquare } from 'lucide-react';

export function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const store = useStore();
  
  const project = store.projects.find(p => p.id === id);
  const projectTasks = store.tasks.filter(t => t.projectId === id);
  
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Project not found</h2>
        <p className="text-gray-500 mb-6">The project you are looking for does not exist or has been removed.</p>
        <button 
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Projects</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link to="/projects" className="hover:text-gray-900">Projects</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 font-medium">{project.name}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{project.name}</h1>
          <p className="text-sm text-gray-500">Client: {project.clientName} ({project.clientEmail})</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
            project.status === 'active' && "bg-emerald-100 text-emerald-800",
            project.status === 'completed' && "bg-gray-100 text-gray-800",
            project.status === 'on-hold' && "bg-orange-100 text-orange-800",
            project.status === 'cancelled' && "bg-red-100 text-red-800",
          )}>
            {project.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details & Milestones */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <div className="bg-[#272625]/[0.03] p-[17px] rounded-[19px]">
            <div className="flex justify-between items-center mb-4 px-1">
              <h2 className="text-[#8C8684] text-xs font-medium tracking-tight uppercase">Overview</h2>
            </div>
            <div className="design-card p-6">
              <p className="text-gray-700 leading-relaxed mb-6">{project.description}</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-gray-100">
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-gray-500">Total Value</p>
                  <p className="text-[20px] font-medium leading-none tracking-[-0.011em] text-black">{formatCurrency(project.value)}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-gray-500">Received</p>
                  <p className="text-[20px] font-medium leading-none tracking-[-0.011em] text-emerald-600">{formatCurrency(project.amountReceived)}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-gray-500">Pending</p>
                  <p className="text-[20px] font-medium leading-none tracking-[-0.011em] text-orange-600">{formatCurrency(project.amountPending)}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-gray-500">Start Date</p>
                  <p className="text-[20px] font-medium leading-none tracking-[-0.011em] text-black">{format(new Date(project.startDate), 'MMM dd, yyyy')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Milestones */}
          <div className="bg-[#272625]/[0.03] p-[17px] rounded-[19px]">
            <div className="flex justify-between items-center mb-4 px-1">
              <h2 className="text-[#8C8684] text-xs font-medium tracking-tight uppercase">Milestones ({project.milestones.filter(m => m.completed).length}/{project.milestones.length})</h2>
            </div>
            <div className="design-card p-6 space-y-4">
              <div className="mb-6">
                <div className="flex justify-between text-sm font-medium mb-2">
                  <span className="text-gray-700">Project Progress</span>
                  <span className={project.progress === 100 ? "text-emerald-600" : "text-blue-600"}>{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div 
                    className={cn("h-2.5 rounded-full transition-all duration-500", project.progress === 100 ? "bg-emerald-500" : "bg-blue-600")}
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-3">
                {project.milestones.map((milestone) => (
                  <div key={milestone.id} className={cn(
                    "flex items-center justify-between p-4 rounded-xl border transition-colors",
                    milestone.completed ? "bg-gray-50 border-gray-100" : "border-gray-200 hover:border-blue-100"
                  )}>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                        milestone.completed ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400"
                      )}>
                        {milestone.completed ? <CheckCircle2 className="h-5 w-5" /> : <div className="h-2.5 w-2.5 rounded-full bg-gray-300" />}
                      </div>
                      <div>
                        <p className={cn("font-medium", milestone.completed ? "text-gray-600 line-through" : "text-gray-900")}>
                          {milestone.name}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center mt-0.5">
                          <Calendar className="h-3 w-3 mr-1" />
                          Due {format(new Date(milestone.dueDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "font-semibold text-sm",
                        milestone.completed ? "text-gray-500" : "text-gray-900"
                      )}>
                        {formatCurrency(milestone.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Related Tasks */}
          {projectTasks.length > 0 && (
            <div className="bg-[#272625]/[0.03] p-[17px] rounded-[19px]">
              <div className="flex justify-between items-center mb-4 px-1">
                <h2 className="text-[#8C8684] text-xs font-medium tracking-tight uppercase">Related Tasks</h2>
                <Link to="/tasks" className="text-[11px] font-medium text-gray-500 hover:text-gray-900 tracking-tight">VIEW TASKS &rarr;</Link>
              </div>
              <div className="design-card p-6">
                 <div className="space-y-3">
                  {projectTasks.map(task => (
                    <div key={task.id} className="flex items-start gap-3 p-3 border border-gray-100 rounded-lg group">
                      <div className={cn(
                        "mt-0.5 flex-shrink-0 h-5 w-5 rounded border border-gray-300 flex items-center justify-center",
                        task.completed ? "bg-blue-500 border-blue-500" : "bg-white"
                      )}>
                        {task.completed && <CheckSquare className="h-3 w-3 text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className={cn("text-sm font-medium", task.completed ? "text-gray-400 line-through" : "text-gray-900")}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {task.priority === 'high' && <span className="text-[10px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">High</span>}
                          {task.dueDate && (
                            <span className="text-[10px] text-gray-500 flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {format(new Date(task.dueDate), 'MMM dd')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Side Info */}
        <div className="space-y-6">
          {/* Deliverables */}
          <div className="bg-[#272625]/[0.03] p-[17px] rounded-[19px]">
            <div className="flex justify-between items-center mb-4 px-1">
              <h2 className="text-[#8C8684] text-xs font-medium tracking-tight uppercase">Deliverables</h2>
            </div>
            <div className="design-card p-6">
              <ul className="space-y-3">
                {project.deliverables.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <FileText className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-[#272625]/[0.03] p-[17px] rounded-[19px]">
            <div className="flex justify-between items-center mb-4 px-1">
              <h2 className="text-[#8C8684] text-xs font-medium tracking-tight uppercase">Notes</h2>
            </div>
            <div className="design-card p-6">
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{project.notes}</p>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="bg-[#272625]/[0.03] p-[17px] rounded-[19px]">
            <div className="flex justify-between items-center mb-4 px-1">
              <h2 className="text-[#8C8684] text-xs font-medium tracking-tight uppercase">Actions</h2>
            </div>
            <div className="design-card p-4 space-y-2">
              <button className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                <span className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-gray-500" /> Email Client</span>
                <ExternalLink className="h-3 w-3 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-gray-500" /> Generate Invoice</span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
