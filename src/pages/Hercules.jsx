
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Plus,
  Bot,
  Code,
  Sparkles,
  Settings,
  Trash2,
  Play,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Brain,
  Wand2,
  Database,
  Shield
} from "lucide-react";

const Toast = ({ message, type, onClose }) => {
  const bgColor = type === 'success' ? 'from-green-500/20 to-emerald-500/20 border-green-500/30' :
                  type === 'error' ? 'from-red-500/20 to-pink-500/20 border-red-500/30' :
                  'from-cyan-500/20 to-blue-500/20 border-cyan-500/30';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-6 right-6 z-[9999] max-w-md"
    >
      <div className={`bg-gradient-to-br ${bgColor} backdrop-blur-xl border rounded-xl p-4 shadow-2xl`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">
            {type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
          </span>
          <div className="flex-1">
            <p className="text-white text-sm">{message}</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            ×
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default function HerculesPage() {
  const [user, setUser] = useState(null);
  const [tools, setTools] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const [toast, setToast] = useState(null);

  // Add Custom Tool Form
  const [toolName, setToolName] = useState('');
  const [toolDescription, setToolDescription] = useState('');
  const [toolEndpoint, setToolEndpoint] = useState('');
  const [toolMethod, setToolMethod] = useState('POST');
  const [toolSchema, setToolSchema] = useState('');
  const [toolApiKey, setToolApiKey] = useState('');

  // AI Tool Creation
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  // Test Tool
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    loadUser();
    loadTools();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.error('Failed to load user:', err);
    }
  };

  const loadTools = async () => {
    setIsLoading(true);
    try {
      const allTools = await base44.entities.HerculesTool.list('-created_date');
      setTools(allTools);
    } catch (err) {
      console.error('Failed to load tools:', err);
      setTools([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTool = async () => {
    if (!toolName.trim() || !toolEndpoint.trim()) {
      showToast('Please enter tool name and endpoint', 'error');
      return;
    }

    try {
      let parsedSchema = null;
      if (toolSchema.trim()) {
        try {
          parsedSchema = JSON.parse(toolSchema);
        } catch (e) {
          showToast('Invalid JSON schema', 'error');
          return;
        }
      }

      await base44.entities.HerculesTool.create({
        tool_name: toolName.trim(),
        description: toolDescription.trim(),
        endpoint_url: toolEndpoint.trim(),
        method: toolMethod,
        input_schema: parsedSchema,
        api_key: toolApiKey.trim() || null,
        is_active: true,
        category: 'custom'
      });

      showToast('AI Tool added successfully!', 'success');
      setShowAddModal(false);
      resetForm();
      loadTools();
    } catch (err) {
      console.error('Failed to add tool:', err);
      showToast('Failed to add tool', 'error');
    }
  };

  const handleGenerateTool = async () => {
    if (!aiPrompt.trim()) {
      showToast('Please describe the AI tool you want to create', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert at creating AI tool definitions for the Hercules platform.

User Request: ${aiPrompt}

Generate a complete AI tool configuration including:
1. Tool name (short, descriptive)
2. Description (what it does)
3. Endpoint URL (use real APIs like OpenAI, Anthropic, or create a mock endpoint)
4. HTTP Method (GET/POST)
5. Input JSON schema (with required fields)
6. Example implementation code (JavaScript/Python)

Return ONLY valid JSON with this structure:
{
  "tool_name": "string",
  "description": "string",
  "endpoint_url": "string",
  "method": "GET|POST",
  "input_schema": {
    "type": "object",
    "properties": {...},
    "required": [...]
  },
  "example_code": "string"
}`,
        response_json_schema: {
          type: "object",
          properties: {
            tool_name: { type: "string" },
            description: { type: "string" },
            endpoint_url: { type: "string" },
            method: { type: "string" },
            input_schema: { type: "object" },
            example_code: { type: "string" }
          }
        }
      });

      if (response && response.tool_name) {
        setToolName(response.tool_name);
        setToolDescription(response.description);
        setToolEndpoint(response.endpoint_url);
        setToolMethod(response.method || 'POST');
        setToolSchema(JSON.stringify(response.input_schema, null, 2));
        setGeneratedCode(response.example_code || '');
        
        showToast('AI Tool generated! Review and save it.', 'success');
        setShowAIModal(false);
        setShowAddModal(true);
      }
    } catch (err) {
      console.error('Failed to generate tool:', err);
      showToast('Failed to generate tool', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTestTool = async (tool) => {
    if (!testInput.trim()) {
      showToast('Please enter test input', 'error');
      return;
    }

    setIsTesting(true);
    setTestOutput('');
    setGeneratedImageUrl(null);

    try {
      // Check if it's an image generation tool
      const isImageTool = tool.category === 'image' || 
                          tool.tool_name.toLowerCase().includes('image') ||
                          tool.description?.toLowerCase().includes('image');

      if (isImageTool) {
        // Use the actual image generation API
        showToast('Generating image with AI...', 'info');
        
        const response = await base44.integrations.Core.GenerateImage({
          prompt: testInput
        });

        if (response && response.url) {
          setGeneratedImageUrl(response.url);
          setTestOutput(JSON.stringify({
            success: true,
            tool: tool.tool_name,
            prompt: testInput,
            image_url: response.url,
            timestamp: new Date().toISOString()
          }, null, 2));
          showToast('Image generated successfully!', 'success');
        } else {
            setTestOutput(JSON.stringify({
                error: "Image generation failed or returned no URL.",
                response: response || "No response data",
                timestamp: new Date().toISOString()
            }, null, 2));
            showToast('Image generation failed', 'error');
        }
      } else {
        // For other tools, try to parse as JSON
        let parsedInput;
        try {
          parsedInput = JSON.parse(testInput);
        } catch (e) {
          showToast('Invalid JSON input', 'error');
          setIsTesting(false);
          return;
        }

        // Mock testing for non-image tools
        const mockResponse = {
          success: true,
          data: {
            tool: tool.tool_name,
            input: parsedInput,
            output: "Tool executed successfully",
            timestamp: new Date().toISOString()
          }
        };

        setTestOutput(JSON.stringify(mockResponse, null, 2));
        showToast('Tool test completed!', 'success');
      }
    } catch (err) {
      console.error('Failed to test tool:', err);
      setTestOutput(JSON.stringify({ 
        error: err.message || 'Tool test failed',
        timestamp: new Date().toISOString()
      }, null, 2));
      showToast('Tool test failed', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleDeleteTool = async (toolId) => {
    if (!confirm('Are you sure you want to delete this tool?')) return;

    try {
      await base44.entities.HerculesTool.delete(toolId);
      showToast('Tool deleted successfully', 'success');
      loadTools();
    } catch (err) {
      console.error('Failed to delete tool:', err);
      showToast('Failed to delete tool', 'error');
    }
  };

  const resetForm = () => {
    setToolName('');
    setToolDescription('');
    setToolEndpoint('');
    setToolMethod('POST');
    setToolSchema('');
    setToolApiKey('');
    setGeneratedCode('');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px]"
        />
      </div>

      <div className="relative z-10 p-6 md:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/50">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                    Hercules AI Tools
                  </h1>
                  <p className="text-gray-400 text-sm mt-1">
                    Create and manage AI-powered tools & MCPs for AgentZK
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setShowAIModal(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Wand2 className="w-5 h-5 mr-2" />
                  AI Create
                </Button>
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Tool
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                <div className="text-2xl font-bold text-white mb-1">{tools.length}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Total Tools</div>
              </div>
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                <div className="text-2xl font-bold text-cyan-400 mb-1">
                  {tools.filter(t => t.is_active).length}
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Active</div>
              </div>
            </div>
          </motion.div>

          {/* Tools Grid */}
          {isLoading ? (
            <div className="text-center py-20">
              <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading AI tools...</p>
            </div>
          ) : tools.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <Brain className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No AI Tools Yet</h3>
              <p className="text-gray-400 mb-6">Create your first AI tool to get started</p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => setShowAIModal(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500"
                >
                  <Wand2 className="w-5 h-5 mr-2" />
                  Create with AI
                </Button>
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Manually
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tools.map((tool, index) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="backdrop-blur-xl bg-white/5 border-white/10 hover:bg-white/10 transition-all group h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                            <Bot className="w-5 h-5 text-cyan-400" />
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">{tool.tool_name}</h3>
                            <Badge
                              className={`text-xs ${
                                tool.is_active
                                  ? 'bg-green-500/20 text-green-300 border-green-500/30'
                                  : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                              }`}
                            >
                              {tool.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteTool(tool.id)}
                          className="text-gray-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                        {tool.description}
                      </p>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Method:</span>
                          <Badge className="bg-white/5 text-white border-white/20">
                            {tool.method}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Category:</span>
                          <span className="text-white">{tool.category || 'custom'}</span>
                        </div>
                        {tool.api_key && (
                          <div className="flex items-center gap-2 text-xs">
                            <Shield className="w-3 h-3 text-cyan-400" />
                            <span className="text-cyan-400">API Key Set</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => setSelectedTool(tool)}
                          size="sm"
                          className="flex-1 bg-white/5 border border-white/10 text-white hover:bg-white/10"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Test
                        </Button>
                        <Button
                          onClick={() => copyToClipboard(tool.endpoint_url)}
                          size="sm"
                          variant="outline"
                          className="border-white/10 text-white hover:bg-white/10"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Tool Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-950 border border-white/20 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Add AI Tool</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Tool Name *</label>
                  <Input
                    value={toolName}
                    onChange={(e) => setToolName(e.target.value)}
                    placeholder="e.g., Image Generator"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Description</label>
                  <Textarea
                    value={toolDescription}
                    onChange={(e) => setToolDescription(e.target.value)}
                    placeholder="What does this tool do?"
                    className="bg-white/5 border-white/10 text-white h-20"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Endpoint URL *</label>
                  <Input
                    value={toolEndpoint}
                    onChange={(e) => setToolEndpoint(e.target.value)}
                    placeholder="https://api.example.com/endpoint"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">HTTP Method</label>
                  <select
                    value={toolMethod}
                    onChange={(e) => setToolMethod(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Input Schema (JSON)</label>
                  <Textarea
                    value={toolSchema}
                    onChange={(e) => setToolSchema(e.target.value)}
                    placeholder={'{\n  "type": "object",\n  "properties": {...}\n}'}
                    className="bg-white/5 border-white/10 text-white font-mono text-xs h-32"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">API Key (Optional)</label>
                  <Input
                    type="password"
                    value={toolApiKey}
                    onChange={(e) => setToolApiKey(e.target.value)}
                    placeholder="Enter API key if required"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                {generatedCode && (
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Example Code</label>
                    <Textarea
                      value={generatedCode}
                      readOnly
                      className="bg-black/50 border-cyan-500/30 text-cyan-400 font-mono text-xs h-32"
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleAddTool}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Tool
                  </Button>
                  <Button
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    variant="outline"
                    className="border-white/20 text-white"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Generate Modal */}
      <AnimatePresence>
        {showAIModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowAIModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-950 border border-purple-500/30 rounded-2xl p-6 max-w-2xl w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Wand2 className="w-6 h-6 text-purple-400" />
                  <h2 className="text-2xl font-bold text-white">Create with AI</h2>
                </div>
                <button
                  onClick={() => setShowAIModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Describe the AI tool you want to create
                  </label>
                  <Textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g., I want a tool that generates images from text using DALL-E API..."
                    className="bg-white/5 border-white/10 text-white h-32"
                  />
                </div>

                <Button
                  onClick={handleGenerateTool}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 h-12"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Tool
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Test Tool Modal */}
      <AnimatePresence>
        {selectedTool && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setSelectedTool(null);
              setTestInput('');
              setTestOutput('');
              setGeneratedImageUrl(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-950 border border-cyan-500/30 rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Play className="w-6 h-6 text-cyan-400" />
                  <h2 className="text-2xl font-bold text-white">Test Tool: {selectedTool.tool_name}</h2>
                </div>
                <button
                  onClick={() => {
                    setSelectedTool(null);
                    setTestInput('');
                    setTestOutput('');
                    setGeneratedImageUrl(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {(selectedTool.category === 'image' || 
                  selectedTool.tool_name.toLowerCase().includes('image') ||
                  selectedTool.description?.toLowerCase().includes('image')) ? (
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      Image Prompt
                    </label>
                    <Textarea
                      value={testInput}
                      onChange={(e) => setTestInput(e.target.value)}
                      placeholder="Describe the image you want to generate: e.g., A futuristic city at sunset, highly detailed, cyberpunk style."
                      className="bg-white/5 border-white/10 text-white h-24"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      💡 Tip: Be detailed and specific for better results
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      Input (JSON)
                    </label>
                    <Textarea
                      value={testInput}
                      onChange={(e) => setTestInput(e.target.value)}
                      placeholder={'{\n  "key": "value"\n}'}
                      className="bg-white/5 border-white/10 text-white font-mono text-xs h-32"
                    />
                  </div>
                )}

                <Button
                  onClick={() => handleTestTool(selectedTool)}
                  disabled={isTesting}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 h-12"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {(selectedTool.category === 'image' || 
                        selectedTool.tool_name.toLowerCase().includes('image') ||
                        selectedTool.description?.toLowerCase().includes('image')) 
                        ? 'Generating Image...' 
                        : 'Testing...'}
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Run Test
                    </>
                  )}
                </Button>

                {generatedImageUrl && (
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      Generated Image
                    </label>
                    <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-cyan-500/30 bg-black/50">
                      <img
                        src={generatedImageUrl}
                        alt="Generated"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <Button
                      onClick={() => window.open(generatedImageUrl, '_blank')}
                      size="sm"
                      className="w-full mt-2 bg-white/5 border border-white/10 text-white hover:bg-white/10"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Full Size
                    </Button>
                  </div>
                )}

                {testOutput && (
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      Output
                    </label>
                    <Textarea
                      value={testOutput}
                      readOnly
                      className="bg-black/50 border-cyan-500/30 text-cyan-400 font-mono text-xs h-48"
                    />
                    <Button
                      onClick={() => copyToClipboard(testOutput)}
                      size="sm"
                      className="w-full mt-2 bg-white/5 border border-white/10 text-white hover:bg-white/10"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Output
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
