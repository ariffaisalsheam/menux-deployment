import React, { useState } from 'react';
import { Calendar, Search, Filter, Eye, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { orderAPI } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { LoadingSkeleton } from '../common/LoadingSpinner';
import { ErrorDisplay } from '../common/ErrorDisplay';

interface Order {
  id: number | string;
  orderNumber?: string;
  customerName?: string;
  items?: Array<{ name: string; quantity: number; price: number; specialInstructions?: string }> | string[];
  totalAmount?: number;
  total?: number; // fallback for any legacy shape
  status: string; // Backend sends uppercase enums: PENDING, CONFIRMED, PREPARING, READY, SERVED, CANCELLED
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
  paymentMethod?: string;
}

export const OrderHistory: React.FC = () => {
  const { user } = useAuth();

  // Fetch orders
  const {
    data: orders = [],
    loading,
    error,
    refetch
  } = useApi<Order[]>(() => orderAPI.getOrders());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const isPro = user?.subscriptionPlan === 'PRO';

  const isCompleted = (status?: string) => {
    const s = (status || '').toUpperCase();
    return s === 'SERVED' || s === 'COMPLETED';
  };

  const isCancelled = (status?: string) => (status || '').toUpperCase() === 'CANCELLED';

  const getStatusBadge = (status?: string): { label: string; variant: 'default' | 'secondary' | 'destructive' } => {
    const s = (status || '').toUpperCase();
    if (s === 'SERVED' || s === 'COMPLETED') return { label: 'Completed', variant: 'default' };
    if (s === 'CANCELLED') return { label: 'Cancelled', variant: 'destructive' };
    return { label: s || 'In Progress', variant: 'secondary' };
  };

  const filteredOrders = (orders || []).filter(order => {
    const rawId: any = (order as any)?.orderNumber ?? order?.id;
    const idLc = typeof rawId === 'string' ? rawId.toLowerCase() : (rawId != null ? String(rawId).toLowerCase() : '');
    const nameLc = order?.customerName ? order.customerName.toLowerCase() : '';
    const q = searchTerm.toLowerCase();
    const matchesSearch = idLc.includes(q) || nameLc.includes(q);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'completed' ? isCompleted(order?.status) : statusFilter === 'cancelled' ? isCancelled(order?.status) : true);
    // Date filter placeholder (kept for future enhancement)
    const matchesDate = true;
    return matchesSearch && matchesStatus && matchesDate;
  });

  const formatDateTime = (iso?: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    const date = d.toLocaleDateString();
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${date} at ${time}`;
  };

  const totalRevenue = (filteredOrders || [])
    .filter(order => isCompleted(order?.status))
    .reduce((sum, order) => sum + Number(order?.totalAmount ?? order?.total ?? 0), 0);

  const completedOrders = (filteredOrders || []).filter(order => isCompleted(order?.status)).length;
  const cancelledOrders = (filteredOrders || []).filter(order => isCancelled(order?.status)).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <LoadingSkeleton lines={2} className="w-64" />
          <LoadingSkeleton lines={1} className="w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} lines={3} />
          ))}
        </div>
        <LoadingSkeleton lines={6} />
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
                    <h3 className="font-semibold text-lg">{(order as any)?.orderNumber ?? order.id}</h3>
                    {(() => {
                      const b = getStatusBadge(order.status);
                      return <Badge variant={b.variant}>{b.label}</Badge>;
                    })()}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Customer</p>
                      <p className="font-medium">{order.customerName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date & Time</p>
                      <p className="font-medium">{formatDateTime(order.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Items</p>
                      <p className="font-medium">
                        {Array.isArray(order.items)
                          ? (order.items as any[]).map((it: any) => (typeof it === 'string' ? it : `${it.name} x${it.quantity}`)).join(', ')
                          : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Payment Method</p>
                      <p className="font-medium">{order.paymentMethod || '-'}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 ml-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">৳{Number(order.totalAmount ?? order.total ?? 0)}</p>
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
