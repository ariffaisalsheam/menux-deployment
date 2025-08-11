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
import { userAPI } from '../../services/api';
import { useApi, useApiMutation } from '../../hooks/useApi';
import { LoadingSkeleton } from '../common/LoadingSpinner';
import { ErrorDisplay } from '../common/ErrorDisplay';

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

// ...removed unused mockUsers...

export const UserManagement: React.FC = () => {
  const { updateUserPlan, switchUserContext, user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  // Fetch users
  const {
    data: users = [],
    loading,
    error,
    refetch
  } = useApi<UserData[]>(() => userAPI.getAllUsers());

  // Update user plan mutation
  const updatePlanMutation = useApiMutation(
    ({ userId, plan }: { userId: number; plan: 'BASIC' | 'PRO' }) =>
      userAPI.updateUserPlan(userId, plan),
    {
      onSuccess: () => refetch()
    }
  );

  // Delete user mutation
  const deleteMutation = useApiMutation(
    (userId: number) => userAPI.deleteUser(userId),
    {
      onSuccess: () => refetch()
    }
  );

  const safeUsers = users ?? [];
  const filteredUsers = safeUsers.filter(user => {
    const matchesSearch = user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user?.restaurantName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user?.role === roleFilter;
    const matchesPlan = planFilter === 'all' || user?.subscriptionPlan === planFilter;
    return matchesSearch && matchesRole && matchesPlan;
  });

  const handlePlanChange = async (userId: number, newPlan: 'BASIC' | 'PRO') => {
    try {
      await updatePlanMutation.mutate({ userId, plan: newPlan });

      // If this is the current user, update the context
  const user = safeUsers.find(u => u.id === userId);
      if (user && currentUser && user.username === currentUser.username) {
        updateUserPlan(newPlan);
      }
    } catch (error) {
      console.error('Failed to update user plan:', error);
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

  const handleDeleteUser = async (userId: number) => {
    try {
      await deleteMutation.mutate(userId);
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <LoadingSkeleton lines={2} className="w-64" />
          <LoadingSkeleton lines={1} className="w-32" />
        </div>
        <LoadingSkeleton lines={8} />
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={refetch} />;
  }

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
              <p className="text-2xl font-bold">{safeUsers.length}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {safeUsers.filter(u => u.status === 'active').length}
              </p>
              <p className="text-sm text-muted-foreground">Active Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {safeUsers.filter(u => u.subscriptionPlan === 'PRO').length}
              </p>
              <p className="text-sm text-muted-foreground">Pro Subscribers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {safeUsers.filter(u => u.role === 'SUPER_ADMIN').length}
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
