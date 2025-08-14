import React, { useEffect, useState } from 'react';
import { Plus, Settings, TestTube, Crown, Trash2, BarChart3 } from 'lucide-react';
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
  providerId?: string;
  endpoint?: string;
  model?: string;
  modelDisplayName?: string;
  isActive: boolean;
  isPrimary: boolean;
  settings?: string;
  testStatus?: 'PENDING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT';
  testErrorMessage?: string;
  lastTestedAt?: string;
}

interface UsageMap { [providerId: string]: { providerId: number; totalCalls: number; totalErrors: number; lastCalledAt?: string } }

interface CreateProviderRequest {
  name: string;
  type: string;
  apiKey: string;
  providerId?: string;
  endpoint?: string;
  model?: string;
  modelDisplayName?: string;
  isActive: boolean;
  isPrimary: boolean;
  settings?: string;
}

const providerTypes = [
  { value: 'GOOGLE_GEMINI', label: 'Google Gemini', description: 'Google\'s Gemini AI model' },
  { value: 'OPENROUTER', label: 'OpenRouter', description: 'Multi-model API gateway' },
  { value: 'OPENAI', label: 'OpenAI', description: 'Direct OpenAI API integration' },
  { value: 'OPENAI_COMPATIBLE', label: 'OpenAI Compatible', description: 'Custom OpenAI-compatible endpoints' },
  { value: 'Z_AI_GLM_4_5', label: 'Z.AI', description: 'Z.AI provider (glm-4.5-flash)' }
];

export const AIConfiguration: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [formData, setFormData] = useState<CreateProviderRequest>({
    name: '',
    type: '',
    apiKey: '',
    endpoint: '',
    model: '',
    isActive: false,
    isPrimary: false,
    settings: ''
  });
  const [usage, setUsage] = useState<UsageMap>({});

  // Fetch AI providers
  const api = useApi<AIProvider[]>(() => aiConfigAPI.getAllProviders());
  const providers: AIProvider[] = api.data ?? [];

  useEffect(() => {
    const load = async () => {
      try {
        const u = await aiConfigAPI.getUsageStatistics();
        setUsage(u || {});
      } catch {}
    };
    load();
  }, [isCreateDialogOpen]);

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
      onSuccess: async () => {
        // Force a fresh fetch of providers to get updated timestamps
        await api.refetch();
        // Also refresh usage statistics
        try {
          const updatedUsage = await aiConfigAPI.getUsageStatistics();
          setUsage(updatedUsage || {});
        } catch (error) {
          console.warn('Failed to refresh usage statistics:', error);
        }
      }
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
      model: '',
      isActive: false,
      isPrimary: false,
      settings: ''
    });
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);
    setFormError(null);

    if (!formData.apiKey) {
      setFormError('API key is required for testing.');
      setIsTestingConnection(false);
      return;
    }

    if (formData.type === 'OPENROUTER' && (!formData.model || formData.model.trim() === '')) {
      setFormError('Model ID is required for testing OpenRouter provider.');
      setIsTestingConnection(false);
      return;
    }

    try {
      const testData = {
        type: formData.type,
        apiKey: formData.apiKey,
        endpoint: formData.endpoint,
        model: formData.model,
        settings: formData.settings
      };

      const result = await aiConfigAPI.testProvider(testData as any);
      setTestResult({ success: true, message: result.message || 'Connection test successful!' });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.response?.data?.message || error.message || 'Connection test failed'
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleCreateProvider = async () => {
    setFormError(null);

    if (!formData.type || !formData.apiKey) {
      setFormError('Provider type and API key are required.');
      return;
    }

    // Auto-name based on provider type selection
    const selected = providerTypes.find(t => t.value === formData.type);
    const autoName = selected ? selected.label : 'AI Provider';

    if (formData.type === 'GOOGLE_GEMINI' && !formData.model) {
      setFormError('Select a Gemini model or enter a custom model ID.');
      return;
    }

    if (formData.type === 'OPENROUTER') {
      if (!formData.model || formData.model.trim() === '') {
        setFormError('Model ID is required for OpenRouter provider.');
        return;
      }
      if (formData.model.length > 255) {
        setFormError('Model ID is too long (maximum 255 characters).');
        return;
      }
    }

    if (formData.type === 'OPENAI_COMPATIBLE') {
      if (!formData.endpoint) {
        setFormError('API Base URL is required for custom OpenAI-compatible providers.');
        return;
      }
      if (!formData.providerId || /\s/.test(formData.providerId)) {
        setFormError('Provider ID must be alphanumeric/hyphen and contain no spaces.');
        return;
      }
    }

    const payload = { ...formData, name: autoName } as CreateProviderRequest;

    try {
      await createMutation.mutate(payload);
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
        <div className="flex items-center gap-4">
          {providers && providers.length > 0 && (
            <div className="flex items-center gap-2">
              <Label htmlFor="primary-provider">Primary Provider:</Label>
              <Select
                value={providers.find(p => p.isPrimary)?.id.toString() || ''}
                onValueChange={(value) => {
                  const providerId = parseInt(value);
                  setPrimaryMutation.mutate(providerId);
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select primary provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.filter(p => p.isActive).map((provider) => (
                    <SelectItem key={provider.id} value={provider.id.toString()}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Provider
          </Button>
        </div>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add AI Provider</DialogTitle>
            <DialogDescription>
              Configure a new AI provider for the system
            </DialogDescription>
            {formError && (
              <div className="text-sm text-red-600 bg-red-50 rounded p-2 mt-2">{formError}</div>
            )}
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Provider
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, type: value }));
                  // Auto set name
                  const selected = providerTypes.find(t => t.value === value);
                  setFormData(prev => ({ ...prev, name: selected ? selected.label : 'AI Provider' }));

                  // For Z.AI, enforce model and hide endpoint
                  if (value === 'Z_AI_GLM_4_5') {
                    setFormData(prev => ({ ...prev, model: 'glm-4.5-flash', endpoint: '' }));
                  }
                }}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select provider" />
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

            {formData.type === 'OPENAI_COMPATIBLE' || formData.type === 'OPENROUTER' || formData.type === 'OPENAI' ? (
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
                  placeholder="https://api.example.com/v1"
                  className="col-span-3"
                />
              </div>
            ) : null}

            {/* Google Gemini Provider Section */}
            {formData.type === 'GOOGLE_GEMINI' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Model</Label>
                  <Select
                    value={formData.model || ''}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, model: value }))}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-2.5-pro">gemini-2.5-pro</SelectItem>
                      <SelectItem value="gemini-2.5-flash">gemini-2.5-flash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* OpenAI Provider Section */}
            {formData.type === 'OPENAI' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Model</Label>
                  <Select
                    value={formData.model || ''}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, model: value }))}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="o4">o4</SelectItem>
                      <SelectItem value="o4-mini">o4-mini</SelectItem>
                      <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                      <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* OpenRouter Provider Section */}
            {formData.type === 'OPENROUTER' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Model ID</Label>
                  <div className="col-span-3">
                    <Input
                      value={formData.model || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                      placeholder="openai/gpt-4o"
                      className="mb-2"
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Enter the exact model name from OpenRouter documentation (e.g., openai/gpt-4o, google/gemini-flash-1.5, anthropic/claude-3-sonnet)
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Custom Provider (OpenAI Compatible) */}
            {formData.type === 'OPENAI_COMPATIBLE' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Provider ID</Label>
                  <Input
                    value={formData.providerId || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, providerId: e.target.value }))}
                    placeholder="my-provider"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">API Base URL</Label>
                  <Input
                    value={formData.endpoint || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, endpoint: e.target.value }))}
                    placeholder="https://api.example.com/v1"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Model ID</Label>
                  <Input
                    value={formData.model || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                    placeholder="my/model-id"
                    className="col-span-3"
                  />
                </div>
              </>
            )}

            {/* Z.AI – only API key, fixed model */}
            {formData.type === 'Z_AI_GLM_4_5' && (
              <div className="text-sm text-muted-foreground">
                Using model: <span className="font-mono">glm-4.5-flash</span>
              </div>
            )}

            {/* Test Connection */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Test Connection</Label>
              <div className="col-span-3 space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTestingConnection || !formData.apiKey}
                  className="w-full"
                >
                  {isTestingConnection ? 'Testing...' : 'Test Connection'}
                </Button>
                {testResult && (
                  <div className={`text-sm p-2 rounded ${
                    testResult.success
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {testResult.message}
                  </div>
                )}
              </div>
            </div>

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
          <DialogFooter className="flex justify-between">
            <div />
            <div className="flex gap-2">
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
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Providers List */}
      <div className="grid gap-4">
        {providers.map((provider) => {
          const u = usage[String(provider.id)];
          return (
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
                  {provider.model && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Model:</span>
                      <span className="text-sm font-mono">{provider.model}</span>
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

                  {/* Usage Statistics */}
                  <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      <span>Total Calls:</span>
                      <span className="font-medium">{u?.totalCalls ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Errors:</span>
                      <span className="font-medium">{u?.totalErrors ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Last Used:</span>
                      <span className="font-medium">{u?.lastCalledAt ? new Date(u.lastCalledAt).toLocaleString() : '-'}</span>
                    </div>
                  </div>

                  {provider.testErrorMessage && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {provider.testErrorMessage}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
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
