import React, { useState, useEffect } from 'react';
import { SidePanel } from './SidePanel';
import { FileText, Download, Sparkles } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { formatCurrency, formatCurrencyPDF } from '../lib/utils';
import { Project } from '../types';

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project;
}

export function ProposalModal({ isOpen, onClose, project }: ProposalModalProps) {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [proposalTitle, setProposalTitle] = useState('');
  const [scope, setScope] = useState('');
  const [deliverables, setDeliverables] = useState('');
  const [timeline, setTimeline] = useState('4 Weeks');
  const [pricing, setPricing] = useState('');

  // Auto-fill from project if available
  useEffect(() => {
    if (project) {
      setClientName(project.clientName || '');
      setClientEmail(project.clientEmail || '');
      setProposalTitle(`${project.name} Proposal`);
      setScope(project.description || '');
      setDeliverables(project.deliverables?.join('\n') || '');
      setPricing(project.value ? project.value.toString() : '');
    } else {
      setClientName('');
      setClientEmail('');
      setClientCompany('');
      setProposalTitle('');
      setScope('');
      setDeliverables('');
      setTimeline('4 Weeks');
      setPricing('');
    }
  }, [project, isOpen]);

  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Cover/Header Accent Band
      doc.setFillColor(249, 115, 22); // Orange Accent
      doc.rect(0, 0, pageWidth, 28, 'F');
      
      doc.setFillColor(30, 41, 59); // Slate-800 Band
      doc.rect(0, 28, pageWidth, 2, 'F');

      // Header Text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.text('PROJECT PROPOSAL', 14, 18);
      
      // Client Details
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      
      let currentY = 48;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Prepared For:', 14, currentY);
      doc.text('Prepared By:', 120, currentY);
      currentY += 6;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(`Client: ${clientName || 'N/A'}`, 14, currentY);
      doc.text('Founder-OS Team', 120, currentY);
      currentY += 5;
      doc.text(`Company: ${clientCompany || 'N/A'}`, 14, currentY);
      doc.text('Founder-OS Workspace', 120, currentY);
      currentY += 5;
      doc.text(`Email: ${clientEmail || 'N/A'}`, 14, currentY);
      doc.text(`Date: ${format(new Date(), 'MMMM d, yyyy')}`, 120, currentY);
      
      currentY += 15;
      
      // Divider
      doc.setDrawColor(226, 232, 240);
      doc.line(14, currentY, pageWidth - 14, currentY);
      currentY += 10;
      
      // Proposal Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(24, 24, 27);
      doc.text(proposalTitle || 'Project Proposal Spec', 14, currentY);
      currentY += 12;
      
      // Scope Section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(249, 115, 22);
      doc.text('1. Project Scope & Overview', 14, currentY);
      currentY += 6;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(63, 63, 70);
      
      const splitScope = doc.splitTextToSize(scope || 'No project overview details provided.', pageWidth - 28);
      doc.text(splitScope, 14, currentY);
      currentY += (splitScope.length * 5) + 12;
      
      // Deliverables Section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(249, 115, 22);
      doc.text('2. Key Deliverables', 14, currentY);
      currentY += 6;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(63, 63, 70);
      
      const deliverableItems = deliverables.split('\n').filter(item => item.trim() !== '');
      if (deliverableItems.length === 0) {
        doc.text('• Details pending definition.', 14, currentY);
        currentY += 10;
      } else {
        deliverableItems.forEach(item => {
          const splitItem = doc.splitTextToSize(`• ${item}`, pageWidth - 32);
          doc.text(splitItem, 16, currentY);
          currentY += (splitItem.length * 5) + 2;
        });
        currentY += 8;
      }
      
      // Timeline & Financial Summary
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(249, 115, 22);
      doc.text('3. Timeline & Financial Summary', 14, currentY);
      currentY += 8;
      
      // Draw details table manually
      doc.setFillColor(248, 250, 252);
      doc.rect(14, currentY, pageWidth - 28, 24, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(14, currentY, pageWidth - 28, 24, 'S');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text('Estimated Timeline', 20, currentY + 9);
      doc.text('Proposed Investment', 120, currentY + 9);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(24, 24, 27);
      doc.text(timeline || 'TBD', 20, currentY + 16);
      doc.text(pricing ? formatCurrencyPDF(Number(pricing)) : 'TBD', 120, currentY + 16);
      
      currentY += 38;
      
      // Signatures
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(24, 24, 27);
      doc.text('4. Acceptance & Sign-off', 14, currentY);
      currentY += 18;
      
      doc.setDrawColor(203, 213, 225);
      doc.line(14, currentY, 80, currentY);
      doc.line(120, currentY, 186, currentY);
      
      currentY += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Client Representative Signature', 14, currentY);
      doc.text('Founder-OS Representative Signature', 120, currentY);
      
      doc.save(`Proposal_${clientName.replace(/\s+/g, '_') || 'Draft'}.pdf`);
      onClose();
    } catch (e) {
      console.error('Proposal PDF generation error:', e);
      alert('Failed to generate proposal PDF. Please check your input.');
    }
  };

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title="Project Proposal Generator"
      subtitle="Draft a professional proposal PDF spec"
      width="max-w-xl"
    >
      <div className="space-y-4 py-2">
        <div className="flex items-center gap-2 p-3 bg-orange-500/5 border border-orange-500/10 rounded-xl text-orange-600 dark:text-orange-400 text-xs">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>Fills dynamically from the active project information when opened.</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] uppercase mb-1">
            Proposal Title
          </label>
          <input
            type="text"
            className="input-field w-full"
            placeholder="e.g. Website Re-design Proposal"
            value={proposalTitle}
            onChange={(e) => setProposalTitle(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] uppercase mb-1">
              Client Name
            </label>
            <input
              type="text"
              className="input-field w-full"
              placeholder="e.g. John Doe"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] uppercase mb-1">
              Client Email
            </label>
            <input
              type="email"
              className="input-field w-full"
              placeholder="e.g. client@company.com"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] uppercase mb-1">
            Client Company
          </label>
          <input
            type="text"
            className="input-field w-full"
            placeholder="e.g. Acme Corp"
            value={clientCompany}
            onChange={(e) => setClientCompany(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] uppercase mb-1">
            Scope & Overview
          </label>
          <textarea
            className="input-field w-full min-h-24 py-2"
            placeholder="Describe the overall scope and background of the project..."
            value={scope}
            onChange={(e) => setScope(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] uppercase mb-1">
            Key Deliverables (one per line)
          </label>
          <textarea
            className="input-field w-full min-h-24 py-2 font-mono text-xs"
            placeholder="Deliverable 1&#10;Deliverable 2&#10;Deliverable 3..."
            value={deliverables}
            onChange={(e) => setDeliverables(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] uppercase mb-1">
              Timeline Estimate
            </label>
            <input
              type="text"
              className="input-field w-full"
              placeholder="e.g. 6 Weeks"
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] uppercase mb-1">
              Proposed Price / Value
            </label>
            <input
              type="number"
              className="input-field w-full"
              placeholder="e.g. 5000"
              value={pricing}
              onChange={(e) => setPricing(e.target.value)}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--color-border-soft)] flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={generatePDF}
            className="btn-primary flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" />
            <span>Generate PDF Proposal</span>
          </button>
        </div>
      </div>
    </SidePanel>
  );
}
