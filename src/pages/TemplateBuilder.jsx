import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Image as ImageIcon, Trash2, Eye, ShoppingCart, Wand2, BookOpen, Save, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function TemplateBuilderPage() {
  const [user, setUser] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState('view'); // view, create, guide
  const [templateIdea, setTemplateIdea] = useState("");
  const [enhancedPrompt, setEnhancedPrompt] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [templateDetails, setTemplateDetails] = useState({
    title: "",
    price: "",
    category: "landing"
  });
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadTemplates();
    }
  }, [user]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.log('User not logged in');
      setIsLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const userTemplates = await base44.entities.Template.filter({
        creator_email: user.email
      }, '-created_date');
      setTemplates(userTemplates);
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!templateIdea.trim()) return;

    setIsEnhancing(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional web designer. A user wants to create a landing page template with this idea:

"${templateIdea}"

Enhance this into a detailed, structured design prompt that includes:
- Specific color schemes (hex codes)
- Typography choices
- Proper spacing and padding guidelines
- Visual hierarchy and depth
- Layout structure (hero, features, CTA, etc.)
- Modern design trends (gradients, shadows, glassmorphism if appropriate)

Make it extremely detailed so an AI image generator can create a beautiful landing page preview. Be specific about:
- Header design and navigation
- Hero section with imagery placement
- Section layouts and card designs
- Button styles and CTAs
- Footer design
- Overall visual theme and mood

Format as a single, comprehensive paragraph.`
      });

      setEnhancedPrompt(response);
    } catch (err) {
      alert('Failed to enhance: ' + err.message);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGeneratePreview = async () => {
    const prompt = enhancedPrompt || templateIdea;
    if (!prompt.trim()) {
      alert('Please enter a template idea first');
      return;
    }

    setIsGenerating(true);
    try {
      // Limit prompt to 800 characters to avoid API errors
      const truncatedPrompt = prompt.length > 800 ? prompt.substring(0, 800) + '...' : prompt;
      const imagePrompt = `Professional landing page website template mockup: ${truncatedPrompt}. Modern, clean, high-quality web design preview. Desktop view. Professional UI/UX.`;

      const response = await base44.integrations.Core.GenerateImage({
        prompt: imagePrompt
      });

      setPreviewImage(response.url);
    } catch (err) {
      alert('Failed to generate preview: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateDetails.title || !templateDetails.price || !previewImage) {
      alert('Please fill in all fields and generate a preview first');
      return;
    }

    if (!user.created_wallet_address && !user.agent_zk_id) {
      alert('Please connect your TTT wallet first in Profile');
      return;
    }

    setIsSaving(true);
    try {
      const wallet = user.created_wallet_address || user.agent_zk_id;
      
      await base44.entities.Template.create({
        title: templateDetails.title,
        description: enhancedPrompt || templateIdea,
        preview_image_url: previewImage,
        html_content: "", // Users will add HTML later via Canva/ChatGPT
        creator_wallet: wallet,
        creator_email: user.email,
        price_kas: parseFloat(templateDetails.price),
        category: templateDetails.category
      });

      alert('Template saved! You can now edit it in Canva using ChatGPT.');
      setStep('view');
      setTemplateIdea("");
      setEnhancedPrompt("");
      setPreviewImage("");
      setTemplateDetails({ title: "", price: "", category: "landing" });
      await loadTemplates();
    } catch (err) {
      alert('Failed to save: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePushToShop = async (template) => {
    if (!confirm('Push this template to the Shop marketplace?')) return;

    try {
      await base44.entities.ShopItem.create({
        title: template.title,
        description: template.description,
        price_kas: template.price_kas,
        images: [template.preview_image_url],
        category: "services",
        condition: "new",
        stock: 999,
        seller_kaspa_address: template.creator_wallet,
        seller_email: template.creator_email,
        seller_username: user.username || user.email.split('@')[0],
        tags: ["template", "landing-page", template.category],
        status: "active"
      });

      alert('Template pushed to Shop successfully! Buyers will need to pay to view.');
    } catch (err) {
      alert('Failed to push to shop: ' + err.message);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm('Delete this template?')) return;

    try {
      await base44.entities.Template.delete(id);
      await loadTemplates();
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl max-w-md">
          <CardContent className="p-8 text-center">
            <Sparkles className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
            <p className="text-gray-400 mb-6">Sign in to create templates</p>
            <Button
              onClick={() => base44.auth.redirectToLogin()}
              className="bg-gradient-to-r from-cyan-500 to-purple-500"
            >
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden" style={{ paddingTop: '8rem', paddingBottom: '6rem' }}>
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[150px]"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-cyan-500/10 rounded-full blur-[180px]"
        />
      </div>

      <div className="relative z-10 p-6 md:p-12 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-2xl blur-xl" />
            <div className="relative w-full h-full bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/30 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Sparkles className="w-10 h-10 text-purple-400" strokeWidth={1.5} />
            </div>
          </div>
          <h1 className="text-5xl font-black text-white mb-3 tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-cyan-400 to-pink-400">
              Template Builder AI
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Create stunning landing page templates with AI and sell them for $KAS
          </p>
        </motion.div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          <Button
            onClick={() => setStep('view')}
            className={step === 'view' ? 'bg-purple-500/20 border-purple-500/50' : 'bg-white/5 border-white/10'}
          >
            <Eye className="w-4 h-4 mr-2" />
            My Templates ({templates.length})
          </Button>
          <Button
            onClick={() => setStep('create')}
            className={step === 'create' ? 'bg-cyan-500/20 border-cyan-500/50' : 'bg-white/5 border-white/10'}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New
          </Button>
          <Button
            onClick={() => setStep('guide')}
            className={step === 'guide' ? 'bg-pink-500/20 border-pink-500/50' : 'bg-white/5 border-white/10'}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Guide
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {step === 'view' && (
            <motion.div
              key="view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {isLoading ? (
                <div className="text-center py-20">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-20">
                  <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-white font-bold text-xl mb-2">No Templates Yet</h3>
                  <p className="text-gray-400 mb-6">Create your first AI-generated template</p>
                  <Button
                    onClick={() => setStep('create')}
                    className="bg-gradient-to-r from-purple-500 to-cyan-500"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Template
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map((template, i) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Card className="bg-white/5 border-white/10 hover:border-purple-500/30 transition-all">
                        <CardContent className="p-4">
                          {template.preview_image_url && (
                            <img
                              src={template.preview_image_url}
                              alt={template.title}
                              className="w-full h-48 object-cover rounded-lg mb-4"
                            />
                          )}
                          <h3 className="text-white font-bold text-lg mb-2">{template.title}</h3>
                          <p className="text-gray-400 text-sm mb-3 line-clamp-2">{template.description}</p>
                          <div className="flex items-center justify-between mb-3">
                            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                              {template.price_kas} KAS
                            </Badge>
                            <code className="text-xs text-gray-500">
                              {template.creator_wallet?.slice(0, 8)}...
                            </code>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => setSelectedTemplate(template)}
                              size="sm"
                              className="flex-1 bg-purple-500/20 border border-purple-500/30 hover:bg-purple-500/30"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button
                              onClick={() => handlePushToShop(template)}
                              size="sm"
                              className="flex-1 bg-green-500/20 border border-green-500/30 hover:bg-green-500/30"
                            >
                              <ShoppingCart className="w-3 h-3 mr-1" />
                              Shop
                            </Button>
                            <Button
                              onClick={() => handleDeleteTemplate(template.id)}
                              size="sm"
                              variant="outline"
                              className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {step === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              <Card className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] border-white/10 backdrop-blur-xl">
                <CardContent className="p-6">
                  <h3 className="text-white font-bold text-xl mb-4">Step 1: Describe Your Template</h3>
                  <Textarea
                    value={templateIdea}
                    onChange={(e) => setTemplateIdea(e.target.value)}
                    placeholder="Example: A modern landing page for a SaaS product with a dark theme, neon accents, and 3D elements..."
                    className="bg-black/30 border-white/10 text-white placeholder:text-gray-500 min-h-[120px] mb-4"
                  />
                  <Button
                    onClick={handleEnhancePrompt}
                    disabled={!templateIdea.trim() || isEnhancing}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {isEnhancing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enhancing with AI...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Enhance with AI
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {enhancedPrompt && (
                <Card className="bg-gradient-to-br from-cyan-500/5 to-purple-500/5 border-cyan-500/20 backdrop-blur-xl">
                  <CardContent className="p-6">
                    <h3 className="text-cyan-400 font-bold text-lg mb-3">✨ Enhanced Design Prompt</h3>
                    <p className="text-gray-300 leading-relaxed text-sm">{enhancedPrompt}</p>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] border-white/10 backdrop-blur-xl">
                <CardContent className="p-6">
                  <h3 className="text-white font-bold text-xl mb-4">Step 2: Generate Preview</h3>
                  <Button
                    onClick={handleGeneratePreview}
                    disabled={(!templateIdea.trim() && !enhancedPrompt) || isGenerating}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 h-12"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Generating AI Preview...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-5 h-5 mr-2" />
                        Generate Template Preview
                      </>
                    )}
                  </Button>

                  {previewImage && (
                    <div className="mt-6">
                      <img
                        src={previewImage}
                        alt="Template preview"
                        className="w-full rounded-lg border border-cyan-500/30 shadow-2xl"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {previewImage && (
                <Card className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] border-white/10 backdrop-blur-xl">
                  <CardContent className="p-6">
                    <h3 className="text-white font-bold text-xl mb-4">Step 3: Save Template</h3>
                    <div className="space-y-4">
                      <Input
                        value={templateDetails.title}
                        onChange={(e) => setTemplateDetails({...templateDetails, title: e.target.value})}
                        placeholder="Template Title"
                        className="bg-black/30 border-white/10 text-white placeholder:text-gray-500"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        value={templateDetails.price}
                        onChange={(e) => setTemplateDetails({...templateDetails, price: e.target.value})}
                        placeholder="Price in KAS"
                        className="bg-black/30 border-white/10 text-white placeholder:text-gray-500"
                      />
                      <select
                        value={templateDetails.category}
                        onChange={(e) => setTemplateDetails({...templateDetails, category: e.target.value})}
                        className="w-full bg-black/30 border border-white/10 text-white rounded-lg p-2.5"
                      >
                        <option value="landing">Landing Page</option>
                        <option value="portfolio">Portfolio</option>
                        <option value="ecommerce">E-commerce</option>
                        <option value="blog">Blog</option>
                        <option value="saas">SaaS</option>
                        <option value="other">Other</option>
                      </select>
                      
                      {user.created_wallet_address || user.agent_zk_id ? (
                        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                          <p className="text-green-300 text-sm">
                            💰 Wallet Connected: {(user.created_wallet_address || user.agent_zk_id)?.slice(0, 12)}...
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                          <p className="text-yellow-300 text-sm">
                            ⚠️ Please connect your TTT wallet in Profile to receive payments
                          </p>
                        </div>
                      )}

                      <Button
                        onClick={handleSaveTemplate}
                        disabled={isSaving}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 h-12"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5 mr-2" />
                            Save Template
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {step === 'guide' && (
            <motion.div
              key="guide"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <Card className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] border-white/10 backdrop-blur-xl">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-white mb-6">📚 How to Create & Edit Templates</h2>
                  
                  <div className="space-y-6">
                    <div className="p-6 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-300 font-bold">
                          1
                        </div>
                        <h3 className="text-white font-bold text-lg">Generate Your Template with AI</h3>
                      </div>
                      <p className="text-gray-300 ml-11">
                        Describe your landing page idea, click "Enhance with AI" to get detailed design specs, then generate a preview image.
                      </p>
                    </div>

                    <div className="p-6 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center text-cyan-300 font-bold">
                          2
                        </div>
                        <h3 className="text-white font-bold text-lg">Download & Edit in Canva</h3>
                      </div>
                      <p className="text-gray-300 ml-11 mb-3">
                        Save the AI-generated preview, then open <a href="https://canva.com" target="_blank" className="text-cyan-400 underline">Canva.com</a> and upload it as a reference.
                      </p>
                      <ul className="text-gray-400 text-sm ml-11 space-y-2">
                        <li>• Use the preview as inspiration for colors and layout</li>
                        <li>• Customize text, fonts, and elements</li>
                        <li>• Add your own branding touches</li>
                      </ul>
                    </div>

                    <div className="p-6 bg-pink-500/10 border border-pink-500/30 rounded-xl">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-pink-500/20 rounded-full flex items-center justify-center text-pink-300 font-bold">
                          3
                        </div>
                        <h3 className="text-white font-bold text-lg">Convert to HTML with ChatGPT</h3>
                      </div>
                      <p className="text-gray-300 ml-11 mb-3">
                        Go to <a href="https://chat.openai.com" target="_blank" className="text-pink-400 underline">ChatGPT</a> and ask:
                      </p>
                      <div className="ml-11 p-4 bg-black/30 rounded-lg">
                        <code className="text-sm text-green-400">
                          "Convert this landing page design to clean HTML/CSS/JS code with Tailwind. 
                          Make it responsive and production-ready."
                        </code>
                      </div>
                      <p className="text-gray-400 text-sm ml-11 mt-3">
                        Upload your Canva design screenshot to ChatGPT for best results!
                      </p>
                    </div>

                    <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-xl">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-300 font-bold">
                          4
                        </div>
                        <h3 className="text-white font-bold text-lg">List & Sell Your Template</h3>
                      </div>
                      <p className="text-gray-300 ml-11">
                        Once you have the HTML code, come back here, save your template, and start earning $KAS from buyers!
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 p-6 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/30 rounded-xl">
                    <h4 className="text-white font-bold mb-3">💡 Pro Tips</h4>
                    <ul className="text-gray-300 text-sm space-y-2">
                      <li>• Use the "Enhance with AI" button for better, more detailed designs</li>
                      <li>• Make sure your template is mobile-responsive</li>
                      <li>• Test your HTML code before listing</li>
                      <li>• Price competitively to attract buyers</li>
                      <li>• Connect your TTT wallet to receive payments automatically</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Template Preview Modal */}
      <AnimatePresence>
        {selectedTemplate && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTemplate(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-4xl max-h-[85vh] z-[101] overflow-y-auto flex items-center justify-center"
            >
              <Card className="bg-gradient-to-br from-zinc-900/95 to-black/95 border-cyan-500/30">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">{selectedTemplate.title}</h3>
                      <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                        {selectedTemplate.price_kas} KAS
                      </Badge>
                    </div>
                    <Button
                      onClick={() => setSelectedTemplate(null)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white"
                    >
                      ✕
                    </Button>
                  </div>

                  {selectedTemplate.preview_image_url && (
                    <img
                      src={selectedTemplate.preview_image_url}
                      alt={selectedTemplate.title}
                      className="w-full rounded-lg mb-6 border border-cyan-500/30"
                    />
                  )}

                  <p className="text-gray-300 leading-relaxed mb-6">{selectedTemplate.description}</p>

                  <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2">Payment Address:</p>
                    <code className="text-cyan-400 text-sm">{selectedTemplate.creator_wallet}</code>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}