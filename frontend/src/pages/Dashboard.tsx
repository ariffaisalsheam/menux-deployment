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


const Dashboard: React.FC = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<DashboardOverview />} />
        <Route path="/profile" element={<RestaurantProfile />} />
        <Route path="/menu" element={<MenuManagement />} />
        <Route path="/orders" element={<OrderHistory />} />
        <Route path="/analytics" element={<BasicAnalytics />} />
        <Route path="/live-orders" element={<LiveOrders />} />
        <Route path="/ai-menu" element={<AIMenuWriter />} />
        <Route path="/feedback" element={<FeedbackAnalysis />} />
        <Route path="/advanced-analytics" element={<AdvancedAnalytics />} />
        <Route path="/notifications" element={<NotificationCenter />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;
