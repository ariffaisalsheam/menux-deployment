import React, { useState } from 'react';
import { Calendar, Search, Filter, Eye, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { useAuth } from '../../contexts/AuthContext';

interface Order {
  id: string;
  customerName: string;
  items: string[];
  total: number;
  status: 'completed' | 'cancelled';
  date: string;
  time: string;
  paymentMethod: string;
}

const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    customerName: 'Ahmed Rahman',
    items: ['Chicken Biryani', 'Beef Bhuna', 'Lassi'],
    total: 850,
    status: 'completed',
    date: '2024-08-11',
    time: '12:30 PM',
    paymentMethod: 'Cash'
  },
  {
    id: 'ORD-002',
    customerName: 'Fatima Khan',
    items: ['Fish Curry', 'Rice', 'Vegetable Samosa'],
    total: 420,
    status: 'completed',
    date: '2024-08-11',
    time: '1:15 PM',
    paymentMethod: 'bKash'
  },
  {
    id: 'ORD-003',
    customerName: 'Mohammad Ali',
    items: ['Chicken Biryani', 'Raita'],
    total: 380,
    status: 'cancelled',
    date: '2024-08-10',
    time: '7:45 PM',
    paymentMethod: 'Card'
  },
  {
    id: 'ORD-004',
    customerName: 'Rashida Begum',
    items: ['Beef Bhuna', 'Naan', 'Tea'],
    total: 520,
    status: 'completed',
    date: '2024-08-10',
    time: '8:20 PM',
    paymentMethod: 'Nagad'
  },
  {
    id: 'ORD-005',
    customerName: 'Karim Uddin',
    items: ['Fish Curry', 'Rice', 'Salad'],
    total: 350,
    status: 'completed',
    date: '2024-08-09',
    time: '2:10 PM',
    paymentMethod: 'Cash'
  }
];

export const OrderHistory: React.FC = () => {
  const { user } = useAuth();
  const [orders] = useState<Order[]>(mockOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const isPro = user?.subscriptionPlan === 'PRO';

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesDate = dateFilter === 'all' || order.date === dateFilter;
    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalRevenue = filteredOrders
    .filter(order => order.status === 'completed')
    .reduce((sum, order) => sum + order.total, 0);

  const completedOrders = filteredOrders.filter(order => order.status === 'completed').length;
  const cancelledOrders = filteredOrders.filter(order => order.status === 'cancelled').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order History</h1>
          <p className="text-muted-foreground">
            View and manage your past orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isPro ? 'default' : 'secondary'}>
            {user?.subscriptionPlan || 'Basic'} Plan
          </Badge>
        </div>
      </div>

      {/* Live Orders Promotion for Basic Users */}
      {!isPro && (
        <Card className="border-blue-300 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              Upgrade to Pro for Live Order Management
            </CardTitle>
            <CardDescription>
              Manage orders in real-time with our Kanban board interface
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Track orders from placement to completion with real-time updates
                </p>
              </div>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                Upgrade to Pro
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{filteredOrders.length}</p>
              <p className="text-sm text-muted-foreground">Total Orders</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{completedOrders}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{cancelledOrders}</p>
              <p className="text-sm text-muted-foreground">Cancelled</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">৳{totalRevenue}</p>
              <p className="text-sm text-muted-foreground">Revenue</p>
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
                  placeholder="Search by order ID or customer name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Dates</option>
                <option value="2024-08-11">Today</option>
                <option value="2024-08-10">Yesterday</option>
                <option value="2024-08-09">2 days ago</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <Card key={order.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{order.id}</h3>
                    <Badge variant={order.status === 'completed' ? 'default' : 'destructive'}>
                      {order.status === 'completed' ? 'Completed' : 'Cancelled'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Customer</p>
                      <p className="font-medium">{order.customerName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date & Time</p>
                      <p className="font-medium">{order.date} at {order.time}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Items</p>
                      <p className="font-medium">{order.items.join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Payment Method</p>
                      <p className="font-medium">{order.paymentMethod}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 ml-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">৳{order.total}</p>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground">No orders found matching your criteria.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
