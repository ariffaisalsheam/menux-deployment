import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorDisplay } from '../common/ErrorDisplay';
import { useApi } from '../../hooks/useApi';
import { adminAPI } from '../../services/api';
import { Settings, Plus, Edit, Trash2, Save, X, RefreshCw } from 'lucide-react';

interface PlatformSetting {
  id: number;
  key: string;
  value: string;
  description: string;
  valueType: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'DECIMAL' | 'JSON';
  isPublic: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export const PlatformSettings: React.FC = () => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<PlatformSetting>>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<Partial<PlatformSetting>>({
    valueType: 'STRING',
    isPublic: false
  });

  const {
    data: settings,
    loading,
    error,
    refetch
  } = useApi<PlatformSetting[]>(() => adminAPI.getPlatformSettings());

  const handleEdit = (setting: PlatformSetting) => {
    setEditingId(setting.id);
    setEditForm({
      value: setting.value,
      description: setting.description,
      isPublic: setting.isPublic
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    
    try {
      await adminAPI.updatePlatformSetting(editingId.toString(), editForm);
      setEditingId(null);
      setEditForm({});
      refetch();
    } catch (error) {
      console.error('Failed to update setting:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleCreate = async () => {
    try {
      await adminAPI.createPlatformSetting(createForm);
      setShowCreateForm(false);
      setCreateForm({ valueType: 'STRING', isPublic: false });
      refetch();
    } catch (error) {
      console.error('Failed to create setting:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this setting?')) return;
    
    try {
      await adminAPI.deletePlatformSetting(id.toString());
      refetch();
    } catch (error) {
      console.error('Failed to delete setting:', error);
    }
  };

  const handleInitializeDefaults = async () => {
    try {
      await adminAPI.initializePlatformSettings();
      refetch();
    } catch (error) {
      console.error('Failed to initialize default settings:', error);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error="Failed to load platform settings" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="w-8 h-8" />
            Platform Settings
          </h1>
          <p className="text-muted-foreground">
            Manage global platform configuration and settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleInitializeDefaults}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Initialize Defaults
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Setting
          </Button>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Setting</CardTitle>
            <CardDescription>Add a new platform configuration setting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-key">Key</Label>
                <Input
                  id="create-key"
                  value={createForm.key || ''}
                  onChange={(e) => setCreateForm({ ...createForm, key: e.target.value })}
                  placeholder="e.g., app.feature_enabled"
                />
              </div>
              <div>
                <Label htmlFor="create-value-type">Value Type</Label>
                <select
                  id="create-value-type"
                  className="w-full p-2 border rounded"
                  value={createForm.valueType}
                  onChange={(e) => setCreateForm({ ...createForm, valueType: e.target.value as any })}
                >
                  <option value="STRING">String</option>
                  <option value="INTEGER">Integer</option>
                  <option value="BOOLEAN">Boolean</option>
                  <option value="DECIMAL">Decimal</option>
                  <option value="JSON">JSON</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="create-value">Value</Label>
              <Input
                id="create-value"
                value={createForm.value || ''}
                onChange={(e) => setCreateForm({ ...createForm, value: e.target.value })}
                placeholder="Setting value"
              />
            </div>
            <div>
              <Label htmlFor="create-description">Description</Label>
              <Textarea
                id="create-description"
                value={createForm.description || ''}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Describe what this setting controls"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="create-public"
                checked={createForm.isPublic || false}
                onCheckedChange={(checked) => setCreateForm({ ...createForm, isPublic: checked })}
              />
              <Label htmlFor="create-public">Public (accessible via public API)</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate}>
                <Save className="w-4 h-4 mr-2" />
                Create Setting
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings List */}
      <div className="grid gap-4">
        {settings?.map((setting) => (
          <Card key={setting.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{setting.key}</h3>
                    <Badge variant={setting.isSystem ? 'default' : 'secondary'}>
                      {setting.isSystem ? 'System' : 'Custom'}
                    </Badge>
                    <Badge variant={setting.isPublic ? 'outline' : 'secondary'}>
                      {setting.isPublic ? 'Public' : 'Private'}
                    </Badge>
                    <Badge variant="outline">{setting.valueType}</Badge>
                  </div>
                  
                  {editingId === setting.id ? (
                    <div className="space-y-3">
                      <div>
                        <Label>Value</Label>
                        <Input
                          value={editForm.value || ''}
                          onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={editForm.description || ''}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={editForm.isPublic || false}
                          onCheckedChange={(checked) => setEditForm({ ...editForm, isPublic: checked })}
                        />
                        <Label>Public</Label>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveEdit}>
                          <Save className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{setting.description}</p>
                      <p className="font-mono text-sm bg-gray-100 p-2 rounded">{setting.value}</p>
                    </div>
                  )}
                </div>
                
                {editingId !== setting.id && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(setting)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    {!setting.isSystem && (
                      <Button size="sm" variant="outline" onClick={() => handleDelete(setting.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
