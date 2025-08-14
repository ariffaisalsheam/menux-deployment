import React, { useState } from 'react';
import { Crown, Brain, Wand2, CheckCircle, ArrowRight, Sparkles, RefreshCw, Copy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { aiAPI } from '../../services/api';
import { AIErrorHandler } from '../common/AIErrorHandler';
import { withAIRetry } from '../../utils/retry';

export const AIMenuWriter: React.FC = () => {
  const { user } = useAuth();
  const [menuItemName, setMenuItemName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
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

  // Pro user content
  return (
    <div className="space-y-6">
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
        <Badge variant="default" className="flex items-center gap-1 bg-yellow-500">
          <Crown className="w-3 h-3" />
          Pro Active
        </Badge>
      </div>

      {/* AI Generation Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-purple-500" />
            Generate Menu Description
          </CardTitle>
          <CardDescription>
            Enter your menu item name and let AI create an engaging description
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Menu Item Name</label>
            <Input
              placeholder="e.g., Chicken Biryani, Beef Bhuna, Fish Curry"
              value={menuItemName}
              onChange={(e) => setMenuItemName(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button 
            onClick={handleGenerateDescription}
            disabled={!menuItemName.trim() || isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate AI Description
              </>
            )}
          </Button>

          {error && (
            <AIErrorHandler
              error={error}
              onRetry={handleGenerateDescription}
              className="mb-4"
            />
          )}

          {retryCount > 0 && isGenerating && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4">
              <p className="text-sm text-blue-700">
                Retrying... (Attempt {retryCount + 1})
              </p>
            </div>
          )}

          {generatedDescription && (
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-medium mb-2">Generated Description:</h4>
              <p className="text-sm italic">{generatedDescription}</p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGenerateDescription}
                  disabled={isGenerating}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Regenerate
                </Button>
                <Button
                  size="sm"
                  onClick={async () => {
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
                  }}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  {copySuccess ? 'Copied!' : 'Copy Description'}
                </Button>
              </div>
              {copySuccess && (
                <div className="mt-2 text-sm text-green-600 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Description copied to clipboard!
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
