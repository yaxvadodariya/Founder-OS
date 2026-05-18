import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';

export function SlackPoller() {
  const store = useStore();
  const user = store.user;

  useEffect(() => {
    if (!user) return;

    let timeoutId: NodeJS.Timeout;

    const pollTasks = async () => {
      try {
        const res = await fetch('/api/tasks/pending');
        if (res.ok) {
          const data = await res.json();
          if (data.tasks && data.tasks.length > 0) {
            for (const task of data.tasks) {
              
              // 1. Check if an active project exists or create one based on the matched name
              let targetProjectId = '';
              if (task.projectName) {
                // Find existing
                const existingProj = useStore.getState().projects.find(
                  p => p.name.toLowerCase() === task.projectName.toLowerCase()
                );
                if (existingProj) {
                  targetProjectId = existingProj.id;
                } else {
                  // Create project
                  const newProjId = Math.random().toString(36).substring(2, 11);
                  targetProjectId = newProjId;
                  useStore.getState().addProject({
                    id: newProjId,
                    name: task.projectName,
                    clientName: 'Slack Client', // unknown
                    clientEmail: '',
                    status: 'active',
                    value: 0,
                    amountReceived: 0,
                    amountPending: 0,
                    startDate: new Date().toISOString(),
                    progress: 0,
                    description: `Automatically created from Slack message.`,
                    deliverables: [],
                    notes: '',
                    milestones: []
                  });
                }
              }

              // 2. Create the task under this project
              const newTaskId = Math.random().toString(36).substring(2, 11);
              useStore.getState().addTask({
                id: newTaskId,
                projectId: targetProjectId,
                title: task.title,
                description: task.description + '\\n\\n(Captured from Slack)',
                status: 'todo',
                priority: task.priority,
                completed: false,
                subtasks: [],
                tags: ['slack']
              });

              // 3. Mark processed on server
              await fetch('/api/tasks/processed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: task.id })
              });

              toast.success(`New Task: ${task.title} (from Slack)`);
            }
          }
        }
      } catch (err) {
        console.error('Error polling Slack tasks:', err);
      } finally {
        timeoutId = setTimeout(pollTasks, 15000); // Poll every 15s
      }
    };

    pollTasks();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [user]);

  return null;
}
