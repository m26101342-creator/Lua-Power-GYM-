import React from 'react';
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

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAdmin = sessionStorage.getItem('isAdmin');
  const location = useLocation();

  if (!isAdmin) {
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const ClientRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const clientId = localStorage.getItem('gym_client_id');
  const location = useLocation();

  if (!clientId) {
    return <Navigate to="/client-login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
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