import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Store,
  Crown,
  BarChart3,
  Settings,
  Shield,
  Brain,
  Bell,
  CreditCard,
  BadgeCheck,
  ScrollText,
  Activity
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../ui/sidebar';
import { Badge } from '../ui/badge';
import { notificationAPI, adminPaymentsAPI, adminApprovalsAPI } from '../../services/api';
import { usePermissions } from '../../hooks/usePermissions';

const navigationItems = [
  {
    title: 'Overview',
    icon: LayoutDashboard,
    href: '/admin',
    permission: null, // Always visible
  },
  {
    title: 'User Management',
    icon: Users,
    href: '/admin/users',
    permission: 'MANAGE_USERS',
  },
  {
    title: 'Restaurant Management',
    icon: Store,
    href: '/admin/restaurants',
    permission: 'MANAGE_RESTAURANTS',
  },
  {
    title: 'Subscription Management',
    icon: Crown,
    href: '/admin/plans',
    permission: 'MANAGE_SUBSCRIPTIONS',
  },
  {
    title: 'Subscriptions',
    icon: Crown,
    href: '/admin/subscriptions',
    permission: 'MANAGE_SUBSCRIPTIONS',
  },
  {
    title: 'Platform Analytics',
    icon: BarChart3,
    href: '/admin/analytics',
    permission: 'VIEW_ANALYTICS',
  },
  {
    title: 'RBAC',
    icon: Shield,
    href: '/admin/rbac',
    permission: 'MANAGE_RBAC',
  },
  {
    title: 'Manual Payments',
    icon: CreditCard,
    href: '/admin/payments',
    permission: 'MANAGE_PAYMENTS',
  },
  {
    title: 'Approvals',
    icon: BadgeCheck,
    href: '/admin/approvals',
    permission: 'MANAGE_APPROVALS',
  },
  {
    title: 'Notifications',
    icon: Bell,
    href: '/admin/notifications',
    permission: 'MANAGE_NOTIFICATIONS',
  },
  {
    title: 'Audit Logs',
    icon: ScrollText,
    href: '/admin/audit-logs',
    permission: 'VIEW_AUDIT_LOGS',
  }
];

const systemItems = [
  {
    title: 'AI Configuration',
    icon: Brain,
    href: '/admin/ai-config',
    permission: 'MANAGE_SYSTEM',
  },
  {
    title: 'System Settings',
    icon: Settings,
    href: '/admin/settings',
    permission: 'MANAGE_SYSTEM',
  },
  {
    title: 'System Health',
    icon: Activity,
    href: '/admin/system-health',
    permission: 'VIEW_SYSTEM_HEALTH',
  }
];

export const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const { hasPermission } = usePermissions();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [pendingPayments, setPendingPayments] = useState<number>(0);
  const [pendingApprovals, setPendingApprovals] = useState<number>(0);

  const loadCounts = async () => {
    try {
      const [unreadRes, pendingPaymentsList, pendingApprovalsList] = await Promise.all([
        notificationAPI.getUnreadCount().catch(() => ({ count: 0 })),
        adminPaymentsAPI.list('PENDING').catch(() => ([] as any[])),
        adminApprovalsAPI.list('PENDING').catch(() => ([] as any[])),
      ]);
      setUnreadCount((unreadRes as any)?.count || 0);
      setPendingPayments(Array.isArray(pendingPaymentsList) ? pendingPaymentsList.length : 0);
      setPendingApprovals(Array.isArray(pendingApprovalsList) ? pendingApprovalsList.length : 0);
    } catch (e) {
      console.error('Failed to load admin sidebar counts', e);
    }
  };

  useEffect(() => {
    loadCounts();
    const id = setInterval(loadCounts, 45000);
    const onChanged = () => loadCounts();
    window.addEventListener('notifications:changed', onChanged as EventListener);
    return () => {
      clearInterval(id);
      window.removeEventListener('notifications:changed', onChanged as EventListener);
    };
  }, []);

  // Filter navigation items based on permissions
  const visibleNavigationItems = navigationItems.filter(item =>
    !item.permission || hasPermission(item.permission)
  );

  // Filter system items based on permissions
  const visibleSystemItems = systemItems.filter(item =>
    !item.permission || hasPermission(item.permission)
  );

  return (
    <Sidebar>
      <SidebarContent>
        {/* Header */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2 text-red-600 font-bold">
            <Shield className="w-4 h-4" />
            Super Admin
          </SidebarGroupLabel>
        </SidebarGroup>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNavigationItems.map((item) => {
                const isActive = location.pathname === item.href || 
                  (item.href === '/admin' && location.pathname === '/admin/');
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild>
                      <Link 
                        to={item.href} 
                        className={`flex items-center gap-3 ${
                          isActive ? 'bg-accent text-accent-foreground' : ''
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {item.title === 'Manual Payments' && pendingPayments > 0 && (
                          <Badge variant="secondary" className="ml-auto text-xs">{pendingPayments}</Badge>
                        )}
                        {item.title === 'Approvals' && pendingApprovals > 0 && (
                          <Badge variant="secondary" className="ml-auto text-xs">{pendingApprovals}</Badge>
                        )}
                        {item.title === 'Notifications' && unreadCount > 0 && (
                          <Badge variant="secondary" className="ml-auto text-xs">{unreadCount > 99 ? '99+' : unreadCount}</Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* System Tools */}
        <SidebarGroup>
          <SidebarGroupLabel>System Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleSystemItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild>
                      <Link 
                        to={item.href}
                        className={`flex items-center gap-3 ${
                          isActive ? 'bg-accent text-accent-foreground' : ''
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
