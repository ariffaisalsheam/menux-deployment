import React, { useEffect } from 'react';
import { SidebarProvider } from '../ui/sidebar';
import { DashboardHeader } from './DashboardHeader';
import { DashboardSidebar } from './DashboardSidebar';
import { AdminViewingBanner } from '../common/AdminViewingBanner';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { refreshUser } = useAuth();

  // Refresh user data when dashboard loads to get latest subscription plan
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full bg-gray-50">
        <AdminViewingBanner />
        <div className="flex flex-1">
          <DashboardSidebar />
          <div className="flex-1 flex flex-col">
            <DashboardHeader />
            <main className="flex-1 p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};
