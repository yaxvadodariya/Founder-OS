import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard, Finance, Projects, ProjectDetails, Tasks, Payments, Notes } from './pages';
import { FirebaseProvider } from './FirebaseProvider';
import { Login } from './components/Login';
import { useStore } from './store/useStore';
import { SlackPoller } from './components/SlackPoller';
import { WhatsAppPoller } from './components/WhatsAppPoller';

function AppContent() {
  const user = useStore(state => state.user);

  if (!user) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <SlackPoller />
      <WhatsAppPoller />
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="finance/:type" element={<Finance />} />
          <Route path="finance" element={<Navigate to="/finance/personal" replace />} />
          <Route path="projects">
            <Route index element={<Projects />} />
            <Route path=":id" element={<ProjectDetails />} />
          </Route>
          <Route path="tasks" element={<Tasks />} />
          <Route path="payments" element={<Payments />} />
          <Route path="notes" element={<Notes />} />
          <Route path="more" element={<div className="p-6">More options on mobile (Coming soon)</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  );
}
