import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import Dashboard from './components/Dashboard';
import NewCall from './components/NewCall';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import CallHistory from './components/CallHistory';
import ActiveCall from './components/ActiveCall';
import Billing from './components/Billing';
import Login from './components/Login';

const App: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/new-call" element={<NewCall />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/history" element={<CallHistory />} />
      <Route path="/active-call/:callId" element={<ActiveCall />} />
      <Route path="/billing" element={<Billing />} />
    </Routes>
  );
};

export default App; 