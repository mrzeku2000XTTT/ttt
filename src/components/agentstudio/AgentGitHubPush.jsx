import React, { useState } from "react";
import { Github, Loader2, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getEpochs, getTrainingStats } from "@/lib/agentTraining";

/**
 * Export the trained agent to the USER'S OWN GitHub account via the per-user
 * OAuth connector — agent config, the on-chain training log, and a runner.
 */
export default function AgentGitHubPush({ wallet, agentName, systemPrompt }) {
  const [repo, setRepo] = useState("agent-internet-agent");
  const [pushing, setPushing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const push = async () => {
    setPushing(true);
    setError("");
    setResult(null);
    const stats = getTrainingStats();
    const epochs = getEpochs();

    const agentJson = {
      name: agentName,
      system_prompt: systemPrompt,
      wallet_address: wallet?.address || null,
      network: "kaspa-mainnet",
      training: { level: stats.level, epochs: stats.confirmed, kas_cycled: stats.kasCycled },
    };

    const files = [
      { path: "agent.json", content: JSON.stringify(agentJson, null, 2) },
      {
        path: "training-log.json",
        content: JSON.stringify(
          epochs.filter((e) => e.txId).map((e) => ({ at: new Date(e.at).toISOString(), tx_id: e.txId, amount_kas: e.amountKas })),
          null, 2
        ),
      },
      {
        path: "README.md",
        content: `# ${agentName}\n\nAn AI agent trained on the **Agent Internet** — every training epoch is a real Kaspa self-send transaction, verifiable on-chain.\n\n- **Training level:** ${stats.level}\n- **Verified epochs:** ${stats.confirmed}\n- **KAS cycled:** ${stats.kasCycled.toFixed(4)}\n- **Agent wallet:** \`${wallet?.address || "not generated"}\`\n\n## System prompt\n\n\`\`\`\n${systemPrompt}\n\`\`\`\n\n## Training log\n\nEvery entry in \`training-log.json\` carries a Kaspa transaction id. Verify any epoch:\n\n\`\`\`\nhttps://explorer.kaspa.org/txs/<tx_id>\n\`\`\`\n\n---\n\nTrained in **Agent Internet Studio** · [tttz.xyz](https://tttz.xyz)\n`,
      },
      {
        path: "run.js",
        content: `import agent from "./agent.json" with { type: "json" };\n\n// Minimal runner — plug in your own LLM provider.\nexport async function run(userMessage, callLLM) {\n  return callLLM({\n    system: agent.system_prompt,\n    prompt: userMessage,\n  });\n}\n\nconsole.log(\`\${agent.name} — level \${agent.training.level}, \${agent.training.epochs} verified epochs\`);\n`,
      },
    ];

    try {
      const res = await base44.functions.invoke("pushAppToUserGitHubOAuth", {
        repo,
        files,
        commitMessage: `Agent Internet: ${agentName} — level ${stats.level} (${stats.confirmed} on-chain epochs)`,
      });
      const data = res?.data || res;
      if (!data?.success) throw new Error(data?.error || "Push failed");
      setResult(data);
    } catch (e) {
      setError(e?.message || "Push failed");
    }
    setPushing(false);
  };

  return (
    <div className="bg-white rounded-2xl ring-1 ring-zinc-200 p-6">
      <div className="flex items-center gap-2 mb-1">
        <Github className="w-4 h-4 text-zinc-700" />
        <h3 className="font-bold text-zinc-900">Push to your GitHub</h3>
      </div>
      <p className="text-sm text-zinc-500 leading-relaxed mb-5">
        Export the agent, its system prompt, and the full on-chain training log into a repo on your own GitHub account.
      </p>

      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Repository name</label>
      <input
        value={repo}
        onChange={(e) => setRepo(e.target.value)}
        className="w-full h-10 px-3 mt-1 mb-4 rounded-xl border border-zinc-200 text-sm font-mono outline-none focus:border-zinc-400"
      />

      <button
        onClick={push}
        disabled={pushing || !repo.trim()}
        className="w-full h-11 rounded-full bg-zinc-900 text-white text-sm font-bold hover:bg-zinc-800 disabled:opacity-40 flex items-center justify-center gap-2"
      >
        {pushing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
        {pushing ? "Pushing…" : "Push agent to GitHub"}
      </button>

      {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
      {result?.repoUrl && (
        <a
          href={result.repoUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-green-600 hover:text-green-700"
        >
          Pushed {result.filesPushed} files — open repo
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}