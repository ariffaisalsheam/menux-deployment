import React, { useRef, useState } from 'react';
import { Crown, Brain, Wand2, CheckCircle, ArrowRight, Sparkles, RefreshCw, Copy, Plus, Trash2, Save, Upload, Download, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useAuth } from '../../contexts/AuthContext';
import { aiAPI, mediaAPI, mediaProxyUrl, menuAPI } from '../../services/api';
import { AIErrorHandler } from '../common/AIErrorHandler';
import { withAIRetry } from '../../utils/retry';

export const AIMenuWriter: React.FC = () => {
  const { user } = useAuth();
  const restaurantId = (user as any)?.restaurantId as number | undefined;
  const [menuItemName, setMenuItemName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
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
  }
  const [items, setItems] = useState<BuilderItem[]>([]);
  const [bulkNames, setBulkNames] = useState('');
  const [savingAll, setSavingAll] = useState(false);
  const [saveSummary, setSaveSummary] = useState<{ success: number; failed: number } | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  // AI settings
  const [tone, setTone] = useState<'Friendly' | 'Gourmet' | 'Casual' | 'Elegant' | 'Playful'>('Friendly');
  const [length, setLength] = useState<'Short' | 'Medium' | 'Long'>('Medium');
  const [cuisine, setCuisine] = useState('');
  const isPro = user?.subscriptionPlan === 'PRO';

  const handleGenerateDescription = async () => {
    if (!menuItemName.trim()) return;

    setIsGenerating(true);
    setError('');
    setRetryCount(0);

    try {
      const response = await withAIRetry(
        () => aiAPI.generateDescription(menuItemName.trim()),
        (attempt, error) => {
          setRetryCount(attempt);
          console.log(`AI generation attempt ${attempt} failed:`, error.message);
        }
      );

      const desc = response.description || response.result || response.text || response.content;

      if (desc && desc.trim()) {
        setGeneratedDescription(desc.trim());
      } else {
        setGeneratedDescription('Generated description not available');
      }
    } catch (error: any) {
      console.error('Failed to generate description:', error);

      // Extract detailed error message from the response
      let errorMessage = 'Failed to generate description. Please try again.';

      if (error.response?.data?.error) {
        // Use the exact error message from the backend
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      // Clear any previous description when error occurs
      setGeneratedDescription('');
    } finally {
      setIsGenerating(false);
    }
  };

  // Helpers
  const makePromptName = (name: string) => {
    const parts = [`tone: ${tone}`, `length: ${length}`];
    if (cuisine.trim()) parts.push(`cuisine: ${cuisine.trim()}`);
    return `${name} (${parts.join(', ')})`;
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
    setItems(prev => prev.map(i => (i.id === id ? { ...i, ...patch } : i)));
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
        description: (desc && String(desc).trim()) || target.description,
        status: 'ready'
      });
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.response?.data?.message || e?.message || 'AI generation failed';
      updateItem(id, { status: 'error', errorMsg: String(msg) });
    }
  };

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const generateForAll = async () => {
    // Generate sequentially to avoid rate limits
    for (const it of items) {
      if (!it.name.trim()) continue;
      // eslint-disable-next-line no-await-in-loop
      await generateForItem(it.id);
      // eslint-disable-next-line no-await-in-loop
      await delay(200);
    }
  };

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
    let success = 0;
    let failed = 0;
    for (const it of items) {
      // basic validation
      if (!it.name.trim()) { failed++; continue; }
      const payload = {
        name: it.name.trim(),
        description: it.description?.trim() || '',
        price: parseFloat(it.price || '0') || 0,
        category: it.category,
        isAvailable: it.isAvailable,
        imageUrl: it.imageUrl || ''
      };
      try {
        // eslint-disable-next-line no-await-in-loop
        await menuAPI.createMenuItem(payload);
        success++;
        updateItem(it.id, { status: 'saved' });
      } catch (e) {
        failed++;
        updateItem(it.id, { status: 'error', errorMsg: 'Save failed' });
      }
    }
    setSaveSummary({ success, failed });
    setSavingAll(false);
  };

  const exportJSON = () => {
    const data = JSON.stringify(items, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-menu-draft.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '[]')) as BuilderItem[];
        if (Array.isArray(parsed)) {
          // Normalize ids to avoid collisions
          const normalized = parsed.map((p, idx) => ({
            id: p.id || Date.now() + idx,
            name: p.name || '',
            category: (p.category as Category) || 'MAIN_COURSE',
            price: p.price?.toString?.() || '',
            isAvailable: p.isAvailable ?? true,
            description: p.description || '',
            imageUrl: p.imageUrl || '',
            status: 'idle' as const,
          }));
          setItems(normalized);
        }
      } catch {}
    };
    reader.readAsText(file);
  };

  if (!isPro) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Brain className="w-8 h-8 text-purple-500" />
              AI Menu Writer
            </h1>
            <p className="text-muted-foreground">
              Generate compelling menu descriptions with AI
            </p>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Crown className="w-3 h-3" />
            Pro Feature
          </Badge>
        </div>

        {/* Upgrade Prompt */}
        <Card className="border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Crown className="h-6 w-6 text-yellow-500" />
              Upgrade to Pro for AI Menu Writer
            </CardTitle>
            <CardDescription className="text-base">
              Let AI create mouth-watering descriptions that increase orders and customer engagement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Demo Interface */}
            <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 bg-white/50">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-purple-500" />
                Try the AI Menu Writer (Demo)
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Menu Item Name</label>
                  <Input
                    placeholder="e.g., Chicken Biryani"
                    value="Chicken Biryani"
                    disabled
                    className="mt-1"
                  />
                </div>
                <Button disabled className="w-full">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate AI Description
                </Button>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground italic">
                    "Experience the royal flavors of our signature Chicken Biryani, where tender, marinated chicken meets fragrant basmati rice, slow-cooked with aromatic spices and saffron to create a dish that's both comforting and extraordinary."
                  </p>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">AI-Powered Features:</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Instant description generation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Multiple style options</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Cuisine-specific language</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Customizable tone and length</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Business Benefits:</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">Increase order conversion</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">Save time on menu creation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">Professional descriptions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">Consistent brand voice</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Sample Generations */}
            <div>
              <h3 className="font-semibold mb-3">Sample AI Generations:</h3>
              <div className="space-y-3">
                <Card className="border-purple-200 bg-purple-50">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Brain className="w-5 h-5 text-purple-500 mt-1" />
                      <div>
                        <p className="font-medium">Beef Bhuna</p>
                        <p className="text-sm text-muted-foreground italic">
                          "Indulge in our slow-cooked Beef Bhuna, where tender chunks of premium beef are simmered in a rich, aromatic curry that captures the essence of traditional Bengali cuisine."
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-purple-200 bg-purple-50">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Brain className="w-5 h-5 text-purple-500 mt-1" />
                      <div>
                        <p className="font-medium">Fish Curry</p>
                        <p className="text-sm text-muted-foreground italic">
                          "Dive into the authentic flavors of our Fish Curry, featuring fresh catch of the day in a vibrant mustard-based sauce that's both comforting and exotic."
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Upgrade CTA */}
            <div className="text-center pt-4 border-t">
              <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Pro - ৳1,500/month
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Generate unlimited AI descriptions • Cancel anytime
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pro user content - AI Menu Builder
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="w-8 h-8 text-purple-500" />
            AI Menu Writer
          </h1>
          <p className="text-muted-foreground">Create your entire menu with AI, customize, preview, and save.</p>
        </div>
        <Badge variant="default" className="flex items-center gap-1 bg-yellow-500">
          <Crown className="w-3 h-3" /> Pro Active
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Builder Column */}
        <div className="space-y-6">
          {/* Global AI Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Wand2 className="w-5 h-5 text-purple-500" />AI Settings</CardTitle>
              <CardDescription>Tune the tone and length to match your brand voice</CardDescription>
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
              {items.length === 0 && (
                <div className="text-sm text-muted-foreground">No items yet. Add items above to get started.</div>
              )}
              {items.map((it) => (
                <div key={it.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs">Name</Label>
                        <Input value={it.name} onChange={(e) => updateItem(it.id, { name: e.target.value })} placeholder="Item name" />
                      </div>
                      <div>
                        <Label className="text-xs">Category</Label>
                        <Select value={it.category} onValueChange={(v) => updateItem(it.id, { category: v as any })}>
                          <SelectTrigger className=""><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="APPETIZER">Appetizer</SelectItem>
                            <SelectItem value="MAIN_COURSE">Main Course</SelectItem>
                            <SelectItem value="DESSERT">Dessert</SelectItem>
                            <SelectItem value="BEVERAGE">Beverage</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Price (৳)</Label>
                        <Input type="number" value={it.price} onChange={(e) => updateItem(it.id, { price: e.target.value })} placeholder="0.00" />
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
                      <Button size="sm" variant="secondary" onClick={() => generateForItem(it.id)} disabled={!it.name.trim() || it.status === 'generating'}>
                        <Sparkles className="w-4 h-4 mr-1" /> {it.status === 'generating' ? 'Generating…' : 'Generate'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => removeItem(it.id)} className="text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Description</Label>
                    <Textarea rows={3} value={it.description} onChange={(e) => updateItem(it.id, { description: e.target.value })} placeholder="AI will generate a compelling description here" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div>
                      <Label className="text-xs">Upload Image</Label>
                      <div className="flex items-center gap-2">
                        <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleImageChange(it.id, e.target.files?.[0] || undefined)} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Image Preview</Label>
                      <div className="h-20 w-20 border rounded overflow-hidden flex items-center justify-center bg-gray-50">
                        {it.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img alt="preview" className="h-full w-full object-cover" src={it.imageUrl.startsWith('/api/media/stream') || it.imageUrl.startsWith('http') ? it.imageUrl : mediaProxyUrl(it.imageUrl)} />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                    </div>
                    <div className="text-sm">
                      {it.status === 'error' && <span className="text-red-600">{it.errorMsg}</span>}
                      {it.status === 'saved' && <span className="text-green-600 flex items-center"><CheckCircle className="w-4 h-4 mr-1" />Saved</span>}
                    </div>
                  </div>
                </div>
              ))}

              {items.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <Button onClick={generateForAll} variant="secondary"><Sparkles className="w-4 h-4 mr-2" />Generate All</Button>
                  <Button onClick={saveAllToMenu} disabled={savingAll}><Save className="w-4 h-4 mr-2" />{savingAll ? 'Saving…' : 'Save All to Menu'}</Button>
                  <Button variant="outline" onClick={exportJSON}><Download className="w-4 h-4 mr-2" />Export JSON</Button>
                  <input ref={importFileRef} type="file" accept="application/json" className="hidden" onChange={(e) => importJSON(e.target.files?.[0] || undefined)} />
                  <Button variant="outline" onClick={() => importFileRef.current?.click()}><Upload className="w-4 h-4 mr-2" />Import JSON</Button>
                  {saveSummary && (
                    <span className="text-sm text-muted-foreground ml-auto">Saved {saveSummary.success}, Failed {saveSummary.failed}</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live Preview Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Live Menu Preview</CardTitle>
              <CardDescription>See how your menu will look to customers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.length === 0 && <div className="text-sm text-muted-foreground">Add items to see a live preview here.</div>}
              {/* Group by category */}
              {(['APPETIZER','MAIN_COURSE','DESSERT','BEVERAGE'] as Category[]).map(cat => {
                const group = items.filter(i => i.category === cat);
                if (group.length === 0) return null;
                const catLabel = cat === 'APPETIZER' ? 'Appetizers' : cat === 'MAIN_COURSE' ? 'Main Course' : cat === 'DESSERT' ? 'Desserts' : 'Beverages';
                return (
                  <div key={cat} className="space-y-2">
                    <h3 className="text-lg font-semibold">{catLabel}</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
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
            </CardContent>
          </Card>

          {/* Quick single-item generator for convenience */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Wand2 className="w-5 h-5 text-purple-500" />Quick Generator</CardTitle>
              <CardDescription>Test the AI on a single item</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm">Menu Item Name</Label>
                <Input placeholder="e.g., Chicken Biryani" value={menuItemName} onChange={(e) => setMenuItemName(e.target.value)} className="mt-1" />
              </div>
              <Button onClick={handleGenerateDescription} disabled={!menuItemName.trim() || isGenerating} className="w-full">
                {isGenerating ? (<><Sparkles className="w-4 h-4 mr-2 animate-spin" />Generating…</>) : (<><Sparkles className="w-4 h-4 mr-2" />Generate AI Description</>)}
              </Button>
              {error && (<AIErrorHandler error={error} onRetry={handleGenerateDescription} className="mb-2" />)}
              {retryCount > 0 && isGenerating && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700">Retrying... (Attempt {retryCount + 1})</p>
                </div>
              )}
              {generatedDescription && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h4 className="font-medium mb-2">Generated Description:</h4>
                  <p className="text-sm italic">{generatedDescription}</p>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={handleGenerateDescription} disabled={isGenerating}>
                      <RefreshCw className="w-3 h-3 mr-1" /> Regenerate
                    </Button>
                    <Button size="sm" onClick={async () => {
                      try {
                        if (navigator.clipboard?.writeText) {
                          await navigator.clipboard.writeText(generatedDescription);
                        } else {
                          const ta = document.createElement('textarea');
                          ta.value = generatedDescription;
                          document.body.appendChild(ta);
                          ta.select();
                          document.execCommand('copy');
                          document.body.removeChild(ta);
                        }
                        setCopySuccess(true);
                        setTimeout(() => setCopySuccess(false), 2000);
                      } catch (e) {
                        console.warn('Clipboard copy failed', e);
                      }
                    }}>
                      <Copy className="w-3 h-3 mr-1" /> {copySuccess ? 'Copied!' : 'Copy Description'}
                    </Button>
                  </div>
                  {copySuccess && (
                    <div className="mt-2 text-sm text-green-600 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" /> Description copied to clipboard!
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
