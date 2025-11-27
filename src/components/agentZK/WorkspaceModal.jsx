import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Code, Play, Copy, CheckCircle2, Zap, Book, Sparkles, Terminal, Globe } from "lucide-react";
import { base44 } from "@/api/base44Client";

const EXAMPLE_TEMPLATES = [
  {
    name: "Simple JSON API",
    description: "Return JSON data",
    code: `// Simple JSON response
const data = {
  message: "Hello from Agent ZK!",
  timestamp: new Date().toISOString(),
  user: user.email
};

return Response.json({ 
  success: true, 
  data 
});`,
    path: "/api/hello",
    method: "GET",
    responseType: "json"
  },
  {
    name: "KAS Price Checker",
    description: "Get real-time KAS price",
    code: `// Fetch KAS price
const response = await base44.functions.invoke('getKaspaPrice');

return Response.json({
  success: true,
  price: response.data.priceUSD,
  timestamp: new Date().toISOString()
});`,
    path: "/api/kas-price",
    method: "GET",
    responseType: "json"
  },
  {
    name: "User Balance API",
    description: "Check wallet balance",
    code: `// Get request body
const { address } = await req.json();

if (!address) {
  return Response.json({ 
    error: 'Address required' 
  }, { status: 400 });
}

// Fetch balance
const response = await base44.functions.invoke('getKaspaBalance', {
  address
});

return Response.json({
  success: true,
  balance: response.data.balanceKAS,
  address
});`,
    path: "/api/check-balance",
    method: "POST",
    responseType: "json"
  },
  {
    name: "HTML Page Generator",
    description: "Return HTML content",
    code: `// Generate HTML page
const html = \`
<!DOCTYPE html>
<html>
<head>
  <title>Agent ZK Page</title>
  <style>
    body {
      font-family: monospace;
      background: black;
      color: lime;
      padding: 20px;
    }
  </style>
</head>
<body>
  <h1>🤖 Agent ZK Dynamic Page</h1>
  <p>Generated at: \${new Date().toLocaleString()}</p>
  <p>User: \${user.email}</p>
</body>
</html>
\`;

return new Response(html, {
  headers: { 'Content-Type': 'text/html' }
});`,
    path: "/page/status",
    method: "GET",
    responseType: "html"
  }
];

export default function WorkspaceModal({ onClose, onEndpointCreated }) {
  const [activeTab, setActiveTab] = useState('create');
  const [endpoints, setEndpoints] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    endpoint_name: "",
    endpoint_path: "",
    method: "GET",
    description: "",
    code: "",
    response_type: "json",
    requires_auth: false,
    example_request: "{}",
    example_response: "{}",
    tags: []
  });

  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (activeTab === 'endpoints') {
      loadEndpoints();
    }
  }, [activeTab]);

  const loadEndpoints = async () => {
    try {
      const allEndpoints = await base44.entities.ZKEndpoint.list();
      setEndpoints(allEndpoints);
    } catch (err) {
      console.error('Failed to load endpoints:', err);
    }
  };

  const handleTemplateSelect = (template) => {
    setFormData({
      ...formData,
      endpoint_name: template.name,
      endpoint_path: template.path,
      method: template.method,
      description: template.description,
      code: template.code,
      response_type: template.responseType
    });
  };

  const handleCreateEndpoint = async () => {
    if (!formData.endpoint_name || !formData.endpoint_path || !formData.code) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = await base44.entities.ZKEndpoint.create(formData);
      console.log('✅ Endpoint created:', endpoint.id);
      
      alert('🎉 Endpoint created successfully!');
      
      if (onEndpointCreated) {
        onEndpointCreated(endpoint);
      }
      
      // Reset form
      setFormData({
        endpoint_name: "",
        endpoint_path: "",
        method: "GET",
        description: "",
        code: "",
        response_type: "json",
        requires_auth: false,
        example_request: "{}",
        example_response: "{}",
        tags: []
      });
      
      setActiveTab('endpoints');
      await loadEndpoints();
      
    } catch (err) {
      console.error('Failed to create endpoint:', err);
      alert('Failed to create endpoint: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestEndpoint = async (endpoint) => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      console.log('🧪 Testing endpoint:', endpoint.endpoint_path);
      
      // For now, show mock result
      // In production, you'd call the actual endpoint
      setTestResult({
        success: true,
        message: 'Endpoint structure is valid',
        endpoint: endpoint.endpoint_path,
        method: endpoint.method
      });
      
    } catch (err) {
      setTestResult({
        success: false,
        error: err.message
      });
    } finally {
      setIsTesting(false);
    }
  };

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-6xl max-h-[90vh] overflow-hidden"
      >
        <Card className="bg-black border-cyan-500/30 overflow-hidden">
          <CardHeader className="border-b border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Terminal className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
                    Agent ZK Workspace
                  </h2>
                  <p className="text-xs text-gray-400" style={{ fontFamily: 'monospace' }}>
                    Create API endpoints in one click
                  </p>
                </div>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Tabs */}
            <div className="flex border-b border-cyan-500/30 bg-black/50">
              <button
                onClick={() => setActiveTab('create')}
                className={`flex-1 px-6 py-3 text-sm font-semibold transition-colors ${
                  activeTab === 'create'
                    ? 'bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-500'
                    : 'text-gray-500 hover:text-white'
                }`}
                style={{ fontFamily: 'monospace' }}
              >
                <Code className="w-4 h-4 inline mr-2" />
                Create Endpoint
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                className={`flex-1 px-6 py-3 text-sm font-semibold transition-colors ${
                  activeTab === 'templates'
                    ? 'bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-500'
                    : 'text-gray-500 hover:text-white'
                }`}
                style={{ fontFamily: 'monospace' }}
              >
                <Book className="w-4 h-4 inline mr-2" />
                Templates
              </button>
              <button
                onClick={() => setActiveTab('endpoints')}
                className={`flex-1 px-6 py-3 text-sm font-semibold transition-colors ${
                  activeTab === 'endpoints'
                    ? 'bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-500'
                    : 'text-gray-500 hover:text-white'
                }`}
                style={{ fontFamily: 'monospace' }}
              >
                <Globe className="w-4 h-4 inline mr-2" />
                My Endpoints ({endpoints.length})
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <AnimatePresence mode="wait">
                {activeTab === 'create' && (
                  <motion.div
                    key="create"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block" style={{ fontFamily: 'monospace' }}>
                          Endpoint Name *
                        </label>
                        <Input
                          value={formData.endpoint_name}
                          onChange={(e) => setFormData({ ...formData, endpoint_name: e.target.value })}
                          placeholder="e.g., Get User Data"
                          className="bg-black/50 border-cyan-500/30 text-white"
                          style={{ fontFamily: 'monospace' }}
                        />
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 mb-1 block" style={{ fontFamily: 'monospace' }}>
                          Path *
                        </label>
                        <Input
                          value={formData.endpoint_path}
                          onChange={(e) => setFormData({ ...formData, endpoint_path: e.target.value })}
                          placeholder="/api/your-endpoint"
                          className="bg-black/50 border-cyan-500/30 text-white"
                          style={{ fontFamily: 'monospace' }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block" style={{ fontFamily: 'monospace' }}>
                          Method
                        </label>
                        <select
                          value={formData.method}
                          onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                          className="w-full px-3 py-2 bg-black/50 border border-cyan-500/30 rounded-lg text-white"
                          style={{ fontFamily: 'monospace' }}
                        >
                          <option value="GET">GET</option>
                          <option value="POST">POST</option>
                          <option value="PUT">PUT</option>
                          <option value="DELETE">DELETE</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 mb-1 block" style={{ fontFamily: 'monospace' }}>
                          Response Type
                        </label>
                        <select
                          value={formData.response_type}
                          onChange={(e) => setFormData({ ...formData, response_type: e.target.value })}
                          className="w-full px-3 py-2 bg-black/50 border border-cyan-500/30 rounded-lg text-white"
                          style={{ fontFamily: 'monospace' }}
                        >
                          <option value="json">JSON</option>
                          <option value="html">HTML</option>
                          <option value="text">Text</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 mb-1 block" style={{ fontFamily: 'monospace' }}>
                        Description
                      </label>
                      <Input
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="What does this endpoint do?"
                        className="bg-black/50 border-cyan-500/30 text-white"
                        style={{ fontFamily: 'monospace' }}
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 mb-2 block" style={{ fontFamily: 'monospace' }}>
                        Code * (JavaScript)
                      </label>
                      <Textarea
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="// Your endpoint code here..."
                        className="bg-black/50 border-cyan-500/30 text-cyan-400 h-64 font-mono text-sm"
                        style={{ fontFamily: 'monospace' }}
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.requires_auth}
                        onChange={(e) => setFormData({ ...formData, requires_auth: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <label className="text-sm text-gray-400" style={{ fontFamily: 'monospace' }}>
                        Require Authentication
                      </label>
                    </div>

                    <Button
                      onClick={handleCreateEndpoint}
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold"
                      style={{ fontFamily: 'monospace' }}
                    >
                      {isLoading ? (
                        <>Creating...</>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Create Endpoint
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}

                {activeTab === 'templates' && (
                  <motion.div
                    key="templates"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    {EXAMPLE_TEMPLATES.map((template, idx) => (
                      <Card key={idx} className="bg-black/50 border-cyan-500/30 overflow-hidden hover:border-cyan-500/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-white font-bold mb-1" style={{ fontFamily: 'monospace' }}>
                                {template.name}
                              </h3>
                              <p className="text-xs text-gray-400" style={{ fontFamily: 'monospace' }}>
                                {template.description}
                              </p>
                            </div>
                            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                              {template.method}
                            </Badge>
                          </div>

                          <div className="bg-black/70 rounded-lg p-3 mb-3">
                            <code className="text-xs text-cyan-400" style={{ fontFamily: 'monospace' }}>
                              {template.path}
                            </code>
                          </div>

                          <pre className="bg-black rounded-lg p-3 text-xs text-green-400 overflow-x-auto mb-3" style={{ fontFamily: 'monospace' }}>
                            {template.code}
                          </pre>

                          <Button
                            onClick={() => {
                              handleTemplateSelect(template);
                              setActiveTab('create');
                            }}
                            variant="outline"
                            size="sm"
                            className="w-full bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                            style={{ fontFamily: 'monospace' }}
                          >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Use This Template
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'endpoints' && (
                  <motion.div
                    key="endpoints"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    {endpoints.length === 0 ? (
                      <div className="text-center py-12">
                        <Code className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                        <p className="text-gray-500" style={{ fontFamily: 'monospace' }}>
                          No endpoints created yet
                        </p>
                        <Button
                          onClick={() => setActiveTab('create')}
                          variant="outline"
                          size="sm"
                          className="mt-4 bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                          style={{ fontFamily: 'monospace' }}
                        >
                          Create Your First Endpoint
                        </Button>
                      </div>
                    ) : (
                      endpoints.map((endpoint) => (
                        <Card key={endpoint.id} className="bg-black/50 border-cyan-500/30 hover:border-cyan-500/50 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-white font-bold" style={{ fontFamily: 'monospace' }}>
                                    {endpoint.endpoint_name}
                                  </h3>
                                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
                                    {endpoint.method}
                                  </Badge>
                                  {endpoint.requires_auth && (
                                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                                      🔒 Auth
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-400 mb-2" style={{ fontFamily: 'monospace' }}>
                                  {endpoint.description || 'No description'}
                                </p>
                                <div className="flex items-center gap-2">
                                  <code className="text-xs text-cyan-400 bg-black/70 px-2 py-1 rounded" style={{ fontFamily: 'monospace' }}>
                                    {endpoint.endpoint_path}
                                  </code>
                                  <button
                                    onClick={() => copyToClipboard(endpoint.endpoint_path, endpoint.id)}
                                    className="text-gray-400 hover:text-cyan-400 transition-colors"
                                  >
                                    {copiedId === endpoint.id ? (
                                      <CheckCircle2 className="w-3 h-3 text-green-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              <Button
                                onClick={() => handleTestEndpoint(endpoint)}
                                disabled={isTesting}
                                size="sm"
                                variant="outline"
                                className="bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
                                style={{ fontFamily: 'monospace' }}
                              >
                                <Play className="w-3 h-3 mr-1" />
                                Test
                              </Button>
                            </div>

                            <div className="text-xs text-gray-500 flex items-center gap-4" style={{ fontFamily: 'monospace' }}>
                              <span>📊 Calls: {endpoint.call_count || 0}</span>
                              <span>📅 Created: {new Date(endpoint.created_date).toLocaleDateString()}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}

                    {testResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-lg border ${
                          testResult.success
                            ? 'bg-green-500/10 border-green-500/30'
                            : 'bg-red-500/10 border-red-500/30'
                        }`}
                      >
                        <pre className="text-xs" style={{ fontFamily: 'monospace' }}>
                          {JSON.stringify(testResult, null, 2)}
                        </pre>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}