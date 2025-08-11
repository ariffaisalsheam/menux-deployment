import React, { useState } from 'react';
import { Save, Edit, MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { restaurantAPI } from '../../services/api';
import { useApi, useApiMutation } from '../../hooks/useApi';
import { LoadingSpinner, LoadingSkeleton } from '../common/LoadingSpinner';
import { ErrorDisplay } from '../common/ErrorDisplay';

interface RestaurantData {
  id: number;
  name: string;
  description: string;
  address: string;
  phoneNumber: string;
  email: string;
  openingHours: string;
  cuisine: string;
  subscriptionPlan: 'BASIC' | 'PRO';
}

export const RestaurantProfile: React.FC = () => {
  useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phoneNumber: '',
    email: '',
    description: '',
    openingHours: '',
    cuisine: ''
  });

  // Fetch restaurant data
  const {
    data: restaurant,
    loading,
    error,
    refetch
  } = useApi<RestaurantData>(
    () => restaurantAPI.getCurrentRestaurant(),
    {
      onSuccess: (data) => {
        if (data) {
          setFormData({
            name: data.name || '',
            address: data.address || '',
            phoneNumber: data.phoneNumber || '',
            email: data.email || '',
            description: data.description || '',
            openingHours: data.openingHours || '',
            cuisine: data.cuisine || ''
          });
        }
      }
    }
  );

  // Update restaurant mutation
  const updateMutation = useApiMutation(
    (data: Partial<RestaurantData>) => restaurantAPI.updateCurrentRestaurant(data),
    {
      onSuccess: () => {
        setIsEditing(false);
        refetch();
      }
    }
  );

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutate(formData);
    } catch (error) {
      console.error('Failed to save restaurant profile:', error);
    }
  };

  const handleCancel = () => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || '',
        address: restaurant.address || '',
        phoneNumber: restaurant.phoneNumber || '',
        email: restaurant.email || '',
        description: restaurant.description || '',
        openingHours: restaurant.openingHours || '',
        cuisine: restaurant.cuisine || ''
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <LoadingSkeleton lines={2} className="w-64" />
          </div>
          <LoadingSkeleton lines={1} className="w-32" />
        </div>
        <LoadingSkeleton lines={8} />
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={refetch} />;
  }

  if (!restaurant) {
    return <ErrorDisplay error="Restaurant data not found" onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Restaurant Profile</h1>
          <p className="text-muted-foreground">
            Manage your restaurant information and settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={restaurant.subscriptionPlan === 'PRO' ? 'default' : 'secondary'}>
            {restaurant.subscriptionPlan} Plan
          </Badge>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={updateMutation.loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateMutation.loading}
              >
                {updateMutation.loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Restaurant Information */}
      <Card>
        <CardHeader>
          <CardTitle>Restaurant Information</CardTitle>
          <CardDescription>
            Basic information about your restaurant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Restaurant Name</label>
              {isEditing ? (
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter restaurant name"
                />
              ) : (
                <p className="text-sm text-muted-foreground mt-1">{formData.name}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Cuisine Type</label>
              {isEditing ? (
                <Input
                  value={formData.cuisine}
                  onChange={(e) => handleInputChange('cuisine', e.target.value)}
                  placeholder="e.g., Bangladeshi, Indian, Continental"
                />
              ) : (
                <p className="text-sm text-muted-foreground mt-1">{formData.cuisine}</p>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            {isEditing ? (
              <textarea
                className="w-full mt-1 p-2 border rounded-md resize-none"
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your restaurant"
              />
            ) : (
              <p className="text-sm text-muted-foreground mt-1">{formData.description}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Contact Information
          </CardTitle>
          <CardDescription>
            How customers can reach your restaurant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Address
              </label>
              {isEditing ? (
                <Input
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter restaurant address"
                />
              ) : (
                <p className="text-sm text-muted-foreground mt-1">{formData.address}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </label>
              {isEditing ? (
                <Input
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="Enter phone number"
                />
              ) : (
                <p className="text-sm text-muted-foreground mt-1">{formData.phoneNumber}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </label>
              {isEditing ? (
                <Input
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                />
              ) : (
                <p className="text-sm text-muted-foreground mt-1">{formData.email}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Opening Hours
              </label>
              {isEditing ? (
                <Input
                  value={formData.openingHours}
                  onChange={(e) => handleInputChange('openingHours', e.target.value)}
                  placeholder="e.g., 10:00 AM - 11:00 PM"
                />
              ) : (
                <p className="text-sm text-muted-foreground mt-1">{formData.openingHours}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Section */}
      <Card>
        <CardHeader>
          <CardTitle>QR Code</CardTitle>
          <CardDescription>
            Customers can scan this QR code to view your menu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-xs text-gray-500">QR Code</span>
              </div>
              <div>
                <p className="font-medium">Menu QR Code</p>
                <p className="text-sm text-muted-foreground">
                  Print this QR code and place it on tables for customers to scan
                </p>
              </div>
            </div>
            <Button variant="outline">
              Download QR Code
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
