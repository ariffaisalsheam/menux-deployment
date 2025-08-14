import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Search, Filter, Crown, ArrowUp, ArrowDown, LayoutGrid, Table as TableIcon, CheckSquare, Square } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useAuth } from '../../contexts/AuthContext';
import { menuAPI, aiAPI } from '../../services/api';
import { useApi, useApiMutation } from '../../hooks/useApi';
import { LoadingSkeleton } from '../common/LoadingSpinner';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorDisplay } from '../common/ErrorDisplay';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  isAvailable: boolean;
  imageUrl?: string;
}

interface MenuItemFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  isAvailable: boolean;
  imageUrl?: string;
}

export const MenuManagement: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [items, setItems] = useState<MenuItem[]>([]);
  const [orderDirty, setOrderDirty] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const [formData, setFormData] = useState<MenuItemFormData>({
    name: '',
    description: '',
    price: '',
    category: 'MAIN_COURSE',
    isAvailable: true,
    imageUrl: ''
  });

  const categories = ['All', 'APPETIZER', 'MAIN_COURSE', 'DESSERT', 'BEVERAGE'];
  const isPro = user?.subscriptionPlan === 'PRO';

  // Fetch menu items
  const {
    data: menuItems = [],
    loading,
    error,
    refetch
  } = useApi<MenuItem[]>(() => menuAPI.getMenuItems());

  // keep local list for reordering
  useEffect(() => {
    if (Array.isArray(menuItems)) {
      setItems(menuItems);
      setOrderDirty(false);
      setSelectedIds([]);
    }
  }, [menuItems]);

  // Create menu item mutation
  const createMutation = useApiMutation(
    (data: Omit<MenuItem, 'id'>) => menuAPI.createMenuItem(data),
    {
      onSuccess: () => {
        refetch();
        setIsDialogOpen(false);
        resetForm();
      }
    }
  );

  // Update menu item mutation
  const updateMutation = useApiMutation(
    ({ id, data }: { id: number; data: Partial<MenuItem> }) =>
      menuAPI.updateMenuItem(id, data),
    {
      onSuccess: () => {
        refetch();
        setIsDialogOpen(false);
        resetForm();
        setEditingItem(null);
      }
    }
  );

  // Delete menu item mutation
  const deleteMutation = useApiMutation(
    (id: number) => menuAPI.deleteMenuItem(id),
    {
      onSuccess: () => refetch()
    }
  );

  // Form handling functions
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'MAIN_COURSE',
      isAvailable: true,
      imageUrl: ''
    });
  };

  const handleAddItem = () => {
    resetForm();
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      isAvailable: item.isAvailable,
      imageUrl: item.imageUrl || ''
    });
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    const menuItemData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      category: formData.category,
      isAvailable: formData.isAvailable,
      imageUrl: formData.imageUrl
    };

    if (editingItem) {
      await updateMutation.mutate({ id: editingItem.id, data: menuItemData });
    } else {
      await createMutation.mutate(menuItemData);
    }
  };

  const handleToggleAvailability = async (id: number) => {
    const item = (menuItems ?? []).find(item => item.id === id);
    if (item) {
      await updateMutation.mutate({
        id,
        data: { isAvailable: !item.isAvailable }
      });
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      await deleteMutation.mutate(id);
    }
  };

  // Reorder helpers
  const moveItem = (id: number, direction: 'up' | 'down') => {
    setItems((prev) => {
      const idx = prev.findIndex(i => i.id === id);
      if (idx === -1) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      const [removed] = copy.splice(idx, 1);
      copy.splice(newIdx, 0, removed);
      setOrderDirty(true);
      return copy;
    });
  };

  const saveOrder = async () => {
    const payload = items.map((it, index) => ({ id: it.id, displayOrder: index + 1 }));
    try {
      await menuAPI.reorderMenuItems(payload);
      setOrderDirty(false);
      await refetch();
    } catch (e) {
      // noop - ErrorDisplay covers
    }
  };

  // Table selection
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };
  const toggleSelectAll = (current: MenuItem[]) => {
    const allIds = current.map(i => i.id);
    const allSelected = allIds.every(id => selectedIds.includes(id));
    setSelectedIds(allSelected ? [] : allIds);
  };
  const bulkSetAvailability = async (available: boolean, ids: number[]) => {
    for (const id of ids) {
      await updateMutation.mutate({ id, data: { isAvailable: available } });
    }
    setSelectedIds([]);
  };

  // AI generate description (Pro only)
  const handleGenerateAI = async () => {
    if (!user || user.subscriptionPlan !== 'PRO') return;
    if (!formData.name.trim()) return;
    setAiError('');
    setAiLoading(true);
    try {
      const resp = await aiAPI.generateDescription(formData.name.trim());
      const desc = resp.description || resp.result || resp.text || resp.content;
      setFormData(prev => ({ ...prev, description: (desc && String(desc).trim()) || prev.description }));
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to generate description';
      setAiError(msg);
    } finally {
      setAiLoading(false);
    }
  };



  const safeMenuItems = Array.isArray(items) ? items : [];
  const filteredItems = safeMenuItems.filter(item => {
    const matchesSearch = item?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item?.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item?.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <LoadingSkeleton lines={2} className="w-64" />
          <LoadingSkeleton lines={1} className="w-32" />
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
          <h1 className="text-3xl font-bold tracking-tight">Menu Management</h1>
          <p className="text-muted-foreground">
            Manage your restaurant's menu items and categories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isPro ? 'default' : 'secondary'}>
            {user?.subscriptionPlan || 'Basic'} Plan
          </Badge>
          <div className="flex items-center gap-1 mr-2">
            <Button variant={view === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setView('grid')}>
              <LayoutGrid className="w-4 h-4 mr-1" /> Grid
            </Button>
            <Button variant={view === 'table' ? 'default' : 'outline'} size="sm" onClick={() => setView('table')}>
              <TableIcon className="w-4 h-4 mr-1" /> Table
            </Button>
            <Button variant="secondary" size="sm" disabled={!orderDirty} onClick={saveOrder} className="ml-2">
              Save Order
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleAddItem}>
              <Plus className="w-4 h-4 mr-2" />
              Add Menu Item
            </Button>
          </div>
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

      {/* Items - Grid or Table */}
      {view === 'grid' ? (
        <div className="grid gap-4">
          {filteredItems.map((item, idx) => (
            <Card key={item.id} className={!item.isAvailable ? 'opacity-60' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <Badge variant={item.isAvailable ? 'default' : 'secondary'}>
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                      </Badge>
                      <Badge variant="outline">{item.category}</Badge>
                    </div>
                    <p className="text-muted-foreground mb-2">{item.description}</p>
                    <p className="text-2xl font-bold text-green-600">৳{item.price}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <div className="flex flex-col gap-1 mr-2">
                      <Button variant="ghost" size="icon" onClick={() => moveItem(item.id, 'up')} disabled={idx === 0}>
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => moveItem(item.id, 'down')} disabled={idx === filteredItems.length - 1}>
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleAvailability(item.id)}
                    >
                      {item.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditItem(item)}
                    >
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
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 text-sm underline" onClick={() => toggleSelectAll(filteredItems)}>
                  {(filteredItems.length > 0 && filteredItems.every(i => selectedIds.includes(i.id))) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  Select All
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" disabled={selectedIds.length === 0} onClick={() => bulkSetAvailability(true, selectedIds)}>Set Available</Button>
                <Button size="sm" variant="outline" disabled={selectedIds.length === 0} onClick={() => bulkSetAvailability(false, selectedIds)}>Set Unavailable</Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="w-10"></th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, idx) => (
                    <tr key={item.id} className="border-t">
                      <td>
                        <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} />
                      </td>
                      <td className="py-2">{item.name}</td>
                      <td>{item.category}</td>
                      <td>৳{item.price}</td>
                      <td>
                        <Badge variant={item.isAvailable ? 'default' : 'secondary'}>
                          {item.isAvailable ? 'Available' : 'Unavailable'}
                        </Badge>
                      </td>
                      <td className="py-2">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => moveItem(item.id, 'up')} disabled={idx === 0}>
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => moveItem(item.id, 'down')} disabled={idx === filteredItems.length - 1}>
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleToggleAvailability(item.id)}>
                            {item.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEditItem(item)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteItem(item.id)} className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">No menu items found matching your criteria.</p>
              <Button className="mt-4" onClick={handleAddItem}>
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
              <p className="text-2xl font-bold">{(menuItems ?? []).length}</p>
              <p className="text-sm text-muted-foreground">Total Items</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {safeMenuItems.filter(item => item.isAvailable).length}
              </p>
              <p className="text-sm text-muted-foreground">Available</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {safeMenuItems.filter(item => !item.isAvailable).length}
              </p>
              <p className="text-sm text-muted-foreground">Unavailable</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {new Set(safeMenuItems.map(item => item.category)).size}
              </p>
              <p className="text-sm text-muted-foreground">Categories</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Menu Item Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update the menu item details below.' : 'Fill in the details for your new menu item.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
                placeholder="Menu item name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData(prev => ({ ...prev, description: e.target.value }))
                }
                className="col-span-3"
                placeholder="Describe your menu item"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4 -mt-2">
              <div className="col-start-2 col-span-3">
                {isPro ? (
                  <Button size="sm" variant="secondary" onClick={handleGenerateAI} disabled={aiLoading || !formData.name.trim()}>
                    {aiLoading ? 'Generating…' : 'Generate with AI'}
                  </Button>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button size="sm" variant="secondary" disabled>
                          Generate with AI (Pro)
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Upgrade to Pro to generate AI descriptions</TooltipContent>
                  </Tooltip>
                )}
                {aiError && <p className="text-xs text-red-600 mt-1">{aiError}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price (৳)
              </Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                className="col-span-3"
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APPETIZER">Appetizer</SelectItem>
                  <SelectItem value="MAIN_COURSE">Main Course</SelectItem>
                  <SelectItem value="DESSERT">Dessert</SelectItem>
                  <SelectItem value="BEVERAGE">Beverages</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="imageUrl" className="text-right">
                Image URL
              </Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                className="col-span-3"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.loading || updateMutation.loading}
            >
              {createMutation.loading || updateMutation.loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                editingItem ? 'Update Item' : 'Add Item'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  );
};
