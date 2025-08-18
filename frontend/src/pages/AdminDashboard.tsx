import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AdminLayout } from '../components/admin/AdminLayout';
import { AdminOverview } from '../components/admin/AdminOverview';
import { UserManagement } from '../components/admin/UserManagement';
import { RestaurantManagement } from '../components/admin/RestaurantManagement';
import { PlanManagement } from '../components/admin/PlanManagement';
import { PlatformAnalytics } from '../components/admin/PlatformAnalytics';
import { AIConfiguration } from '../components/admin/AIConfiguration';
import { PlatformSettings } from '../components/admin/PlatformSettings';
import { AdminNotifications } from '../components/admin/AdminNotifications';
import { AdminRestaurantDetails } from '../components/admin/AdminRestaurantDetails';
import { AdminRestaurantAnalytics } from '../components/admin/AdminRestaurantAnalytics';
import { AdminRestaurantQR } from '../components/admin/AdminRestaurantQR';
import { PaymentsReview } from '../components/admin/PaymentsReview';
import { AdminSubscriptions } from '../components/admin/AdminSubscriptions';
import { AdminApprovals } from '../components/admin/AdminApprovals';


// Legacy redirect: /admin/subscriptions/:id -> /admin/restaurants/:id/subscription
const LegacySubscriptionRedirect: React.FC = () => {
  const { id } = useParams();
  if (!id) return <Navigate to="subscriptions" replace />;
  return <Navigate to={`/admin/restaurants/${id}/subscription`} replace />;
};


const AdminDashboard: React.FC = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<AdminOverview />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="restaurants" element={<RestaurantManagement />} />
        <Route path="restaurants/:id" element={<AdminRestaurantDetails />} />
        <Route path="restaurants/:id/analytics" element={<AdminRestaurantAnalytics />} />
        <Route path="restaurants/:id/qr" element={<AdminRestaurantQR />} />
        <Route path="plans" element={<PlanManagement />} />
        <Route path="subscriptions" element={<AdminSubscriptions />} />
        <Route path="subscriptions/:id" element={<LegacySubscriptionRedirect />} />
        <Route path="analytics" element={<PlatformAnalytics />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="ai-config" element={<AIConfiguration />} />
        <Route path="settings" element={<PlatformSettings />} />
        <Route path="payments" element={<PaymentsReview />} />
        <Route path="approvals" element={<AdminApprovals />} />

        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminDashboard;
