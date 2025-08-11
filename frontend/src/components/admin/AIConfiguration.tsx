import React, { useState } from 'react';
import { Plus, Settings, TestTube, Crown, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';

import { Switch } from '../ui/switch';
import { useApi, useApiMutation } from '../../hooks/useApi';
import { LoadingSpinner, LoadingSkeleton } from '../common/LoadingSpinner';
import { ErrorDisplay } from '../common/ErrorDisplay';
import { aiConfigAPI } from '../../services/api';

interface AIProvider {
  id: number;
  name: string;
  type: 'GOOGLE_GEMINI' | 'OPENROUTER' | 'OPENAI' | 'OPENAI_COMPATIBLE' | 'Z_AI_GLM_4_5';
  maskedApiKey: string;
  endpoint?: string;
  isActive: boolean;
  isPrimary: boolean;
  settings?: string;
  testStatus?: 'PENDING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT';
  testErrorMessage?: string;
  lastTestedAt?: string;
}

interface CreateProviderRequest {
  name: string;
  type: string;
  apiKey: string;
  endpoint?: string;
  isActive: boolean;
  isPrimary: boolean;
  settings?: string;
}

const providerTypes = [
  { value: 'GOOGLE_GEMINI', label: 'Google Gemini', description: 'Google\'s Gemini AI model' },
  { value: 'OPENROUTER', label: 'OpenRouter', description: 'Multi-model API gateway' },
  { value: 'OPENAI', label: 'OpenAI', description: 'Direct OpenAI API integration' },
  { value: 'OPENAI_COMPATIBLE', label: 'OpenAI Compatible', description: 'Custom OpenAI-compatible endpoints' },
  { value: 'Z_AI_GLM_4_5', label: 'Z.AI GLM-4.5', description: 'Z.AI\'s GLM-4.5 model' }
];

export const AIConfiguration: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateProviderRequest>({
    name: '',
    type: '',
    apiKey: '',
    endpoint: '',
    isActive: false,
    isPrimary: false,
    settings: ''
  });

  // Fetch AI providers
  const api = useApi<AIProvider[]>(() => aiConfigAPI.getAllProviders());
  const providers: AIProvider[] = api.data ?? [];

  // Create provider mutation
  const createMutation = useApiMutation(
    (data: CreateProviderRequest) => aiConfigAPI.createProvider(data),
    {
      onSuccess: () => {
        api.refetch();
        setIsCreateDialogOpen(false);
        resetForm();
      }
    }
  );

  // Test provider mutation
  const testMutation = useApiMutation(
    (id: number) => aiConfigAPI.testProvider(id),
    {
      onSuccess: () => api.refetch()
    }
  );

  // Set primary provider mutation
  const setPrimaryMutation = useApiMutation(
    (id: number) => aiConfigAPI.setPrimaryProvider(id),
    {
      onSuccess: () => api.refetch()
    }
  );

  // Delete provider mutation
  const deleteMutation = useApiMutation(
    (id: number) => aiConfigAPI.deleteProvider(id),
    {
      onSuccess: () => api.refetch()
    }
  );

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      apiKey: '',
      endpoint: '',
      isActive: false,
      isPrimary: false,
      settings: ''
    });
  };

  const handleCreateProvider = async () => {
    try {
      await createMutation.mutate(formData);
    } catch (error) {
      console.error('Failed to create provider:', error);
    }
  };

  const handleTestProvider = async (id: number) => {
    try {
      await testMutation.mutate(id);
    } catch (error) {
      console.error('Failed to test provider:', error);
    }
  };

  const handleSetPrimary = async (id: number) => {
    try {
      await setPrimaryMutation.mutate(id);
    } catch (error) {
      console.error('Failed to set primary provider:', error);
    }
  };

  const handleDeleteProvider = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this AI provider?')) {
      try {
        await deleteMutation.mutate(id);
      } catch (error) {
        console.error('Failed to delete provider:', error);
      }
    }
  };

  // No-op: visibility toggling not needed in current simplified UI

  const getStatusBadge = (provider: AIProvider) => {
    if (!provider.testStatus) {
      return <Badge variant="secondary">Not Tested</Badge>;
    }
    
    switch (provider.testStatus) {
      case 'SUCCESS':
        return <Badge variant="default" className="bg-green-500">Working</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      case 'TIMEOUT':
        return <Badge variant="destructive">Timeout</Badge>;
      case 'PENDING':
        return <Badge variant="secondary">Testing...</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (api.loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <LoadingSkeleton lines={2} className="w-64" />
          <LoadingSkeleton lines={1} className="w-32" />
        </div>
        <LoadingSkeleton lines={8} />
      </div>
    );
  }

  if (api.error) {
    return <ErrorDisplay error={api.error} onRetry={api.refetch} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Configuration</h1>
          <p className="text-muted-foreground">
            Manage AI providers for menu description generation and feedback analysis
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Provider
        </Button>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add AI Provider</DialogTitle>
            <DialogDescription>
              Configure a new AI provider for the system
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Provider Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My AI Provider"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Provider Type
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select provider type" />
                </SelectTrigger>
                <SelectContent>
                  {providerTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="apiKey" className="text-right">
                API Key
              </Label>
              <Input
                id="apiKey"
                type="password"
                value={formData.apiKey}
                onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="Enter API key"
                className="col-span-3"
              />
            </div>
            {(formData.type === 'OPENAI_COMPATIBLE' ||
              formData.type === 'OPENROUTER' ||
              formData.type === 'Z_AI_GLM_4_5') && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="endpoint" className="text-right">
                  Endpoint URL
                </Label>
                <Input
                  id="endpoint"
                  value={formData.endpoint}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, endpoint: e.target.value }))
                  }
                  placeholder="https://api.example.com"
                  className="col-span-3"
                />
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">
                Active
              </Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: checked }))
                }
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isPrimary" className="text-right">
                Set as Primary
              </Label>
              <Switch
                id="isPrimary"
                checked={formData.isPrimary}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isPrimary: checked }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProvider} disabled={createMutation.loading}>
              {createMutation.loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                'Create Provider'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Providers List */}
      <div className="grid gap-4">
        {providers.map((provider) => (
          <Card key={provider.id} className={provider.isPrimary ? 'border-yellow-500' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="flex items-center gap-2">
                    {provider.name}
                    {provider.isPrimary && <Crown className="w-4 h-4 text-yellow-500" />}
                  </CardTitle>
                  <Badge variant="outline">
                    {providerTypes.find(t => t.value === provider.type)?.label || provider.type}
                  </Badge>
                  {getStatusBadge(provider)}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestProvider(provider.id)}
                    disabled={testMutation.loading}
                  >
                    <TestTube className="w-4 h-4 mr-1" />
                    Test
                  </Button>
                  {!provider.isPrimary && provider.isActive && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetPrimary(provider.id)}
                      disabled={setPrimaryMutation.loading}
                    >
                      <Crown className="w-4 h-4 mr-1" />
                      Set Primary
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteProvider(provider.id)}
                    disabled={deleteMutation.loading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">API Key:</span>
                  <span className="text-sm font-mono">{provider.maskedApiKey}</span>
                </div>
                {provider.endpoint && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Endpoint:</span>
                    <span className="text-sm">{provider.endpoint}</span>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant={provider.isActive ? 'default' : 'secondary'}>
                      {provider.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {provider.lastTestedAt && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Last Tested:</span>
                      <span className="text-sm">{new Date(provider.lastTestedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
                {provider.testErrorMessage && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {provider.testErrorMessage}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {providers.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No AI Providers Configured</h3>
              <p className="text-muted-foreground mb-4">
                Add your first AI provider to enable menu description generation and feedback analysis.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Provider
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
