import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Client } from '../types';
import { SidePanel } from './SidePanel';

interface ClientModalProps { isOpen: boolean; onClose: () => void; clientToEdit?: Client | null; }

export function ClientModal({ isOpen, onClose, clientToEdit = null }: ClientModalProps) {
  const store = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (clientToEdit) { setName(clientToEdit.name); setEmail(clientToEdit.email); setPhone(clientToEdit.phone); setCompany(clientToEdit.company); setNotes(clientToEdit.notes); }
    else { setName(''); setEmail(''); setPhone(''); setCompany(''); setNotes(''); }
  }, [clientToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    if (clientToEdit) {
      store.updateClient(clientToEdit.id, { name, email, phone, company, notes });
    } else {
      store.addClient({ id: Math.random().toString(36).substring(2, 11), name, email, phone, company, notes, tags: [], createdAt: new Date().toISOString() });
    }
    onClose();
  };

  return (
    <SidePanel isOpen={isOpen} onClose={onClose} title={clientToEdit ? 'Edit Client' : 'New Client'} subtitle="Client contact information"
      footer={<div className="flex justify-between items-center">
        {clientToEdit ? (<button type="button" onClick={() => { store.deleteClient(clientToEdit.id); onClose(); }}
          className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors">Delete</button>) : <div />}
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" form="client-form" className="btn-primary">Save</button>
        </div>
      </div>}>
      <form id="client-form" onSubmit={handleSubmit} className="space-y-5">
        <div><label className="form-label">Name *</label>
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="John Doe" /></div>
        <div><label className="form-label">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="john@example.com" /></div>
        <div><label className="form-label">Phone</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" placeholder="+91 98765 43210" /></div>
        <div><label className="form-label">Company</label>
          <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className="input-field" placeholder="Acme Inc." /></div>
        <div><label className="form-label">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field resize-vertical" placeholder="Additional notes..." rows={3} /></div>
      </form>
    </SidePanel>
  );
}
