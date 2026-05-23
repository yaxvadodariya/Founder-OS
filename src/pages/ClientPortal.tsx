import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Project, Invoice } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { format } from 'date-fns';
import { Calendar, CheckCircle2, FileText, ChevronRight, Download, CheckSquare } from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export function ClientPortal() {
  const { userId, projectId } = useParams<{ userId: string; projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPortalData() {
      if (!userId || !projectId) {
        setError('Invalid portal link.');
        setLoading(false);
        return;
      }

      try {
        // Fetch project document
        const projectRef = doc(db, 'users', userId, 'projects', projectId);
        const projectSnap = await getDoc(projectRef);

        if (!projectSnap.exists()) {
          setError('Project not found or access has been restricted by the owner.');
          setLoading(false);
          return;
        }

        const projectData = { id: projectSnap.id, ...projectSnap.data() } as Project;
        
        if (!projectData.isPublic) {
          setError('This client portal is private. Please contact the project owner.');
          setLoading(false);
          return;
        }

        setProject(projectData);

        // Fetch invoices associated with this project
        const invoicesRef = collection(db, 'users', userId, 'invoices');
        const q = query(invoicesRef, where('projectId', '==', projectId));
        const invoicesSnap = await getDocs(q);
        const invoicesData = invoicesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Invoice));
        // Sort by date descending
        invoicesData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setInvoices(invoicesData);

      } catch (err: any) {
        console.error('Portal load failed:', err);
        setError('Failed to load project details: ' + err.message);
      } finally {
        setLoading(false);
      }
    }

    loadPortalData();
  }, [userId, projectId]);

  const handleDownloadInvoice = (invoice: Invoice) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-canvas)] flex items-center justify-center font-sans text-[var(--color-ink-muted)]">
        Loading Client Portal...
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[var(--color-canvas)] flex items-center justify-center font-sans px-4">
        <div className="design-card max-w-md w-full p-8 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto text-xl font-bold">!</div>
          <h2 className="text-xl font-bold text-[var(--color-ink)]">Access Restricted</h2>
          <p className="text-sm text-[var(--color-ink-secondary)] leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] py-8 px-4 sm:px-6 lg:px-8 font-sans text-[var(--color-ink)]">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="design-card p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <span className="status-badge status-badge-success mb-2 uppercase text-[10px]">Client Portal</span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-ink)]">{project.name}</h1>
            <p className="text-sm text-[var(--color-ink-secondary)]">Client: {project.clientName} ({project.clientEmail})</p>
          </div>
          <div className="flex flex-col items-end">
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
            <p className="text-xs text-[var(--color-ink-muted)] mt-1.5">Last updated: {format(new Date(project.startDate), 'MMM dd, yyyy')}</p>
          </div>
        </header>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="design-card p-6">
            <p className="text-xs font-medium text-[var(--color-ink-secondary)] uppercase tracking-wider">Project Value</p>
            <p className="text-2xl font-bold mt-2 text-[var(--color-ink)]">{formatCurrency(project.value)}</p>
          </div>
          <div className="design-card p-6">
            <p className="text-xs font-medium text-[var(--color-ink-secondary)] uppercase tracking-wider">Amount Paid</p>
            <p className="text-2xl font-bold mt-2 text-emerald-600 dark:text-emerald-400">{formatCurrency(project.amountReceived)}</p>
          </div>
          <div className="design-card p-6">
            <p className="text-xs font-medium text-[var(--color-ink-secondary)] uppercase tracking-wider">Amount Pending</p>
            <p className="text-2xl font-bold mt-2 text-orange-600 dark:text-orange-400">{formatCurrency(project.amountPending)}</p>
          </div>
        </div>

        {/* Project Progress */}
        <div className="design-card p-6 sm:p-8 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">Overall Progress</h2>
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{project.progress}%</span>
          </div>
          <div className="w-full bg-[var(--color-surface-muted)] rounded-full h-3">
            <div 
              className={cn("h-3 rounded-full transition-all duration-500", project.progress === 100 ? "bg-emerald-500" : "bg-[var(--color-ink)]")}
              style={{ width: `${project.progress}%` }}
            ></div>
          </div>
        </div>

        {/* Split Milestones and Invoices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Milestones */}
          <div className="design-card p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-bold border-b border-[var(--color-border-soft)] pb-3">Project Milestones</h2>
            <div className="divide-y divide-[var(--color-border-soft)]">
              {project.milestones.map((milestone) => (
                <div 
                  key={milestone.id} 
                  className="flex items-center justify-between py-4 transition-colors text-left"
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
                        <div className="h-4.5 w-4.5 rounded-full border-2 border-[var(--color-border-subtle)]" />
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
                      "font-semibold text-sm transition-colors",
                      milestone.completed ? "text-[var(--color-ink-secondary)]" : "text-[var(--color-ink)]"
                    )}>
                      {formatCurrency(milestone.amount)}
                    </span>
                  </div>
                </div>
              ))}
              {project.milestones.length === 0 && (
                <p className="text-sm text-[var(--color-ink-secondary)] italic text-center py-4">No milestones scheduled.</p>
              )}
            </div>
          </div>

          {/* Invoices */}
          <div className="design-card p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-bold border-b border-[var(--color-border-soft)] pb-3">Invoices</h2>
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border border-[var(--color-border-subtle)] rounded-xl bg-[var(--color-surface)]">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-[var(--color-surface-muted)] flex items-center justify-center text-[var(--color-ink-secondary)]">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{invoice.invoiceNumber}</span>
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
                      <p className="text-[11px] text-[var(--color-ink-muted)]">Due {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold">{formatCurrency(invoice.amount)}</span>
                    <button 
                      onClick={() => handleDownloadInvoice(invoice)}
                      className="p-2 text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
                      title="Download PDF Invoice"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {invoices.length === 0 && (
                <p className="text-sm text-[var(--color-ink-secondary)] italic text-center py-4">No invoices created yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Deliverables Checklist */}
        <div className="design-card p-6 sm:p-8 space-y-6">
          <h2 className="text-lg font-bold border-b border-[var(--color-border-soft)] pb-3">Deliverables Status</h2>
          {project.deliverables && project.deliverables.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.deliverables.map((del, i) => (
                <div key={i} className="flex items-start gap-3 p-3 border border-[var(--color-border-soft)] rounded-xl">
                  <div className="mt-0.5 flex-shrink-0 h-5 w-5 rounded border bg-[var(--color-ink)] border-[var(--color-ink)] flex items-center justify-center">
                    <CheckSquare className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm text-[var(--color-ink-secondary)] line-through font-medium">{del}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-ink-secondary)] italic text-center py-4">No deliverables listed yet.</p>
          )}
        </div>

      </div>
    </div>
  );
}
