import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Phone, MapPin, ShoppingCart, MessageSquare, Grid, Search, Star, X, Plus, Minus, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorDisplay } from '../components/common/ErrorDisplay';
import { FeedbackDialog } from '../components/public/FeedbackDialog';
import { publicMenuAPI, mediaProxyUrl } from '../services/api';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
}

interface Restaurant {
  id: number;
  name: string;
  description: string;
  address: string;
  phoneNumber: string;
  email: string;
  subscriptionPlan: string;
}

interface PublicMenuData {
  restaurant: Restaurant;
  menuItems: MenuItem[];
  isPro: boolean;
}

interface RestaurantFeatures {
  canOrder: boolean;
  canTrackOrders: boolean;
  canRequestBill: boolean;
  hasAdvancedFeedback: boolean;
  subscriptionPlan: string;
}

interface FeedbackItem {
  id: number;
  customerName?: string;
  rating: number;
  comment: string;
  createdAt: string;
  aiAnalysis?: string | null;
  aiSentiment?: string | null;
}

export const PublicMenu: React.FC = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const location = useLocation();
  const tableNumber = (new URLSearchParams(location.search).get('table') || '').trim();
  const [menuData, setMenuData] = useState<PublicMenuData | null>(null);
  const [features, setFeatures] = useState<RestaurantFeatures | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [search, setSearch] = useState<string>('');
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // Order Tracking state
  type TrackedOrder = {
    orderNumber: string;
    status: string;
    paymentStatus?: string;
    createdAt?: string;
    updatedAt?: string;
    completedAt?: string;
    estimatedPreparationTime?: number;
    tableNumber?: string;
    totalAmount?: number;
    timeline?: Record<string, string>;
  } | null;
  const [isTrackOpen, setIsTrackOpen] = useState(false);
  const [orderNumberInput, setOrderNumberInput] = useState('');
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<TrackedOrder>(null);
  const [autoPolling, setAutoPolling] = useState(true);
  const [billLoading, setBillLoading] = useState(false);

  // Simplified tracking: only by order number

  const requestBill = async () => {
    if (!restaurantId || !trackedOrder) return;
    try {
      setBillLoading(true);
      setTrackError('');
      const res = await publicMenuAPI.requestBill(restaurantId, trackedOrder.orderNumber);
      const newStatus = (res && (res.paymentStatus || res?.data?.paymentStatus)) || 'BILL_REQUESTED';
      setTrackedOrder((prev) => prev ? { ...prev, paymentStatus: newStatus } : prev);
    } catch (e: any) {
      setTrackError(e?.response?.data?.message || e?.message || 'Failed to request bill');
    } finally {
      setBillLoading(false);
    }
  };
  // Removed tracking modes (table/phone) for a cleaner UX

  const fetchTrackedOrder = async (ordNum?: string) => {
    if (!restaurantId) return;
    const number = (ordNum ?? orderNumberInput).trim();
    if (!number) return;
    try {
      setTrackLoading(true);
      setTrackError('');
      const data = await publicMenuAPI.trackOrder(restaurantId, number);
      setTrackedOrder(data);
    } catch (e: any) {
      setTrackError(e?.response?.status === 404 ? 'Order not found' : (e?.message || 'Failed to load order status'));
      setTrackedOrder(null);
    } finally {
      setTrackLoading(false);
    }
  };

  // Removed table/phone multi-order tracking for a simpler UX

  // Poll every 15s while modal open and we have a tracked order
  useEffect(() => {
    if (!isTrackOpen || !trackedOrder || !autoPolling) return;
    const handle = setInterval(() => {
      fetchTrackedOrder(trackedOrder.orderNumber);
    }, 15000);
    return () => clearInterval(handle);
  }, [isTrackOpen, trackedOrder?.orderNumber, autoPolling]);

  // Auto-fetch once when modal opens and we have an order number
  useEffect(() => {
    if (!isTrackOpen) return;
    if (orderNumberInput.trim() && !trackedOrder && !trackLoading) {
      fetchTrackedOrder(orderNumberInput);
    }
  }, [isTrackOpen]);

  // Cart & Checkout state
  type CartItem = { menuItemName: string; price: number; quantity: number };
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState<{ orderNumber: string } | null>(null);

  // tableNumber is parsed above from useLocation query params

  // Cart helpers
  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const idx = prev.findIndex((ci) => ci.menuItemName === item.name);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 };
        return copy;
      }
      return [...prev, { menuItemName: item.name, price: item.price, quantity: 1 }];
    });
  };

  const incQty = (name: string) => {
    setCart((prev) => prev.map(ci => ci.menuItemName === name ? { ...ci, quantity: ci.quantity + 1 } : ci));
  };

  const decQty = (name: string) => {
    setCart((prev) => prev
      .map(ci => ci.menuItemName === name ? { ...ci, quantity: Math.max(1, ci.quantity - 1) } : ci)
    );
  };

  const removeItem = (name: string) => {
    setCart((prev) => prev.filter(ci => ci.menuItemName !== name));
  };

  const cartCount = cart.reduce((sum, ci) => sum + ci.quantity, 0);
  const cartTotal = cart.reduce((sum, ci) => sum + ci.price * ci.quantity, 0);

  const nameValid = customerName.trim().length > 0;
  const canCheckout = features?.canOrder && cart.length > 0 && !!restaurantId && nameValid;

  const submitOrder = async () => {
    if (!restaurantId || !canCheckout) return;
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(null);
    try {
      const payload = {
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        tableNumber: tableNumber || undefined,
        specialInstructions: orderNotes.trim() || undefined,
        orderItems: cart.map(ci => ({ menuItemName: ci.menuItemName, quantity: ci.quantity, price: ci.price }))
      };
      const res = await publicMenuAPI.placeOrder(restaurantId, payload);
      setSubmitSuccess({ orderNumber: res.orderNumber });
      // Persist and auto-open tracking for seamless experience
      try { localStorage.setItem(`lastOrder:${restaurantId}`, res.orderNumber); } catch {}
      setOrderNumberInput(res.orderNumber);
      setIsCartOpen(false);
      setIsTrackOpen(true);
      setTimeout(() => fetchTrackedOrder(res.orderNumber), 0);
      // Clear cart on success
      setCart([]);
    } catch (e: any) {
      setSubmitError(e?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  const loadFeedback = async () => {
    if (!restaurantId) return;
    try {
      setFeedbackLoading(true);
      const list = await publicMenuAPI.getFeedbackList(restaurantId);
      setFeedback(list);
    } catch (e) {
      // Silently ignore on public page
    } finally {
      setFeedbackLoading(false);
    }
  };

  useEffect(() => {
    const fetchMenuData = async () => {
      if (!restaurantId) {
        setError('Restaurant ID is required');
        setLoading(false);
        return;
      }

      if (!tableNumber || tableNumber === 'LEGACY') {
        setError(
          tableNumber === 'LEGACY'
            ? 'This QR code is outdated. Please ask your server for a new table-specific QR code.'
            : 'Table number is required. Please scan a valid QR code from a table.'
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [menuResponse, featuresResponse] = await Promise.all([
          publicMenuAPI.getPublicMenu(restaurantId, tableNumber),
          publicMenuAPI.getRestaurantFeatures(restaurantId)
        ]);

        setMenuData(menuResponse);
        setFeatures(featuresResponse);
        setError('');
        // Load feedback after basic data loads
        loadFeedback();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load menu');
      } finally {
        setLoading(false);
      }
    };

    fetchMenuData();
  }, [restaurantId, tableNumber]);

  // Get unique categories
  const categories = menuData ? ['All', ...new Set(menuData.menuItems.map(item => item.category))] : [];

  // Filter menu items by category and search query
  const filteredItems = (menuData?.menuItems || [])
    .filter(item => selectedCategory === 'All' || item.category === selectedCategory)
    .filter(item => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        (item.description?.toLowerCase().includes(q) ?? false)
      );
    });

  // Group items by category for display
  const groupedItems = filteredItems.reduce((acc, item) => {
    const category = item.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner text="Loading menu..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <ErrorDisplay error={error} />
      </div>
    );
  }

  if (!menuData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Restaurant not found</h1>
          <p className="text-gray-600 mt-2">The restaurant you're looking for doesn't exist or is not active.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">{menuData.restaurant.name}</h1>
            {menuData.restaurant.description && (
              <p className="text-gray-600 mt-2 max-w-2xl mx-auto">{menuData.restaurant.description}</p>
            )}
            <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-500">
              {menuData.restaurant.address && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{menuData.restaurant.address}</span>
                </div>
              )}
              {menuData.restaurant.phoneNumber && (
                <div className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  <span>{menuData.restaurant.phoneNumber}</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {features?.subscriptionPlan === 'PRO' && (
                <Badge className="bg-yellow-500 text-white">
                  Pro Restaurant - Online Ordering Available
                </Badge>
              )}
              {tableNumber && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Grid className="w-3 h-3" />
                  Table {tableNumber}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter + Search */}
      <div className="sticky top-0 z-10 bg-gray-50/80 backdrop-blur supports-[backdrop-filter]:bg-gray-50/60 border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search menu items..."
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        {selectedCategory === 'All' ? (
          // Show all categories grouped
          Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{category}</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {items.map((item) => (
                  <MenuItemCard key={item.id} item={item} features={features} onAdd={addToCart} />
                ))}
              </div>
            </div>
          ))
        ) : (
          // Show filtered category
          <div className="grid gap-4 md:grid-cols-2">
            {filteredItems.map((item) => (
              <MenuItemCard key={item.id} item={item} features={features} onAdd={addToCart} />
            ))}
          </div>
        )}

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No menu items available in this category.</p>
          </div>
        )}
      </div>

      {/* Recent Feedback */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Feedback</h2>
        {feedbackLoading && (
          <div className="text-sm text-gray-500">Loading feedback...</div>
        )}
        {!feedbackLoading && feedback.length === 0 && (
          <div className="text-sm text-gray-500">No feedback yet. Be the first to leave a review!</div>
        )}
        <div className="space-y-4">
          {feedback.slice(0, 5).map((fb) => (
            <div key={fb.id} className="p-4 bg-white rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="font-medium text-gray-900">{fb.customerName || 'Anonymous'}</div>
                <div className="text-xs text-gray-500">{new Date(fb.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-1 mt-1">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} className={`w-4 h-4 ${i <= fb.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                ))}
              </div>
              <p className="text-sm text-gray-700 mt-2">{fb.comment}</p>
              {fb.aiAnalysis && (
                <div className="mt-2 text-xs text-purple-700 bg-purple-50 border border-purple-200 rounded px-2 py-1">
                  AI Insight: {fb.aiAnalysis}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="bg-white border-t p-4 sticky bottom-0">
        <div className="max-w-4xl mx-auto flex justify-center gap-4">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setIsFeedbackOpen(true)}
          >
            <MessageSquare className="w-4 h-4" />
            Leave Feedback
          </Button>
          {features?.canTrackOrders && (
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => {
                const last = submitSuccess?.orderNumber || (restaurantId ? localStorage.getItem(`lastOrder:${restaurantId}`) || '' : '');
                setIsTrackOpen(true);
                setTrackError('');
                setTrackedOrder(null);
                setOrderNumberInput(last);
                if (last) setTimeout(() => fetchTrackedOrder(last), 0);
              }}
            >
              <Clock className="w-4 h-4" />
              Track Order
            </Button>
          )}
          {features?.canOrder && (
            <Button className="flex items-center gap-2" onClick={() => setIsCartOpen(true)}>
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 ? `Cart (${cartCount})` : 'Start Order'}
            </Button>
          )}
        </div>
      </div>

      {/* Cart / Checkout Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50">
          <div className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl shadow-xl">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Your Order {cartCount > 0 && `(${cartCount})`}</h3>
              <button
                className="p-2 rounded hover:bg-gray-100"
                onClick={() => { setIsCartOpen(false); setSubmitError(''); setSubmitSuccess(null); }}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 max-h-[70vh] overflow-y-auto space-y-4">
              {/* Cart Items */}
              {cart.length === 0 ? (
                <div className="text-center text-gray-500">Your cart is empty. Add items from the menu.</div>
              ) : (
                <div className="space-y-3">
                  {cart.map((ci) => (
                    <div key={ci.menuItemName} className="flex items-center justify-between gap-3 border rounded-lg p-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{ci.menuItemName}</div>
                        <div className="text-sm text-gray-600">৳{ci.price.toFixed(2)} each</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-1 rounded border hover:bg-gray-50" onClick={() => decQty(ci.menuItemName)} aria-label="Decrease">
                          <Minus className="w-4 h-4" />
                        </button>
                        <div className="w-8 text-center">{ci.quantity}</div>
                        <button className="p-1 rounded border hover:bg-gray-50" onClick={() => incQty(ci.menuItemName)} aria-label="Increase">
                          <Plus className="w-4 h-4" />
                        </button>
                        <div className="w-16 text-right font-semibold">৳{(ci.price * ci.quantity).toFixed(2)}</div>
                        <button className="p-1 rounded border hover:bg-gray-50" onClick={() => removeItem(ci.menuItemName)} aria-label="Remove">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Your Name <span className="text-red-600">*</span></label>
                  <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g. John" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Phone (optional)</label>
                  <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="e.g. 01234..." />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Table</label>
                <div className="px-3 py-2 border rounded bg-gray-50">{tableNumber || 'Not specified'}</div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Special Instructions</label>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full border rounded px-3 py-2 min-h-[80px]"
                  placeholder="Any allergies or preferences?"
                />
              </div>

              {/* Summary */}
              <div className="flex items-center justify-between border-t pt-3">
                <div className="text-gray-600">Total</div>
                <div className="text-xl font-bold text-green-600">৳{cartTotal.toFixed(2)}</div>
              </div>

              {/* Errors / Success */}
              {submitError && (
                <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded p-2">{submitError}</div>
              )}
              {submitSuccess && (
                <div className="text-sm text-green-700 border border-green-200 bg-green-50 rounded p-2">
                  Order placed! Your order number is <span className="font-semibold">{submitSuccess.orderNumber}</span>.
                  {features?.canTrackOrders && (
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setIsTrackOpen(true); setOrderNumberInput(submitSuccess.orderNumber); setTimeout(() => fetchTrackedOrder(submitSuccess.orderNumber), 0); }}
                      >
                        <Clock className="w-3 h-3 mr-1" /> Track This Order
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="p-4 border-t flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setIsCartOpen(false)}>Close</Button>
              <Button className="flex-1" disabled={!canCheckout || submitting || cart.length === 0} onClick={submitOrder}>
                {submitting ? 'Placing...' : 'Place Order'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Order Tracking Modal */}
      {isTrackOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50">
          <div className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl shadow-xl">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Track Your Order</h3>
              <button
                className="p-2 rounded hover:bg-gray-100"
                onClick={() => { setIsTrackOpen(false); setTrackError(''); setTrackedOrder(null); }}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 max-h-[70vh] overflow-y-auto space-y-4">
              {/* Inputs */}
              <div className="flex gap-2">
                <Input
                  value={orderNumberInput}
                  onChange={(e) => setOrderNumberInput(e.target.value)}
                  placeholder="Enter your order number"
                />
                <Button onClick={() => fetchTrackedOrder()} disabled={!orderNumberInput.trim() || trackLoading}>
                  {trackLoading ? 'Checking...' : 'Check'}
                </Button>
              </div>

              {/* Errors */}
              {trackError && (
                <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded p-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {trackError}
                </div>
              )}

              {/* Displays */}
              {trackLoading && (
                <div className="flex justify-center py-6"><LoadingSpinner text="Fetching status..." /></div>
              )}

              {trackedOrder && !trackLoading && (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500">Order</div>
                      <div className="font-semibold">{trackedOrder.orderNumber}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => fetchTrackedOrder(trackedOrder.orderNumber)}>
                        <RefreshCw className="w-3 h-3 mr-1" /> Refresh
                      </Button>
                      {features?.canRequestBill && trackedOrder.paymentStatus !== 'PAID' && trackedOrder.paymentStatus !== 'BILL_REQUESTED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={requestBill}
                          disabled={billLoading}
                        >
                          {billLoading ? 'Requesting...' : 'Request Bill'}
                        </Button>
                      )}
                      <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input type="checkbox" checked={autoPolling} onChange={(e) => setAutoPolling(e.target.checked)} /> Auto refresh
                      </label>
                    </div>
                  </div>

                  {/* Status pill */}
                  <div>
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      trackedOrder.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                      trackedOrder.status === 'READY' || trackedOrder.status === 'SERVED' ? 'bg-green-100 text-green-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {trackedOrder.status}
                    </span>
                    {trackedOrder.paymentStatus && (
                      <span className={`ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        trackedOrder.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {trackedOrder.paymentStatus}
                      </span>
                    )}
                  </div>

                  {/* Steps */}
                  <div className="border rounded-lg p-3">
                    <div className="text-sm font-medium mb-2">Progress</div>
                    {(() => {
                      const steps = ['PENDING','CONFIRMED','PREPARING','READY','SERVED'];
                      const currentIdx = Math.max(0, steps.indexOf(trackedOrder.status));
                      const cancelled = trackedOrder.status === 'CANCELLED';
                      return (
                        <div className="flex items-center justify-between">
                          {steps.map((s, idx) => (
                            <div key={s} className="flex-1 flex items-center">
                              <div className={`flex items-center gap-2 ${idx < currentIdx ? 'text-green-600' : idx === currentIdx ? 'text-blue-600' : 'text-gray-400'}`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${idx <= currentIdx ? 'bg-white' : 'bg-gray-50'}`}>
                                  {idx < currentIdx ? <CheckCircle className="w-4 h-4" /> : idx === currentIdx ? <Clock className="w-4 h-4" /> : <span className="text-xs">{idx+1}</span>}
                                </div>
                                <span className="text-xs font-medium">{s}</span>
                              </div>
                              {idx < steps.length - 1 && <div className={`flex-1 h-[2px] mx-2 ${idx < currentIdx ? 'bg-green-500' : 'bg-gray-200'}`} />}
                            </div>
                          ))}
                          {cancelled && (
                            <div className="ml-2 text-xs text-red-600 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" /> Cancelled
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {trackedOrder.tableNumber && (
                      <div className="p-2 rounded border bg-gray-50">
                        <div className="text-gray-500">Table</div>
                        <div className="font-medium">{trackedOrder.tableNumber}</div>
                      </div>
                    )}
                    {typeof trackedOrder.totalAmount === 'number' && (
                      <div className="p-2 rounded border bg-gray-50">
                        <div className="text-gray-500">Total</div>
                        <div className="font-medium">৳{trackedOrder.totalAmount.toFixed(2)}</div>
                      </div>
                    )}
                    {trackedOrder.estimatedPreparationTime != null && (
                      <div className="p-2 rounded border bg-gray-50">
                        <div className="text-gray-500">ETA</div>
                        <div className="font-medium">{trackedOrder.estimatedPreparationTime} min</div>
                      </div>
                    )}
                    {trackedOrder.createdAt && (
                      <div className="p-2 rounded border bg-gray-50">
                        <div className="text-gray-500">Placed</div>
                        <div className="font-medium">{new Date(trackedOrder.createdAt).toLocaleString()}</div>
                      </div>
                    )}
                    {trackedOrder.updatedAt && (
                      <div className="p-2 rounded border bg-gray-50">
                        <div className="text-gray-500">Updated</div>
                        <div className="font-medium">{new Date(trackedOrder.updatedAt).toLocaleString()}</div>
                      </div>
                    )}
                    {trackedOrder.completedAt && (
                      <div className="p-2 rounded border bg-gray-50">
                        <div className="text-gray-500">Completed</div>
                        <div className="font-medium">{new Date(trackedOrder.completedAt).toLocaleString()}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              </div>
              <div className="p-4 border-t flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setIsTrackOpen(false)}>Close</Button>
                {/* Secondary manual check removed; use header Refresh and auto polling */}
              </div>
            </div>
         </div>
       )}

      {restaurantId && (
        <FeedbackDialog
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
          restaurantId={restaurantId}
          restaurantName={menuData.restaurant.name}
          onSubmitted={loadFeedback}
        />
      )}

      {/* Footer Branding */}
      <footer className="bg-white border-t mt-8">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Powered by{' '}
              <span className="font-semibold text-blue-600">Menu.X</span>
              {' '}• Digital Menu Solution for Modern Restaurants
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Streamline your dining experience with QR-based menus
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Menu Item Card Component
const MenuItemCard: React.FC<{ 
  item: MenuItem; 
  features: RestaurantFeatures | null;
  onAdd?: (item: MenuItem) => void;
}> = ({ item, features, onAdd }) => {
  return (
    <Card className={`overflow-hidden ${!item.isAvailable ? 'opacity-60' : ''}`}>
      {item.imageUrl && (
        <div className="aspect-video bg-gray-200">
          <img 
            src={item.imageUrl.startsWith('/api/media/stream') || item.imageUrl.startsWith('http')
              ? item.imageUrl
              : mediaProxyUrl(item.imageUrl)} 
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{item.name}</CardTitle>
          <span className="text-lg font-bold text-green-600">
            ৳{item.price.toFixed(2)}
          </span>
        </div>
        {!item.isAvailable && (
          <div className="mt-1">
            <Badge variant="secondary">Unavailable</Badge>
          </div>
        )}
        {item.description && (
          <CardDescription>{item.description}</CardDescription>
        )}
      </CardHeader>
      {features?.canOrder && (
        <CardContent className="pt-0">
          <Button size="sm" className="w-full" disabled={!item.isAvailable} onClick={() => onAdd?.(item)}>
            <ShoppingCart className="w-4 h-4 mr-2" />
            {item.isAvailable ? 'Add to Order' : 'Unavailable'}
          </Button>
        </CardContent>
      )}
    </Card>
  );
};

// Attach handler to item cards where rendered
