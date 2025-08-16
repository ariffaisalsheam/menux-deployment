import React, { useEffect, useState } from 'react';
import { Brain, Sparkles, RefreshCw, Plus, Trash2, Save, Image as ImageIcon, Loader2, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from '../ui/dialog';
import { useAuth } from '../../contexts/AuthContext';
import { aiAPI, mediaAPI, mediaProxyUrl, menuAPI } from '../../services/api';
import { withAIRetry } from '../../utils/retry';

export const AIMenuWriter: React.FC = () => {
  const { user } = useAuth();
  const restaurantId = (user as any)?.restaurantId as number | undefined;
  // Builder state
  type Category = 'APPETIZER' | 'MAIN_COURSE' | 'DESSERT' | 'BEVERAGE';
  interface BuilderItem {
    id: number;
    name: string;
    category: Category;
    price: string; // keep string for input control
    isAvailable: boolean;
    description: string;
    imageUrl?: string;
    status?: 'idle' | 'generating' | 'ready' | 'error' | 'saving' | 'saved';
    errorMsg?: string;
    fieldErrors?: { name?: string; price?: string; category?: string };
  }
  const [items, setItems] = useState<BuilderItem[]>([]);
  const [bulkNames, setBulkNames] = useState('');
  const [savingAll, setSavingAll] = useState(false);
  const [saveSummary, setSaveSummary] = useState<{ success: number; failed: number } | null>(null);
  const [validationSummary, setValidationSummary] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  // AI settings
  const [tone, setTone] = useState<'Friendly' | 'Gourmet' | 'Casual' | 'Elegant' | 'Playful'>('Friendly');
  const [length, setLength] = useState<'Short' | 'Medium' | 'Long'>('Medium');
  const [cuisine, setCuisine] = useState('');

  // Draft autosave/restore
  const DRAFT_KEY = 'aimenu_writer_draft_v1';
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftStatus, setDraftStatus] = useState<{ state: 'idle' | 'saving' | 'saved'; at?: number }>({ state: 'idle' });
  useEffect(() => {
    if (draftRestored) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw || '{}');
        if (Array.isArray(parsed.items)) setItems(parsed.items);
        if (parsed.tone) setTone(parsed.tone);
        if (parsed.length) setLength(parsed.length);
        if (typeof parsed.cuisine === 'string') setCuisine(parsed.cuisine);
      }
    } catch {}
    setDraftRestored(true);
  }, [draftRestored]);
  useEffect(() => {
    // mark as saving immediately on edits
    setDraftStatus(prev => ({ ...prev, state: 'saving' }));
    const handle = setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ items, tone, length, cuisine })
        );
      } catch {}
      setDraftStatus({ state: 'saved', at: Date.now() });
    }, 500);
    return () => clearTimeout(handle);
  }, [items, tone, length, cuisine]);
  const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    setItems([]);
    setValidationSummary(null);
    setSaveSummary(null);
    setDraftStatus({ state: 'idle', at: undefined });
  };

  // Helpers
  const formatDateTime = (ts?: number) => {
    if (!ts) return '';
    try {
      return new Date(ts).toLocaleString([], { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };
  const makePromptName = (name: string) => {
    const parts = [`tone: ${tone}`, `length: ${length}`];
    if (cuisine.trim()) parts.push(`cuisine: ${cuisine.trim()}`);
    return `${name} (${parts.join(', ')})`;
  };

  const sanitizeAI = (text: any): string => {
    if (!text) return '';
    let t = String(text).replace(/\r\n/g, '\n');
    // remove bold/italic/code markers
    t = t.replace(/\*\*(.*?)\*\*/g, '$1')
         .replace(/\*(.*?)\*/g, '$1')
         .replace(/__(.*?)__/g, '$1')
         .replace(/_(.*?)_/g, '$1')
         .replace(/`+/g, '');
    // remove list markers at line start and collapse lines
    t = t.split('\n').map(l => l.replace(/^\s*[-*]\s+/, '').trim()).join(' ');
    // remove double quotes (straight and curly) from generated responses
    t = t.replace(/[“”"]/g, '');
    // collapse whitespace
    t = t.replace(/\s+/g, ' ').trim();
    return t;
  };

  const addItemsFromBulk = () => {
    const lines = bulkNames
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);
    if (!lines.length) return;
    setItems(prev => [
      ...prev,
      ...lines.map((name, idx) => ({
        id: Date.now() + idx,
        name,
        category: 'MAIN_COURSE' as Category,
        price: '',
        isAvailable: true,
        description: '',
        imageUrl: '',
        status: 'idle' as const
      }))
    ]);
    setBulkNames('');
  };

  const addEmptyItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: Date.now(),
        name: '',
        category: 'MAIN_COURSE',
        price: '',
        isAvailable: true,
        description: '',
        imageUrl: '',
        status: 'idle'
      }
    ]);
  };

  const removeItem = (id: number) => setItems(prev => prev.filter(i => i.id !== id));

  const updateItem = (id: number, patch: Partial<BuilderItem>) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const next: BuilderItem = { ...(i as BuilderItem), ...patch };
      // Clear field-level errors when corresponding field changes
      if (patch.name !== undefined && i.fieldErrors?.name) {
        next.fieldErrors = { ...(next.fieldErrors || {}), name: undefined };
      }
      if (patch.price !== undefined && i.fieldErrors?.price) {
        next.fieldErrors = { ...(next.fieldErrors || {}), price: undefined };
      }
      if (patch.category !== undefined && i.fieldErrors?.category) {
        next.fieldErrors = { ...(next.fieldErrors || {}), category: undefined };
      }
      // Clean up empty fieldErrors object
      if (next.fieldErrors && !next.fieldErrors.name && !next.fieldErrors.price && !next.fieldErrors.category) {
        delete (next as any).fieldErrors;
      }
      return next;
    }));
  };

  const generateForItem = async (id: number) => {
    const target = items.find(i => i.id === id);
    if (!target || !target.name.trim()) return;
    updateItem(id, { status: 'generating', errorMsg: undefined });
    try {
      const response = await withAIRetry(
        () => aiAPI.generateDescription(makePromptName(target.name.trim())),
        () => {}
      );
      const desc = response.description || response.result || response.text || response.content;
      updateItem(id, {
        description: (desc && sanitizeAI(desc)) || target.description,
        status: 'ready'
      });
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.response?.data?.message || e?.message || 'AI generation failed';
      updateItem(id, { status: 'error', errorMsg: String(msg) });
    }
  };

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  // Bulk generation progress state
  const [bulkGen, setBulkGen] = useState<{ running: boolean; current: number; total: number }>({ running: false, current: 0, total: 0 });

  const generateForAll = async () => {
    const targets = items.filter(it => it.name.trim() && !(it.description || '').toString().trim());
    setBulkGen({ running: true, current: 0, total: targets.length });
    for (const it of targets) {
      // eslint-disable-next-line no-await-in-loop
      await generateForItem(it.id);
      // eslint-disable-next-line no-await-in-loop
      await delay(200);
      setBulkGen(prev => ({ ...prev, current: Math.min(prev.current + 1, prev.total) }));
    }
    setBulkGen(prev => ({ ...prev, running: false }));
  };

  const validateItem = (it: BuilderItem) => {
    const errors: { name?: string; price?: string; category?: string } = {};
    if (!it.name || !it.name.trim()) errors.name = 'Name is needed';
    const priceStr = (it.price ?? '').toString().trim();
    const priceNum = parseFloat(priceStr);
    if (!priceStr) {
      errors.price = 'Price is needed';
    } else if (!isFinite(priceNum) || priceNum <= 0) {
      errors.price = 'Price must be greater than 0';
    }
    if (!it.category) errors.category = 'Category is needed';
    return { valid: Object.keys(errors).length === 0, errors };
  };

  // Build human-friendly summary of validation errors across items
  const buildFriendlySummary = (list: BuilderItem[]) => {
    const invalidItems = list.filter((x) => !validateItem(x).valid);
    if (invalidItems.length === 0) return '';
    let needName = 0, needPriceMissing = 0, invalidPrice = 0, needCategory = 0;
    for (const it of invalidItems) {
      const v = validateItem(it);
      if (v.errors.name) needName++;
      if (v.errors.price) {
        if ((v.errors.price || '').toLowerCase().includes('needed')) needPriceMissing++;
        else invalidPrice++;
      }
      if (v.errors.category) needCategory++;
    }
    const p = (n: number) => (n === 1 ? 'item' : 'items');
    const v = (n: number) => (n === 1 ? 'needs' : 'need');
    const parts: string[] = [];
    if (needName) parts.push(`${needName} ${p(needName)} ${v(needName)} a name`);
    if (needPriceMissing) parts.push(`${needPriceMissing} ${p(needPriceMissing)} ${v(needPriceMissing)} a price`);
    if (invalidPrice) parts.push(`${invalidPrice} ${p(invalidPrice)} ${v(invalidPrice)} a valid price (> 0)`);
    if (needCategory) parts.push(`${needCategory} ${p(needCategory)} ${v(needCategory)} a category`);
    if (parts.length === 1) return parts[0] + '.';
    const total = invalidItems.length;
    return `${total} ${p(total)} have validation errors. Please fix: ${parts.join('; ')}.`;
  };

  // Live invalid count for UI blocking and banner
  const invalidCount = items.reduce((acc, it) => acc + (validateItem(it).valid ? 0 : 1), 0);
  // Items that currently need AI generation (blank descriptions)
  const needGenCount = items.reduce((acc, it) => acc + (it.name.trim() && !(it.description || '').toString().trim() ? 1 : 0), 0);

  const handleImageChange = async (id: number, file?: File) => {
    if (!file) return;
    // Validation like backend: <=1MB, types: jpeg/png/webp
    const MAX_IMAGE_BYTES = 1024 * 1024;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (file.size > MAX_IMAGE_BYTES) {
      updateItem(id, { errorMsg: 'Image too large. Max 1MB.' });
      return;
    }
    if (!allowed.includes(file.type)) {
      updateItem(id, { errorMsg: 'Unsupported image type. Use JPG, PNG, or WebP.' });
      return;
    }
    try {
      updateItem(id, { status: 'saving', errorMsg: undefined });
      const resp = await mediaAPI.uploadImage(file, restaurantId);
      if (resp?.path) {
        updateItem(id, { imageUrl: resp.path, status: 'ready' });
      } else {
        updateItem(id, { status: 'error', errorMsg: 'Upload failed. No path returned.' });
      }
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.response?.data?.message || e?.message || 'Upload failed';
      updateItem(id, { status: 'error', errorMsg: String(msg) });
    }
  };

  const saveAllToMenu = async () => {
    setSavingAll(true);
    setSaveSummary(null);
    setValidationSummary(null);

    // Pre-validate all items and block save if any invalid
    const results = items.map(it => ({ id: it.id, validation: validateItem(it) }));
    const invalidCount = results.filter(r => !r.validation.valid).length;
    if (invalidCount > 0) {
      setItems(prev => prev.map(i => {
        const v = validateItem(i);
        if (!v.valid) {
          return { ...i, fieldErrors: v.errors, status: 'error', errorMsg: 'Please fix the highlighted fields' } as BuilderItem;
        }
        const clean: BuilderItem = { ...(i as BuilderItem) };
        if (clean.fieldErrors) delete (clean as any).fieldErrors;
        return clean;
      }));
      setValidationSummary(buildFriendlySummary(items));
      setSavingAll(false);
      return;
    }

    let success = 0;
    let failed = 0;
    for (const it of items) {
      const payload = {
        name: it.name.trim(),
        description: it.description?.trim() || '',
        price: parseFloat((it.price ?? '0').toString()),
        category: it.category,
        isAvailable: it.isAvailable,
        imageUrl: it.imageUrl || ''
      };
      try {
        // eslint-disable-next-line no-await-in-loop
        await menuAPI.createMenuItem(payload);
        success++;
        updateItem(it.id, { status: 'saved', errorMsg: undefined });
      } catch (e: any) {
        failed++;
        const msg = e?.response?.data?.error || e?.response?.data?.message || e?.message || 'Save failed';
        updateItem(it.id, { status: 'error', errorMsg: String(msg) });
      }
    }
    setSaveSummary({ success, failed });
    setSavingAll(false);
  };

  // Warn on navigation if unsaved draft exists
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (items.length > 0 && !saveSummary) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [items.length, saveSummary]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          <h2 className="text-xl font-semibold">AI Menu Writer</h2>
          {draftStatus.state === 'saving' && (
            <Badge variant="secondary" className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Saving… {formatDateTime(Date.now())}</Badge>
          )}
          {draftStatus.state === 'saved' && (
            <Badge variant="secondary" className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-600" /> Saved {formatDateTime(draftStatus.at)}</Badge>
          )}
          {draftStatus.state === 'idle' && (
            <Badge variant="secondary">Draft autosave</Badge>
          )}
        </div>
      </div>

      {/* AI Settings */}
      <Card>
        <CardHeader>
          <CardTitle>AI Settings</CardTitle>
          <CardDescription>Control tone, length and optional cuisine for generated descriptions</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm">Tone</Label>
            <Select value={tone} onValueChange={(v) => setTone(v as any)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select tone" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Friendly">Friendly</SelectItem>
                <SelectItem value="Gourmet">Gourmet</SelectItem>
                <SelectItem value="Casual">Casual</SelectItem>
                <SelectItem value="Elegant">Elegant</SelectItem>
                <SelectItem value="Playful">Playful</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm">Length</Label>
            <Select value={length} onValueChange={(v) => setLength(v as any)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select length" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Short">Short</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Long">Long</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm">Cuisine (optional)</Label>
            <Input className="mt-1" placeholder="e.g., Bengali, Italian" value={cuisine} onChange={(e) => setCuisine(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Bulk Add */}
      <Card>
        <CardHeader>
          <CardTitle>Add Items in Bulk</CardTitle>
          <CardDescription>Paste one item name per line and click Add</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea rows={4} placeholder={"Chicken Biryani\nBeef Bhuna\nFish Curry"} value={bulkNames} onChange={(e) => setBulkNames(e.target.value)} />
          <div className="flex gap-2">
            <Button onClick={addItemsFromBulk}><Plus className="w-4 h-4 mr-2" />Add Items</Button>
            <Button variant="outline" onClick={addEmptyItem}><Plus className="w-4 h-4 mr-2" />Add Empty Item</Button>
            <Button variant="secondary" onClick={generateForAll} disabled={!items.length}><Sparkles className="w-4 h-4 mr-2" />Generate All</Button>
          </div>
        </CardContent>
      </Card>

      {/* Item Editor List */}
      <Card>
        <CardHeader>
          <CardTitle>Menu Items ({items.length})</CardTitle>
          <CardDescription>Edit details, generate descriptions, upload images</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {bulkGen.running && (
            <div className="w-full">
              <div className="text-xs text-blue-700 mb-1">Generating {bulkGen.current}/{bulkGen.total}</div>
              <div className="h-2 bg-gray-200 rounded">
                <div className="h-2 bg-blue-500 rounded" style={{ width: `${bulkGen.total ? Math.round((bulkGen.current / bulkGen.total) * 100) : 0}%` }} />
              </div>
            </div>
          )}
          {items.length === 0 && (
            <div className="text-sm text-muted-foreground">No items yet. Add items above to get started.</div>
          )}
          {items.map((it) => (
            <div key={it.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">Name</Label>
                    <Input value={it.name} onChange={(e) => updateItem(it.id, { name: e.target.value })} placeholder="Item name" className={it.fieldErrors?.name ? 'border-red-500 focus-visible:ring-red-500' : ''} />
                    {it.fieldErrors?.name && <p className="text-xs text-red-600 mt-1">{it.fieldErrors.name}</p>}
                  </div>
                  <div>
                    <Label className="text-xs">Category</Label>
                    <Select value={it.category} onValueChange={(v) => updateItem(it.id, { category: v as any })}>
                      <SelectTrigger className={it.fieldErrors?.category ? 'border-red-500 focus-visible:ring-red-500' : ''}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="APPETIZER">Appetizer</SelectItem>
                        <SelectItem value="MAIN_COURSE">Main Course</SelectItem>
                        <SelectItem value="DESSERT">Dessert</SelectItem>
                        <SelectItem value="BEVERAGE">Beverage</SelectItem>
                      </SelectContent>
                    </Select>
                    {it.fieldErrors?.category && <p className="text-xs text-red-600 mt-1">{it.fieldErrors.category}</p>}
                  </div>
                  <div>
                    <Label className="text-xs">Price (৳)</Label>
                    <Input type="number" min={0.01} step={0.01} value={it.price} onChange={(e) => updateItem(it.id, { price: e.target.value })} placeholder="0.00" className={it.fieldErrors?.price ? 'border-red-500 focus-visible:ring-red-500' : ''} />
                    {it.fieldErrors?.price && <p className="text-xs text-red-600 mt-1">{it.fieldErrors.price}</p>}
                  </div>
                  <div>
                    <Label className="text-xs">Availability</Label>
                    <div className="flex items-center h-10">
                      <input type="checkbox" checked={it.isAvailable} onChange={(e) => updateItem(it.id, { isAvailable: e.target.checked })} className="mr-2" />
                      <span className="text-sm">{it.isAvailable ? 'Available' : 'Unavailable'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => generateForItem(it.id)} disabled={!it.name.trim() || it.status === 'generating'} title="Generate a description">
                    <Sparkles className="w-3 h-3 mr-1" /> {it.status === 'generating' ? 'Generating…' : 'Generate'}
                  </Button>
                  {Boolean((it.description || '').toString().trim()) && (
                    <Button size="sm" variant="outline" onClick={() => generateForItem(it.id)} disabled={!it.name.trim() || it.status === 'generating'} title="Regenerate description">
                      <RefreshCw className="w-3 h-3 mr-1" /> Regenerate
                    </Button>
                  )}
                  <Button size="sm" variant="destructive" onClick={() => removeItem(it.id)}>
                    <Trash2 className="w-3 h-3 mr-1" /> Remove
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                {it.status === 'generating' && (
                  <div className="mt-2 animate-pulse">
                    <div className="h-3 bg-gray-200 rounded w-11/12 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-10/12 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-9/12" />
                  </div>
                )}
                <Textarea rows={3} disabled={it.status === 'generating'} value={it.description} onChange={(e) => updateItem(it.id, { description: e.target.value })} placeholder="Describe the dish…" />
                {it.status === 'error' && it.errorMsg && (
                  <p className="text-xs text-red-600 mt-1">{it.errorMsg}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 border rounded overflow-hidden bg-gray-50">
                  {it.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={it.name} className="h-full w-full object-cover" src={it.imageUrl.startsWith('/api/media/stream') || it.imageUrl.startsWith('http') ? it.imageUrl : mediaProxyUrl(it.imageUrl)} />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">No Image</div>
                  )}
                </div>
                <label className="inline-flex items-center gap-2 px-3 py-2 border rounded cursor-pointer">
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-sm">Upload Image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(it.id, e.target.files?.[0] || undefined)} />
                </label>
                <span className="text-xs text-muted-foreground">JPG/PNG/WebP, max 1MB</span>
                {it.imageUrl && (
                  <Button size="sm" variant="ghost" onClick={() => updateItem(it.id, { imageUrl: '' })}>Remove</Button>
                )}
                {it.status === 'saving' && <span className="text-xs text-muted-foreground">Uploading…</span>}
                {it.status === 'saved' && <span className="text-xs text-green-600">Saved</span>}
              </div>
            </div>
          ))}
          {items.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {(validationSummary || invalidCount > 0) && (
                <div className="w-full text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
                  {validationSummary ?? buildFriendlySummary(items)}
                </div>
              )}
              <Button onClick={generateForAll} variant="secondary" disabled={needGenCount === 0}>
                <Sparkles className="w-4 h-4 mr-2" />Generate All ({needGenCount})
              </Button>
              <Button onClick={saveAllToMenu} disabled={savingAll || invalidCount > 0}><Save className="w-4 h-4 mr-2" />{savingAll ? 'Saving…' : 'Save All to Menu'}</Button>
              <Button variant="outline" onClick={clearDraft}><RefreshCw className="w-4 h-4 mr-2" />Clear Draft</Button>
              <Button variant="outline" onClick={() => setPreviewOpen(true)}>Preview</Button>
              {saveSummary && (
                <span className="text-sm text-muted-foreground ml-auto">Saved {saveSummary.success}, Failed {saveSummary.failed}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[95vw] md:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[85vh] overflow-y-auto p-0">
          <DialogHeader className="sticky top-0 z-10 bg-background px-6 py-4 border-b">
            <DialogTitle>Live Menu Preview</DialogTitle>
            <DialogDescription>See how your menu will look to customers</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-6 py-4">
            {items.length === 0 && <div className="text-sm text-muted-foreground">Add items to see a live preview here.</div>}
            {(['APPETIZER','MAIN_COURSE','DESSERT','BEVERAGE'] as Category[]).map(cat => {
              const group = items.filter(i => i.category === cat);
              if (group.length === 0) return null;
              const catLabel = cat === 'APPETIZER' ? 'Appetizers' : cat === 'MAIN_COURSE' ? 'Main Course' : cat === 'DESSERT' ? 'Desserts' : 'Beverages';
              return (
                <div key={cat} className="space-y-2">
                  <h3 className="text-lg font-semibold">{catLabel}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {group.map(item => (
                      <Card key={item.id} className={!item.isAvailable ? 'opacity-60' : ''}>
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <div className="h-16 w-16 border rounded overflow-hidden flex-shrink-0 bg-gray-50">
                              {item.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img alt={item.name} className="h-full w-full object-cover" src={item.imageUrl.startsWith('/api/media/stream') || item.imageUrl.startsWith('http') ? item.imageUrl : mediaProxyUrl(item.imageUrl)} />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">No Image</div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{item.name || 'Untitled'}</h4>
                                <Badge variant={item.isAvailable ? 'default' : 'secondary'}>{item.isAvailable ? 'Available' : 'Unavailable'}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{item.description || 'No description yet.'}</p>
                              <p className="text-green-600 font-semibold mt-1">৳{item.price || '0.00'}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-6 py-4 border-t flex justify-end">
            <DialogClose asChild>
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>Close</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
