import React, { useState } from "react";
import { Github, ArrowLeft, Save, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AgentWalletCard from "@/components/agentstudio/AgentWalletCard";
import AgentTrainer from "@/components/agentstudio/AgentTrainer";
import AgentChat from "@/components/agentstudio/AgentChat";
import PushToGitHubModal from "@/components/tttbuilder/PushToGitHubModal";

export default function AgentEditor({ agent, wallet, onWallet, onBack, onChanged, onDeleted }) {
  const [name, setName] = useState(agent.name);
  const [task, setTask] = useState(agent.task || "");
  const [systemPrompt, setSystemPrompt] = useState(agent.system_prompt);
  const [saving, setSaving] = useState(false);
  const [pushOpen, setPushOpen] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await base44.entities.AgentInternetAgent.update(agent.id, {
        name, task, system_prompt: systemPrompt,
      });
      onChanged(updated);
    } catch (e) {
      alert(e?.message || "Save failed");
    }
    setSaving(false);
  };

  const remove = async () => {
    if (!confirm("Delete this agent?")) return;
    await base44.entities.AgentInternetAgent.delete(agent.id);
    onDeleted();
  };

  const files = [
    { path: "agent.json", content: JSON.stringify({
      name, task, system_prompt: systemPrompt,
      wallet_address: wallet?.address || null,
      training_examples: agent.training_examples || [],
      epochs: agent.epochs || 0,
      level: agent.level || 0,
    }, null, 2) },
    { path: "training-log.json", content: JSON.stringify(
      (agent.training_examples || []).map((e) => ({ input: e.input, output: e.output, tx_id: e.tx_id, at: e.at })),
      null, 2
    ) },
    { path: "README.md", content: `# ${name}\n\nA trained AI agent from the **Agent Internet Studio**.\n\n- **Task:** ${task}\n- **Training level:** ${agent.level || 0}\n- **Verified epochs:** ${agent.epochs || 0}\n- **Agent wallet:** \`${wallet?.address || "not generated"}\`\n\n## System prompt\n\n\`\`\`\n${systemPrompt}\n\`\`\`\n\n## Training\n\nEvery epoch in \`training-log.json\` is anchored by a real Kaspa self-send transaction id. Verify any epoch on the explorer:\n\n\`\`\`\nhttps://explorer.kaspa.org/txs/<tx_id>\n\`\`\`\n\n---\n\nTrained in **Agent Internet Studio** · [tttz.xyz](https://tttz.xyz)\n` },
    { path: "run.js", content: `import agent from "./agent.json" with { type: "json" };\n\n// Minimal runner — plug in your own LLM provider.\nexport async function run(userMessage, callLLM) {\n  const examples = agent.training_examples || [];\n  const fewShot = examples.slice(-6).map(e => \`User: \${e.input}\\nAgent: \${e.output}\`).join("\\n\\n");\n  return callLLM({\n    system: \`\${agent.system_prompt}\\n\\nExamples:\\n\${fewShot}\`,\n    prompt: userMessage,\n  });\n}\n\nconsole.log(\`\${agent.name} — level \${agent.level}, \${agent.epochs} verified epochs\`);\n` },
  ];

  return (
    <div className="max-w-5xl mx-auto px-5 pb-24">
      <div className="flex items-center justify-between mb-5">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </button>
        <div className="flex items-center gap-2">
          <button onClick={remove} className="h-9 px-3 rounded-full text-zinc-400 hover:text-red-500 text-xs font-semibold flex items-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
          <button onClick={save} disabled={saving} className="h-9 px-4 rounded-full bg-zinc-100 text-zinc-700 text-xs font-bold hover:bg-zinc-200 disabled:opacity-40 flex items-center gap-1.5">
            <Save className="w-3.5 h-3.5" /> {saving ? "Saving…" : "Save"}
          </button>
          <button onClick={() => setPushOpen(true)} className="h-9 px-4 rounded-full bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 flex items-center gap-1.5">
            <Github className="w-3.5 h-3.5" /> Push to GitHub
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl ring-1 ring-zinc-200 p-6 mb-4">
        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Agent name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full h-10 px-3 mt-1 mb-3 rounded-xl border border-zinc-200 text-sm outline-none focus:border-zinc-400" />
        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Task</label>
        <input value={task} onChange={(e) => setTask(e.target.value)} placeholder="e.g. Summarize Kaspa transactions in plain English" className="w-full h-10 px-3 mt-1 mb-3 rounded-xl border border-zinc-200 text-sm outline-none focus:border-zinc-400" />
        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">System prompt</label>
        <textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={3} className="w-full px-3 py-2 mt-1 rounded-xl border border-zinc-200 text-sm outline-none focus:border-zinc-400 resize-none" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <div className="space-y-4">
          <AgentWalletCard wallet={wallet} onWallet={onWallet} />
          <AgentChat agent={{ ...agent, name, task, system_prompt: systemPrompt }} />
        </div>
        <AgentTrainer agent={agent} wallet={wallet} onChanged={onChanged} />
      </div>

      <PushToGitHubModal
        open={pushOpen}
        onClose={() => setPushOpen(false)}
        files={files}
        defaultName={name}
      />
    </div>
  );
}