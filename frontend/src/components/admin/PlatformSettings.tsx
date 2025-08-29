import React, { useState, useMemo, useEffect } from 'react';
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
import { platformConfigAPI } from '../../services/api';
import { Settings, Save, RefreshCw, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

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
  // Status for success/error messages
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

  // Global Toggles
  const maintenanceSetting = useMemo(() => (settings || []).find(s => s.key === 'app.maintenance_mode'), [settings]);
  const registrationSetting = useMemo(() => (settings || []).find(s => s.key === 'features.registration_enabled'), [settings]);
  const aiSetting = useMemo(() => (settings || []).find(s => s.key === 'features.ai_enabled'), [settings]);

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  useEffect(() => {
    if (maintenanceSetting) setMaintenanceMode(String(maintenanceSetting.value) === 'true');
  }, [maintenanceSetting]);

  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [savingRegistration, setSavingRegistration] = useState(false);
  useEffect(() => {
    if (registrationSetting) setRegistrationEnabled(String(registrationSetting.value) === 'true');
  }, [registrationSetting]);

  const [aiEnabled, setAiEnabled] = useState(true);
  const [savingAI, setSavingAI] = useState(false);
  useEffect(() => {
    if (aiSetting) setAiEnabled(String(aiSetting.value) === 'true');
  }, [aiSetting]);

  const saveBooleanSetting = async (
    key: string,
    exists: boolean,
    value: boolean,
    successMsg: string,
    createMeta: { description: string }
  ) => {
    try {
      if (exists) {
        await platformConfigAPI.updatePlatformSetting(key, { value: String(value) });
      } else {
        await platformConfigAPI.createPlatformSetting({
          key,
          value: String(value),
          description: createMeta.description,
          valueType: 'BOOLEAN',
          isPublic: false,
        });
      }
      setStatus({ kind: 'success', message: successMsg });
      refetch();
    } catch (e: any) {
      setStatus({ kind: 'error', message: e?.message || 'Failed to save setting' });
    }
  };

  const saveMaintenance = async () => {
    setSavingMaintenance(true);
    await saveBooleanSetting(
      'app.maintenance_mode',
      !!maintenanceSetting,
      maintenanceMode,
      'Maintenance mode saved',
      { description: 'Whether the application is in maintenance mode' }
    );
    setSavingMaintenance(false);
  };

  const saveRegistration = async () => {
    setSavingRegistration(true);
    await saveBooleanSetting(
      'features.registration_enabled',
      !!registrationSetting,
      registrationEnabled,
      'Registration setting saved',
      { description: 'Whether new user registration is enabled' }
    );
    setSavingRegistration(false);
  };

  const saveAI = async () => {
    setSavingAI(true);
    await saveBooleanSetting(
      'features.ai_enabled',
      !!aiSetting,
      aiEnabled,
      'AI feature toggle saved',
      { description: 'Whether AI features are enabled globally' }
    );
    setSavingAI(false);
  };

  // Grace days
  const graceSetting = useMemo(() => (settings || []).find(s => s.key === 'SUB_GRACE_DAYS_DEFAULT'), [settings]);
  const [graceDays, setGraceDays] = useState<string>('');
  const [savingGrace, setSavingGrace] = useState(false);
  useEffect(() => {
    if (graceSetting) {
      setGraceDays(String(graceSetting.value ?? ''));
    }
  }, [graceSetting]);

  const saveGraceDays = async () => {
    const n = Number(graceDays);
    if (!Number.isInteger(n) || n < 0) {
      setStatus({ kind: 'error', message: 'Enter a valid non-negative integer for grace days' });
      return;
    }
    setSavingGrace(true);
    try {
      if (graceSetting) {
        await platformConfigAPI.updatePlatformSetting('SUB_GRACE_DAYS_DEFAULT', { value: String(n) });
      } else {
        await platformConfigAPI.createPlatformSetting({
          key: 'SUB_GRACE_DAYS_DEFAULT',
          value: String(n),
          description: 'Default grace period after trial/period ends',
          valueType: 'INTEGER',
          isPublic: false,
        });
      }
      setStatus({ kind: 'success', message: 'Default grace days saved' });
      refetch();
    } catch (e: any) {
      setStatus({ kind: 'error', message: e?.message || 'Failed to save grace days' });
    } finally {
      setSavingGrace(false);
    }
  };

  // Manual bKash Settings (Public)
  const bkashMerchantSetting = useMemo(() => (settings || []).find(s => s.key === 'PAYMENT_BKASH_MERCHANT_NUMBER'), [settings]);
  const bkashMinAmountSetting = useMemo(() => (settings || []).find(s => s.key === 'PAYMENT_BKASH_MIN_AMOUNT'), [settings]);
  const bkashInstructionsEnSetting = useMemo(() => (settings || []).find(s => s.key === 'PAYMENT_BKASH_INSTRUCTIONS_EN'), [settings]);
  const bkashInstructionsBnSetting = useMemo(() => (settings || []).find(s => s.key === 'PAYMENT_BKASH_INSTRUCTIONS_BN'), [settings]);

  const [bkashMerchant, setBkashMerchant] = useState<string>('');
  const [bkashMinAmount, setBkashMinAmount] = useState<string>('0');
  const [bkashInstructionsEn, setBkashInstructionsEn] = useState<string>('');
  const [bkashInstructionsBn, setBkashInstructionsBn] = useState<string>('');
  const [savingBkash, setSavingBkash] = useState(false);

  useEffect(() => {
    if (bkashMerchantSetting) setBkashMerchant(String(bkashMerchantSetting.value ?? ''));
    if (bkashMinAmountSetting) setBkashMinAmount(String(bkashMinAmountSetting.value ?? '0'));
    if (bkashInstructionsEnSetting) setBkashInstructionsEn(String(bkashInstructionsEnSetting.value ?? ''));
    if (bkashInstructionsBnSetting) setBkashInstructionsBn(String(bkashInstructionsBnSetting.value ?? ''));
  }, [
    bkashMerchantSetting,
    bkashMinAmountSetting,
    bkashInstructionsEnSetting,
    bkashInstructionsBnSetting,
  ]);

  const saveBkashSettings = async () => {
    try {
      // Validate bKash settings
      const trimmedMerchant = String(bkashMerchant || '').trim();
      const trimmedMinAmount = String(bkashMinAmount || '').trim();
      const trimmedInstructionsEn = String(bkashInstructionsEn || '').trim();
      const trimmedInstructionsBn = String(bkashInstructionsBn || '').trim();
      
      if (!trimmedMerchant) {
        setStatus({ kind: 'error', message: 'bKash merchant number is required and cannot be empty' });
        return;
      }
      
      // Validate merchant number format (basic validation)
      if (!/^01[0-9]{9}$/.test(trimmedMerchant)) {
        setStatus({ kind: 'error', message: 'bKash merchant number must be in format 01XXXXXXXXX (11 digits starting with 01)' });
        return;
      }
      
      if (!trimmedMinAmount) {
        setStatus({ kind: 'error', message: 'Minimum amount is required and cannot be empty' });
        return;
      }
      
      const minAmountNum = Number(trimmedMinAmount);
      if (isNaN(minAmountNum) || !Number.isInteger(minAmountNum) || minAmountNum < 0 || minAmountNum > 100000) {
        setStatus({ kind: 'error', message: 'Minimum amount must be a non-negative integer between 0 and 100,000' });
        return;
      }
      
      if (!trimmedInstructionsEn) {
        setStatus({ kind: 'error', message: 'English instructions are required and cannot be empty' });
        return;
      }
      
      if (!trimmedInstructionsBn) {
        setStatus({ kind: 'error', message: 'Bangla instructions are required and cannot be empty' });
        return;
      }
      
      setSavingBkash(true);
      setStatus(null); // Clear previous status
      
      const promises = [];
      
      // Save merchant number
      if (bkashMerchantSetting) {
        promises.push(platformConfigAPI.updatePlatformSetting('PAYMENT_BKASH_MERCHANT_NUMBER', { value: trimmedMerchant }));
      } else {
        promises.push(platformConfigAPI.createPlatformSetting({
          key: 'PAYMENT_BKASH_MERCHANT_NUMBER',
          value: trimmedMerchant,
          description: 'bKash merchant number for manual payments',
          valueType: 'STRING',
          isPublic: true,
        }));
      }
      
      // Save minimum amount
      if (bkashMinAmountSetting) {
        promises.push(platformConfigAPI.updatePlatformSetting('PAYMENT_BKASH_MIN_AMOUNT', { value: String(minAmountNum) }));
      } else {
        promises.push(platformConfigAPI.createPlatformSetting({
          key: 'PAYMENT_BKASH_MIN_AMOUNT',
          value: String(minAmountNum),
          description: 'Minimum amount for manual bKash payments',
          valueType: 'INTEGER',
          isPublic: true,
        }));
      }
      
      // Save English instructions
      if (bkashInstructionsEnSetting) {
        promises.push(platformConfigAPI.updatePlatformSetting('PAYMENT_BKASH_INSTRUCTIONS_EN', { value: trimmedInstructionsEn }));
      } else {
        promises.push(platformConfigAPI.createPlatformSetting({
          key: 'PAYMENT_BKASH_INSTRUCTIONS_EN',
          value: trimmedInstructionsEn,
          description: 'bKash payment instructions in English',
          valueType: 'STRING',
          isPublic: true,
        }));
      }
      
      // Save Bangla instructions
      if (bkashInstructionsBnSetting) {
        promises.push(platformConfigAPI.updatePlatformSetting('PAYMENT_BKASH_INSTRUCTIONS_BN', { value: trimmedInstructionsBn }));
      } else {
        promises.push(platformConfigAPI.createPlatformSetting({
          key: 'PAYMENT_BKASH_INSTRUCTIONS_BN',
          value: trimmedInstructionsBn,
          description: 'bKash payment instructions in Bangla',
          valueType: 'STRING',
          isPublic: true,
        }));
      }
      
      await Promise.all(promises);
      setStatus({ kind: 'success', message: 'bKash settings saved successfully' });
      await refetch();
    } catch (e: any) {
      console.error('Error saving bKash settings:', e);
      const errorMessage = e?.response?.data?.message || e?.message || 'Failed to save bKash settings. Please try again.';
      setStatus({ kind: 'error', message: errorMessage });
    } finally {
      setSavingBkash(false);
    }
  };

  // Pricing Settings
  const proPlanMonthlySetting = useMemo(() => (settings || []).find(s => s.key === 'pricing.pro_plan_monthly'), [settings]);
  const [proPlanMonthly, setProPlanMonthly] = useState<string>('');
  const [savingPricing, setSavingPricing] = useState(false);
  useEffect(() => {
    if (proPlanMonthlySetting) {
      setProPlanMonthly(String(proPlanMonthlySetting.value ?? ''));
    }
  }, [proPlanMonthlySetting]);

  const savePricing = async () => {
    const price = Number(proPlanMonthly);
    if (!Number.isInteger(price) || price <= 0) {
      setStatus({ kind: 'error', message: 'Enter a valid positive price for Pro plan' });
      return;
    }
    setSavingPricing(true);
    try {
      if (proPlanMonthlySetting) {
        await platformConfigAPI.updatePlatformSetting('pricing.pro_plan_monthly', { value: String(price) });
      } else {
        await platformConfigAPI.createPlatformSetting({
          key: 'pricing.pro_plan_monthly',
          value: String(price),
          description: 'Pro plan monthly price in BDT',
          valueType: 'INTEGER',
          isPublic: true,
        });
      }
      setStatus({ kind: 'success', message: 'Pricing updated successfully' });
      refetch();
    } catch (e: any) {
      setStatus({ kind: 'error', message: e?.message || 'Failed to save pricing' });
    } finally {
      setSavingPricing(false);
    }
  };

  // Limits Settings
  const maxMenuItemsBasicSetting = useMemo(() => (settings || []).find(s => s.key === 'limits.max_menu_items_basic'), [settings]);
  const maxMenuItemsProSetting = useMemo(() => (settings || []).find(s => s.key === 'limits.max_menu_items_pro'), [settings]);
  const maxTablesBasicSetting = useMemo(() => (settings || []).find(s => s.key === 'limits.max_tables_basic'), [settings]);
  const maxTablesProSetting = useMemo(() => (settings || []).find(s => s.key === 'limits.max_tables_pro'), [settings]);

  const [maxMenuItemsBasic, setMaxMenuItemsBasic] = useState<string>('');
  const [maxMenuItemsPro, setMaxMenuItemsPro] = useState<string>('');
  const [maxTablesBasic, setMaxTablesBasic] = useState<string>('');
  const [maxTablesPro, setMaxTablesPro] = useState<string>('');
  const [savingLimits, setSavingLimits] = useState(false);

  useEffect(() => {
    if (maxMenuItemsBasicSetting) setMaxMenuItemsBasic(String(maxMenuItemsBasicSetting.value ?? ''));
  }, [maxMenuItemsBasicSetting]);
  useEffect(() => {
    if (maxMenuItemsProSetting) setMaxMenuItemsPro(String(maxMenuItemsProSetting.value ?? ''));
  }, [maxMenuItemsProSetting]);
  useEffect(() => {
    if (maxTablesBasicSetting) setMaxTablesBasic(String(maxTablesBasicSetting.value ?? ''));
  }, [maxTablesBasicSetting]);
  useEffect(() => {
    if (maxTablesProSetting) setMaxTablesPro(String(maxTablesProSetting.value ?? ''));
  }, [maxTablesProSetting]);

  const saveLimits = async () => {
    const basicMenuItems = Number(maxMenuItemsBasic);
    const proMenuItems = Number(maxMenuItemsPro);
    const basicTables = Number(maxTablesBasic);
    const proTables = Number(maxTablesPro);

    if (!Number.isInteger(basicMenuItems) || basicMenuItems <= 0 ||
        !Number.isInteger(proMenuItems) || proMenuItems <= 0 ||
        !Number.isInteger(basicTables) || basicTables <= 0 ||
        !Number.isInteger(proTables) || proTables <= 0) {
      setStatus({ kind: 'error', message: 'All limits must be positive integers' });
      return;
    }

    setSavingLimits(true);
    try {
      const promises = [];

      if (maxMenuItemsBasicSetting) {
        promises.push(platformConfigAPI.updatePlatformSetting('limits.max_menu_items_basic', { value: String(basicMenuItems) }));
      }
      if (maxMenuItemsProSetting) {
        promises.push(platformConfigAPI.updatePlatformSetting('limits.max_menu_items_pro', { value: String(proMenuItems) }));
      }
      if (maxTablesBasicSetting) {
        promises.push(platformConfigAPI.updatePlatformSetting('limits.max_tables_basic', { value: String(basicTables) }));
      }
      if (maxTablesProSetting) {
        promises.push(platformConfigAPI.updatePlatformSetting('limits.max_tables_pro', { value: String(proTables) }));
      }

      await Promise.all(promises);
      setStatus({ kind: 'success', message: 'Limits updated successfully' });
      refetch();
    } catch (e: any) {
      setStatus({ kind: 'error', message: e?.message || 'Failed to save limits' });
    } finally {
      setSavingLimits(false);
    }
  };

  // Subscription Settings
  const trialEnabledSetting = useMemo(() => (settings || []).find(s => s.key === 'SUB_TRIAL_ENABLED'), [settings]);
  const trialOncePerRestaurantSetting = useMemo(() => (settings || []).find(s => s.key === 'SUB_TRIAL_ONCE_PER_RESTAURANT'), [settings]);
  const proPeriodDaysSetting = useMemo(() => (settings || []).find(s => s.key === 'SUB_PRO_PERIOD_DAYS'), [settings]);
  const brandingShowPoweredBySetting = useMemo(() => (settings || []).find(s => s.key === 'branding.show_powered_by'), [settings]);

  const [trialEnabled, setTrialEnabled] = useState(true);
  const [trialOncePerRestaurant, setTrialOncePerRestaurant] = useState(true);
  const [proPeriodDays, setProPeriodDays] = useState<string>('');
  const [brandingShowPoweredBy, setBrandingShowPoweredBy] = useState(true);
  const [savingSubscription, setSavingSubscription] = useState(false);

  useEffect(() => {
    if (trialEnabledSetting) setTrialEnabled(String(trialEnabledSetting.value) === 'true');
  }, [trialEnabledSetting]);
  useEffect(() => {
    if (trialOncePerRestaurantSetting) setTrialOncePerRestaurant(String(trialOncePerRestaurantSetting.value) === 'true');
  }, [trialOncePerRestaurantSetting]);
  useEffect(() => {
    if (proPeriodDaysSetting) setProPeriodDays(String(proPeriodDaysSetting.value ?? ''));
  }, [proPeriodDaysSetting]);
  useEffect(() => {
    if (brandingShowPoweredBySetting) setBrandingShowPoweredBy(String(brandingShowPoweredBySetting.value) === 'true');
  }, [brandingShowPoweredBySetting]);

  const saveSubscription = async () => {
    const periodDays = Number(proPeriodDays);
    if (!Number.isInteger(periodDays) || periodDays <= 0) {
      setStatus({ kind: 'error', message: 'Pro period days must be a positive integer' });
      return;
    }

    setSavingSubscription(true);
    try {
      const promises = [];

      if (trialEnabledSetting) {
        promises.push(platformConfigAPI.updatePlatformSetting('SUB_TRIAL_ENABLED', { value: String(trialEnabled) }));
      }
      if (trialOncePerRestaurantSetting) {
        promises.push(platformConfigAPI.updatePlatformSetting('SUB_TRIAL_ONCE_PER_RESTAURANT', { value: String(trialOncePerRestaurant) }));
      }
      if (proPeriodDaysSetting) {
        promises.push(platformConfigAPI.updatePlatformSetting('SUB_PRO_PERIOD_DAYS', { value: String(periodDays) }));
      }
      if (brandingShowPoweredBySetting) {
        promises.push(platformConfigAPI.updatePlatformSetting('branding.show_powered_by', { value: String(brandingShowPoweredBy) }));
      }

      await Promise.all(promises);
      setStatus({ kind: 'success', message: 'Subscription settings updated successfully' });
      refetch();
    } catch (e: any) {
      setStatus({ kind: 'error', message: e?.message || 'Failed to save subscription settings' });
    } finally {
      setSavingSubscription(false);
    }
  };

  // Notification Settings
  const notifyDaysBeforeTrialEndSetting = useMemo(() => (settings || []).find(s => s.key === 'SUB_NOTIFY_DAYS_BEFORE_TRIAL_END'), [settings]);
  const notifyDaysBeforePeriodEndSetting = useMemo(() => (settings || []).find(s => s.key === 'SUB_NOTIFY_DAYS_BEFORE_PERIOD_END'), [settings]);

  const [notifyDaysBeforeTrialEnd, setNotifyDaysBeforeTrialEnd] = useState<string>('');
  const [notifyDaysBeforePeriodEnd, setNotifyDaysBeforePeriodEnd] = useState<string>('');
  const [savingNotifications, setSavingNotifications] = useState(false);

  useEffect(() => {
    if (notifyDaysBeforeTrialEndSetting) setNotifyDaysBeforeTrialEnd(String(notifyDaysBeforeTrialEndSetting.value ?? ''));
  }, [notifyDaysBeforeTrialEndSetting]);
  useEffect(() => {
    if (notifyDaysBeforePeriodEndSetting) setNotifyDaysBeforePeriodEnd(String(notifyDaysBeforePeriodEndSetting.value ?? ''));
  }, [notifyDaysBeforePeriodEndSetting]);

  const saveNotifications = async () => {
    const trialDays = Number(notifyDaysBeforeTrialEnd);
    const periodDays = Number(notifyDaysBeforePeriodEnd);

    if (!Number.isInteger(trialDays) || trialDays < 0 ||
        !Number.isInteger(periodDays) || periodDays < 0) {
      setStatus({ kind: 'error', message: 'Notification days must be non-negative integers' });
      return;
    }

    setSavingNotifications(true);
    try {
      const promises = [];

      if (notifyDaysBeforeTrialEndSetting) {
        promises.push(platformConfigAPI.updatePlatformSetting('SUB_NOTIFY_DAYS_BEFORE_TRIAL_END', { value: String(trialDays) }));
      }
      if (notifyDaysBeforePeriodEndSetting) {
        promises.push(platformConfigAPI.updatePlatformSetting('SUB_NOTIFY_DAYS_BEFORE_PERIOD_END', { value: String(periodDays) }));
      }

      await Promise.all(promises);
      setStatus({ kind: 'success', message: 'Notification settings updated successfully' });
      refetch();
    } catch (e: any) {
      setStatus({ kind: 'error', message: e?.message || 'Failed to save notification settings' });
    } finally {
      setSavingNotifications(false);
    }
  };


  // Auto-clear status messages
  useEffect(() => {
    if (status) {
      const t = setTimeout(() => setStatus(null), 3000);
      return () => clearTimeout(t);
    }
  }, [status]);


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
          <CardTitle className="flex items-center gap-2">
            Default Trial Days
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>Global default trial length applied when starting trials</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription>
            Global default trial length applied when starting trials. Key: <code>SUB_TRIAL_DAYS_DEFAULT</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="sm:w-56 w-full">
            <div className="flex items-center gap-2">
              <Label htmlFor="default-trial-days">Days</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>Enter a positive integer number of days</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
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

      {/* Global Toggles */}
      <Card>
        <CardHeader>
          <CardTitle>Global Toggles</CardTitle>
          <CardDescription>
            Common platform-wide feature switches
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>Temporarily disable the app for maintenance</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-sm text-muted-foreground">Temporarily disable the app for maintenance</p>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="maintenance-mode" checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
              <Button size="sm" onClick={saveMaintenance} disabled={savingMaintenance}>
                <Save className="w-4 h-4 mr-2" /> {savingMaintenance ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="registration-enabled">Registration Enabled</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>Allow new user signups</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-sm text-muted-foreground">Allow new user signups</p>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="registration-enabled" checked={registrationEnabled} onCheckedChange={setRegistrationEnabled} />
              <Button size="sm" onClick={saveRegistration} disabled={savingRegistration}>
                <Save className="w-4 h-4 mr-2" /> {savingRegistration ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="ai-enabled">AI Features</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>Enable AI-powered features</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-sm text-muted-foreground">Enable AI-powered features</p>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="ai-enabled" checked={aiEnabled} onCheckedChange={setAiEnabled} />
              <Button size="sm" onClick={saveAI} disabled={savingAI}>
                <Save className="w-4 h-4 mr-2" /> {savingAI ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Default Grace Days */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Default Grace Days
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>Days allowed after trial/period end before restrictions apply</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription>
            Applies after trial/period ends. Key: <code>SUB_GRACE_DAYS_DEFAULT</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="sm:w-56 w-full">
            <div className="flex items-center gap-2">
              <Label htmlFor="default-grace-days">Days</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>Enter a non-negative integer</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="default-grace-days"
              type="number"
              inputMode="numeric"
              placeholder="e.g., 3"
              value={graceDays}
              onChange={(e) => setGraceDays(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={saveGraceDays} disabled={savingGrace}>
              <Save className="w-4 h-4 mr-2" /> {savingGrace ? 'Saving…' : 'Save'}
            </Button>
            {graceSetting && (
              <Badge variant="secondary" className="self-center">Current: {graceSetting.value}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Pricing Settings
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>Configure subscription pricing for Pro plans</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription>
            Set pricing for Pro plan subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="sm:w-56 w-full">
            <div className="flex items-center gap-2">
              <Label htmlFor="pro-plan-monthly">Pro Plan Monthly (BDT)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>Monthly subscription price for Pro plan in Bangladeshi Taka</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="pro-plan-monthly"
              type="number"
              inputMode="numeric"
              placeholder="e.g., 1500"
              value={proPlanMonthly}
              onChange={(e) => setProPlanMonthly(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={savePricing} disabled={savingPricing}>
              <Save className="w-4 h-4 mr-2" /> {savingPricing ? 'Saving…' : 'Save'}
            </Button>
            {proPlanMonthlySetting && (
              <Badge variant="secondary" className="self-center">Current: ৳{proPlanMonthlySetting.value}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plan Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Plan Limits
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>Set maximum limits for Basic and Pro plan features</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription>
            Configure feature limits for different subscription plans
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="max-menu-items-basic">Basic Plan Menu Items</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>Maximum menu items allowed for Basic plan restaurants</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="max-menu-items-basic"
                type="number"
                value={maxMenuItemsBasic}
                onChange={(e) => setMaxMenuItemsBasic(e.target.value)}
                placeholder="50"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="max-menu-items-pro">Pro Plan Menu Items</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>Maximum menu items allowed for Pro plan restaurants</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="max-menu-items-pro"
                type="number"
                value={maxMenuItemsPro}
                onChange={(e) => setMaxMenuItemsPro(e.target.value)}
                placeholder="500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="max-tables-basic">Basic Plan Tables</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>Maximum tables allowed for Basic plan restaurants</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="max-tables-basic"
                type="number"
                value={maxTablesBasic}
                onChange={(e) => setMaxTablesBasic(e.target.value)}
                placeholder="10"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="max-tables-pro">Pro Plan Tables</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>Maximum tables allowed for Pro plan restaurants</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="max-tables-pro"
                type="number"
                value={maxTablesPro}
                onChange={(e) => setMaxTablesPro(e.target.value)}
                placeholder="100"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={saveLimits} disabled={savingLimits}>
              <Save className="w-4 h-4 mr-2" /> {savingLimits ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Subscription Settings
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>Configure trial and subscription behavior</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription>
            Control trial availability and subscription periods
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="trial-enabled">Enable Free Trials</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>Allow new restaurants to start free trials</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-sm text-muted-foreground">Allow new restaurants to start free trials</p>
            </div>
            <Switch id="trial-enabled" checked={trialEnabled} onCheckedChange={setTrialEnabled} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="trial-once-per-restaurant">One Trial Per Restaurant</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>Restrict each restaurant to only one trial period</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-sm text-muted-foreground">Restrict each restaurant to only one trial period</p>
            </div>
            <Switch id="trial-once-per-restaurant" checked={trialOncePerRestaurant} onCheckedChange={setTrialOncePerRestaurant} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="branding-show-powered-by">Show "Powered by" Branding</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>Show Menu.X branding on Basic plan restaurants</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-sm text-muted-foreground">Show Menu.X branding on Basic plan restaurants</p>
            </div>
            <Switch id="branding-show-powered-by" checked={brandingShowPoweredBy} onCheckedChange={setBrandingShowPoweredBy} />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="sm:w-56 w-full">
              <div className="flex items-center gap-2">
                <Label htmlFor="pro-period-days">Pro Period Days</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>Number of days granted per Pro subscription period</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="pro-period-days"
                type="number"
                value={proPeriodDays}
                onChange={(e) => setProPeriodDays(e.target.value)}
                placeholder="30"
              />
            </div>
            <Button onClick={saveSubscription} disabled={savingSubscription}>
              <Save className="w-4 h-4 mr-2" /> {savingSubscription ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Notification Settings
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>Configure when to notify restaurant owners about subscription events</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription>
            Set notification timing for subscription events
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="notify-trial-end">Days Before Trial End</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>How many days before trial expires to notify the owner</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="notify-trial-end"
                type="number"
                value={notifyDaysBeforeTrialEnd}
                onChange={(e) => setNotifyDaysBeforeTrialEnd(e.target.value)}
                placeholder="3"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="notify-period-end">Days Before Period End</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>How many days before paid period expires to notify the owner</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="notify-period-end"
                type="number"
                value={notifyDaysBeforePeriodEnd}
                onChange={(e) => setNotifyDaysBeforePeriodEnd(e.target.value)}
                placeholder="5"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={saveNotifications} disabled={savingNotifications}>
              <Save className="w-4 h-4 mr-2" /> {savingNotifications ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manual bKash Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Manual bKash Settings
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>Configure bKash payment settings for manual payments</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription>
            Public settings used by the upgrade flow and payment form
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="bkash-merchant">Merchant Number</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>Public bKash merchant number used by payment flows</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="bkash-merchant"
                value={bkashMerchant}
                onChange={(e) => setBkashMerchant(e.target.value)}
                placeholder="01XXXXXXXXX"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="bkash-min-amount">Minimum Amount (BDT)</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>Minimum manual bKash payment amount in BDT</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="bkash-min-amount"
                type="number"
                inputMode="numeric"
                value={bkashMinAmount}
                onChange={(e) => setBkashMinAmount(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="bkash-instructions-en">Instructions (English)</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>Public payment instructions shown in English</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Textarea
                id="bkash-instructions-en"
                value={bkashInstructionsEn}
                onChange={(e) => setBkashInstructionsEn(e.target.value)}
                placeholder="Payment instructions in English"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="bkash-instructions-bn">Instructions (বাংলা)</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>পাবলিক বিকাশ পেমেন্ট নির্দেশনা (বাংলা)</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Textarea
                id="bkash-instructions-bn"
                value={bkashInstructionsBn}
                onChange={(e) => setBkashInstructionsBn(e.target.value)}
                placeholder="বিকাশ পেমেন্ট নির্দেশনা (বাংলা)"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={saveBkashSettings} disabled={savingBkash}>
              <Save className="w-4 h-4 mr-2" /> {savingBkash ? 'Saving…' : 'Save'}
            </Button>
            {bkashMerchantSetting && <Badge variant="secondary" className="self-center">Public</Badge>}
          </div>
        </CardContent>
      </Card>

    </div>
  );
};
