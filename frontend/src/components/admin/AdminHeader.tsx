import React from 'react';
import { Shield, Settings, LogOut, User } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useAuth } from '../../contexts/AuthContext';
import { SidebarTrigger } from '../ui/sidebar';
import { NotificationBell } from '../notifications/NotificationBell';

export const AdminHeader: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <header className="border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-red-600" />
            <h1 className="text-xl font-bold">Menu.X Admin</h1>
            <Badge variant="destructive" className="text-xs">
              Super Admin
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <NotificationBell />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-red-100 text-red-600">
                    {user?.fullName?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-sm font-medium">{user?.fullName || 'Admin'}</p>
                  <p className="text-xs text-muted-foreground">Super Admin</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
