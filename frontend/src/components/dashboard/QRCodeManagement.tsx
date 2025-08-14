import React, { useState, useEffect } from 'react';
import { QrCode, Eye, Settings, Save, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { useApi } from '../../hooks/useApi';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorDisplay } from '../common/ErrorDisplay';
import { qrCodeAPI } from '../../services/api';

interface QRCodeInfo {
  restaurantId: number;
  restaurantName: string;
  menuUrl: string;
  qrCodeSize: number;
  qrCodeGeneratedAt: string;
  subscriptionPlan: string;
}

interface QRCustomizationSettings {
  size: number;
  branded: boolean;
  restaurantNameDisplay: 'full' | 'abbreviated' | 'hidden';
  tableNameFormat: 'table-number' | 'short' | 'number-only';
  fontSize: 'small' | 'medium' | 'large';
  textPosition: 'bottom' | 'top';
}

export const QRCodeManagement: React.FC = () => {
  const [, setQrCodeBlob] = useState<Blob | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [size, setSize] = useState<number>(256);
  const [branded, setBranded] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // New customization settings
  const [restaurantNameDisplay, setRestaurantNameDisplay] = useState<'full' | 'abbreviated' | 'hidden'>('full');
  const [tableNameFormat, setTableNameFormat] = useState<'table-number' | 'short' | 'number-only'>('table-number');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [textPosition, setTextPosition] = useState<'bottom' | 'top'>('bottom');

  // State for tracking changes and saving
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string>('');

  // Fetch QR code info
  const {
    data: qrInfo,
    loading: infoLoading,
    error: infoError,
    refetch: refetchInfo
  } = useApi<QRCodeInfo>(() => qrCodeAPI.getQRCodeInfo());

  // Generate QR code preview
  const generatePreview = async () => {
    setIsGenerating(true);
    try {
      const customizationSettings = {
        size,
        branded,
        restaurantNameDisplay,
        tableNameFormat,
        fontSize,
        textPosition
      };

      const blob = await qrCodeAPI.previewQRCode(size, branded, customizationSettings);
      setQrCodeBlob(blob);

      // Create URL for preview
      if (qrCodeUrl) {
        URL.revokeObjectURL(qrCodeUrl);
      }
      const url = URL.createObjectURL(blob);
      setQrCodeUrl(url);
    } catch (error) {
      console.error('Failed to generate QR code preview:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save customization settings
  const saveSettings = async () => {
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      const settings: QRCustomizationSettings = {
        size,
        branded,
        restaurantNameDisplay,
        tableNameFormat,
        fontSize,
        textPosition
      };

      await qrCodeAPI.saveQRCustomizationSettings(settings);
      setHasUnsavedChanges(false);
      setSaveSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);

      // Regenerate preview with new settings
      await generatePreview();
    } catch (error: any) {
      setSaveError(error?.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };



  // Track changes to settings
  useEffect(() => {
    setHasUnsavedChanges(true);
    // Auto-generate preview when settings change
    const timeoutId = setTimeout(() => {
      if (qrInfo) {
        generatePreview();
      }
    }, 500); // Debounce preview generation

    return () => clearTimeout(timeoutId);
  }, [qrInfo, size, branded, restaurantNameDisplay, tableNameFormat, fontSize, textPosition]);

  // Load saved settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await qrCodeAPI.getQRCustomizationSettings();
        if (savedSettings) {
          setSize(savedSettings.size);
          setBranded(savedSettings.branded);
          setRestaurantNameDisplay(savedSettings.restaurantNameDisplay);
          setTableNameFormat(savedSettings.tableNameFormat);
          setFontSize(savedSettings.fontSize);
          setTextPosition(savedSettings.textPosition);
          setHasUnsavedChanges(false);
        }
      } catch (error) {
        console.error('Failed to load saved settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Cleanup URL on unmount
  useEffect(() => {
    return () => {
      if (qrCodeUrl) {
        URL.revokeObjectURL(qrCodeUrl);
      }
    };
  }, [qrCodeUrl]);

  if (infoLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <QrCode className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold tracking-tight">QR Code Management</h1>
        </div>
        <LoadingSpinner text="Loading QR code information..." />
      </div>
    );
  }

  if (infoError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <QrCode className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold tracking-tight">QR Code Management</h1>
        </div>
        <ErrorDisplay error={infoError} onRetry={refetchInfo} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <QrCode className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">QR Code Customization</h1>
            <p className="text-muted-foreground">
              Central control panel for all QR code styling across your restaurant
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-blue-600">Global Settings</p>
          <p className="text-xs text-muted-foreground">Applied to all QR codes</p>
        </div>
      </div>

      {/* Information Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Settings className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Global QR Code Settings</h3>
              <p className="text-blue-800 text-sm mb-3">
                Customize your QR code appearance here. These settings will be automatically applied to all QR codes generated throughout your system, including individual table QR codes and bulk generations.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard/tables'}>
                  Go to Table Management
                </Button>
                <Button variant="outline" size="sm" onClick={generatePreview}>
                  <Eye className="w-4 h-4 mr-1" />
                  Refresh Preview
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              QR Code Preview
            </CardTitle>
            <CardDescription>
              Preview your customized QR code styling
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center p-6 bg-gray-50 rounded-lg">
              {isGenerating ? (
                <LoadingSpinner text="Generating QR code..." />
              ) : qrCodeUrl ? (
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code Preview" 
                  className="max-w-full h-auto"
                  style={{ maxWidth: `${size}px` }}
                />
              ) : (
                <div className="text-center text-muted-foreground">
                  <QrCode className="w-16 h-16 mx-auto mb-2 opacity-50" />
                  <p>QR code will appear here</p>
                </div>
              )}
            </div>


          </CardContent>
        </Card>

        {/* QR Code Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              QR Code Settings
            </CardTitle>
            <CardDescription>
              Customize your QR code appearance and size
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Size Selection */}
            <div className="space-y-2">
              <Label htmlFor="size">Size (pixels)</Label>
              <Select value={size.toString()} onValueChange={(value) => setSize(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="128">128x128 (Small)</SelectItem>
                  <SelectItem value="256">256x256 (Medium)</SelectItem>
                  <SelectItem value="512">512x512 (Large)</SelectItem>
                  <SelectItem value="1024">1024x1024 (Extra Large)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Branded Option */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="branded">Include Restaurant Name</Label>
                <p className="text-sm text-muted-foreground">
                  Add your restaurant name below the QR code
                </p>
              </div>
              <Switch
                id="branded"
                checked={branded}
                onCheckedChange={setBranded}
              />
            </div>

            {/* Restaurant Name Display Format */}
            {branded && (
              <div className="space-y-2">
                <Label>Restaurant Name Display</Label>
                <Select value={restaurantNameDisplay} onValueChange={(value: 'full' | 'abbreviated' | 'hidden') => setRestaurantNameDisplay(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Name</SelectItem>
                    <SelectItem value="abbreviated">Abbreviated</SelectItem>
                    <SelectItem value="hidden">Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Table Name Format */}
            <div className="space-y-2">
              <Label>Table Name Format</Label>
              <Select value={tableNameFormat} onValueChange={(value: 'table-number' | 'short' | 'number-only') => setTableNameFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="table-number">Table 1, Table 2...</SelectItem>
                  <SelectItem value="short">T1, T2...</SelectItem>
                  <SelectItem value="number-only">1, 2...</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <Label>Text Size</Label>
              <Select value={fontSize} onValueChange={(value: 'small' | 'medium' | 'large') => setFontSize(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Text Position */}
            <div className="space-y-2">
              <Label>Text Position</Label>
              <Select value={textPosition} onValueChange={(value: 'bottom' | 'top') => setTextPosition(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom">Below QR Code</SelectItem>
                  <SelectItem value="top">Above QR Code</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Restaurant Info */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium">Restaurant Information</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <p className="font-medium">{qrInfo?.restaurantName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">ID:</span>
                  <p className="font-mono">{qrInfo?.restaurantId}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Plan:</span>
                  <p className="font-medium">{qrInfo?.subscriptionPlan}</p>
                </div>
              </div>
            </div>

            {/* Save Changes Button */}
            <div className="space-y-3">
              {saveError && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{saveError}</p>
                </div>
              )}

              {saveSuccess && (
                <div className="p-3 rounded-md bg-green-50 border border-green-200 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <p className="text-sm text-green-600">Settings saved successfully!</p>
                </div>
              )}

              <Button
                onClick={saveSettings}
                disabled={isSaving || !hasUnsavedChanges}
                className="w-full"
              >
                {isSaving ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {hasUnsavedChanges ? 'Save Changes' : 'No Changes to Save'}
                  </>
                )}
              </Button>

              {hasUnsavedChanges && (
                <p className="text-xs text-muted-foreground text-center">
                  You have unsaved changes. Click "Save Changes" to apply them to all QR codes.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
