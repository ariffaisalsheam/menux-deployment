import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { DashboardOverview } from '../components/dashboard/DashboardOverview';
import { RestaurantProfile } from '../components/dashboard/RestaurantProfile';
import { MenuManagement } from '../components/dashboard/MenuManagement';
import { OrderHistory } from '../components/dashboard/OrderHistory';
import { BasicAnalytics } from '../components/dashboard/BasicAnalytics';
import { LiveOrders } from '../components/dashboard/LiveOrders';
import { AIMenuWriter } from '../components/dashboard/AIMenuWriter';
import { FeedbackAnalysis } from '../components/dashboard/FeedbackAnalysis';
import { AdvancedAnalytics } from '../components/dashboard/AdvancedAnalytics';
import { NotificationCenter } from '../components/dashboard/NotificationCenter';
import { QRCodeManagement } from '../components/dashboard/QRCodeManagement';
import { TableManagement } from '../components/dashboard/TableManagement';
import PlanProtectedRoute from '../components/auth/PlanProtectedRoute';


const Dashboard: React.FC = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<DashboardOverview />} />
        <Route path="/profile" element={<RestaurantProfile />} />
        <Route path="/menu" element={<MenuManagement />} />
        <Route path="/orders" element={<OrderHistory />} />
        <Route path="/analytics" element={<BasicAnalytics />} />
        <Route path="/qr-code" element={<QRCodeManagement />} />
        <Route path="/tables" element={<TableManagement />} />
        <Route path="/live-orders" element={
          <PlanProtectedRoute requiredPlan="PRO">
            <LiveOrders />
          </PlanProtectedRoute>
        } />
        <Route path="/ai-menu" element={
          <PlanProtectedRoute requiredPlan="PRO">
            <AIMenuWriter />
          </PlanProtectedRoute>
        } />
        <Route path="/feedback" element={
          <PlanProtectedRoute requiredPlan="PRO">
            <FeedbackAnalysis />
          </PlanProtectedRoute>
        } />
        <Route path="/advanced-analytics" element={
          <PlanProtectedRoute requiredPlan="PRO">
            <AdvancedAnalytics />
          </PlanProtectedRoute>
        } />
        <Route path="/notifications" element={<NotificationCenter />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;
