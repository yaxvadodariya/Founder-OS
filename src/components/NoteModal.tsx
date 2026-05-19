import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Note, NoteCategory } from '../types';
import { X } from 'lucide-react';

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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{noteToEdit ? 'Edit Note' : 'Add Note'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium"
              placeholder="Note Title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select 
              required
              value={category}
              onChange={(e) => setCategory(e.target.value as NoteCategory)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
             <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
             <textarea 
               required
               value={content}
               onChange={(e) => setContent(e.target.value)}
               className="w-full flex-1 min-h-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
               placeholder="Write your note here..."
             />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
            <input 
              type="text" 
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g. work, personal, references"
            />
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="pinnedCheckbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="pinnedCheckbox" className="text-sm font-medium text-gray-700 flex items-center">
              Pinned
            </label>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-between gap-3">
            {noteToEdit ? (
              <button
                type="button"
                onClick={() => {
                  store.deleteNote(noteToEdit.id);
                  onClose();
                }}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
              >
                Delete
              </button>
            ) : <div />}
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Save Note
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
