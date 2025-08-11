import React, { useState } from 'react';
import { Store, Search, Filter, Edit, QrCode, MoreHorizontal } from 'lucide-react';
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

interface Restaurant {
  id: number;
  name: string;
  owner: string;
  email: string;
  plan: 'BASIC' | 'PRO';
  status: 'active' | 'inactive';
  address: string;
  phone: string;
  joinDate: string;
  totalOrders: number;
  monthlyRevenue: number;
}

const mockRestaurants: Restaurant[] = [
  {
    id: 1,
    name: 'Ahmed\'s Kitchen',
    owner: 'Ahmed Rahman',
    email: 'ahmed@kitchen.com',
    plan: 'PRO',
    status: 'active',
    address: '123 Main St, Dhaka',
    phone: '+880 1234-567890',
    joinDate: '2024-01-15',
    totalOrders: 1247,
    monthlyRevenue: 45600
  },
  {
    id: 2,
    name: 'Spice Garden',
    owner: 'Fatima Khan',
    email: 'owner@spicegarden.com',
    plan: 'BASIC',
    status: 'active',
    address: '456 Food St, Dhaka',
    phone: '+880 1234-567891',
    joinDate: '2024-02-20',
    totalOrders: 523,
    monthlyRevenue: 18200
  },
  {
    id: 3,
    name: 'Test Restaurant 456',
    owner: 'Test User 456',
    email: 'testuser456@example.com',
    plan: 'BASIC',
    status: 'active',
    address: '789 Test Ave, Dhaka',
    phone: '+880 1234-567892',
    joinDate: '2024-08-01',
    totalOrders: 89,
    monthlyRevenue: 3200
  }
];

export const RestaurantManagement: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(mockRestaurants);
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = planFilter === 'all' || restaurant.plan === planFilter;
    const matchesStatus = statusFilter === 'all' || restaurant.status === statusFilter;
    return matchesSearch && matchesPlan && matchesStatus;
  });

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
              <p className="text-2xl font-bold">{restaurants.length}</p>
              <p className="text-sm text-muted-foreground">Total Restaurants</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {restaurants.filter(r => r.status === 'active').length}
              </p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {restaurants.filter(r => r.plan === 'PRO').length}
              </p>
              <p className="text-sm text-muted-foreground">Pro Plans</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                ৳{restaurants.reduce((sum, r) => sum + r.monthlyRevenue, 0).toLocaleString()}
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
                      <Badge variant={restaurant.plan === 'PRO' ? 'default' : 'secondary'}>
                        {restaurant.plan}
                      </Badge>
                      <Badge variant={restaurant.status === 'active' ? 'default' : 'destructive'}>
                        {restaurant.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Owner: {restaurant.owner}</p>
                    <p className="text-sm text-muted-foreground">{restaurant.address}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {restaurant.totalOrders} orders
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ৳{restaurant.monthlyRevenue.toLocaleString()}/month
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
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
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Restaurant
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        View Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem>
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
