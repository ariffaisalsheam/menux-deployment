import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Filter, Crown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { useAuth } from '../../contexts/AuthContext';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  image?: string;
}

const mockMenuItems: MenuItem[] = [
  {
    id: 1,
    name: 'Chicken Biryani',
    description: 'Aromatic basmati rice cooked with tender chicken and traditional spices',
    price: 350,
    category: 'Main Course',
    available: true
  },
  {
    id: 2,
    name: 'Beef Bhuna',
    description: 'Slow-cooked beef curry with rich spices and onions',
    price: 450,
    category: 'Main Course',
    available: true
  },
  {
    id: 3,
    name: 'Fish Curry',
    description: 'Traditional Bengali fish curry with mustard oil and spices',
    price: 280,
    category: 'Main Course',
    available: false
  },
  {
    id: 4,
    name: 'Vegetable Samosa',
    description: 'Crispy pastry filled with spiced vegetables',
    price: 80,
    category: 'Appetizer',
    available: true
  }
];

export const MenuManagement: React.FC = () => {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>(mockMenuItems);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [, setIsAddingItem] = useState(false);

  const categories = ['All', 'Appetizer', 'Main Course', 'Dessert', 'Beverages'];
  const isPro = user?.subscriptionPlan === 'PRO';

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleToggleAvailability = (id: number) => {
    setMenuItems(items =>
      items.map(item =>
        item.id === id ? { ...item, available: !item.available } : item
      )
    );
  };

  const handleDeleteItem = (id: number) => {
    setMenuItems(items => items.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Menu Management</h1>
          <p className="text-muted-foreground">
            Manage your restaurant's menu items and categories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isPro ? 'default' : 'secondary'}>
            {user?.subscriptionPlan || 'Basic'} Plan
          </Badge>
          <Button onClick={() => setIsAddingItem(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Menu Item
          </Button>
        </div>
      </div>

      {/* AI Menu Writer Promotion for Basic Users */}
      {!isPro && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Upgrade to Pro for AI Menu Writer
            </CardTitle>
            <CardDescription>
              Let AI generate compelling descriptions for your menu items automatically
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Save time and create mouth-watering descriptions that increase orders
                </p>
              </div>
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-white">
                Upgrade to Pro
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu Items Grid */}
      <div className="grid gap-4">
        {filteredItems.map((item) => (
          <Card key={item.id} className={!item.available ? 'opacity-60' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <Badge variant={item.available ? 'default' : 'secondary'}>
                      {item.available ? 'Available' : 'Unavailable'}
                    </Badge>
                    <Badge variant="outline">{item.category}</Badge>
                  </div>
                  <p className="text-muted-foreground mb-2">{item.description}</p>
                  <p className="text-2xl font-bold text-green-600">৳{item.price}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleAvailability(item.id)}
                  >
                    {item.available ? 'Mark Unavailable' : 'Mark Available'}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">No menu items found matching your criteria.</p>
              <Button className="mt-4" onClick={() => setIsAddingItem(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Menu Item
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{menuItems.length}</p>
              <p className="text-sm text-muted-foreground">Total Items</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {menuItems.filter(item => item.available).length}
              </p>
              <p className="text-sm text-muted-foreground">Available</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {menuItems.filter(item => !item.available).length}
              </p>
              <p className="text-sm text-muted-foreground">Unavailable</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {new Set(menuItems.map(item => item.category)).size}
              </p>
              <p className="text-sm text-muted-foreground">Categories</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
