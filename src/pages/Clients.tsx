import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { cn, formatCurrency } from '../lib/utils';
import { Plus, Search, Users, Building2 } from 'lucide-react';
import { Client } from '../types';
import { ClientModal } from '../components/ClientModal';
import { PageShell } from '../components/layout/PageShell';

export function Clients() {
  const store = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [search, setSearch] = useState('');

  const clients = store.clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const getClientRevenue = (client: Client) => {
    const projects = store.projects.filter(p => p.clientName.toLowerCase() === client.name.toLowerCase() || p.clientEmail.toLowerCase() === client.email.toLowerCase());
    return projects.reduce((acc, p) => acc + (p.amountReceived || 0), 0);
  };

  const getClientProjects = (client: Client) => {
    return store.projects.filter(p => p.clientName.toLowerCase() === client.name.toLowerCase() || p.clientEmail.toLowerCase() === client.email.toLowerCase()).length;
  };

  return (
    <PageShell className="lg:pb-0">
      <header className="page-block flex flex-row justify-between items-center gap-4">
        <div className="min-w-0">
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle hidden sm:block">Your client database & CRM</p>
        </div>
        <button type="button" onClick={() => { setClientToEdit(null); setIsModalOpen(true); }} className="btn-primary">
          <Plus className="h-4 w-4" /><span>New Client</span>
        </button>
      </header>

      <div className="page-block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-ink-muted)]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9" placeholder="Search clients..." />
        </div>
      </div>

      <section className="page-block">
        {clients.length > 0 ? (
          <div className="section-panel-flat">
            <div className="divide-y divide-[var(--color-border-soft)]">
              {clients.map(client => (
                <div key={client.id} className="flex items-center gap-4 p-4 hover:bg-[var(--color-surface-muted)] transition-colors cursor-pointer"
                  onClick={() => { setClientToEdit(client); setIsModalOpen(true); }}>
                  <div className="h-10 w-10 rounded-full bg-[var(--color-surface-muted)] border border-[var(--color-border-subtle)] flex items-center justify-center text-sm font-semibold text-[var(--color-ink-secondary)] shrink-0">
                    {client.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-ink)] truncate">{client.name}</p>
                    <p className="text-xs text-[var(--color-ink-muted)] truncate">{client.company || client.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-[var(--color-ink)]">{formatCurrency(getClientRevenue(client))}</p>
                    <p className="text-xs text-[var(--color-ink-muted)]">{getClientProjects(client)} projects</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="section-panel-flat">
            <div className="flex flex-col items-center justify-center p-10 text-center">
              <Users className="h-10 w-10 text-[var(--color-ink-muted)] mb-2 opacity-40" />
              <p className="text-sm font-medium text-[var(--color-ink)]">No clients yet</p>
              <p className="page-subtitle mt-1">Add clients to track revenue and projects.</p>
            </div>
          </div>
        )}
      </section>

      <ClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} clientToEdit={clientToEdit} />
      <button type="button" onClick={() => { setClientToEdit(null); setIsModalOpen(true); }}
        className="sm:hidden fixed bottom-[5.25rem] right-5 h-14 w-14 flex items-center justify-center fab-mobile z-40" aria-label="Add client">
        <Plus className="h-6 w-6" strokeWidth={2} />
      </button>
    </PageShell>
  );
}
