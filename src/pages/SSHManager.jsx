import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Terminal, Plus, Trash2, Play, Loader2, Server, 
  CheckCircle2, XCircle, Edit2, Save, X, FolderOpen
} from "lucide-react";

export default function SSHManager() {
  const [connections, setConnections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [testingId, setTestingId] = useState(null);
  const [newConnection, setNewConnection] = useState({
    project_name: "",
    host: "",
    port: 22,
    username: "",
    password: "",
    connection_type: "password",
    project_path: "",
    description: ""
  });

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    setIsLoading(true);
    try {
      const allConnections = await base44.entities.SSHConnection.list('-created_date', 50);
      setConnections(allConnections);
    } catch (err) {
      console.error('Failed to load connections:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newConnection.project_name || !newConnection.host || !newConnection.username) {
      alert('Please fill in required fields');
      return;
    }

    try {
      await base44.entities.SSHConnection.create(newConnection);
      setShowAddForm(false);
      setNewConnection({
        project_name: "",
        host: "",
        port: 22,
        username: "",
        password: "",
        connection_type: "password",
        project_path: "",
        description: ""
      });
      await loadConnections();
    } catch (err) {
      console.error('Failed to add connection:', err);
      alert('Failed to add connection: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this SSH connection?')) return;
    
    try {
      await base44.entities.SSHConnection.delete(id);
      await loadConnections();
    } catch (err) {
      console.error('Failed to delete connection:', err);
      alert('Failed to delete connection');
    }
  };

  const handleTest = async (id) => {
    setTestingId(id);
    try {
      const { data } = await base44.functions.invoke('sshExecute', {
        action: 'test',
        connection_id: id
      });

      if (data.success) {
        alert('✅ SSH Connection Successful!');
        await loadConnections();
      } else {
        alert('❌ SSH Connection Failed: ' + data.error);
      }
    } catch (err) {
      console.error('Test failed:', err);
      alert('Test failed: ' + err.message);
    } finally {
      setTestingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative z-10 p-6 md:p-8 lg:p-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                  <Terminal className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white" style={{ fontFamily: 'monospace' }}>SSH Manager</h1>
                  <p className="text-gray-400 text-sm">Manage remote project connections</p>
                </div>
              </div>

              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Connection
              </Button>
            </div>
          </motion.div>

          {/* Add Connection Form */}
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                <CardHeader className="border-b border-white/10">
                  <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'monospace' }}>New SSH Connection</h2>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Project Name *</label>
                      <Input
                        value={newConnection.project_name}
                        onChange={(e) => setNewConnection({...newConnection, project_name: e.target.value})}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="My Project"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Host *</label>
                      <Input
                        value={newConnection.host}
                        onChange={(e) => setNewConnection({...newConnection, host: e.target.value})}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="example.com or 192.168.1.1"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Port</label>
                      <Input
                        type="number"
                        value={newConnection.port}
                        onChange={(e) => setNewConnection({...newConnection, port: parseInt(e.target.value)})}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="22"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Username *</label>
                      <Input
                        value={newConnection.username}
                        onChange={(e) => setNewConnection({...newConnection, username: e.target.value})}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="root or user"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Password</label>
                      <Input
                        type="password"
                        value={newConnection.password}
                        onChange={(e) => setNewConnection({...newConnection, password: e.target.value})}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="********"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Project Path</label>
                      <Input
                        value={newConnection.project_path}
                        onChange={(e) => setNewConnection({...newConnection, project_path: e.target.value})}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="/home/user/project"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Description</label>
                    <Input
                      value={newConnection.description}
                      onChange={(e) => setNewConnection({...newConnection, description: e.target.value})}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="Production server, Dev environment, etc."
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      onClick={() => setShowAddForm(false)}
                      variant="outline"
                      className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAdd}
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Connection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Connections List */}
          {connections.length === 0 ? (
            <Card className="backdrop-blur-xl bg-white/5 border-white/10">
              <CardContent className="py-16 text-center">
                <Server className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-2">No SSH connections yet</p>
                <p className="text-gray-600 text-sm">Add your first remote project connection</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {connections.map((conn, index) => (
                <motion.div
                  key={conn.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="backdrop-blur-xl bg-white/5 border-white/10 hover:border-cyan-500/30 transition-all">
                    <CardHeader className="border-b border-white/10">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center">
                            <Server className="w-5 h-5 text-cyan-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'monospace' }}>
                              {conn.project_name}
                            </h3>
                            {conn.description && (
                              <p className="text-sm text-gray-400">{conn.description}</p>
                            )}
                          </div>
                        </div>

                        <Badge
                          variant="outline"
                          className={conn.status === 'connected' 
                            ? "bg-green-500/20 text-green-300 border-green-500/30"
                            : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                          }
                        >
                          {conn.status === 'connected' ? (
                            <><CheckCircle2 className="w-3 h-3 mr-1" /> Connected</>
                          ) : (
                            <><XCircle className="w-3 h-3 mr-1" /> Disconnected</>
                          )}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-6 space-y-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Host:</span>
                          <span className="text-white font-mono">{conn.host}:{conn.port}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Username:</span>
                          <span className="text-white font-mono">{conn.username}</span>
                        </div>
                        {conn.project_path && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Path:</span>
                            <span className="text-white font-mono text-xs">{conn.project_path}</span>
                          </div>
                        )}
                        {conn.last_connected && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Last Connected:</span>
                            <span className="text-white text-xs">
                              {new Date(conn.last_connected).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleTest(conn.id)}
                          disabled={testingId === conn.id}
                          size="sm"
                          className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10"
                        >
                          {testingId === conn.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Testing...
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Test
                            </>
                          )}
                        </Button>

                        <Button
                          onClick={() => handleDelete(conn.id)}
                          size="sm"
                          variant="outline"
                          className="bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
}