import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bot, Sparkles, Image as ImageIcon, Upload, Zap, Brain, Clock, BarChart, Settings as SettingsIcon, Trash2, Plus, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";

export default function AgentSettingsModal({ onClose }) {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState('persona');
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    agent_name: '',
    persona: '',
    avatar_url: '',
    voice_tone: 'professional',
    temperature: 0.7,
    enabled_tools: [],
    image_generation_enabled: false,
    image_style: 'professional',
    knowledge_base: [],
    auto_post_enabled: false,
    post_frequency: 'daily',
    context_memory: 10,
    max_tokens: 500,
    is_active: true,
    analytics: { posts: 0, likes: 0, engagement: 0 }
  });

  const availableTools = [
    { id: 'web_search', name: 'Web Search', icon: '🔍' },
    { id: 'image_gen', name: 'Image Generation', icon: '🎨' },
    { id: 'file_upload', name: 'File Upload', icon: '📁' },
    { id: 'data_analysis', name: 'Data Analysis', icon: '📊' },
    { id: 'code_exec', name: 'Code Execution', icon: '💻' },
    { id: 'email', name: 'Email Integration', icon: '📧' }
  ];

  const tabs = [
    { id: 'persona', name: 'Persona', icon: Bot },
    { id: 'tools', name: 'Tools', icon: Zap },
    { id: 'media', name: 'Media', icon: ImageIcon },
    { id: 'behavior', name: 'Behavior', icon: Brain },
    { id: 'automation', name: 'Automation', icon: Clock },
    { id: 'analytics', name: 'Analytics', icon: BarChart }
  ];

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const data = await base44.entities.AgentConfig.list('-created_date');
      setAgents(data);
      if (data.length > 0) {
        setSelectedAgent(data[0]);
        setFormData(data[0]);
      }
    } catch (err) {
      console.error('Failed to load agents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedAgent(null);
    setFormData({
      agent_name: '',
      persona: '',
      avatar_url: '',
      voice_tone: 'professional',
      temperature: 0.7,
      enabled_tools: [],
      image_generation_enabled: false,
      image_style: 'professional',
      knowledge_base: [],
      auto_post_enabled: false,
      post_frequency: 'daily',
      context_memory: 10,
      max_tokens: 500,
      is_active: true,
      analytics: { posts: 0, likes: 0, engagement: 0 }
    });
  };

  const handleSave = async () => {
    if (!formData.agent_name?.trim()) {
      alert('Agent name is required');
      return;
    }
    
    if (!formData.persona?.trim()) {
      alert('Persona is required');
      return;
    }

    setIsSaving(true);
    try {
      const saveData = {
        ...formData,
        agent_name: formData.agent_name.trim(),
        persona: formData.persona.trim(),
        enabled_tools: formData.enabled_tools || [],
        knowledge_base: formData.knowledge_base || [],
        analytics: formData.analytics || { posts: 0, likes: 0, engagement: 0 }
      };

      if (selectedAgent) {
        await base44.entities.AgentConfig.update(selectedAgent.id, saveData);
      } else {
        const newAgent = await base44.entities.AgentConfig.create(saveData);
        setSelectedAgent(newAgent);
      }
      await loadAgents();
      alert('Agent saved successfully!');
    } catch (err) {
      console.error('Failed to save:', err);
      alert(`Failed to save agent: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAgent || !confirm('Delete this agent?')) return;
    
    try {
      await base44.entities.AgentConfig.delete(selectedAgent.id);
      await loadAgents();
      handleCreateNew();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleGenerateAvatar = async () => {
    if (!formData.persona) {
      alert('Please write a persona first');
      return;
    }

    setIsGeneratingAvatar(true);
    try {
      const { url } = await base44.integrations.Core.GenerateImage({
        prompt: `Professional avatar for AI agent with this personality: ${formData.persona}. Style: clean, modern, professional headshot`
      });
      setFormData({ ...formData, avatar_url: url });
    } catch (err) {
      console.error('Failed to generate:', err);
      alert('Failed to generate avatar');
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, knowledge_base: [...formData.knowledge_base, file_url] });
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const toggleTool = (toolId) => {
    const tools = formData.enabled_tools.includes(toolId)
      ? formData.enabled_tools.filter(t => t !== toolId)
      : [...formData.enabled_tools, toolId];
    setFormData({ ...formData, enabled_tools: tools });
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[999] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[999] flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Agent Control Center</h2>
              <p className="text-white/40 text-sm">Configure your AI agents</p>
            </div>
          </div>
          <Button onClick={onClose} variant="ghost" size="sm" className="text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-white/10 p-4 overflow-y-auto">
            <Button
              onClick={handleCreateNew}
              className="w-full mb-4 bg-purple-500 hover:bg-purple-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Agent
            </Button>

            <div className="space-y-2">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => {
                    setSelectedAgent(agent);
                    setFormData(agent);
                  }}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedAgent?.id === agent.id
                      ? 'bg-white/10 border border-white/20'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {agent.avatar_url ? (
                      <img src={agent.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium text-sm truncate">{agent.agent_name}</div>
                      <div className={`text-xs ${agent.is_active ? 'text-green-400' : 'text-red-400'}`}>
                        {agent.is_active ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="flex gap-2 p-4 border-b border-white/10 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? 'bg-white/10 text-white border border-white/20'
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 overflow-y-auto">
              {activeTab === 'persona' && (
                <div className="space-y-6">
                  <div>
                    <label className="text-white font-semibold mb-2 block">Agent Name</label>
                    <Input
                      value={formData.agent_name}
                      onChange={(e) => setFormData({ ...formData, agent_name: e.target.value })}
                      placeholder="e.g., Creative Director AI"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-white font-semibold mb-2 block">Avatar</label>
                    <div className="flex items-center gap-4">
                      {formData.avatar_url ? (
                        <img src={formData.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-white/20" />
                      ) : (
                        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center border-2 border-white/20">
                          <Bot className="w-8 h-8 text-white/40" />
                        </div>
                      )}
                      <Button
                        onClick={handleGenerateAvatar}
                        disabled={isGeneratingAvatar}
                        className="bg-purple-500 hover:bg-purple-600"
                      >
                        {isGeneratingAvatar ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        Generate Avatar
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-white font-semibold mb-2 block">Persona & Personality</label>
                    <Textarea
                      value={formData.persona}
                      onChange={(e) => setFormData({ ...formData, persona: e.target.value })}
                      placeholder="Describe the AI's personality, expertise, communication style, and behavior..."
                      className="bg-white/5 border-white/10 text-white min-h-[200px]"
                    />
                    <p className="text-white/40 text-xs mt-2">This defines how your agent thinks and responds</p>
                  </div>

                  <div>
                    <label className="text-white font-semibold mb-2 block">Voice & Tone</label>
                    <select
                      value={formData.voice_tone}
                      onChange={(e) => setFormData({ ...formData, voice_tone: e.target.value })}
                      className="w-full px-4 py-2 bg-black border border-white/10 rounded-lg text-white"
                      style={{ colorScheme: 'dark', backgroundColor: '#000', color: '#fff' }}
                    >
                      <option value="professional" className="bg-black text-white">Professional</option>
                      <option value="casual" className="bg-black text-white">Casual</option>
                      <option value="creative" className="bg-black text-white">Creative</option>
                      <option value="technical" className="bg-black text-white">Technical</option>
                      <option value="friendly" className="bg-black text-white">Friendly</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'tools' && (
                <div className="space-y-4">
                  <p className="text-white/60 text-sm mb-4">Select tools your agent can use</p>
                  <div className="grid grid-cols-2 gap-4">
                    {availableTools.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => toggleTool(tool.id)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          formData.enabled_tools.includes(tool.id)
                            ? 'bg-purple-500/20 border-purple-500'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="text-3xl mb-2">{tool.icon}</div>
                        <div className="text-white font-semibold">{tool.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'media' && (
                <div className="space-y-6">
                  <div>
                    <label className="flex items-center gap-3 mb-4">
                      <input
                        type="checkbox"
                        checked={formData.image_generation_enabled}
                        onChange={(e) => setFormData({ ...formData, image_generation_enabled: e.target.checked })}
                        className="w-5 h-5"
                      />
                      <span className="text-white font-semibold">Enable Image Generation</span>
                    </label>
                  </div>

                  {formData.image_generation_enabled && (
                    <div>
                      <label className="text-white font-semibold mb-2 block">Image Style</label>
                      <Input
                        value={formData.image_style}
                        onChange={(e) => setFormData({ ...formData, image_style: e.target.value })}
                        placeholder="e.g., professional, artistic, minimalist"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-white font-semibold mb-2 block">Knowledge Base</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      multiple
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="w-full border-white/10 text-white hover:bg-white/5"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Knowledge Files
                    </Button>
                    {formData.knowledge_base.length > 0 && (
                      <div className="mt-2 text-white/60 text-sm">
                        {formData.knowledge_base.length} files uploaded
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'behavior' && (
                <div className="space-y-6">
                  <div>
                    <label className="text-white font-semibold mb-2 block">
                      Creativity Level: {formData.temperature.toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={formData.temperature}
                      onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-white/40 mt-1">
                      <span>Focused</span>
                      <span>Creative</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-white font-semibold mb-2 block">Context Memory</label>
                    <Input
                      type="number"
                      value={formData.context_memory}
                      onChange={(e) => setFormData({ ...formData, context_memory: parseInt(e.target.value) })}
                      className="bg-white/5 border-white/10 text-white"
                    />
                    <p className="text-white/40 text-xs mt-1">Number of previous messages to remember</p>
                  </div>

                  <div>
                    <label className="text-white font-semibold mb-2 block">Max Response Length</label>
                    <Input
                      type="number"
                      value={formData.max_tokens}
                      onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
                      className="bg-white/5 border-white/10 text-white"
                    />
                    <p className="text-white/40 text-xs mt-1">Maximum tokens per response</p>
                  </div>
                </div>
              )}

              {activeTab === 'automation' && (
                <div className="space-y-6">
                  <div>
                    <label className="flex items-center gap-3 mb-4">
                      <input
                        type="checkbox"
                        checked={formData.auto_post_enabled}
                        onChange={(e) => setFormData({ ...formData, auto_post_enabled: e.target.checked })}
                        className="w-5 h-5"
                      />
                      <span className="text-white font-semibold">Enable Auto-Posting</span>
                    </label>
                  </div>

                  {formData.auto_post_enabled && (
                    <div>
                      <label className="text-white font-semibold mb-2 block">Posting Frequency</label>
                      <select
                        value={formData.post_frequency}
                        onChange={(e) => setFormData({ ...formData, post_frequency: e.target.value })}
                        className="w-full px-4 py-2 bg-black border border-white/10 rounded-lg text-white"
                        style={{ colorScheme: 'dark', backgroundColor: '#000', color: '#fff' }}
                      >
                        <option value="hourly" className="bg-black text-white">Every Hour</option>
                        <option value="daily" className="bg-black text-white">Daily</option>
                        <option value="weekly" className="bg-black text-white">Weekly</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-5 h-5"
                      />
                      <span className="text-white font-semibold">Agent Active</span>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="bg-white/5 border-white/10">
                      <CardContent className="p-6">
                        <div className="text-white/60 text-sm mb-2">Total Posts</div>
                        <div className="text-3xl font-bold text-white">{formData.analytics?.posts || 0}</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-white/5 border-white/10">
                      <CardContent className="p-6">
                        <div className="text-white/60 text-sm mb-2">Total Likes</div>
                        <div className="text-3xl font-bold text-white">{formData.analytics?.likes || 0}</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-white/5 border-white/10">
                      <CardContent className="p-6">
                        <div className="text-white/60 text-sm mb-2">Engagement</div>
                        <div className="text-3xl font-bold text-white">{formData.analytics?.engagement || 0}%</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 flex justify-between">
              <Button
                onClick={handleDelete}
                disabled={!selectedAgent}
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Agent
              </Button>

              <div className="flex gap-3">
                <Button onClick={onClose} variant="outline" className="border-white/10 text-white hover:bg-white/5">
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Agent
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}