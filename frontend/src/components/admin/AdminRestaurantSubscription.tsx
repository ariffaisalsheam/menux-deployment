import React from 'react';
import { useParams } from 'react-router-dom';
import { SubscriptionDetailView } from './SubscriptionDetailView';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Crown, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import { restaurantAPI } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { LoadingSkeleton } from '../common/LoadingSpinner';
import { ErrorDisplay } from '../common/ErrorDisplay';

interface AdminRestaurant {
  id: number;
  name: string;
  ownerName?: string;
  subscriptionPlan?: 'BASIC' | 'PRO';
  address?: string;
  phone?: string;
  email?: string;
}

export const AdminRestaurantSubscription: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const restaurantId = Number(id);

  const { data: restaurant, loading, error, refetch } = useApi<AdminRestaurant>(() => 
    restaurantAPI.getRestaurantById(restaurantId)
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <LoadingSkeleton lines={1} className="w-8 h-8" />
          <LoadingSkeleton lines={2} className="w-64" />
        </div>
        <LoadingSkeleton lines={8} />
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={refetch} />;
  }

  if (!restaurant) {
    return <ErrorDisplay error="Restaurant not found" onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/admin/restaurants')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Restaurants
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <Crown className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{restaurant.name} - Subscription</h1>
            <p className="text-muted-foreground">
              Manage subscription for {restaurant.name}
            </p>
          </div>
        </div>
      </div>

      {/* Restaurant Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Restaurant Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Restaurant Name</p>
              <p className="text-base">{restaurant.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Owner</p>
              <p className="text-base">{restaurant.ownerName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Current Plan</p>
              <p className="text-base">{restaurant.subscriptionPlan || 'BASIC'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Restaurant ID</p>
              <p className="text-base">{restaurant.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Detail View */}
      <SubscriptionDetailView restaurantId={restaurantId} />
    </div>
  );
};

export default AdminRestaurantSubscription;
