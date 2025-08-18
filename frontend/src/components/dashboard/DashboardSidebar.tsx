import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Store,
  Menu as MenuIcon,
  ShoppingCart,
  MessageSquare,
  BarChart3,
  Settings,
  Crown,
  Zap,
  Brain,
  TrendingUp,
  Bell,
  QrCode,
  Grid
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent
} from '../ui/sidebar';
import { Badge } from '../ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { notificationAPI, paymentsAPI } from '../../services/api';

const navigationItems = [
  {
    title: 'Overview',
    icon: Home,
    href: '/dashboard',
    plan: 'BASIC'
  },
  {
    title: 'Restaurant Profile',
    icon: Store,
    href: '/dashboard/profile',
    plan: 'BASIC'
  },
  {
    title: 'Menu Management',
    icon: MenuIcon,
    href: '/dashboard/menu',
    plan: 'BASIC'
  },
  {
    title: 'Order History',
    icon: ShoppingCart,
    href: '/dashboard/orders',
    plan: 'BASIC'
  },
  {
    title: 'Basic Analytics',
    icon: BarChart3,
    href: '/dashboard/analytics',
    plan: 'BASIC'
  },
  {
    title: 'QR Code',
    icon: QrCode,
    href: '/dashboard/qr-code',
    plan: 'BASIC'
  },
  {
    title: 'Table Management',
    icon: Grid,
    href: '/dashboard/tables',
    plan: 'BASIC'
  }
];

const proFeatures = [
  {
    title: 'Live Orders',
    icon: Zap,
    href: '/dashboard/live-orders',
    plan: 'PRO',
    description: 'Real-time order management'
  },
  {
    title: 'AI Menu Writer',
    icon: Brain,
    href: '/dashboard/ai-menu',
    plan: 'PRO',
    description: 'AI-powered descriptions'
  },
  {
    title: 'Feedback Analysis',
    icon: MessageSquare,
    href: '/dashboard/feedback',
    plan: 'PRO',
    description: 'AI sentiment analysis'
  },
  {
    title: 'Advanced Analytics',
    icon: TrendingUp,
    href: '/dashboard/advanced-analytics',
    plan: 'PRO',
    description: 'Detailed insights'
  },
  {
    title: 'Notifications',
    icon: Bell,
    href: '/dashboard/notifications',
    plan: 'PRO',
    description: 'Real-time alerts'
  }
];

const settingsItems = [
  {
    title: 'Settings',
    icon: Settings,
    href: '/dashboard/settings',
    plan: 'BASIC'
  }
];

export const DashboardSidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isPro = user?.subscriptionPlan === 'PRO';
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [pendingPayments, setPendingPayments] = useState<number>(0);

  const loadCounts = async () => {
    try {
      const [unreadRes, myPayments] = await Promise.all([
        notificationAPI.getUnreadCount().catch(() => ({ count: 0 })),
        paymentsAPI.listMyPayments().catch(() => ([] as any[]))
      ]);
      setUnreadCount((unreadRes as any)?.count || 0);
      const myList = Array.isArray(myPayments) ? myPayments : (myPayments as any)?.content || [];
      const pending = Array.isArray(myList)
        ? myList.filter((p: any) => (p?.status || '').toUpperCase?.() === 'PENDING').length
        : 0;
      setPendingPayments(pending);
    } catch (e) {
      // non-blocking
      console.error('Failed to load sidebar counts', e);
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
    <Sidebar className="border-r">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="font-semibold text-lg">Menu.X</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Basic Features */}
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.href ||
                  (item.href === '/dashboard' && location.pathname === '/dashboard/');
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

        {/* Pro Features */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-yellow-500" />
            Pro Features
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {proFeatures.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      className={!isPro ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                      {isPro ? (
                        <Link
                          to={item.href}
                          className={`flex items-center gap-3 ${
                            isActive ? 'bg-accent text-accent-foreground' : ''
                          }`}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                          {item.title === 'Notifications' && unreadCount > 0 && (
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </Badge>
                          )}
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3 cursor-not-allowed">
                          <item.icon className="h-4 w-4" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span>{item.title}</span>
                              <Badge variant="secondary" className="text-xs">
                                Pro
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => {
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
              {!isPro && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link
                      to="/dashboard/upgrade"
                      className={`flex items-center gap-3 ${location.pathname === '/dashboard/upgrade' ? 'bg-accent text-accent-foreground' : ''}`}
                    >
                      <Crown className="h-4 w-4" />
                      <span>Upgrade to Pro</span>
                      {pendingPayments > 0 && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {pendingPayments}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Upgrade Prompt for Basic Users */}
      {!isPro && (
        <SidebarFooter className="p-4">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-4 w-4" />
              <span className="font-semibold">Upgrade to Pro</span>
            </div>
            <p className="text-sm text-blue-100 mb-3">
              Unlock AI features, live orders, and advanced analytics
            </p>
            <Link to="/dashboard/upgrade" className="w-full bg-white text-blue-600 rounded-md py-2 px-3 text-sm font-medium hover:bg-blue-50 transition-colors block text-center">
              Upgrade Now
            </Link>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
};
