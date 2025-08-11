import React, { useState } from 'react';
import { Save, Edit, MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { useAuth } from '../../contexts/AuthContext';

export const RestaurantProfile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.restaurantName || '',
    address: '123 Main Street, Dhaka, Bangladesh',
    phone: '+880 1234-567890',
    email: 'restaurant@example.com',
    description: 'A delightful restaurant serving authentic Bangladeshi cuisine with modern twists.',
    openingHours: '10:00 AM - 11:00 PM',
    cuisine: 'Bangladeshi, Indian, Continental'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // TODO: Implement API call to save restaurant profile
    console.log('Saving restaurant profile:', formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset form data
    setFormData({
      name: user?.restaurantName || '',
      address: '123 Main Street, Dhaka, Bangladesh',
      phone: '+880 1234-567890',
      email: 'restaurant@example.com',
      description: 'A delightful restaurant serving authentic Bangladeshi cuisine with modern twists.',
      openingHours: '10:00 AM - 11:00 PM',
      cuisine: 'Bangladeshi, Indian, Continental'
    });
    setIsEditing(false);
  };

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
          <Badge variant={user?.subscriptionPlan === 'PRO' ? 'default' : 'secondary'}>
            {user?.subscriptionPlan || 'Basic'} Plan
          </Badge>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
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
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                />
              ) : (
                <p className="text-sm text-muted-foreground mt-1">{formData.phone}</p>
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
