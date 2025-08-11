import React, { useState } from 'react';
import { Search, Filter, Edit, Trash2, Crown, User, Plus, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { useAuth } from '../../contexts/AuthContext';

interface UserData {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: 'RESTAURANT_OWNER' | 'SUPER_ADMIN';
  restaurantName?: string;
  subscriptionPlan?: 'BASIC' | 'PRO';
  status: 'active' | 'inactive';
  joinDate: string;
  lastLogin: string;
}

const mockUsers: UserData[] = [
  {
    id: 1,
    username: 'ahmed_kitchen',
    email: 'ahmed@kitchen.com',
    fullName: 'Ahmed Rahman',
    role: 'RESTAURANT_OWNER',
    restaurantName: 'Ahmed\'s Kitchen',
    subscriptionPlan: 'PRO',
    status: 'active',
    joinDate: '2024-01-15',
    lastLogin: '2024-08-11 14:30'
  },
  {
    id: 2,
    username: 'spice_garden',
    email: 'owner@spicegarden.com',
    fullName: 'Fatima Khan',
    role: 'RESTAURANT_OWNER',
    restaurantName: 'Spice Garden',
    subscriptionPlan: 'BASIC',
    status: 'active',
    joinDate: '2024-02-20',
    lastLogin: '2024-08-11 09:15'
  },
  {
    id: 3,
    username: 'testuser456',
    email: 'testuser456@example.com',
    fullName: 'Test User 456',
    role: 'RESTAURANT_OWNER',
    restaurantName: 'Test Restaurant 456',
    subscriptionPlan: 'BASIC',
    status: 'active',
    joinDate: '2024-08-01',
    lastLogin: '2024-08-11 16:45'
  },
  {
    id: 4,
    username: 'admin_user',
    email: 'admin@menux.com',
    fullName: 'System Administrator',
    role: 'SUPER_ADMIN',
    status: 'active',
    joinDate: '2024-01-01',
    lastLogin: '2024-08-11 17:00'
  }
];

export const UserManagement: React.FC = () => {
  const { updateUserPlan, switchUserContext } = useAuth();
  const [users, setUsers] = useState<UserData[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.restaurantName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesPlan = planFilter === 'all' || user.subscriptionPlan === planFilter;
    return matchesSearch && matchesRole && matchesPlan;
  });

  const handlePlanChange = (userId: number, newPlan: 'BASIC' | 'PRO') => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, subscriptionPlan: newPlan } : user
    ));
    
    // If this is the current test user, update the context
    const user = users.find(u => u.id === userId);
    if (user && user.username === 'testuser456') {
      updateUserPlan(newPlan);
    }
  };

  const handleSwitchToUser = (user: UserData) => {
    if (user.role === 'RESTAURANT_OWNER') {
      const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        restaurantId: user.id,
        restaurantName: user.restaurantName,
        subscriptionPlan: user.subscriptionPlan
      };
      switchUserContext(userData);
      // Navigate to restaurant dashboard
      window.location.href = '/dashboard';
    }
  };

  const handleDeleteUser = (userId: number) => {
    setUsers(users.filter(user => user.id !== userId));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage restaurant owners and administrators
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add New User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {users.filter(u => u.status === 'active').length}
              </p>
              <p className="text-sm text-muted-foreground">Active Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {users.filter(u => u.subscriptionPlan === 'PRO').length}
              </p>
              <p className="text-sm text-muted-foreground">Pro Subscribers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {users.filter(u => u.role === 'SUPER_ADMIN').length}
              </p>
              <p className="text-sm text-muted-foreground">Administrators</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search users by name, email, or restaurant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Roles</option>
                <option value="RESTAURANT_OWNER">Restaurant Owner</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Plans</option>
                <option value="BASIC">Basic</option>
                <option value="PRO">Pro</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Manage user accounts and subscription plans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.fullName}</p>
                      <Badge variant={user.role === 'SUPER_ADMIN' ? 'destructive' : 'default'}>
                        {user.role === 'SUPER_ADMIN' ? 'Admin' : 'Owner'}
                      </Badge>
                      {user.subscriptionPlan && (
                        <Badge variant={user.subscriptionPlan === 'PRO' ? 'default' : 'secondary'}>
                          {user.subscriptionPlan}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    {user.restaurantName && (
                      <p className="text-sm text-muted-foreground">{user.restaurantName}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {user.role === 'RESTAURANT_OWNER' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSwitchToUser(user)}
                      >
                        Switch To User
                      </Button>
                      {user.subscriptionPlan && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Crown className="w-4 h-4 mr-1" />
                              Change Plan
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem 
                              onClick={() => handlePlanChange(user.id, 'BASIC')}
                            >
                              Switch to Basic
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handlePlanChange(user.id, 'PRO')}
                            >
                              Switch to Pro
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit User
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
