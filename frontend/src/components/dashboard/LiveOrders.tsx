import React, { useState, useMemo } from 'react';
import { Crown, Zap, Clock, CheckCircle, ArrowRight, ChefHat, Package, Grid, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useAuth } from '../../contexts/AuthContext';
import { orderAPI } from '../../services/api';
import { useApi, useApiMutation } from '../../hooks/useApi';
import { LoadingSpinner, LoadingSkeleton } from '../common/LoadingSpinner';
import { ErrorDisplay } from '../common/ErrorDisplay';

interface Order {
  id: number;
  customerName: string;
  tableNumber?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
  paymentStatus?: 'UNPAID' | 'BILL_REQUESTED' | 'PAID';
  createdAt: string;
  notes?: string;
}

export const LiveOrders: React.FC = () => {
  const { user } = useAuth();
  const isPro = user?.subscriptionPlan === 'PRO';
  const [selectedTable, setSelectedTable] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Fetch orders
  const {
    data: orders = [],
    loading,
    error,
    refetch
  } = useApi<Order[]>(() => orderAPI.getOrders());

  // Update order status mutation
  const updateStatusMutation = useApiMutation(
    ({ id, status }: { id: number; status: string }) => orderAPI.updateOrderStatus(id, status),
    {
      onSuccess: () => refetch()
    }
  );

  // Update payment status mutation
  const updatePaymentMutation = useApiMutation(
    ({ id, paymentStatus }: { id: number; paymentStatus: string }) => orderAPI.updatePaymentStatus(id, paymentStatus),
    {
      onSuccess: () => refetch()
    }
  );

  // Filter orders based on table and status
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(order => {
      const tableMatch = selectedTable === 'all' || order.tableNumber === selectedTable;
      const statusMatch = selectedStatus === 'all' || order.status === selectedStatus;
      return tableMatch && statusMatch;
    });
  }, [orders, selectedTable, selectedStatus]);

  // Get unique table numbers for filter dropdown
  const uniqueTables = useMemo(() => {
    if (!orders) return [];
    const tables = orders
      .map(order => order.tableNumber)
      .filter((table): table is string => table !== undefined && table !== null)
      .filter((table, index, arr) => arr.indexOf(table) === index)
      .sort((a, b) => {
        // Sort numerically if possible, otherwise alphabetically
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        return a.localeCompare(b);
      });
    return tables;
  }, [orders]);

  if (!isPro) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Zap className="w-8 h-8 text-blue-500" />
              Live Orders
            </h1>
            <p className="text-muted-foreground">
              Real-time order management with Kanban board interface
            </p>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Crown className="w-3 h-3" />
            Pro Feature
          </Badge>
        </div>

        {/* Upgrade Prompt */}
        <Card className="border-blue-300 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Crown className="h-6 w-6 text-yellow-500" />
              Upgrade to Pro for Live Order Management
            </CardTitle>
            <CardDescription className="text-base">
              Transform your order management with real-time tracking and Kanban board interface
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Feature Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-dashed border-2 border-blue-300">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Clock className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                    <h3 className="font-semibold">Pending Orders</h3>
                    <p className="text-2xl font-bold text-orange-600">8</p>
                    <p className="text-sm text-muted-foreground">Awaiting preparation</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-dashed border-2 border-blue-300">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Zap className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <h3 className="font-semibold">In Progress</h3>
                    <p className="text-2xl font-bold text-blue-600">5</p>
                    <p className="text-sm text-muted-foreground">Being prepared</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-dashed border-2 border-blue-300">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <h3 className="font-semibold">Ready</h3>
                    <p className="text-2xl font-bold text-green-600">3</p>
                    <p className="text-sm text-muted-foreground">Ready for pickup</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Benefits List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">What you'll get:</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Real-time order tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Drag-and-drop Kanban board</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Order status notifications</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Kitchen workflow optimization</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Improve efficiency:</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Reduce order preparation time</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Better customer communication</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Streamlined kitchen operations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Real-time performance insights</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Sample Order Cards */}
            <div>
              <h3 className="font-semibold mb-3">Sample Live Orders:</h3>
              <div className="space-y-3">
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Order #ORD-123</p>
                        <p className="text-sm text-muted-foreground">Chicken Biryani, Lassi</p>
                        <p className="text-sm text-orange-600">Pending - 2 min ago</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">৳450</p>
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          Pending
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Order #ORD-124</p>
                        <p className="text-sm text-muted-foreground">Fish Curry, Rice</p>
                        <p className="text-sm text-blue-600">In Progress - 8 min ago</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">৳320</p>
                        <Badge variant="outline" className="text-blue-600 border-blue-300">
                          Cooking
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Upgrade CTA */}
            <div className="text-center pt-4 border-t">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Pro - ৳1,500/month
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Start your free trial today • Cancel anytime
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Helper functions
  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    await updateStatusMutation.mutate({ id: orderId, status: newStatus });
  };

  const getOrdersByStatus = (status: string) => {
    return filteredOrders.filter(order => order.status === status);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PREPARING': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'READY': return 'bg-green-100 text-green-800 border-green-200';
      case 'SERVED': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'PENDING': return 'CONFIRMED';
      case 'CONFIRMED': return 'PREPARING';
      case 'PREPARING': return 'READY';
      case 'READY': return 'SERVED';
      default: return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return Clock;
      case 'CONFIRMED': return CheckCircle;
      case 'PREPARING': return ChefHat;
      case 'READY': return Package;
      case 'SERVED': return CheckCircle;
      default: return Clock;
    }
  };

  // Pro users see the actual live orders interface
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <LoadingSkeleton lines={2} className="w-64" />
          <LoadingSkeleton lines={1} className="w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} lines={8} />
          ))}
        </div>
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
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="w-8 h-8 text-blue-500" />
            Live Orders
          </h1>
          <p className="text-muted-foreground">
            Real-time order management with Kanban board interface
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="flex items-center gap-1 bg-blue-500">
            <Zap className="w-3 h-3" />
            Live Updates
          </Badge>
          <Badge variant="outline">
            {(orders ?? []).length} Total Orders
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Filter by Table</label>
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger>
                  <SelectValue placeholder="All Tables" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tables</SelectItem>
                  {uniqueTables.map((table) => (
                    <SelectItem key={table} value={table}>
                      <div className="flex items-center gap-2">
                        <Grid className="w-4 h-4" />
                        Table {table}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Filter by Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="PREPARING">Preparing</SelectItem>
                  <SelectItem value="READY">Ready</SelectItem>
                  <SelectItem value="SERVED">Served</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedTable('all');
                  setSelectedStatus('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredOrders.length} of {orders?.length || 0} orders
            {selectedTable !== 'all' && ` • Table: ${selectedTable}`}
            {selectedStatus !== 'all' && ` • Status: ${selectedStatus}`}
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].map((status) => {
          const statusOrders = getOrdersByStatus(status);
          const StatusIcon = getStatusIcon(status);

          return (
            <Card key={status} className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <StatusIcon className="w-4 h-4" />
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                  <Badge variant="secondary" className="ml-auto">
                    {statusOrders.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {statusOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <StatusIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No {status.toLowerCase()} orders</p>
                  </div>
                ) : (
                  statusOrders.map((order) => (
                    <Card key={order.id} className={`border-2 ${getStatusColor(order.status)}`}>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Order #{order.id}</h4>
                            <Badge variant="outline" className="text-xs">
                              {new Date(order.createdAt).toLocaleTimeString()}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                              Customer: {order.customerName}
                            </p>
                            {order.tableNumber && (
                              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                <Grid className="w-3 h-3" />
                                Table {order.tableNumber}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between">
                                <span>{item.quantity}x {item.name}</span>
                                <span>৳{item.price}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="font-medium">Total: ৳{order.totalAmount}</span>
                            {getNextStatus(order.status) && (
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(order.id, getNextStatus(order.status)!)}
                                disabled={updateStatusMutation.loading}
                              >
                                {updateStatusMutation.loading ? (
                                  <LoadingSpinner size="sm" />
                                ) : (
                                  <>
                                    <ArrowRight className="w-3 h-3 mr-1" />
                                    {getNextStatus(order.status)}
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                          <div className="flex items-center justify-between pt-2">
                            <div className="text-xs">
                              Payment:
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-medium">
                                {order.paymentStatus || 'UNPAID'}
                              </span>
                            </div>
                            {order.paymentStatus !== 'PAID' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updatePaymentMutation.mutate({ id: order.id, paymentStatus: 'PAID' })}
                                disabled={updatePaymentMutation.loading}
                              >
                                {updatePaymentMutation.loading ? (
                                  <LoadingSpinner size="sm" />
                                ) : (
                                  'Mark Paid'
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
