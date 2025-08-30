import React, { useState } from 'react';
import { Search, Filter, Edit, Trash2, Crown, User, Plus, MoreHorizontal, UserCheck, UserX, LogIn } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI, type UpdateUserRequest } from '../../services/api';
import { useApi, useApiMutation } from '../../hooks/useApi';
import { LoadingSkeleton } from '../common/LoadingSpinner';
import { ErrorDisplay } from '../common/ErrorDisplay';

interface UserData {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: 'RESTAURANT_OWNER' | 'SUPER_ADMIN';
  restaurantId?: number;
  restaurantName?: string;
  subscriptionPlan?: 'BASIC' | 'PRO';
  status: 'active' | 'inactive';
  joinDate: string;
  lastLogin: string;
}

// ...removed unused mockUsers...

export const UserManagement: React.FC = () => {
  const { switchUserContext } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  // Edit user state
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editForm, setEditForm] = useState<UpdateUserRequest>({});
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Delete confirmation state
  const [deletingUser, setDeletingUser] = useState<UserData | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch restaurant owners only
  const {
    data: users = [],
    loading,
    error,
    refetch
  } = useApi<UserData[]>(() => userAPI.getRestaurantOwners());

  // Update user mutation
  const updateUserMutation = useApiMutation(
    ({ userId, data }: { userId: number; data: UpdateUserRequest }) =>
      userAPI.updateUser(userId, data),
    {
      onSuccess: () => {
        refetch();
        setShowEditDialog(false);
        setEditingUser(null);
        setEditForm({});
      }
    }
  );

  // Update user plan mutation
  const updatePlanMutation = useApiMutation(
    ({ userId, plan }: { userId: number; plan: 'BASIC' | 'PRO' }) =>
      userAPI.updateUserPlan(userId, plan),
    {
      onSuccess: () => refetch()
    }
  );

  // Activate user mutation
  const activateUserMutation = useApiMutation(
    (userId: number) => userAPI.activateUser(userId),
    {
      onSuccess: () => refetch()
    }
  );

  // Deactivate user mutation
  const deactivateUserMutation = useApiMutation(
    (userId: number) => userAPI.deactivateUser(userId),
    {
      onSuccess: () => refetch()
    }
  );

  // Delete user mutation
  const deleteMutation = useApiMutation(
    (userId: number) => userAPI.deleteUser(userId),
    {
      onSuccess: () => {
        refetch();
        setShowDeleteDialog(false);
        setDeletingUser(null);
      }
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



  const handleEditUser = (user: UserData) => {
    setEditingUser(user);
    setEditForm({
      email: user.email,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      isActive: user.status === 'active'
    });
    setShowEditDialog(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      await updateUserMutation.mutate({
        userId: editingUser.id,
        data: editForm
      });
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleToggleUserStatus = async (user: UserData) => {
    try {
      if (user.status === 'active') {
        await deactivateUserMutation.mutate(user.id);
      } else {
        await activateUserMutation.mutate(user.id);
      }
    } catch (error) {
      console.error('Failed to toggle user status:', error);
    }
  };

  const handlePlanChange = async (userId: number, plan: 'BASIC' | 'PRO') => {
    try {
      await updatePlanMutation.mutate({ userId, plan });
    } catch (error) {
      console.error('Failed to update user plan:', error);
    }
  };

  const handleSwitchToUser = async (user: UserData) => {
    if (user.role === 'RESTAURANT_OWNER') {
      try {
        // Call backend API to get proper JWT token for the user
        const authResponse = await userAPI.switchToUser(user.id);

        // Update auth context with the new token and user data
        const userData = {
          id: authResponse.id,
          username: authResponse.username,
          email: authResponse.email,
          fullName: authResponse.fullName,
          role: authResponse.role,
          restaurantId: authResponse.restaurantId,
          restaurantName: authResponse.restaurantName,
          subscriptionPlan: authResponse.subscriptionPlan
        };

        // Switch user context with new token (this will save the current admin token)
        switchUserContext(userData, authResponse.token);

        // Navigate to restaurant dashboard
        window.location.href = '/dashboard';
      } catch (error) {
        console.error('Failed to switch to user:', error);
        // Show error message to user
        alert('Failed to switch to user. Please try again.');
      }
    }
  };

  const handleDeleteUser = (user: UserData) => {
    setDeletingUser(user);
    setShowDeleteDialog(true);
  };

  const confirmDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      await deleteMutation.mutate(deletingUser.id);
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
                  {/* Status Badge */}
                  <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                    {user.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>

                  {/* Quick Actions */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleUserStatus(user)}
                    disabled={activateUserMutation.loading || deactivateUserMutation.loading}
                  >
                    {user.status === 'active' ? (
                      <>
                        <UserX className="w-4 h-4 mr-1" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4 mr-1" />
                        Activate
                      </>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSwitchToUser(user)}
                  >
                    <LogIn className="w-4 h-4 mr-1" />
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

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleEditUser(user)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit User
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteUser(user)}
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

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information. Changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fullName" className="text-right">
                Full Name
              </Label>
              <Input
                id="fullName"
                value={editForm.fullName || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={editForm.email || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phoneNumber" className="text-right">
                Phone
              </Label>
              <Input
                id="phoneNumber"
                value={editForm.phoneNumber || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">
                Status
              </Label>
              <div className="col-span-3">
                <select
                  id="isActive"
                  value={editForm.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setEditForm(prev => ({ ...prev, isActive: e.target.value === 'active' }))}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveUser}
              disabled={updateUserMutation.loading}
            >
              {updateUserMutation.loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account for{' '}
              <strong>{deletingUser?.fullName}</strong> and remove all associated data including their restaurant.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              disabled={deleteMutation.loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.loading ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
