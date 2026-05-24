import React from 'react';
import { PageShell } from '../components/layout/PageShell';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { formatCurrency, cn } from '../lib/utils';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, FileText, CheckCircle2, ChevronRight, CheckSquare, ExternalLink, MessageSquare, Edit2, Plus, X, Download } from 'lucide-react';
import { ProjectModal } from '../components/ProjectModal';
import { TaskModal } from '../components/TaskModal';
import { SidePanel } from '../components/SidePanel';
import { ProposalModal } from '../components/ProposalModal';
import { auth } from '../lib/firebase';

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const store = useStore();
  
  const [isProjectModalOpen, setIsProjectModalOpen] = React.useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = React.useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = React.useState(false);
  const [isAddingMilestone, setIsAddingMilestone] = React.useState(false);
  const [milestoneName, setMilestoneName] = React.useState('');
  const [milestoneAmount, setMilestoneAmount] = React.useState('');
  const [milestoneDueDate, setMilestoneDueDate] = React.useState(format(new Date(), 'yyyy-MM-dd'));
  
  const project = store.projects.find(p => p.id === id);
  const projectTasks = store.tasks.filter(t => t.projectId === id);
  
  const toggleMilestone = (milestoneId: string) => {
    if (!project) return;
    
    const milestone = project.milestones.find(m => m.id === milestoneId);
    if (!milestone) return;

    const updatedMilestones = project.milestones.map(m => 
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );
    
    const completedCount = updatedMilestones.filter(m => m.completed).length;
    const progress = updatedMilestones.length > 0 
      ? Math.round((completedCount / updatedMilestones.length) * 100)
      : 0;
      
    store.updateProject(project.id, {
      milestones: updatedMilestones,
      progress
    });

    const projectInvoices = store.invoices.filter(inv => inv.projectId === project.id);

    if (!milestone.completed) {
      const autoInvoice = {
        id: Math.random().toString(36).substring(2, 11),
        projectId: project.id,
        milestoneId: milestoneId,
        invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        amount: milestone.amount,
        status: 'draft' as const,
        dueDate: milestone.dueDate.split('T')[0],
        createdAt: new Date().toISOString(),
        description: `Milestone Payment: ${milestone.name}`
      };
      store.addInvoice(autoInvoice);
    } else {
      const draftInvoice = projectInvoices.find(inv => inv.milestoneId === milestoneId && inv.status === 'draft');
      if (draftInvoice) {
        store.deleteInvoice(draftInvoice.id);
      }
    }
  };

  const handleSaveMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    if (milestoneName && milestoneDueDate) {
      const newMilestone = {
        id: Math.random().toString(36).substring(2, 9),
        name: milestoneName,
        amount: Number(milestoneAmount) || 0,
        dueDate: new Date(milestoneDueDate).toISOString(),
        completed: false
      };
      
      const updatedMilestones = [...project.milestones, newMilestone];
      const completedCount = updatedMilestones.filter(m => m.completed).length;
      const progress = updatedMilestones.length > 0 
        ? Math.round((completedCount / updatedMilestones.length) * 100)
        : 0;

      store.updateProject(project.id, { 
        milestones: updatedMilestones,
        progress
      });
      
      setMilestoneName('');
      setMilestoneAmount('');
      setMilestoneDueDate(format(new Date(), 'yyyy-MM-dd'));
      setIsAddingMilestone(false);
    }
  };

  const [hourlyRate, setHourlyRate] = React.useState(0);

  React.useEffect(() => {
    if (project) {
      setHourlyRate(project.hourlyRate || 0);
    }
  }, [project?.id]);

  const activeTimer = store.activeTimer;
  const isProjectTimerActive = activeTimer?.id === project?.id && activeTimer?.type === 'project';
  const [tickingSeconds, setTickingSeconds] = React.useState(0);

  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isProjectTimerActive && activeTimer) {
      const updateTime = () => {
        const elapsed = Math.round((Date.now() - new Date(activeTimer.startTime).getTime()) / 1000);
        setTickingSeconds(elapsed);
      };
      updateTime();
      interval = setInterval(updateTime, 1000);
    } else {
      setTickingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isProjectTimerActive, activeTimer]);

  const handleToggleTimer = () => {
    if (!project) return;
    if (isProjectTimerActive) {
      store.stopTimer();
    } else {
      store.startTimer(project.id, 'project');
    }
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const totalProjectSeconds = project 
    ? (project.timeSpent || 0) + projectTasks.reduce((acc, t) => acc + (t.timeSpent || 0), 0)
    : 0;

  const projectInvoices = project 
    ? store.invoices.filter(inv => inv.projectId === project.id) 
    : [];

  const handleDownloadInvoice = (invoice: any) => {
    if (!project) return;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("INVOICE", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(project.name, pageWidth / 2, 30, { align: "center" });
    doc.text(`Invoice No: ${invoice.invoiceNumber}`, pageWidth / 2, 35, { align: "center" });
    doc.text(`Due Date: ${invoice.dueDate}`, pageWidth / 2, 40, { align: "center" });
    
    const tableData = [
      [invoice.description || 'Project Milestone Payment', 1, formatCurrency(invoice.amount), formatCurrency(invoice.amount)]
    ];
    
    let currentY = 55;
    
    autoTable(doc, {
      startY: currentY,
      head: [['Item / Description', 'Qty', 'Rate', 'Amount']],
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
    doc.text(`${formatCurrency(invoice.amount)}`, pageWidth - 20, currentY, { align: "right" });
    currentY += 5;
    doc.text("Tax 0%", 20, currentY);
    doc.text("$0.00", pageWidth - 20, currentY, { align: "right" });
    currentY += 5;
    doc.setFont("helvetica", "bold");
    doc.text("Total", 20, currentY);
    doc.text(`${formatCurrency(invoice.amount)}`, pageWidth - 20, currentY, { align: "right" });
    
    currentY += 10;
    doc.line(20, currentY, pageWidth - 20, currentY);
    
    // Client details
    currentY += 15;
    doc.setFont("helvetica", "bold");
    doc.text("Prepared For:", 20, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(project.clientName, 20, currentY + 5);
    doc.text(project.clientEmail, 20, currentY + 10);
    
    // Footer
    doc.setFont("helvetica", "italic");
    doc.text("Thank you for your business!", pageWidth / 2, currentY + 30, { align: "center" });
    
    doc.save(`${invoice.invoiceNumber}.pdf`);
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
          <p className="page-subtitle">
            Client: {project.clientName}{project.clientEmail ? ` (${project.clientEmail})` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "status-badge uppercase px-3 py-1 text-xs",
            project.status === 'lead' && "status-badge-neutral",
            project.status === 'active' && "status-badge-success",
            project.status === 'completed' && "status-badge-neutral",
            project.status === 'on-hold' && "status-badge-warning",
            project.status === 'cancelled' && "status-badge-warning",
          )}>
            {project.status}
          </span>
          <button
            onClick={() => setIsProposalModalOpen(true)}
            className="btn-secondary text-xs flex items-center gap-1.5"
            title="Generate Proposal"
          >
            <FileText className="h-4.5 w-4.5" />
            <span>Proposal</span>
          </button>
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

              <div className="divide-y divide-[var(--color-border-soft)] mb-4">
                {project.milestones.map((milestone) => (
                  <div key={milestone.id} className="relative group">
                    <button 
                      onClick={() => toggleMilestone(milestone.id)}
                      className="w-full flex items-center justify-between py-4 px-1 transition-colors text-left focus:outline-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
                          milestone.completed 
                            ? "text-emerald-600 dark:text-emerald-400" 
                            : "text-[var(--color-ink-muted)]"
                        )}>
                          {milestone.completed ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <div className="h-4.5 w-4.5 rounded-full border-2 border-[var(--color-border-subtle)] group-hover:border-[var(--color-ink-secondary)] transition-colors" />
                          )}
                        </div>
                        <div>
                           <p className={cn("font-medium transition-colors text-sm", milestone.completed ? "text-[var(--color-ink-secondary)] line-through" : "text-[var(--color-ink)]")}>
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
                        const updatedMilestones = project.milestones.filter(m => m.id !== milestone.id);
                        const completedCount = updatedMilestones.filter(m => m.completed).length;
                        const progress = updatedMilestones.length > 0 
                          ? Math.round((completedCount / updatedMilestones.length) * 100)
                          : 0;
                        store.updateProject(project.id, { 
                           milestones: updatedMilestones,
                           progress
                        });
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--color-ink-muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--color-surface)]/80 rounded"
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
              
              <button
                onClick={() => {
                  setMilestoneName('');
                  setMilestoneAmount('0');
                  setMilestoneDueDate(format(new Date(), 'yyyy-MM-dd'));
                  setIsAddingMilestone(true);
                }}
                className="w-full mt-2 py-3 border-2 border-dashed border-[var(--color-border-subtle)] rounded-xl text-sm font-medium text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)] transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Milestone
              </button>
            </div>
          </div>

          {/* Invoices Section */}
          <div className="section-panel">
            <div className="flex justify-between items-center mb-4 px-1">
              <h2 className="section-label">Invoices</h2>
            </div>
            <div className="design-card p-6 space-y-4">
              {projectInvoices.length > 0 ? (
                <div className="space-y-3">
                  {projectInvoices.map((invoice) => (
                    <div key={invoice.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-[var(--color-border-soft)] rounded-[10px] bg-[var(--color-surface)] gap-3 group relative">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[var(--color-surface-muted)] flex items-center justify-center text-[var(--color-ink-secondary)]">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[var(--color-ink)]">{invoice.invoiceNumber}</span>
                            <span className={cn(
                              "status-badge text-[9px] uppercase px-1.5 py-0.5",
                              invoice.status === 'paid' && "status-badge-success",
                              invoice.status === 'sent' && "status-badge-neutral",
                              invoice.status === 'draft' && "status-badge-neutral",
                              invoice.status === 'overdue' && "status-badge-warning"
                            )}>
                              {invoice.status}
                            </span>
                          </div>
                          {invoice.description && (
                            <p className="text-xs text-[var(--color-ink-secondary)] truncate max-w-[200px]">{invoice.description}</p>
                          )}
                          <p className="text-[10px] text-[var(--color-ink-muted)]">Due: {invoice.dueDate}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-[var(--color-border-soft)]">
                        <span className="text-sm font-semibold text-[var(--color-ink)]">{formatCurrency(invoice.amount)}</span>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDownloadInvoice(invoice)}
                            className="p-1.5 text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] bg-[var(--color-surface-muted)] rounded-lg transition-colors"
                            title="Download Invoice PDF"
                          >
                            <Download className="h-4 w-4" />
                          </button>

                          <select
                            value={invoice.status}
                            onChange={(e) => store.updateInvoiceStatus(invoice.id, e.target.value as any)}
                            className="text-xs bg-[var(--color-surface-muted)] border-none rounded-lg px-2.5 py-1 text-[var(--color-ink)] focus:ring-0 cursor-pointer"
                          >
                            <option value="draft">Draft</option>
                            <option value="sent">Sent</option>
                            <option value="overdue">Overdue</option>
                            <option value="paid">Paid</option>
                          </select>

                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this invoice?')) {
                                store.deleteInvoice(invoice.id);
                              }
                            }}
                            className="text-[var(--color-ink-muted)] hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete invoice"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--color-ink-secondary)] italic text-center py-2">No invoices generated yet. Mark a milestone as completed to auto-create a draft.</p>
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
                        <div className="flex justify-between items-start gap-2">
                          <p className={cn("text-sm font-medium transition-colors", task.completed ? "text-[var(--color-ink-muted)] line-through" : "text-[var(--color-ink)]")}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2">
                            {task.timeSpent ? (
                              <span className="text-[10px] bg-[var(--color-surface-muted)] text-[var(--color-ink-secondary)] px-1.5 py-0.5 rounded font-mono">
                                {formatTime(task.timeSpent)}
                              </span>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => {
                                const isTaskTimerActive = store.activeTimer?.id === task.id && store.activeTimer?.type === 'task';
                                if (isTaskTimerActive) {
                                  store.stopTimer();
                                } else {
                                  store.startTimer(task.id, 'task');
                                }
                              }}
                              className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-medium transition-all",
                                store.activeTimer?.id === task.id && store.activeTimer?.type === 'task'
                                  ? "text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400"
                                  : "bg-[var(--color-surface-muted)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
                              )}
                              title={store.activeTimer?.id === task.id && store.activeTimer?.type === 'task' ? "Stop Timer" : "Start Timer"}
                            >
                              {store.activeTimer?.id === task.id && store.activeTimer?.type === 'task' ? "STOP" : "TRACK"}
                            </button>
                          </div>
                        </div>
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
          {/* Client Portal Sharing */}
          <div className="section-panel">
            <div className="flex justify-between items-center mb-4 px-1">
              <h2 className="section-label">Client Portal</h2>
            </div>
            <div className="design-card p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-[var(--color-ink)]">Enable Share Link</span>
                <button
                  type="button"
                  onClick={() => store.updateProject(project.id, { isPublic: !project.isPublic })}
                  className={cn(
                    "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    project.isPublic ? "bg-[var(--color-ink)]" : "bg-[var(--color-surface-muted)]"
                  )}
                >
                  <span className="sr-only">Toggle public portal</span>
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      project.isPublic ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
              {project.isPublic && (
                <div className="space-y-2">
                  <input
                    readOnly
                    value={`${window.location.origin}/portal/project/${auth.currentUser?.uid}/${project.id}`}
                    className="w-full text-xs bg-[var(--color-surface-muted)] text-[var(--color-ink-secondary)] p-2.5 rounded-lg border-none focus:ring-0 truncate font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const url = `${window.location.origin}/portal/project/${auth.currentUser?.uid}/${project.id}`;
                      navigator.clipboard.writeText(url);
                      alert('Portal URL copied to clipboard!');
                    }}
                    className="w-full btn-secondary text-xs py-2"
                  >
                    Copy Portal Link
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Time Tracker */}
          <div className="section-panel">
            <div className="flex justify-between items-center mb-4 px-1">
              <h2 className="section-label">Time Tracker</h2>
            </div>
            <div className="design-card p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-[var(--color-ink)]">Stopwatch</p>
                  <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                    Logged: {formatTime(totalProjectSeconds)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleTimer}
                  className={cn(
                    "btn-secondary !p-2 rounded-full transition-all",
                    isProjectTimerActive && "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30"
                  )}
                >
                  {isProjectTimerActive ? (
                    <div className="flex items-center gap-1.5 text-xs font-semibold px-2">
                      <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                      <span>STOP ({formatTime(tickingSeconds)})</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs font-medium px-2">
                      <span>START TIMER</span>
                    </div>
                  )}
                </button>
              </div>

              {/* Hourly billing */}
              <div className="pt-3 border-t border-[var(--color-border-soft)] space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-ink-secondary)] mb-1.5 uppercase tracking-wide">Hourly Rate (INR)</label>
                  <input
                    type="number"
                    min="0"
                    value={hourlyRate || ''}
                    onChange={(e) => {
                      const rate = Number(e.target.value) || 0;
                      setHourlyRate(rate);
                      store.updateProject(project.id, { hourlyRate: rate });
                    }}
                    placeholder="e.g. 2000"
                    className="w-full text-sm bg-[var(--color-surface-muted)] border-none rounded-lg px-3 py-2 text-[var(--color-ink)] focus:ring-1 focus:ring-[var(--color-ink-muted)]"
                  />
                </div>
                {totalProjectSeconds > 0 && hourlyRate > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Are you sure you want to bill ${(totalProjectSeconds / 3600).toFixed(2)} hours at ₹${hourlyRate}/hr? This will reset logged times and generate a draft invoice.`)) {
                        store.convertTimeToInvoice(project.id, hourlyRate);
                      }
                    }}
                    className="w-full btn-primary text-xs py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                  >
                    Bill Logged Hours (₹{Math.round((totalProjectSeconds / 3600) * hourlyRate)})
                  </button>
                )}
              </div>
            </div>
          </div>

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

      <ProposalModal
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        project={project}
      />

      {isAddingMilestone && (
        <SidePanel
          isOpen={isAddingMilestone}
          onClose={() => setIsAddingMilestone(false)}
          title="Add Milestone"
          subtitle={`Create a new payment milestone for ${project.name}`}
          width="max-w-md"
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsAddingMilestone(false)} className="btn-secondary">Cancel</button>
              <button type="submit" form="milestone-form" className="btn-primary">Save Milestone</button>
            </div>
          }
        >
          <form id="milestone-form" onSubmit={handleSaveMilestone} className="space-y-4">
            <div>
              <label className="form-label">Milestone Name *</label>
              <input 
                autoFocus 
                required 
                type="text" 
                value={milestoneName}
                onChange={(e) => setMilestoneName(e.target.value)}
                placeholder="e.g. Wireframes approved" 
                className="input-field" 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Amount (INR) *</label>
                <input 
                  required 
                  type="number" 
                  min="0"
                  step="1"
                  value={milestoneAmount}
                  onChange={(e) => setMilestoneAmount(e.target.value)}
                  placeholder="0" 
                  className="input-field" 
                />
              </div>
              <div>
                <label className="form-label">Due Date *</label>
                <input 
                  required 
                  type="date" 
                  value={milestoneDueDate}
                  onChange={(e) => setMilestoneDueDate(e.target.value)}
                  className="input-field" 
                />
              </div>
            </div>
          </form>
        </SidePanel>
      )}
    </PageShell>
  );
}
