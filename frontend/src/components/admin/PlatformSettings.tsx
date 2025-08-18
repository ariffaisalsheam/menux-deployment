import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorDisplay } from '../common/ErrorDisplay';
import { useApi } from '../../hooks/useApi';
import { platformConfigAPI } from '../../services/api';
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
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PlatformSetting>>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<Partial<PlatformSetting>>({
    valueType: 'STRING',
    isPublic: false
  });

  // Delete confirmation modal state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteKey, setDeleteKey] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  // UX state: filters, sort, and status
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'STRING' | 'INTEGER' | 'BOOLEAN' | 'DECIMAL' | 'JSON'>('ALL');
  const [filterVisibility, setFilterVisibility] = useState<'ALL' | 'PUBLIC' | 'PRIVATE'>('ALL');
  const [showSystem, setShowSystem] = useState(true);
  const [sortBy, setSortBy] = useState<'key' | 'updatedAt'>('key');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [status, setStatus] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  const {
    data: settings,
    loading,
    error,
    refetch
  } = useApi<PlatformSetting[]>(() => platformConfigAPI.getPlatformSettings());

  // Default Trial Days convenience state (SUB_TRIAL_DAYS_DEFAULT)
  const defaultTrialSetting = useMemo(() => (settings || []).find(s => s.key === 'SUB_TRIAL_DAYS_DEFAULT'), [settings]);
  const [defaultTrialDays, setDefaultTrialDays] = useState<string>('');
  const [savingDefaultTrial, setSavingDefaultTrial] = useState(false);
  useEffect(() => {
    if (defaultTrialSetting) {
      setDefaultTrialDays(String(defaultTrialSetting.value ?? ''));
    }
  }, [defaultTrialSetting]);

  const saveDefaultTrialDays = async () => {
    const n = Number(defaultTrialDays);
    if (!Number.isInteger(n) || n <= 0) {
      setStatus({ kind: 'error', message: 'Enter a valid positive integer for default trial days' });
      return;
    }
    setSavingDefaultTrial(true);
    try {
      if (defaultTrialSetting) {
        await platformConfigAPI.updatePlatformSetting('SUB_TRIAL_DAYS_DEFAULT', { value: String(n) });
      } else {
        await platformConfigAPI.createPlatformSetting({
          key: 'SUB_TRIAL_DAYS_DEFAULT',
          value: String(n),
          description: 'Global default number of trial days for new trials',
          valueType: 'INTEGER',
          isPublic: false,
        });
      }
      setStatus({ kind: 'success', message: 'Default trial days saved' });
      refetch();
    } catch (e: any) {
      setStatus({ kind: 'error', message: e?.message || 'Failed to save default trial days' });
    } finally {
      setSavingDefaultTrial(false);
    }
  };

  // Derived, user-friendly list
  const filteredSettings = useMemo(() => {
    const list = (settings || []).filter((s) => {
      if (!showSystem && s.isSystem) return false;
      if (filterType !== 'ALL' && s.valueType !== filterType) return false;
      if (filterVisibility !== 'ALL') {
        const wantPublic = filterVisibility === 'PUBLIC';
        if (s.isPublic !== wantPublic) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!(s.key.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q))) return false;
      }
      return true;
    });
    const sorted = [...list].sort((a, b) => {
      let av: string | number;
      let bv: string | number;
      if (sortBy === 'key') {
        av = a.key.toLowerCase();
        bv = b.key.toLowerCase();
      } else {
        av = new Date(a.updatedAt).getTime();
        bv = new Date(b.updatedAt).getTime();
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [settings, showSystem, filterType, filterVisibility, search, sortBy, sortDir]);

  // Auto-clear status messages
  useEffect(() => {
    if (status) {
      const t = setTimeout(() => setStatus(null), 3000);
      return () => clearTimeout(t);
    }
  }, [status]);

  const handleEdit = (setting: PlatformSetting) => {
    setEditingId(setting.id);
    setEditingKey(setting.key);
    setEditForm({
      value: setting.value,
      description: setting.description,
      isPublic: setting.isPublic
    });
  };

  const handleSaveEdit = async () => {
    if (!editingKey) return;
    try {
      const current = settings?.find((s) => s.key === editingKey);
      const payload: any = { ...editForm };
      if (current) {
        if (current.valueType === 'BOOLEAN') {
          const checked = String(editForm.value) === 'true' || String(editForm.value) === '1';
          payload.value = String(checked);
        } else if (current.valueType === 'INTEGER') {
          const n = Number((editForm.value as any) ?? '');
          if (!Number.isInteger(n)) throw new Error('Please enter a valid integer');
          payload.value = String(n);
        } else if (current.valueType === 'DECIMAL') {
          const n = Number((editForm.value as any) ?? '');
          if (Number.isNaN(n)) throw new Error('Please enter a valid number');
          payload.value = String(n);
        } else if (current.valueType === 'JSON') {
          const text = String((editForm.value as any) ?? '');
          JSON.parse(text);
          payload.value = text;
        } else {
          payload.value = String((editForm.value as any) ?? '');
        }
      }
      await platformConfigAPI.updatePlatformSetting(editingKey, payload);
      setEditingId(null);
      setEditingKey(null);
      setEditForm({});
      setStatus({ kind: 'success', message: 'Setting updated successfully' });
      refetch();
    } catch (error: any) {
      console.error('Failed to update setting:', error);
      setStatus({ kind: 'error', message: error?.message || 'Failed to update setting' });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingKey(null);
    setEditForm({});
  };

  const handleCreate = async () => {
    try {
      const payload: any = { ...createForm };
      if (!payload.key) throw new Error('Key is required');
      const vt = (payload.valueType || 'STRING') as PlatformSetting['valueType'];
      if (vt === 'BOOLEAN') {
        const boolChecked = String(payload.value) === 'true' || String(payload.value) === '1';
        payload.value = String(boolChecked);
      } else if (vt === 'INTEGER') {
        const n = Number(payload.value ?? '');
        if (!Number.isInteger(n)) throw new Error('Please enter a valid integer');
        payload.value = String(n);
      } else if (vt === 'DECIMAL') {
        const n = Number(payload.value ?? '');
        if (Number.isNaN(n)) throw new Error('Please enter a valid number');
        payload.value = String(n);
      } else if (vt === 'JSON') {
        const text = String(payload.value ?? '');
        JSON.parse(text);
        payload.value = text;
      } else {
        payload.value = String(payload.value ?? '');
      }
      await platformConfigAPI.createPlatformSetting(payload);
      setShowCreateForm(false);
      setCreateForm({ valueType: 'STRING', isPublic: false });
      setStatus({ kind: 'success', message: 'Setting created successfully' });
      refetch();
    } catch (error: any) {
      console.error('Failed to create setting:', error);
      setStatus({ kind: 'error', message: error?.message || 'Failed to create setting' });
    }
  };

  const handleDelete = async (key: string) => {
    setDeleteBusy(true);
    try {
      await platformConfigAPI.deletePlatformSetting(key);
      setStatus({ kind: 'success', message: 'Setting deleted' });
      setDeleteOpen(false);
      setDeleteKey(null);
      refetch();
    } catch (error) {
      console.error('Failed to delete setting:', error);
      setStatus({ kind: 'error', message: 'Failed to delete setting' });
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleInitializeDefaults = async () => {
    try {
      await platformConfigAPI.initializePlatformSettings();
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
            System Settings
          </h1>
          <p className="text-muted-foreground">
            Manage global system configuration and settings
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

      {/* Status Banner */}
      {status && (
        <div className={`border rounded p-3 ${status.kind === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {status.message}
        </div>
      )}

      {/* Default Trial Days quick control */}
      <Card>
        <CardHeader>
          <CardTitle>Default Trial Days</CardTitle>
          <CardDescription>
            Global default trial length applied when starting trials. Key: <code>SUB_TRIAL_DAYS_DEFAULT</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="sm:w-56 w-full">
            <Label htmlFor="default-trial-days">Days</Label>
            <Input
              id="default-trial-days"
              type="number"
              inputMode="numeric"
              placeholder="e.g., 14"
              value={defaultTrialDays}
              onChange={(e) => setDefaultTrialDays(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={saveDefaultTrialDays} disabled={savingDefaultTrial}>
              <Save className="w-4 h-4 mr-2" />
              {savingDefaultTrial ? 'Saving…' : 'Save'}
            </Button>
            {defaultTrialSetting && (
              <Badge variant="secondary" className="self-center">Current: {defaultTrialSetting.value}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Toolbar: search, filters, sort */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div className="md:col-span-2">
              <Label htmlFor="search">Search</Label>
              <Input id="search" placeholder="Search by key or description" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div>
              <Label>Type</Label>
              <select className="w-full p-2 border rounded" value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}>
                <option value="ALL">All</option>
                <option value="STRING">String</option>
                <option value="INTEGER">Integer</option>
                <option value="BOOLEAN">Boolean</option>
                <option value="DECIMAL">Decimal</option>
                <option value="JSON">JSON</option>
              </select>
            </div>
            <div>
              <Label>Visibility</Label>
              <select className="w-full p-2 border rounded" value={filterVisibility}
                onChange={(e) => setFilterVisibility(e.target.value as any)}>
                <option value="ALL">All</option>
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch id="show-system" checked={showSystem} onCheckedChange={setShowSystem} />
                <Label htmlFor="show-system">Show system</Label>
              </div>
            </div>
            <div>
              <Label>Sort by</Label>
              <div className="flex gap-2">
                <select className="flex-1 p-2 border rounded" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                  <option value="key">Key</option>
                  <option value="updatedAt">Last Updated</option>
                </select>
                <Button variant="outline" onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}>
                  {sortDir === 'asc' ? 'Asc' : 'Desc'}
                </Button>
              </div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground mt-3">
            Showing {filteredSettings.length} of {settings?.length || 0}
          </div>
        </CardContent>
      </Card>

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
              {createForm.valueType === 'BOOLEAN' ? (
                <div className="flex items-center gap-2 py-2">
                  <Switch
                    id="create-value"
                    checked={String(createForm.value) === 'true' || String(createForm.value) === '1'}
                    onCheckedChange={(checked) => setCreateForm({ ...createForm, value: String(checked) })}
                  />
                  <span className="text-sm text-muted-foreground">{String(String(createForm.value) === 'true' || String(createForm.value) === '1')}</span>
                </div>
              ) : createForm.valueType === 'INTEGER' || createForm.valueType === 'DECIMAL' ? (
                <Input
                  id="create-value"
                  type="number"
                  value={String(createForm.value ?? '')}
                  onChange={(e) => setCreateForm({ ...createForm, value: e.target.value })}
                  placeholder="0"
                />
              ) : createForm.valueType === 'JSON' ? (
                <Textarea
                  id="create-value"
                  value={String(createForm.value ?? '')}
                  onChange={(e) => setCreateForm({ ...createForm, value: e.target.value })}
                  placeholder='{"key":"value"}'
                />
              ) : (
                <Input
                  id="create-value"
                  value={String(createForm.value ?? '')}
                  onChange={(e) => setCreateForm({ ...createForm, value: e.target.value })}
                  placeholder="Setting value"
                />
              )}
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
        {filteredSettings.map((setting) => (
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
                        {setting.valueType === 'BOOLEAN' ? (
                          <div className="flex items-center gap-2 py-2">
                            <Switch
                              checked={String(editForm.value) === 'true'}
                              onCheckedChange={(checked) => setEditForm({ ...editForm, value: checked ? 'true' : 'false' })}
                            />
                            <span className="text-sm text-muted-foreground">{String(String(editForm.value) === 'true')}</span>
                          </div>
                        ) : setting.valueType === 'INTEGER' || setting.valueType === 'DECIMAL' ? (
                          <Input
                            type="number"
                            value={String(editForm.value ?? '')}
                            onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
                          />
                        ) : setting.valueType === 'JSON' ? (
                          <Textarea
                            value={String(editForm.value ?? '')}
                            onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
                            placeholder='{"key":"value"}'
                          />
                        ) : (
                          <Input
                            value={String(editForm.value ?? '')}
                            onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
                          />
                        )}
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
                      <p className="font-mono text-sm bg-gray-100 p-2 rounded break-all">{setting.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">Last updated: {new Date(setting.updatedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
                
                {editingId !== setting.id && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(setting)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    {!setting.isSystem && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setDeleteKey(setting.key); setDeleteOpen(true); }}
                      >
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
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={(open) => { setDeleteOpen(open); if (!open) { setDeleteKey(null); setDeleteBusy(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Setting</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete the setting{' '}
            <code className="px-1 py-0.5 bg-gray-100 rounded">{deleteKey}</code>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteOpen(false); setDeleteKey(null); }} disabled={deleteBusy}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => deleteKey && handleDelete(deleteKey)} disabled={deleteBusy || !deleteKey}>
              {deleteBusy ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
