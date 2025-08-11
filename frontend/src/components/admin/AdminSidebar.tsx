import React from 'react';
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
  TestTube
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
    title: 'Plan Management',
    icon: Crown,
    href: '/admin/plans',
  },
  {
    title: 'Platform Analytics',
    icon: BarChart3,
    href: '/admin/analytics',
  }
];

const systemItems = [
  {
    title: 'AI Configuration',
    icon: Brain,
    href: '/admin/ai-config',
  },
  {
    title: 'System Tests',
    icon: TestTube,
    href: '/admin/tests',
  },
  {
    title: 'System Settings',
    icon: Settings,
    href: '/admin/settings',
  }
];

export const AdminSidebar: React.FC = () => {
  const location = useLocation();

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
