import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Admin Pages
import TopicManagementPage from '../pages/admin/TopicManagementPage';
import StudentManagementPage from '../pages/admin/StudentManagementPage';
import ReportAnalyticsPage from '../pages/admin/ReportAnalyticsPage';

const AdminRoutes = () => {
  const { user, isAuthenticated } = useAuth();

  // Check if user is authenticated and is an admin
  if (!isAuthenticated || user?.type !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route path="subjects" element={<TopicManagementPage />} />
      <Route path="students" element={<StudentManagementPage />} />
      <Route path="reports" element={<ReportAnalyticsPage />} />
      <Route path="*" element={<Navigate to="/admin" />} />
    </Routes>
  );
};

export default AdminRoutes;