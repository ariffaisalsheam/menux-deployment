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
  ScrollText
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

const navigationItems = [
  {
    title: 'Overview',
    icon: LayoutDashboard,
    href: '/admin',
  },
  {
    title: 'User Management',
    icon: Users,
    href: '/admin/users',
  },
  {
    title: 'Restaurant Management',
    icon: Store,
    href: '/admin/restaurants',
  },
  {
    title: 'Subscription Management',
    icon: Crown,
    href: '/admin/plans',
  },
  {
    title: 'Subscriptions',
    icon: Crown,
    href: '/admin/subscriptions',
  },
  {
    title: 'Platform Analytics',
    icon: BarChart3,
    href: '/admin/analytics',
  },
  {
    title: 'RBAC',
    icon: Shield,
    href: '/admin/rbac',
  },
  {
    title: 'Manual Payments',
    icon: CreditCard,
    href: '/admin/payments',
  },
  {
    title: 'Approvals',
    icon: BadgeCheck,
    href: '/admin/approvals',
  },
  {
    title: 'Notifications',
    icon: Bell,
    href: '/admin/notifications',
  },
  {
    title: 'Audit Logs',
    icon: ScrollText,
    href: '/admin/audit-logs',
  }
];

const systemItems = [
  {
    title: 'AI Configuration',
    icon: Brain,
    href: '/admin/ai-config',
  },
  {
    title: 'System Settings',
    icon: Settings,
    href: '/admin/settings',
  }
];

export const AdminSidebar: React.FC = () => {
  const location = useLocation();
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
              {navigationItems.map((item) => {
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
              {systemItems.map((item) => {
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
