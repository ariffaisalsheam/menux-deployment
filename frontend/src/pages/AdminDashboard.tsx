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
import { AdminNotificationsDashboard } from '../components/admin/notifications/AdminNotificationsDashboard';
import { AdminRestaurantDetails } from '../components/admin/AdminRestaurantDetails';
import { AdminRestaurantAnalytics } from '../components/admin/AdminRestaurantAnalytics';
import { AdminRestaurantQR } from '../components/admin/AdminRestaurantQR';
import { PaymentsReview } from '../components/admin/PaymentsReview';
import { AdminSubscriptions } from '../components/admin/AdminSubscriptions';
import { AdminApprovals } from '../components/admin/AdminApprovals';
import { RBACDashboard } from '../components/admin/rbac/RBACDashboard';
import { AdminAuditLogs } from '../components/admin/AdminAuditLogs';
import { AdminProfile } from '../components/admin/AdminProfile';
import { AdminRestaurantSubscription } from '../components/admin/AdminRestaurantSubscription';
import SystemHealth from '../components/admin/SystemHealth';
import PermissionProtectedRoute from '../components/auth/PermissionProtectedRoute';


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
        <Route path="users" element={
          <PermissionProtectedRoute permission="MANAGE_USERS">
            <UserManagement />
          </PermissionProtectedRoute>
        } />
        <Route path="restaurants" element={
          <PermissionProtectedRoute permission="MANAGE_RESTAURANTS">
            <RestaurantManagement />
          </PermissionProtectedRoute>
        } />
        <Route path="restaurants/:id" element={
          <PermissionProtectedRoute permission="MANAGE_RESTAURANTS">
            <AdminRestaurantDetails />
          </PermissionProtectedRoute>
        } />
        <Route path="restaurants/:id/analytics" element={
          <PermissionProtectedRoute permission="MANAGE_RESTAURANTS">
            <AdminRestaurantAnalytics />
          </PermissionProtectedRoute>
        } />
        <Route path="restaurants/:id/qr" element={
          <PermissionProtectedRoute permission="MANAGE_RESTAURANTS">
            <AdminRestaurantQR />
          </PermissionProtectedRoute>
        } />
        <Route path="restaurants/:id/subscription" element={
          <PermissionProtectedRoute permission="MANAGE_SUBSCRIPTIONS">
            <AdminRestaurantSubscription />
          </PermissionProtectedRoute>
        } />
        <Route path="plans" element={
          <PermissionProtectedRoute permission="MANAGE_SUBSCRIPTIONS">
            <PlanManagement />
          </PermissionProtectedRoute>
        } />
        <Route path="subscriptions" element={
          <PermissionProtectedRoute permission="MANAGE_SUBSCRIPTIONS">
            <AdminSubscriptions />
          </PermissionProtectedRoute>
        } />
        <Route path="subscriptions/:id" element={
          <PermissionProtectedRoute permission="MANAGE_SUBSCRIPTIONS">
            <LegacySubscriptionRedirect />
          </PermissionProtectedRoute>
        } />
        <Route path="analytics" element={
          <PermissionProtectedRoute permission="VIEW_ANALYTICS">
            <PlatformAnalytics />
          </PermissionProtectedRoute>
        } />
        <Route path="notifications" element={
          <PermissionProtectedRoute permission="MANAGE_NOTIFICATIONS">
            <AdminNotificationsDashboard />
          </PermissionProtectedRoute>
        } />
        <Route path="rbac" element={
          <PermissionProtectedRoute permission="MANAGE_RBAC">
            <RBACDashboard />
          </PermissionProtectedRoute>
        } />
        <Route path="audit-logs" element={
          <PermissionProtectedRoute permission="VIEW_AUDIT_LOGS">
            <AdminAuditLogs />
          </PermissionProtectedRoute>
        } />
        <Route path="ai-config" element={
          <PermissionProtectedRoute permission="MANAGE_SYSTEM">
            <AIConfiguration />
          </PermissionProtectedRoute>
        } />
        <Route path="settings" element={
          <PermissionProtectedRoute permission="MANAGE_SYSTEM">
            <PlatformSettings />
          </PermissionProtectedRoute>
        } />
        <Route path="system-health" element={
          <PermissionProtectedRoute permission="VIEW_SYSTEM_HEALTH">
            <SystemHealth />
          </PermissionProtectedRoute>
        } />
        <Route path="payments" element={
          <PermissionProtectedRoute permission="MANAGE_PAYMENTS">
            <PaymentsReview />
          </PermissionProtectedRoute>
        } />
        <Route path="approvals" element={
          <PermissionProtectedRoute permission="MANAGE_APPROVALS">
            <AdminApprovals />
          </PermissionProtectedRoute>
        } />
        <Route path="profile" element={<AdminProfile />} />

        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminDashboard;
