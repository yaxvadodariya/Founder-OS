import React, { useState } from 'react';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';

export function MagicTaskInput() {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const store = useStore();

  const handleParse = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/magic-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (!res.ok) throw new Error('Failed to parse text');
      
      const parsed = await res.json();
      
      if (parsed.taskTitle) {
        let projectId = '';
        if (parsed.projectName) {
          // Check if project exists
          const existingProj = store.projects.find(p => p.name.toLowerCase() === parsed.projectName.toLowerCase());
          if (existingProj) {
            projectId = existingProj.id;
          } else {
            projectId = Math.random().toString(36).substring(2, 11);
            store.addProject({
              id: projectId,
              name: parsed.projectName,
              clientName: 'Magic Client',
              clientEmail: '',
              status: 'active',
              value: 0,
              amountReceived: 0,
              amountPending: 0,
              startDate: new Date().toISOString(),
              deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              progress: 0,
              description: 'Created via Magic Paste',
              deliverables: [],
              notes: '',
              milestones: []
            });
          }
        }

        const taskId = Math.random().toString(36).substring(2, 11);
        store.addTask({
          id: taskId,
          projectId: projectId,
          title: parsed.taskTitle,
          description: parsed.taskDescription || '(Generated from text)',
          priority: parsed.priority || 'medium',
          completed: false,
          subtasks: [],
          tags: ['magic-paste'],
          createdAt: new Date().toISOString()
        });
        
        toast.success(`Converted to task: ${parsed.taskTitle}`);
        setText('');
        setIsOpen(false);
      } else {
        toast.error('Could not find a task in that text');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error parsing text');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#272625]/[0.03] p-[17px] rounded-[19px] mb-4">
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-colors group cursor-text"
        >
          <Sparkles className="h-5 w-5 text-blue-500 group-hover:text-blue-600 animate-pulse" />
          <span className="text-gray-400 font-medium">✨ Magic Paste: Paste a Slack message or email here to extract tasks automatically...</span>
        </button>
      ) : (
        <div className="bg-white border border-blue-200 rounded-xl p-3 shadow-sm ring-1 ring-blue-100">
          <div className="flex items-center gap-2 mb-2 px-1">
            <Sparkles className="h-4 w-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-900">AI Task Extractor</h3>
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">BETA</span>
          </div>
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste raw text here... e.g. 'Hey, can you finish the homepage redesign by Friday? Priority is high.'"
            className="w-full min-h-[100px] p-3 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-y"
          />
          <div className="flex justify-between items-center mt-3">
            <p className="text-xs text-gray-500">Extracts: Project, Title, Description, Priority</p>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                onClick={handleParse}
                disabled={!text.trim() || isLoading}
                className="flex items-center gap-1 px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                Convert to Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
