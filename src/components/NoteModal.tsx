import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Note, NoteCategory } from '../types';
import { SidePanel } from './SidePanel';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteToEdit?: Note | null;
}

export function NoteModal({ isOpen, onClose, noteToEdit = null }: NoteModalProps) {
  const store = useStore();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NoteCategory>('idea');
  const [tags, setTags] = useState('');
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    if (noteToEdit) {
      setTitle(noteToEdit.title);
      setContent(noteToEdit.content);
      setCategory(noteToEdit.category);
      setTags(noteToEdit.tags.join(', '));
      setPinned(noteToEdit.pinned);
    } else {
      setTitle('');
      setContent('');
      setCategory('idea');
      setTags('');
      setPinned(false);
    }
  }, [noteToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    
    const parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);

    if (noteToEdit) {
      store.updateNote(noteToEdit.id, {
        title,
        content,
        category,
        tags: parsedTags,
        pinned,
        updatedAt: new Date().toISOString()
      });
    } else {
      store.addNote({
        id: Math.random().toString(36).substring(2, 11),
        title,
        content,
        category,
        tags: parsedTags,
        pinned,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    onClose();
  };

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={noteToEdit ? 'Edit Note' : 'New Note'}
      subtitle={noteToEdit ? 'Update your note' : 'Capture an idea or important note'}
      width="max-w-xl"
      footer={
        <div className="flex justify-between items-center">
          {noteToEdit ? (
            <button
              type="button"
              onClick={() => {
                store.deleteNote(noteToEdit.id);
                onClose();
              }}
              className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
            >
              Delete
            </button>
          ) : <div />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" form="note-form" className="btn-primary">Save Note</button>
          </div>
        </div>
      }
    >
      <form id="note-form" onSubmit={handleSubmit} className="space-y-5 flex flex-col min-h-full">
        <div>
          <label className="form-label">Title *</label>
          <input 
            type="text" 
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field text-lg font-medium"
            placeholder="Note Title"
          />
        </div>

        <div>
          <label className="form-label">Category *</label>
          <select 
            required
            value={category}
            onChange={(e) => setCategory(e.target.value as NoteCategory)}
            className="input-field"
          >
            <option value="idea">Idea</option>
            <option value="important">Important</option>
            <option value="remember">Remember</option>
            <option value="quote">Quote</option>
            <option value="learning">Learning</option>
            <option value="contact">Contact</option>
          </select>
        </div>

        <div className="flex-1 flex flex-col min-h-[200px]">
           <label className="form-label">Content *</label>
           <textarea 
             required
             value={content}
             onChange={(e) => setContent(e.target.value)}
             className="input-field flex-1 min-h-[200px] resize-y"
             placeholder="Write your note here..."
           />
        </div>

        <div>
          <label className="form-label">Tags (comma separated)</label>
          <input 
            type="text" 
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="input-field"
            placeholder="e.g. work, personal, references"
          />
        </div>

        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            id="pinnedCheckbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
            className="rounded border-[var(--color-border-subtle)] text-[var(--color-ink)] focus:ring-[var(--color-ink-muted)]"
          />
          <label htmlFor="pinnedCheckbox" className="form-label !mb-0">
            Pinned
          </label>
        </div>
      </form>
    </SidePanel>
  );
}
