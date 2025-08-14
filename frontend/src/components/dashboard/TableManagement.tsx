import React, { useState } from 'react';
import { Plus, Edit, Trash2, QrCode, Users, MapPin, Download, Grid, Copy, ExternalLink, Link } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { useApi } from '../../hooks/useApi';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorDisplay } from '../common/ErrorDisplay';
import { tableAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface Table {
  id: number;
  tableNumber: string;
  tableName?: string;
  capacity?: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING' | 'OUT_OF_ORDER';
  locationDescription?: string;
  qrCodeUrl?: string;
  qrCodeGeneratedAt?: string;
  isActive: boolean;
}

interface TableStatistics {
  totalTables: number;
  availableTables: number;
  occupiedTables: number;
  reservedTables: number;
  cleaningTables: number;
  occupancyRate: number;
}

export const TableManagement: React.FC = () => {
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBulkCreateDialogOpen, setIsBulkCreateDialogOpen] = useState(false);
  const [isTableLinkDialogOpen, setIsTableLinkDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [tableLink, setTableLink] = useState('');
  const [formData, setFormData] = useState({
    tableNumber: '',
    tableName: '',
    capacity: '',
    locationDescription: ''
  });
  const [bulkFormData, setBulkFormData] = useState({
    startNumber: '1',
    endNumber: '10',
    prefix: '',
    defaultCapacity: '4',
    defaultLocation: ''
  });

  // Fetch tables and statistics
  const {
    data: tables,
    loading: tablesLoading,
    error: tablesError,
    refetch: refetchTables
  } = useApi<Table[]>(() => tableAPI.getAllTables());

  const {
    data: statistics,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useApi<TableStatistics>(() => tableAPI.getTableStatistics());

  const resetForm = () => {
    setFormData({
      tableNumber: '',
      tableName: '',
      capacity: '',
      locationDescription: ''
    });
  };

  const handleCreateTable = async () => {
    try {
      await tableAPI.createTable({
        tableNumber: formData.tableNumber,
        tableName: formData.tableName || undefined,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        locationDescription: formData.locationDescription || undefined
      });
      
      setIsCreateDialogOpen(false);
      resetForm();
      refetchTables();
      refetchStats();
    } catch (error) {
      console.error('Failed to create table:', error);
    }
  };

  const handleEditTable = async () => {
    if (!selectedTable) return;

    try {
      await tableAPI.updateTable(selectedTable.id, {
        tableNumber: formData.tableNumber,
        tableName: formData.tableName || undefined,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        locationDescription: formData.locationDescription || undefined
      });
      
      setIsEditDialogOpen(false);
      setSelectedTable(null);
      resetForm();
      refetchTables();
    } catch (error) {
      console.error('Failed to update table:', error);
    }
  };

  const handleDeleteTable = async (tableId: number) => {
    if (!confirm('Are you sure you want to delete this table?')) return;

    try {
      await tableAPI.deleteTable(tableId);
      refetchTables();
      refetchStats();
    } catch (error) {
      console.error('Failed to delete table:', error);
    }
  };

  const handleStatusChange = async (tableId: number, status: string) => {
    try {
      await tableAPI.updateTableStatus(tableId, status);
      refetchTables();
      refetchStats();
    } catch (error) {
      console.error('Failed to update table status:', error);
    }
  };

  const handleBulkCreate = async () => {
    try {
      const start = parseInt(bulkFormData.startNumber);
      const end = parseInt(bulkFormData.endNumber);
      const tableNumbers = [];
      
      for (let i = start; i <= end; i++) {
        tableNumbers.push(bulkFormData.prefix + i);
      }

      await tableAPI.createBulkTables({
        tableNumbers,
        defaultCapacity: bulkFormData.defaultCapacity ? parseInt(bulkFormData.defaultCapacity) : undefined,
        defaultLocation: bulkFormData.defaultLocation || undefined
      });

      setIsBulkCreateDialogOpen(false);
      setBulkFormData({
        startNumber: '1',
        endNumber: '10',
        prefix: '',
        defaultCapacity: '4',
        defaultLocation: ''
      });
      refetchTables();
      refetchStats();
    } catch (error) {
      console.error('Failed to create bulk tables:', error);
    }
  };

  const openEditDialog = (table: Table) => {
    setSelectedTable(table);
    setFormData({
      tableNumber: table.tableNumber,
      tableName: table.tableName || '',
      capacity: table.capacity?.toString() || '',
      locationDescription: table.locationDescription || ''
    });
    setIsEditDialogOpen(true);
  };

  const downloadTableQR = async (table: Table) => {
    try {
      // Use saved QR customization settings by not passing size/branded parameters
      const blob = await tableAPI.generateTableQRCode(table.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `table-${table.tableNumber}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download QR code:', error);
    }
  };

  const getTableLink = (table: Table) => {
    const baseUrl = window.location.origin;
    const restaurantId = user?.restaurantId;
    if (!restaurantId) {
      console.error('Restaurant ID not found');
      return;
    }
    const menuUrl = `${baseUrl}/menu/${restaurantId}?table=${table.tableNumber}`;
    setTableLink(menuUrl);
    setSelectedTable(table);
    setIsTableLinkDialogOpen(true);
  };

  const copyTableLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      // You could add a toast notification here
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const openTableMenuInNewTab = () => {
    if (tableLink) {
      window.open(tableLink, '_blank');
    }
  };

  const downloadQRSheet = async () => {
    if (!tables || tables.length === 0) return;

    try {
      const tableNumbers = tables.map(table => table.tableNumber);
      const blob = await tableAPI.generateQRCodeSheet({
        tableNumbers,
        qrSize: 200,
        tablesPerRow: 3
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'table-qr-codes-sheet.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download QR sheet:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-500';
      case 'OCCUPIED': return 'bg-red-500';
      case 'RESERVED': return 'bg-yellow-500';
      case 'CLEANING': return 'bg-blue-500';
      case 'OUT_OF_ORDER': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (tablesLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Grid className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold tracking-tight">Table Management</h1>
        </div>
        <LoadingSpinner text="Loading tables..." />
      </div>
    );
  }

  if (tablesError || statsError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Grid className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold tracking-tight">Table Management</h1>
        </div>
        <ErrorDisplay error={tablesError || statsError || 'An error occurred'} onRetry={() => {
          refetchTables();
          refetchStats();
        }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Grid className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Table Management</h1>
            <p className="text-muted-foreground">
              Manage your restaurant tables and generate QR codes
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsBulkCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Bulk Create
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Table
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
              <Grid className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalTables}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.availableTables}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Occupied</CardTitle>
              <div className="h-3 w-3 rounded-full bg-red-500"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.occupiedTables}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
              <div className="h-3 w-3 rounded-full bg-blue-500"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.occupancyRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* QR Code Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            QR Code Actions
          </CardTitle>
          <CardDescription>
            Generate and download QR codes for your tables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={downloadQRSheet} disabled={!tables || tables.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Download All QR Codes (Sheet)
          </Button>
        </CardContent>
      </Card>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables && Array.isArray(tables) && tables.length > 0 ? tables.map((table) => (
          <Card key={table.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {table.tableName || `Table ${table.tableNumber}`}
                </CardTitle>
                <Badge className={`${getStatusColor(table.status)} text-white`}>
                  {table.status.replace('_', ' ')}
                </Badge>
              </div>
              <CardDescription>#{table.tableNumber}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {table.capacity && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4" />
                  <span>{table.capacity} seats</span>
                </div>
              )}
              {table.locationDescription && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>{table.locationDescription}</span>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={table.status}
                  onValueChange={(value) => handleStatusChange(table.id, value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">Available</SelectItem>
                    <SelectItem value="OCCUPIED">Occupied</SelectItem>
                    <SelectItem value="RESERVED">Reserved</SelectItem>
                    <SelectItem value="CLEANING">Cleaning</SelectItem>
                    <SelectItem value="OUT_OF_ORDER">Out of Order</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadTableQR(table)}
                    className="flex-1"
                  >
                    <QrCode className="w-4 h-4 mr-1" />
                    QR
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => getTableLink(table)}
                    className="flex-1"
                  >
                    <Link className="w-4 h-4 mr-1" />
                    Link
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(table)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTable(table.id)}
                    className="flex-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )) : (
          <div className="col-span-full">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  <Grid className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="font-medium text-gray-900 mb-2">No tables found</h3>
                  <p className="text-sm">Get started by creating your first table.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Create Table Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Table</DialogTitle>
            <DialogDescription>
              Create a new table for your restaurant
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tableNumber" className="text-right">
                Table Number *
              </Label>
              <Input
                id="tableNumber"
                value={formData.tableNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, tableNumber: e.target.value }))}
                className="col-span-3"
                placeholder="e.g., 1, A1, VIP-1"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tableName" className="text-right">
                Display Name
              </Label>
              <Input
                id="tableName"
                value={formData.tableName}
                onChange={(e) => setFormData(prev => ({ ...prev, tableName: e.target.value }))}
                className="col-span-3"
                placeholder="e.g., Corner Table, Window Seat"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="capacity" className="text-right">
                Capacity
              </Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                className="col-span-3"
                placeholder="Number of seats"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Location
              </Label>
              <Input
                id="location"
                value={formData.locationDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, locationDescription: e.target.value }))}
                className="col-span-3"
                placeholder="e.g., Near window, Patio, Main hall"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTable} disabled={!formData.tableNumber}>
              Create Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Table Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Table</DialogTitle>
            <DialogDescription>
              Update table information
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editTableNumber" className="text-right">
                Table Number *
              </Label>
              <Input
                id="editTableNumber"
                value={formData.tableNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, tableNumber: e.target.value }))}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editTableName" className="text-right">
                Display Name
              </Label>
              <Input
                id="editTableName"
                value={formData.tableName}
                onChange={(e) => setFormData(prev => ({ ...prev, tableName: e.target.value }))}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editCapacity" className="text-right">
                Capacity
              </Label>
              <Input
                id="editCapacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editLocation" className="text-right">
                Location
              </Label>
              <Input
                id="editLocation"
                value={formData.locationDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, locationDescription: e.target.value }))}
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditTable} disabled={!formData.tableNumber}>
              Update Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Create Dialog */}
      <Dialog open={isBulkCreateDialogOpen} onOpenChange={setIsBulkCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Create Tables</DialogTitle>
            <DialogDescription>
              Create multiple tables at once with sequential numbering
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="prefix" className="text-right">
                Prefix
              </Label>
              <Input
                id="prefix"
                value={bulkFormData.prefix}
                onChange={(e) => setBulkFormData(prev => ({ ...prev, prefix: e.target.value }))}
                className="col-span-3"
                placeholder="e.g., T, A, VIP-"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startNumber" className="text-right">
                Start Number *
              </Label>
              <Input
                id="startNumber"
                type="number"
                value={bulkFormData.startNumber}
                onChange={(e) => setBulkFormData(prev => ({ ...prev, startNumber: e.target.value }))}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endNumber" className="text-right">
                End Number *
              </Label>
              <Input
                id="endNumber"
                type="number"
                value={bulkFormData.endNumber}
                onChange={(e) => setBulkFormData(prev => ({ ...prev, endNumber: e.target.value }))}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="defaultCapacity" className="text-right">
                Default Capacity
              </Label>
              <Input
                id="defaultCapacity"
                type="number"
                value={bulkFormData.defaultCapacity}
                onChange={(e) => setBulkFormData(prev => ({ ...prev, defaultCapacity: e.target.value }))}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="defaultLocation" className="text-right">
                Default Location
              </Label>
              <Input
                id="defaultLocation"
                value={bulkFormData.defaultLocation}
                onChange={(e) => setBulkFormData(prev => ({ ...prev, defaultLocation: e.target.value }))}
                className="col-span-3"
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              This will create tables: {bulkFormData.prefix}{bulkFormData.startNumber} to {bulkFormData.prefix}{bulkFormData.endNumber}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkCreate} 
              disabled={!bulkFormData.startNumber || !bulkFormData.endNumber}
            >
              Create Tables
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table Link Dialog */}
      <Dialog open={isTableLinkDialogOpen} onOpenChange={setIsTableLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link className="w-5 h-5" />
              Table {selectedTable?.tableNumber} Menu Link
            </DialogTitle>
            <DialogDescription>
              Share this link with customers or use it to generate QR codes for Table {selectedTable?.tableNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                value={tableLink}
                readOnly
                className="flex-1"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyTableLink(tableLink)}
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={openTableMenuInNewTab}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              <p><strong>Table-specific features:</strong></p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Customers scanning this QR will be automatically identified as sitting at Table {selectedTable?.tableNumber}</li>
                <li>Orders placed through this link will include the table number</li>
                <li>Use this link to generate table-specific QR codes</li>
                <li>Print and place the QR code on Table {selectedTable?.tableNumber}</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTableLinkDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
