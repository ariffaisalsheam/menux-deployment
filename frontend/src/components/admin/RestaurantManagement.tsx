import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Search, Filter, Edit, QrCode, MoreHorizontal, Crown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { restaurantAPI } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { LoadingSkeleton } from '../common/LoadingSpinner';
import { ErrorDisplay } from '../common/ErrorDisplay';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';

interface AdminRestaurant {
  id: number;
  name: string;
  description?: string;
  address: string;
  phone?: string;
  email?: string;
  subscriptionPlan: 'BASIC' | 'PRO';
  status: string; // backend sends string (defaults to "active")
  joinDate?: string;
  ownerName?: string;
  ownerEmail?: string;
  totalOrders: number;
  monthlyRevenue: number;
}

// ...removed unused mockRestaurants...

export const RestaurantManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  // Download report handler
  const handleDownloadReport = async (restaurant: AdminRestaurant) => {
    try {
      // Create a simple CSV report with restaurant data
      const csvContent = [
        ['Restaurant Report'],
        ['Generated on:', new Date().toLocaleDateString()],
        [''],
        ['Restaurant Name:', restaurant.name],
        ['Address:', restaurant.address],
        ['Phone:', restaurant.phone || 'N/A'],
        ['Email:', restaurant.email || 'N/A'],
        ['Owner:', restaurant.ownerName || 'N/A'],
        ['Owner Email:', restaurant.ownerEmail || 'N/A'],
        ['Subscription Plan:', restaurant.subscriptionPlan],
        ['Status:', restaurant.status],
        ['Total Orders:', restaurant.totalOrders.toString()],
        ['Monthly Revenue:', `৳${restaurant.monthlyRevenue.toLocaleString()}`],
        ['Join Date:', restaurant.joinDate ? new Date(restaurant.joinDate).toLocaleDateString() : 'N/A']
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `restaurant-${restaurant.id}-report.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download report:', error);
    }
  };

  // Fetch restaurants
  const {
    data: restaurants = [],
    loading,
    error,
    refetch
  } = useApi<AdminRestaurant[]>(() => restaurantAPI.getAllRestaurants());

  const safeRestaurants = restaurants ?? [];
  const filteredRestaurants = safeRestaurants.filter((restaurant) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (restaurant.name || '').toLowerCase().includes(term) ||
      (restaurant.ownerName || '').toLowerCase().includes(term);
    const matchesPlan = planFilter === 'all' || restaurant.subscriptionPlan === (planFilter as 'BASIC' | 'PRO');
    const matchesStatus = statusFilter === 'all' || (restaurant.status || '').toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesPlan && matchesStatus;
  });

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
          <h1 className="text-3xl font-bold tracking-tight">Restaurant Management</h1>
          <p className="text-muted-foreground">
            Manage restaurant accounts and information
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{safeRestaurants.length}</p>
              <p className="text-sm text-muted-foreground">Total Restaurants</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {safeRestaurants.filter(r => (r.status || '').toLowerCase() === 'active').length}
              </p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {safeRestaurants.filter(r => r.subscriptionPlan === 'PRO').length}
              </p>
              <p className="text-sm text-muted-foreground">Pro Plans</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                ৳{safeRestaurants.reduce((sum, r) => sum + (r.monthlyRevenue || 0), 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
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
                  placeholder="Search restaurants by name or owner..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Plans</option>
                <option value="BASIC">Basic</option>
                <option value="PRO">Pro</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Restaurants List */}
      <Card>
        <CardHeader>
          <CardTitle>Restaurants ({filteredRestaurants.length})</CardTitle>
          <CardDescription>
            Manage restaurant accounts and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRestaurants.map((restaurant) => (
              <div key={restaurant.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Store className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{restaurant.name}</p>
                      <Badge variant={restaurant.subscriptionPlan === 'PRO' ? 'default' : 'secondary'}>
                        {restaurant.subscriptionPlan}
                      </Badge>
                      <Badge variant={(restaurant.status || '').toLowerCase() === 'active' ? 'default' : 'destructive'}>
                        {restaurant.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Owner: {restaurant.ownerName || '—'}</p>
                    <p className="text-sm text-muted-foreground">{restaurant.address}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {restaurant.totalOrders ?? 0} orders
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ৳{(restaurant.monthlyRevenue || 0).toLocaleString()}/month
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => navigate(`/admin/restaurants/${restaurant.id}/qr`)}>
                    <QrCode className="w-4 h-4 mr-1" />
                    QR Code
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => navigate(`/admin/restaurants/${restaurant.id}`)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Restaurant
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/admin/restaurants/${restaurant.id}/analytics`)}>
                        View Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/admin/restaurants/${restaurant.id}/subscription`)}>
                        <Crown className="w-4 h-4 mr-2" />
                        View Subscription
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownloadReport(restaurant)}>
                        Download Reports
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
