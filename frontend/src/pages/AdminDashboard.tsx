import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from '../components/admin/AdminLayout';
import { AdminOverview } from '../components/admin/AdminOverview';
import { UserManagement } from '../components/admin/UserManagement';
import { RestaurantManagement } from '../components/admin/RestaurantManagement';
import { PlanManagement } from '../components/admin/PlanManagement';
import { PlatformAnalytics } from '../components/admin/PlatformAnalytics';


const AdminDashboard: React.FC = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<AdminOverview />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/restaurants" element={<RestaurantManagement />} />
        <Route path="/plans" element={<PlanManagement />} />
        <Route path="/analytics" element={<PlatformAnalytics />} />

        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminDashboard;
