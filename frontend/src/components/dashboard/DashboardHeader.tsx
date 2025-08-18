import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Settings, User, LogOut, Crown } from 'lucide-react';
import { SidebarTrigger } from '../ui/sidebar';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationBell } from '../notifications/NotificationBell';
import { mediaProxyUrl } from '../../services/api';

export const DashboardHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const photoUrl = React.useMemo(() => {
    if (!user?.photoPath) return undefined;
    const url = mediaProxyUrl(user.photoPath);
    // Cache-bust when the path changes so the latest image loads
    return `${url}${url.includes('?') ? '&' : '?'}_=${Date.now()}`;
  }, [user?.photoPath]);

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">
              {user?.restaurantName || 'Restaurant Dashboard'}
            </h1>
            <Badge 
              variant={user?.subscriptionPlan === 'PRO' ? 'default' : 'secondary'}
              className={user?.subscriptionPlan === 'PRO' ? 'bg-yellow-500 text-white' : ''}
            >
              {user?.subscriptionPlan === 'PRO' ? (
                <><Crown className="w-3 h-3 mr-1" /> Pro</>
              ) : (
                'Basic'
              )}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <Button variant="ghost" size="icon">
            <Search className="h-4 w-4" />
          </Button>

          {/* Notifications */}
          <NotificationBell />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage key={photoUrl} src={photoUrl} alt={user?.fullName} />
                  <AvatarFallback>
                    {user?.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/dashboard/owner-profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
