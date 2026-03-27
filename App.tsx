import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AdminDashboard } from './pages/AdminDashboard';
import { ClientHome } from './pages/ClientHome';
import { AdminLogin } from './pages/AdminLogin';
import { ClientLogin } from './pages/ClientLogin';
import { AddClient } from './pages/AddClient';
import { EditClient } from './pages/EditClient';
import { ClientDetails } from './pages/ClientDetails';
import { AdminClasses } from './pages/AdminClasses';
import { ManageClass } from './pages/ManageClass';
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAdmin = sessionStorage.getItem('isAdmin');
  const location = useLocation();

  if (!isAdmin || !auth.currentUser) {
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const ClientRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const clientId = localStorage.getItem('gym_client_id');
  const location = useLocation();

  if (!clientId || !auth.currentUser) {
    return <Navigate to="/client-login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      setAuthInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  if (!authInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<ClientRoute><ClientHome /></ClientRoute>} />
        <Route path="/client-login" element={<ClientLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        
        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/add" element={<AdminRoute><AddClient /></AdminRoute>} />
        
        {/* Class Management Routes */}
        <Route path="/admin/classes" element={<AdminRoute><AdminClasses /></AdminRoute>} />
        <Route path="/admin/classes/add" element={<AdminRoute><ManageClass /></AdminRoute>} />
        <Route path="/admin/classes/edit/:id" element={<AdminRoute><ManageClass /></AdminRoute>} />
        
        {/* Client Management */}
        <Route path="/edit/:id" element={<AdminRoute><EditClient /></AdminRoute>} />
        <Route path="/client/:id" element={<AdminRoute><ClientDetails /></AdminRoute>} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;