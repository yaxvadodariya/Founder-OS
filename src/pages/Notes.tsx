import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { Plus, Search, Pin, Lightbulb, AlertTriangle, Bookmark, Quote, BookOpen, Users, MoreHorizontal } from 'lucide-react';
import { NoteCategory } from '../types';
import { NoteModal } from '../components/NoteModal';

const categoryIcons: Record<NoteCategory, React.ElementType> = {
  idea: Lightbulb,
  important: AlertTriangle,
  remember: Bookmark,
  quote: Quote,
  learning: BookOpen,
  contact: Users,
};

const categoryColors: Record<NoteCategory, string> = {
  idea: 'text-amber-600 bg-amber-50 border-amber-100',
  important: 'text-red-600 bg-red-50 border-red-100',
  remember: 'text-blue-600 bg-blue-50 border-blue-100',
  quote: 'text-purple-600 bg-purple-50 border-purple-100',
  learning: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  contact: 'text-orange-600 bg-orange-50 border-orange-100',
};

export function Notes() {
  const store = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<NoteCategory | 'all'>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<any>(null);

  const notes = store.notes
    .filter(n => filter === 'all' || n.category === filter)
    .filter(n => 
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      n.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  return (
    <div className="space-y-6 pb-20 lg:pb-0 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title">Remember Book</h1>
          <p className="page-subtitle">Your second brain for ideas and information</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => {
              setNoteToEdit(null);
              setIsModalOpen(true);
            }}
            className="hidden sm:inline-flex btn-primary"
          >
            <Plus className="h-4 w-4" />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search your brain..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar items-center">
          <FilterPill active={filter === 'all'} onClick={() => setFilter('all')}>All</FilterPill>
          {(Object.keys(categoryIcons) as NoteCategory[]).map((cat) => (
            <FilterPill key={cat} active={filter === cat} onClick={() => setFilter(cat)}>
              <span className="capitalize">{cat}</span>
            </FilterPill>
          ))}
        </div>
      </div>

      {/* Masonry or Grid Layout */}
      <div className="section-panel flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-4 px-1">
          <h2 className="section-label">Notes Library</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
          {notes.map(note => {
            const Icon = categoryIcons[note.category];
            return (
              <div 
                key={note.id} 
                className="design-card transition-shadow relative overflow-hidden group flex flex-col cursor-pointer hover:shadow-md"
                onClick={() => {
                  setNoteToEdit(note);
                  setIsModalOpen(true);
                }}
              >
                {note.pinned && (
                  <div className="absolute top-3 right-3 text-blue-600 bg-blue-50 p-1.5 rounded-full z-10">
                    <Pin className="h-3 w-3 fill-current" />
                  </div>
                )}
                
                <div className="p-5">
                  <div className={cn("inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider mb-3 border", categoryColors[note.category])}>
                    <Icon className="mr-1 h-3 w-3" />
                    {note.category}
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2 pr-6 leading-tight">{note.title}</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-4 leading-relaxed mb-4">
                    {note.content}
                  </p>
                  
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-auto">
                      {note.tags.map(tag => (
                        <span key={tag} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="px-5 py-3 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 mt-auto rounded-b-[24px]">
                  <span>{format(new Date(note.createdAt), 'MMM d, yyyy')}</span>
                  <button className="hover:text-gray-900 transition-colors opacity-0 group-hover:opacity-100">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        
        {notes.length === 0 && (
          <div className="design-card flex-1 flex flex-col items-center justify-center p-12 text-center mt-2 bg-white/50">
            <BookOpen className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-900 font-medium">No notes found</p>
            <p className="page-subtitle mt-1">Try adjusting your search or create a new note.</p>
          </div>
        )}
      </div>
      
      <NoteModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        noteToEdit={noteToEdit}
      />
      
      {/* Mobile FAB */}
      <button
        type="button"
        onClick={() => {
          setNoteToEdit(null);
          setIsModalOpen(true);
        }}
        className="sm:hidden fixed bottom-[88px] right-6 p-4 fab-mobile z-40"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}

export const FilterPill: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all border",
        active 
          ? "bg-gray-900 text-white border-gray-900" 
          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
      )}
    >
      {children}
    </button>
  );
}
