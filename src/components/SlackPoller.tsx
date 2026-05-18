import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';
import { collection, onSnapshot, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const processedIds = new Set<string>();

export function SlackPoller() {
  const store = useStore();
  const user = store.user;

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'webhook_queue'),
      where('type', '==', 'task')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const docId = change.doc.id;
          if (processedIds.has(docId)) return;
          processedIds.add(docId);
          
          const task = change.doc.data();
          
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
                deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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
            description: task.description + '\n\n(Captured from Slack)',
            priority: task.priority,
            completed: false,
            subtasks: [],
            tags: ['slack'],
            createdAt: new Date().toISOString()
          });

          // 3. Mark processed on server
          deleteDoc(doc(db, 'webhook_queue', change.doc.id)).catch(console.error);

          toast.success(`New Task: ${task.title} (from Slack)`);
        }
      });
    });

    return () => unsubscribe();
  }, [user]);

  return null;
}
