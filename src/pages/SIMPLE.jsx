import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus, Play, Zap, Database, Send, GitBranch, Clock, Edit2 } from "lucide-react";
import WorkflowCanvas from "@/components/simple/WorkflowCanvas";

export default function SIMPLEPage() {
  const [user, setUser] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [editingWorkflow, setEditingWorkflow] = useState(null);

  useEffect(() => {
    loadUser();
    loadWorkflows();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.log("User not logged in");
      setUser(null);
    }
  };

  const loadWorkflows = () => {
    const saved = localStorage.getItem('simple_workflows');
    if (saved) {
      setWorkflows(JSON.parse(saved));
    }
  };

  const createNewWorkflow = () => {
    const newWorkflow = {
      id: Date.now().toString(),
      name: "New Workflow",
      nodes: [],
      connections: [],
      active: false,
      created: new Date().toISOString()
    };
    setEditingWorkflow(newWorkflow);
  };

  const saveWorkflow = (workflow) => {
    const existing = workflows.find(w => w.id === workflow.id);
    let updated;
    if (existing) {
      updated = workflows.map(w => w.id === workflow.id ? workflow : w);
    } else {
      updated = [...workflows, workflow];
    }
    setWorkflows(updated);
    localStorage.setItem('simple_workflows', JSON.stringify(updated));
    setEditingWorkflow(null);
  };

  const deleteWorkflow = (id) => {
    const updated = workflows.filter(w => w.id !== id);
    setWorkflows(updated);
    localStorage.setItem('simple_workflows', JSON.stringify(updated));
  };

  const nodeTypes = [
    { icon: Zap, name: "Trigger", color: "from-yellow-500 to-orange-500" },
    { icon: Database, name: "Database", color: "from-blue-500 to-cyan-500" },
    { icon: Send, name: "Action", color: "from-green-500 to-emerald-500" },
    { icon: GitBranch, name: "Condition", color: "from-purple-500 to-pink-500" },
    { icon: Clock, name: "Schedule", color: "from-red-500 to-orange-500" },
  ];

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />
      
      <div className="relative z-10 min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link to={createPageUrl("AppStore")}>
              <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            </Link>
            <div>
              <h1 className="text-4xl font-black text-white">SIMPLE</h1>
              <p className="text-white/60">AI Workflow Automation</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {nodeTypes.map((node, i) => {
              const Icon = node.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6 hover:bg-white/10 transition-all cursor-pointer">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${node.color} flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white">{node.name}</h3>
                    <p className="text-white/60 text-sm">Drag to canvas to add</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Your Workflows</h2>
            <Button
              onClick={createNewWorkflow}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Workflow
            </Button>
          </div>

          {workflows.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center"
            >
              <Zap className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">No workflows yet</h3>
              <p className="text-white/60 mb-6">
                Create your first AI automation workflow to get started
              </p>
              <Button
                onClick={createNewWorkflow}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Workflow
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workflows.map((workflow, i) => (
                <motion.div
                  key={workflow.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6 hover:bg-white/10 transition-all cursor-pointer group">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">{workflow.name}</h3>
                        <p className="text-white/40 text-sm">
                          {new Date(workflow.created).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs ${
                        workflow.active 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {workflow.active ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => setEditingWorkflow(workflow)}
                        className="bg-purple-500 hover:bg-purple-600"
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteWorkflow(workflow.id)}
                        className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                      >
                        Delete
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {editingWorkflow && (
        <WorkflowCanvas
          workflow={editingWorkflow}
          onClose={() => setEditingWorkflow(null)}
          onSave={saveWorkflow}
        />
      )}
    </div>
  );
}