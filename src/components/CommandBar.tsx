import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Search, LayoutDashboard, Wallet, FolderKanban, CheckSquare, BookOpen, Target, Flame, PenTool, Users, PieChart, BarChart3 } from 'lucide-react';
import { cn } from '../lib/utils';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  category: string;
}

export function CommandBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const store = useStore();

  const close = useCallback(() => { setIsOpen(false); setQuery(''); setSelectedIndex(0); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsOpen(o => !o); }
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [close]);

  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 50); }, [isOpen]);

  const pages: CommandItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, action: () => navigate('/'), category: 'Pages' },
    { id: 'finance', label: 'Finance', icon: Wallet, action: () => navigate('/finance/personal'), category: 'Pages' },
    { id: 'projects', label: 'Projects', icon: FolderKanban, action: () => navigate('/projects'), category: 'Pages' },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, action: () => navigate('/tasks'), category: 'Pages' },
    { id: 'habits', label: 'Habits', icon: Flame, action: () => navigate('/habits'), category: 'Pages' },
    { id: 'journal', label: 'Journal', icon: PenTool, action: () => navigate('/journal'), category: 'Pages' },
    { id: 'goals', label: 'Goals', icon: Target, action: () => navigate('/goals'), category: 'Pages' },
    { id: 'budgets', label: 'Budgets', icon: PieChart, action: () => navigate('/budgets'), category: 'Pages' },
    { id: 'clients', label: 'Clients', icon: Users, action: () => navigate('/clients'), category: 'Pages' },
    { id: 'notes', label: 'Remember Book', icon: BookOpen, action: () => navigate('/notes'), category: 'Pages' },
    { id: 'review', label: 'Weekly Review', icon: BarChart3, action: () => navigate('/weekly-review'), category: 'Pages' },
  ];

  const projectItems: CommandItem[] = store.projects.map(p => ({
    id: `project-${p.id}`, label: p.name, description: p.clientName, icon: FolderKanban,
    action: () => navigate(`/projects/${p.id}`), category: 'Projects',
  }));

  const taskItems: CommandItem[] = store.tasks.filter(t => !t.completed).slice(0, 5).map(t => ({
    id: `task-${t.id}`, label: t.title, icon: CheckSquare, action: () => navigate('/tasks'), category: 'Tasks',
  }));

  const allItems = [...pages, ...projectItems, ...taskItems];
  const filtered = query ? allItems.filter(i => i.label.toLowerCase().includes(query.toLowerCase()) || (i.description || '').toLowerCase().includes(query.toLowerCase())) : pages;

  useEffect(() => { setSelectedIndex(0); }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && filtered[selectedIndex]) { filtered[selectedIndex].action(); close(); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]" onClick={close}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg mx-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border-subtle)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border-soft)]">
          <Search className="h-5 w-5 text-[var(--color-ink-muted)] shrink-0" />
          <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-muted)]"
            placeholder="Search pages, projects, tasks..." />
          <kbd className="hidden sm:inline-flex text-[10px] text-[var(--color-ink-muted)] bg-[var(--color-surface-muted)] px-1.5 py-0.5 rounded font-mono">ESC</kbd>
        </div>
        <div className="max-h-[300px] overflow-y-auto py-2">
          {filtered.length > 0 ? filtered.map((item, i) => (
            <button key={item.id} type="button"
              className={cn('w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                i === selectedIndex ? 'bg-[var(--color-surface-muted)]' : 'hover:bg-[var(--color-surface-hover)]')}
              onClick={() => { item.action(); close(); }}
              onMouseEnter={() => setSelectedIndex(i)}>
              <item.icon className="h-4 w-4 text-[var(--color-ink-muted)] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-ink)] truncate">{item.label}</p>
                {item.description && <p className="text-xs text-[var(--color-ink-muted)] truncate">{item.description}</p>}
              </div>
              <span className="text-[10px] text-[var(--color-ink-muted)] shrink-0">{item.category}</span>
            </button>
          )) : (
            <p className="text-center text-sm text-[var(--color-ink-muted)] py-8">No results found</p>
          )}
        </div>
      </div>
    </div>
  );
}
