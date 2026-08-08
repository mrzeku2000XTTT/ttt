import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// AI audit function: an admin triggers a review of a submitted AppProposal.
// Subagent judges scan the open-source GitHub code + the live Vercel URL for
// malware, phishing, and suspicious patterns, then write a verdict back.

function parseGithubRepo(url) {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('github.com')) return null;
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1] };
  } catch {
    return null;
  }
}

async function fetchGithubFileTree(owner, repo) {
  const base = `https://api.github.com/repos/${owner}/${repo}`;
  // Get repo metadata + default branch
  const repoRes = await fetch(base, { headers: { Accept: 'application/vnd.github+json' } });
  if (!repoRes.ok) return null;
  const repoData = await repoRes.json();
  const branch = repoData.default_branch || 'main';
  // Get the git tree recursively
  const treeRes = await fetch(`${base}/git/trees/${branch}?recursive=1`, { headers: { Accept: 'application/vnd.github+json' } });
  if (!treeRes.ok) return null;
  const treeData = await treeRes.json();
  return treeData;
}

async function fetchGithubFileContent(owner, repo, path, branch) {
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  const res = await fetch(rawUrl);
  if (!res.ok) return null;
  const text = await res.text();
  return text.slice(0, 8000); // cap each file to keep prompt manageable
}

async function scanLiveUrl(url) {
  try {
    const res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'TTT-Auditor/1.0' } });
    const html = await res.text();
    return html.slice(0, 12000);
  } catch {
    return null;
  }
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json();
    const proposalId = body?.proposal_id;
    if (!proposalId) return Response.json({ error: 'proposal_id required' }, { status: 400 });

    const proposal = await base44.asServiceRole.entities.AppProposal.get(proposalId);
    if (!proposal) return Response.json({ error: 'Proposal not found' }, { status: 404 });

    // Mark as running
    await base44.asServiceRole.entities.AppProposal.update(proposalId, {
      audit_status: 'running',
      audit_verdict: 'unknown',
      audit_notes: 'AI audit in progress…',
    });

    // Gather evidence
    let codeSnippets = [];
    let repoInfo = null;
    if (proposal.github_url) {
      const parsed = parseGithubRepo(proposal.github_url);
      if (parsed) {
        const tree = await fetchGithubFileTree(parsed.owner, parsed.repo);
        if (tree && tree.tree) {
          repoInfo = { owner: parsed.owner, repo: parsed.repo, branch: tree.truncated ? 'main' : (tree.tree[0]?.url?.split('/').slice(-2)[0] || 'main') };
          // Pick the most security-relevant files to audit
          const codeFiles = tree.tree
            .filter((f) => f.type === 'blob' && /\.(js|jsx|ts|tsx|json|html|sh|py|env)$/i.test(f.path))
            .filter((f) => !/node_modules|\.git\/|package-lock|yarn\.lock/i.test(f.path))
            .slice(0, 15);
          for (const f of codeFiles) {
            const content = await fetchGithubFileContent(parsed.owner, parsed.repo, f.path, repoInfo.branch);
            if (content) codeSnippets.push({ path: f.path, content });
          }
        }
      }
    }

    const liveHtml = await scanLiveUrl(proposal.app_link);

    // Build the audit prompt for the AI judge
    const codeBlock = codeSnippets.length
      ? codeSnippets.map((s) => `--- ${s.path} ---\n${s.content}`).join('\n\n')
      : '(No GitHub source provided or unreachable)';
    const htmlBlock = liveHtml ? liveHtml.slice(0, 8000) : '(Live URL unreachable)';

    const auditPrompt = `You are a security auditor reviewing a web app submitted to a Kaspa app store. 
Analyze the following for MALWARE, PHISHING, and SUSPICIOUS behavior:

Check for:
1. Obfuscated/malicious JavaScript (eval, atob+Function, crypto drainers, clipboard hijack, redirect to phishing)
2. Fake login forms that steal credentials or seed phrases
3. Wallet drainer patterns (requesting unlimited approvals, swapping to attacker addresses)
4. Data exfiltration to suspicious endpoints
5. Iframe clickjacking or credential harvesting
6. Hardcoded attacker wallet addresses with auto-send logic
7. XSS injection points

GITHUB SOURCE CODE:
${codeBlock}

LIVE PAGE HTML:
${htmlBlock}

Respond as JSON with this exact schema:
{
  "verdict": "safe" | "suspicious" | "malicious",
  "confidence": number (0-100),
  "findings": [string] (specific issues found, empty if safe),
  "summary": string (one-line conclusion)
}`;

    const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: auditPrompt,
      model: 'claude_sonnet_4_6',
      response_json_schema: {
        type: 'object',
        properties: {
          verdict: { type: 'string', enum: ['safe', 'suspicious', 'malicious'] },
          confidence: { type: 'number' },
          findings: { type: 'array', items: { type: 'string' } },
          summary: { type: 'string' },
        },
        required: ['verdict', 'confidence', 'findings', 'summary'],
      },
    });

    const verdict = llmRes?.verdict || 'unknown';
    const confidence = llmRes?.confidence ?? 0;
    const findings = Array.isArray(llmRes?.findings) ? llmRes.findings : [];
    const summary = llmRes?.summary || 'No summary returned.';

    const notes = [
      `Verdict: ${verdict} (${confidence}% confidence)`,
      summary,
      findings.length ? 'Findings:\n' + findings.map((f) => `• ${f}`).join('\n') : 'No specific findings.',
      codeSnippets.length ? `Audited ${codeSnippets.length} source files from GitHub.` : 'No GitHub source available for audit.',
      liveHtml ? 'Live URL scanned.' : 'Live URL unreachable.',
    ].join('\n\n');

    const auditStatus = verdict === 'safe' ? 'passed' : 'flagged';

    await base44.asServiceRole.entities.AppProposal.update(proposalId, {
      audit_status: auditStatus,
      audit_verdict: verdict,
      audit_notes: notes,
      audit_date: new Date().toISOString(),
    });

    return Response.json({
      ok: true,
      verdict,
      confidence,
      findings,
      summary,
      audit_status: auditStatus,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}