import React from 'react';
import { PageShell } from '../components/layout/PageShell';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { formatCurrency, cn } from '../lib/utils';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, FileText, CheckCircle2, ChevronRight, CheckSquare, ExternalLink, MessageSquare, Edit2, Plus, X } from 'lucide-react';
import { ProjectModal } from '../components/ProjectModal';
import { TaskModal } from '../components/TaskModal';

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const store = useStore();
  
  const [isProjectModalOpen, setIsProjectModalOpen] = React.useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = React.useState(false);
  const [isAddingMilestone, setIsAddingMilestone] = React.useState(false);
  
  const project = store.projects.find(p => p.id === id);
  const projectTasks = store.tasks.filter(t => t.projectId === id);
  
  const toggleMilestone = (milestoneId: string) => {
    if (!project) return;
    
    const updatedMilestones = project.milestones.map(m => 
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );
    
    const completedCount = updatedMilestones.filter(m => m.completed).length;
    const progress = project.milestones.length > 0 
      ? Math.round((completedCount / project.milestones.length) * 100)
      : 0;
      
    store.updateProject(project.id, {
      milestones: updatedMilestones,
      progress
    });
  };

  const handleGenerateInvoice = () => {
    if (!project) return;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("INVOICE", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Your Company Inc.", pageWidth / 2, 30, { align: "center" });
    doc.text("Code: 123456789", pageWidth / 2, 35, { align: "center" });
    doc.text("Tax ID: LT1000123456789", pageWidth / 2, 40, { align: "center" });
    doc.text("123 Business Rd, New York, 10001", pageWidth / 2, 45, { align: "center" });
    
    // Table
    const tableData = project.milestones.map(m => [
      m.name,
      1, // Qty
      formatCurrency(m.amount),
      formatCurrency(m.amount)
    ]);
    
    let currentY = 55;
    
    autoTable(doc, {
      startY: currentY,
      head: [['Item', 'Qty', 'Rate', 'Amount']],
      body: tableData,
      theme: 'plain',
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
        lineWidth: { bottom: 0.5 },
        lineColor: [0, 0, 0]
      },
      bodyStyles: {
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'left' },
        3: { halign: 'right' }
      },
      margin: { top: 10, left: 20, right: 20 }
    });
    
    // @ts-ignore
    currentY = doc.lastAutoTable.finalY + 10;
    
    // Summary
    doc.line(20, currentY, pageWidth - 20, currentY);
    currentY += 5;
    doc.setFontSize(10);
    doc.text("Subtotal", 20, currentY);
    doc.text(`${formatCurrency(project.value)}`, pageWidth - 20, currentY, { align: "right" });
    currentY += 5;
    doc.text("Tax 0%", 20, currentY);
    doc.text("$0.00", pageWidth - 20, currentY, { align: "right" });
    currentY += 5;
    doc.setFont("helvetica", "bold");
    doc.text("Total", 20, currentY);
    doc.text(`${formatCurrency(project.value)}`, pageWidth - 20, currentY, { align: "right" });
    
    currentY += 5;
    doc.line(20, currentY, pageWidth - 20, currentY);
    
    // Bank Details
    currentY += 10;
    doc.setFont("helvetica", "normal");
    doc.text("Bank Name", 20, currentY);
    doc.text("LT601010012345678901", pageWidth - 20, currentY, { align: "right" });
    
    // Invoice details & Recipient Details
    currentY += 20;
    doc.text("Invoice", 60, currentY, { align: "center" });
    doc.text("Recipient", pageWidth - 60, currentY, { align: "center" });
    
    currentY += 5;
    doc.text(`Invoice no.: INV-${Math.floor(Math.random() * 1000)}`, 60, currentY, { align: "center" });
    doc.text(`Client: ${project.clientName}`, pageWidth - 60, currentY, { align: "center" });
    
    currentY += 5;
    doc.text(`Invoice date: ${new Date().toISOString().split('T')[0]}`, 60, currentY, { align: "center" });
    doc.text(`${project.clientEmail}`, pageWidth - 60, currentY, { align: "center" });
    
    // Footer
    doc.setFont("helvetica", "italic");
    doc.text("Thanks for being with us!", pageWidth / 2, currentY + 30, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("hello@yourcompany.com", 20, currentY + 45);
    doc.text("+1-234-567-8900", pageWidth / 2, currentY + 45, { align: "center" });
    doc.text("yourcompany.app", pageWidth - 20, currentY + 45, { align: "right" });
    
    // Save
    doc.save(`Invoice-${project.name.replace(/\s+/g, '-')}.pdf`);
  };
  
  const handleEmailClient = () => {
    if (!project) return;
    window.location.href = `mailto:${project.clientEmail}?subject=Regarding Project: ${project.name}`;
  };
  
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-2xl font-bold text-[var(--color-ink)] mb-2">Project not found</h2>
        <p className="text-[var(--color-ink-secondary)] mb-6">The project you are looking for does not exist or has been removed.</p>
        <button 
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-[10px] text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)] transition-colors shadow-[var(--shadow-card)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink-muted)] focus:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Projects</span>
        </button>
      </div>
    );
  }

  return (
    <PageShell className="lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-[var(--color-ink-secondary)] mb-2">
            <Link to="/projects" className="hover:text-[var(--color-ink)]">Projects</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-[var(--color-ink)] font-medium">{project.name}</span>
          </div>
          <h1 className="page-title">{project.name}</h1>
          <p className="page-subtitle">Client: {project.clientName} ({project.clientEmail})</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
            project.status === 'lead' && "bg-[var(--color-surface-muted)] text-[var(--color-ink)]",
            project.status === 'active' && "bg-emerald-100 text-emerald-800",
            project.status === 'completed' && "bg-[var(--color-surface-muted)] text-[var(--color-ink)]",
            project.status === 'on-hold' && "bg-orange-100 text-orange-800",
            project.status === 'cancelled' && "bg-red-100 text-red-800",
          )}>
            {project.status.toUpperCase()}
          </span>
          <button 
            onClick={() => setIsProjectModalOpen(true)}
            className="inline-flex items-center justify-center p-2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-[10px] hover:bg-[var(--color-surface-hover)] transition-colors shadow-[var(--shadow-card)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-subtle)]"
            title="Edit Project"
          >
            <Edit2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details & Milestones */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <div className="section-panel">
            <div className="flex justify-between items-center mb-4 px-1">
              <h2 className="section-label">Overview</h2>
            </div>
            <div className="design-card p-6">
              <p className="text-[var(--color-ink)] leading-relaxed mb-6">{project.description}</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-6 gap-x-4 sm:gap-4 pt-6 border-t border-[var(--color-border-soft)]">
                <div className="flex flex-col gap-1.5 sm:gap-2">
                  <p className="text-xs font-medium text-[var(--color-ink-secondary)]">Total Value</p>
                  <p className="text-lg sm:text-[20px] font-medium leading-tight sm:leading-none tracking-[-0.011em] text-[var(--color-ink)]">{formatCurrency(project.value)}</p>
                </div>
                <div className="flex flex-col gap-1.5 sm:gap-2">
                  <p className="text-xs font-medium text-[var(--color-ink-secondary)]">Received</p>
                  <p className="text-lg sm:text-[20px] font-medium leading-tight sm:leading-none tracking-[-0.011em] text-emerald-600">{formatCurrency(project.amountReceived)}</p>
                </div>
                <div className="flex flex-col gap-1.5 sm:gap-2">
                  <p className="text-xs font-medium text-[var(--color-ink-secondary)]">Pending</p>
                  <p className="text-lg sm:text-[20px] font-medium leading-tight sm:leading-none tracking-[-0.011em] text-orange-600">{formatCurrency(project.amountPending)}</p>
                </div>
                <div className="flex flex-col gap-1.5 sm:gap-2">
                  <p className="text-xs font-medium text-[var(--color-ink-secondary)]">Start Date</p>
                  <p className="text-lg sm:text-[20px] font-medium leading-tight sm:leading-none tracking-[-0.011em] text-[var(--color-ink)] whitespace-nowrap">{format(new Date(project.startDate), 'MMM dd, yyyy')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Milestones */}
          <div className="section-panel">
            <div className="flex justify-between items-center mb-4 px-1">
              <h2 className="section-label">Milestones ({project.milestones.filter(m => m.completed).length}/{project.milestones.length})</h2>
            </div>
            <div className="design-card p-6 space-y-4">
              <div className="mb-6">
                <div className="flex justify-between text-sm font-medium mb-2">
                  <span className="text-[var(--color-ink)]">Project Progress</span>
                  <span className={project.progress === 100 ? "text-emerald-600" : "text-[var(--color-ink-secondary)]"}>{project.progress}%</span>
                </div>
                <div className="w-full bg-[var(--color-surface-muted)] rounded-full h-2.5">
                  <div 
                    className={cn("h-2.5 rounded-full transition-all duration-500", project.progress === 100 ? "bg-emerald-500" : "bg-[var(--color-ink)]")}
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {project.milestones.map((milestone) => (
                  <div key={milestone.id} className="relative group">
                    <button 
                      onClick={() => toggleMilestone(milestone.id)}
                      className={cn(
                      "w-full flex items-center justify-between p-4 rounded-xl border transition-colors text-left focus:outline-none focus:ring-2 focus:ring-[var(--color-ink-muted)]",
                      milestone.completed ? "bg-[var(--color-surface-muted)] border-[var(--color-border-soft)]" : "border-[var(--color-border-subtle)] hover:border-[var(--color-border-subtle)]"
                    )}>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
                          milestone.completed ? "bg-emerald-100 text-emerald-600" : "bg-[var(--color-surface-muted)] text-[var(--color-ink-muted)] group-hover:bg-[var(--color-surface-hover)] group-hover:text-[var(--color-ink-secondary)]"
                        )}>
                          {milestone.completed ? <CheckCircle2 className="h-5 w-5" /> : <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-ink-muted)]" />}
                        </div>
                        <div>
                          <p className={cn("font-medium transition-colors", milestone.completed ? "text-[var(--color-ink-secondary)] line-through" : "text-[var(--color-ink)]")}>
                            {milestone.name}
                          </p>
                          <p className="text-xs text-[var(--color-ink-secondary)] flex items-center mt-0.5">
                            <Calendar className="h-3 w-3 mr-1" />
                            Due {format(new Date(milestone.dueDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={cn(
                          "font-semibold text-sm transition-colors mr-6",
                          milestone.completed ? "text-[var(--color-ink-secondary)]" : "text-[var(--color-ink)]"
                        )}>
                          {formatCurrency(milestone.amount)}
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        store.updateProject(project.id, { milestones: project.milestones.filter(m => m.id !== milestone.id) });
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-[var(--color-ink-muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--color-surface)]/80 rounded"
                      title="Delete milestone"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {project.milestones.length === 0 && (
                  <p className="text-sm text-[var(--color-ink-secondary)] italic text-center py-4">No milestones created yet.</p>
                )}
              </div>
              
              {!isAddingMilestone ? (
                <button
                  onClick={() => setIsAddingMilestone(true)}
                  className="w-full mt-2 py-3 border-2 border-dashed border-[var(--color-border-subtle)] rounded-xl text-sm font-medium text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)] transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Milestone
                </button>
              ) : (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const nameInput = form.elements.namedItem('mName') as HTMLInputElement;
                    const amtInput = form.elements.namedItem('mAmount') as HTMLInputElement;
                    const dateInput = form.elements.namedItem('mDate') as HTMLInputElement;
                    
                    if (nameInput.value && amtInput.value && dateInput.value) {
                      const newMilestone = {
                        id: Math.random().toString(36).substring(2, 9),
                        name: nameInput.value,
                        amount: Number(amtInput.value),
                        dueDate: new Date(dateInput.value).toISOString(),
                        completed: false
                      };
                      store.updateProject(project.id, { milestones: [...project.milestones, newMilestone] });
                      form.reset();
                      setIsAddingMilestone(false);
                    }
                  }}
                  className="mt-4 pt-4 border-t border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-4 rounded-xl space-y-4"
                >
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-ink-secondary)] mb-1.5 uppercase tracking-wide">Milestone Name</label>
                    <input autoFocus required type="text" name="mName" placeholder="e.g. Wireframes approved" className="w-full text-sm bg-[var(--color-surface)] border border-[var(--color-border-subtle)] focus:border-[var(--color-ink-muted)] focus:ring-1 focus:ring-[var(--color-ink-muted)] rounded-[10px] px-3 py-2 text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-ink-secondary)] mb-1.5 uppercase tracking-wide">Amount</label>
                      <input required type="number" name="mAmount" placeholder="0" className="w-full text-sm bg-[var(--color-surface)] border border-[var(--color-border-subtle)] focus:border-[var(--color-ink-muted)] focus:ring-1 focus:ring-[var(--color-ink-muted)] rounded-[10px] px-3 py-2 text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-ink-secondary)] mb-1.5 uppercase tracking-wide">Due Date</label>
                      <input required type="date" name="mDate" className="w-full text-sm bg-[var(--color-surface)] border border-[var(--color-border-subtle)] focus:border-[var(--color-ink-muted)] focus:ring-1 focus:ring-[var(--color-ink-muted)] rounded-[10px] px-3 py-2 text-[var(--color-ink)]" defaultValue={format(new Date(), 'yyyy-MM-dd')} />
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setIsAddingMilestone(false)}
                      className="flex-1 py-2 px-4 shadow-[var(--shadow-card)] text-sm font-medium rounded-[10px] text-[var(--color-ink)] bg-[var(--color-surface)] border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink-muted)]"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 btn-primary !text-sm"
                    >
                      Save Milestone
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
          
          {/* Related Tasks */}
          <div className="section-panel">
            <div className="flex justify-between items-center mb-4 px-1">
              <h2 className="section-label">Related Tasks</h2>
              <button 
                 onClick={() => setIsTaskModalOpen(true)}
                 className="flex items-center gap-1 text-[11px] font-medium text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] tracking-tight"
               >
                 <Plus className="h-3.5 w-3.5" /> ADD TASK
               </button>
            </div>
            <div className="design-card p-6">
               {projectTasks.length > 0 ? (
                 <div className="space-y-3">
                  {projectTasks.map(task => (
                    <div key={task.id} className="flex items-start gap-3 p-3 border border-[var(--color-border-soft)] rounded-[10px] group">
                      <button 
                        onClick={() => store.toggleTaskCompletion(task.id)}
                        className={cn(
                        "mt-0.5 flex-shrink-0 h-5 w-5 rounded border flex items-center justify-center transition-colors",
                        task.completed ? "bg-[var(--color-ink)] border-[var(--color-ink)]" : "bg-[var(--color-surface)] border-[var(--color-border-subtle)] hover:border-[var(--color-ink-muted)] hover:bg-[var(--color-surface-muted)]"
                      )}>
                        {task.completed && <CheckSquare className="h-3 w-3 text-white" />}
                      </button>
                      <div className="flex-1">
                        <p className={cn("text-sm font-medium transition-colors", task.completed ? "text-[var(--color-ink-muted)] line-through" : "text-[var(--color-ink)]")}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {task.priority === 'high' && <span className="text-[10px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">High</span>}
                          {task.dueDate && (
                            <span className="text-[10px] text-[var(--color-ink-secondary)] flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {format(new Date(task.dueDate), 'MMM dd')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                 </div>
               ) : (
                 <div className="text-center py-6">
                   <p className="text-sm font-medium text-[var(--color-ink)] mb-3">No tasks created yet for this project.</p>
                   <button 
                     onClick={() => setIsTaskModalOpen(true)}
                     className="inline-flex items-center justify-center px-4 py-2 bg-[var(--color-surface-muted)] text-[var(--color-ink-secondary)] font-medium rounded-[10px] text-sm hover:bg-[var(--color-surface-hover)] transition-colors"
                   >
                     Create First Task
                   </button>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Right Column - Side Info */}
        <div className="space-y-6">
          {/* Deliverables */}
          <div className="section-panel">
            <div className="flex justify-between items-center mb-4 px-1">
              <h2 className="section-label">Deliverables</h2>
            </div>
            <div className="design-card p-6">
              <ul className="space-y-3 mb-4">
                {project.deliverables.map((item, i) => (
                  <li key={i} className="flex items-start justify-between text-sm text-[var(--color-ink)] group">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-[var(--color-ink-secondary)] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                    <button 
                      onClick={() => store.updateProject(project.id, { deliverables: project.deliverables.filter((_, index) => index !== i) })}
                      className="text-[var(--color-ink-muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
                {project.deliverables.length === 0 && (
                  <li className="text-sm text-[var(--color-ink-secondary)] italic">No deliverables added yet.</li>
                )}
              </ul>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const input = e.currentTarget.elements.namedItem('newDeliverable') as HTMLInputElement;
                  if (input.value.trim()) {
                    store.updateProject(project.id, { deliverables: [...project.deliverables, input.value.trim()] });
                    input.value = '';
                  }
                }}
                className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--color-border-soft)]"
              >
                <input 
                  type="text" 
                  name="newDeliverable"
                  placeholder="Add a deliverable..." 
                  className="flex-1 text-sm bg-[var(--color-surface-muted)] border-none rounded-[10px] px-3 py-2 text-[var(--color-ink)] focus:ring-1 focus:ring-[var(--color-ink-muted)]"
                />
                <button type="submit" className="text-xs font-medium text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] px-3 py-2 bg-[var(--color-surface-muted)] rounded-[10px]">Add</button>
              </form>
            </div>
          </div>

          {/* Notes */}
          <div className="section-panel">
            <div className="flex justify-between items-center mb-4 px-1">
              <h2 className="section-label">Notes</h2>
            </div>
            <div className="design-card p-6">
              <textarea 
                className="w-full text-sm text-[var(--color-ink)] whitespace-pre-wrap bg-transparent border-none focus:ring-0 resize-none p-0"
                placeholder="Add project notes here..."
                defaultValue={project.notes}
                rows={5}
                onBlur={(e) => store.updateProject(project.id, { notes: e.target.value })}
              />
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="section-panel">
            <div className="flex justify-between items-center mb-4 px-1">
              <h2 className="section-label">Actions</h2>
            </div>
            <div className="design-card p-4 space-y-2">
              <button onClick={handleEmailClient} className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)] rounded-[10px] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-ink-muted)]">
                <span className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-[var(--color-ink-secondary)]" /> Email Client</span>
                <ExternalLink className="h-3 w-3 text-[var(--color-ink-muted)]" />
              </button>
              <button onClick={handleGenerateInvoice} className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)] rounded-[10px] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-ink-muted)]">
                <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-[var(--color-ink-secondary)]" /> Generate Invoice</span>
                <ChevronRight className="h-4 w-4 text-[var(--color-ink-muted)]" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <ProjectModal 
        isOpen={isProjectModalOpen} 
        onClose={() => setIsProjectModalOpen(false)} 
        projectToEdit={project} 
      />
      
      <TaskModal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
        defaultProjectId={project.id}
      />
    </PageShell>
  );
}
