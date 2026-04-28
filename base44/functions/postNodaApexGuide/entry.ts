import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@2.5.2';

/**
 * One-shot function: builds a real PDF guide for NODA + APEX,
 * uploads it via Base44, and creates a TTT Post with the PDF attached.
 *
 * Caller: must be the authenticated user (uses their identity for the post).
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── 1. Long-form content ───────────────────────────────────────────────
    const sections = [
      {
        h: 'NODA + APEX — The Complete Guide',
        sub: 'A visual workflow engine for the Kaspa ecosystem with built-in zero-knowledge proof sealing.',
        body: [
          'NODA is a node-based automation studio. You drag nodes onto a canvas, wire them in sequence, and the engine runs each step in order — passing the previous step\'s output into the next via the {{result}} token. APEX sits on top: every successful run is sealed with a SHA-256 proof, recorded as an on-chain-style ledger entry, with zero payload data leaked.',
          'This guide walks through every node type, every config field, the Brain natural-language builder, the Save & Publish system, auto-run, the X-poster, the new Post-to-TTT step, and the APEX proof pipeline — end to end, no detail skipped.',
        ],
      },
      {
        h: '1. The Canvas',
        body: [
          'When you open NODA, you land on a black workspace with a faint cyan grid. The top bar holds: Back, the workflow name (editable inline), Brain, Example, Add, Save, Hide-layout, Auto, and Run.',
          'Empty state shows a centered "Build your Ultra Workflow" card with a single Add button. Once you add a node it appears as a vertical stack of cards, each numbered (01, 02, 03…) and connected by a soft chevron arrow.',
          'Click a card to open the right-side configuration panel (a 320–384 px split-screen). The currently selected node gets a purple ring; a small green check appears once it has produced an output.',
        ],
      },
      {
        h: '2. The Node Library',
        body: [
          'Click "+ Add" to open the library modal. Twelve node types are organized into four categories: AI, Action, Logic, Data. Each has a colored gradient avatar, a 1-line description, and tag chips for search.',
          'You can filter by category pill (All / AI / Action / Logic / Data) and free-text search across name + description + tags.',
        ],
      },
      {
        h: '3. AI Nodes',
        body: [
          '• AI Prompt — runs a prompt through the LLM. Config: { prompt }. Returns text. Supports {{result}} to chain off the previous step.',
          '• AI Image — generates an image with AI. Config: { prompt }. Returns a URL. Used by downstream email / X / TTT post / Send-to-X steps that auto-detect the most recent image URL.',
          '• Deep Research — actually scrapes the live web in two passes. Pass 1: discovery (8–12 sources, 6–8 key questions, 3–4 angles). Pass 2: synthesis (markdown report with executive summary, detailed findings, perspectives, sources). Config: { topic, depth: shallow|deep }. Uses Gemini-3-Flash with internet context. Returns long-form markdown.',
        ],
      },
      {
        h: '4. Data Nodes',
        body: [
          '• Read TTT Feed — pulls real recent posts from the TTT social feed inside this app. Config: { limit (1–100), keyword (optional) }. Returns a markdown-formatted feed digest with author, date, stamp status, tip count, and content snippet — perfect for chaining into an AI Prompt that reasons over what people are saying.',
          '• Save Output — explicit checkpoint that stores the most recent value. Useful as a debug marker.',
        ],
      },
      {
        h: '5. Action Nodes',
        body: [
          '• Send Email — sends a real email via Base44\'s SendEmail integration. Config: { to, subject, body, from_name? }. Body supports {{result}}, which expands to ALL prior step outputs (text + image URLs) concatenated. Markdown is auto-converted to clean HTML (h1–h6, bold, italic, lists, inline code, links). Raw image URLs become embedded <img> tags. If body lacks {{result}}, any prior ai_image URLs are appended to the bottom of the email automatically.',
          '• Send to X — copies text + image to clipboard and opens X.com\'s compose intent. Auto-truncates to 275 chars. If popup-blocked or an image is present, a fallback modal appears with the preview, an "Open X" button, and copy-text / copy-image buttons. Image is auto-converted to PNG via canvas before clipboard write so the user can Ctrl/Cmd+V it directly into X.',
          '• Post to TTT Feed — auto-publishes to the TTT feed. Config: { author_name?, content_override? }. Walks back through prior nodes to grab the most recent text + the most recent ai_image URL. Posts under your username/wallet automatically. Image attaches via media_files. Returns post_id.',
          '• Webhook — POSTs the previous output to any URL. Config: { url, method }.',
        ],
      },
      {
        h: '6. Logic Nodes',
        body: [
          '• Delay — pauses N seconds before continuing. Config: { seconds }.',
          '• Filter — kills the workflow unless the previous output contains a keyword. Config: { contains }.',
          '• Branch — marks a branching point (visual marker, no enforced logic).',
        ],
      },
      {
        h: '7. The Brain — Natural-Language Builder',
        body: [
          'Click the Brain button (fuchsia/cyan glow, top-left of action group). Type what you want in plain English: "research the latest Kaspa news, write a tweet about it, post it to X" or "pull the top 10 TTT posts about KAS, summarize them, email me at me@example.com".',
          'The Brain calls the LLM with a strict JSON schema and the full node spec. It returns an ordered list of steps with pre-filled configs. NODA validates each step against the registered node templates, applies sensible defaults, ensures send_email always has a valid recipient (falls back to your account email), and auto-runs the workflow immediately on success.',
          'Brain knows: use deep_research for any "find me / latest / news / investigate" request; use read_ttt_feed when the user mentions the TTT feed/community; use post_to_ttt when the user wants to publish; emit N separate ai_image steps when the user asks for N images (no collapsing); always place send_email AFTER all ai_image steps so images auto-embed.',
        ],
      },
      {
        h: '8. {{result}} — The Chaining Token',
        body: [
          'Any string config field supports {{result}}. By default it expands to the most recent prior step\'s output. In send_email body it expands to ALL prior outputs concatenated (text + image URLs in order) — that\'s why a chain of ai_prompt → ai_image → send_email with body "{{result}}" produces an email with the prompt text on top and the generated image embedded below, automatically.',
          'For nested object outputs, {{key}} extracts a property from the previous step\'s output (e.g. {{title}} pulls .title from a JSON result).',
        ],
      },
      {
        h: '9. Auto-Run',
        body: [
          'Toggle the Auto button (turns emerald green with pulsing icon). NODA debounces for 1.2s on every node/config change, then runs the entire workflow. send_to_x is intentionally skipped during auto-run (so X compose doesn\'t pop open repeatedly). Auto suppresses one cycle right after a Brain build to avoid double-running.',
        ],
      },
      {
        h: '10. The Run Engine',
        body: [
          'When you click Run (or Auto fires), the engine: (1) flips a runningRef so concurrent triggers no-op; (2) opens the bottom run-log panel; (3) iterates nodes top→bottom; (4) calls executeNode(node, context, nodeList) per step; (5) writes the return value to context[node.id] and updateNode(...{output}); (6) logs ✓ or ✗ with a timestamp; (7) on first failure, breaks the loop and marks allSucceeded=false.',
          'executeNode is a single switch statement covering all 12 node types. AI calls go through withRetry (2 attempts, 800 ms backoff) to ride out flaky network blips on image generation.',
        ],
      },
      {
        h: '11. APEX — Zero-Knowledge Proof Sealing',
        body: [
          'After a workflow finishes successfully (allSucceeded === true) AND the user is authenticated, NODA seals an APEX proof. The payload is metadata only — no node contents, no prompt text, no output data: workflowName | nodeCount | durationMs | startedAt | userEmail.',
          'That string is hashed with SHA-256 via the Web Crypto API (crypto.subtle.digest). The resulting 64-char hex hash is written to the ApexProof entity along with workflow_id, workflow_name, node_count, duration_ms, and completed_at.',
          'Failed runs are NEVER sealed. APEX errors are silent — they cannot block NODA. The Run log shows "🛡 APEX proof sealed" on success.',
        ],
      },
      {
        h: '12. The APEX Page',
        body: [
          'Visit /APEX for the cinematic dragon-themed landing. Three layered Framer Motion dragon images parallax as you scroll (golden dragon on volcanic peak → red flying dragon breathing fire → DAG dragon coiled around a node network). Sections: Hero, Features (immutability, zero-data privacy, DAG-linked verification), How-it-Works (3 steps), Proof Feed (live polling of ApexProof entity, auto-refresh every 15s), CTA.',
          'The Proof Feed is read-only and public — anyone can see proof hashes, durations, timestamps, and workflow names, but never any actual workflow data.',
        ],
      },
      {
        h: '13. Save & Publish',
        body: [
          'Click Save to store the current workflow as a NodaWorkflow entity. Modal asks for: name, description (optional), and a public/private toggle. Public workflows can be invoked by any signed-in app user via the runNodaWorkflow backend function; private workflows are owner-only.',
          'On save you get a workflow_id and a copy-paste call snippet: base44.functions.invoke("runNodaWorkflow", { workflow_id, inputs }) — letting other apps in the ecosystem trigger this exact node sequence with optional input overrides.',
        ],
      },
      {
        h: '14. Hide Layout / World 360',
        body: [
          'The eye-off button collapses the entire NODA chrome to give the canvas full-screen real estate. A small "Show NODA" floating button restores it.',
          'Some nodes (ai_image) can open a 360° world viewer for the generated panorama via the World toggle in the config panel.',
        ],
      },
      {
        h: '15. The Example Workflow',
        body: [
          'Click "Example" → enter your email → NODA loads a 2-step workflow: AI Prompt (writes a 3-bullet Kaspa briefing in <120 words) → Send Email (delivers it). One click to run, instant proof of concept.',
        ],
      },
      {
        h: '16. End-to-End Recipe',
        body: [
          'A complete "post a thought + image to TTT" run looks like:',
          'Step 1 — AI Prompt: "Write a punchy 2-sentence take on why DAG architecture beats blockchains. No filler."',
          'Step 2 — AI Image: "Cosmic crystalline DAG node network glowing cyan, cinematic, 4k."',
          'Step 3 — Post to TTT Feed: empty config. Pulls Step-1 text + Step-2 image automatically. Posts under your username with the image attached.',
          'Hit Run. Three log lines tick off in <30s. APEX proof sealed. Done.',
        ],
      },
      {
        h: '17. Why It Matters',
        body: [
          'NODA replaces brittle code glue with a visual contract. APEX replaces "trust me bro" with a hash. Together they let any Kaspa-native app spin up an automation, prove it ran without leaking data, and expose it to the rest of the ecosystem with one Save click. Built for builders who care about provenance.',
        ],
      },
    ];

    // ── 2. Render to PDF ───────────────────────────────────────────────────
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 48;
    const maxW = pageW - margin * 2;
    let y = margin;

    const ensureSpace = (needed) => {
      if (y + needed > pageH - margin) {
        doc.addPage();
        y = margin;
      }
    };

    // Cover styling
    doc.setFillColor(8, 12, 20);
    doc.rect(0, 0, pageW, 140, 'F');
    doc.setTextColor(6, 182, 212);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('NODA · APEX', margin, 60);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.text('The Complete Guide', margin, 92);
    doc.setTextColor(180, 180, 180);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Visual workflow engine + zero-knowledge proof sealing for Kaspa.', margin, 116);
    y = 180;

    sections.forEach((sec, i) => {
      if (i === 0) {
        // Cover heading already rendered, just write body
        if (sec.sub) {
          ensureSpace(40);
          doc.setTextColor(60, 60, 60);
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(11);
          const subLines = doc.splitTextToSize(sec.sub, maxW);
          doc.text(subLines, margin, y);
          y += subLines.length * 14 + 12;
        }
      } else {
        ensureSpace(36);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        const hLines = doc.splitTextToSize(sec.h, maxW);
        doc.text(hLines, margin, y);
        y += hLines.length * 18 + 6;
        // accent bar
        doc.setFillColor(6, 182, 212);
        doc.rect(margin, y, 28, 2, 'F');
        y += 14;
      }

      doc.setTextColor(40, 40, 40);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10.5);
      sec.body.forEach((para) => {
        const lines = doc.splitTextToSize(para, maxW);
        ensureSpace(lines.length * 14);
        doc.text(lines, margin, y);
        y += lines.length * 14 + 8;
      });
      y += 6;
    });

    // Footer on every page
    const pageCount = doc.internal.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'normal');
      doc.text(`NODA + APEX · ${new Date().toISOString().split('T')[0]}`, margin, pageH - 24);
      doc.text(`${p} / ${pageCount}`, pageW - margin, pageH - 24, { align: 'right' });
    }

    const pdfBytes = doc.output('arraybuffer');
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    const pdfFile = new File([pdfBlob], 'NODA-APEX-Complete-Guide.pdf', { type: 'application/pdf' });

    // ── 3. Upload PDF ─────────────────────────────────────────────────────
    const upload = await base44.integrations.Core.UploadFile({ file: pdfFile });
    const fileUrl = upload?.file_url;
    if (!fileUrl) throw new Error('PDF upload failed');

    // ── 4. Compose post text ──────────────────────────────────────────────
    const postText = `📘 NODA + APEX — The Complete Guide

Just dropped a full breakdown of how NODA (visual workflow engine) and APEX (zero-knowledge proof sealing) work together on Kaspa.

Every node type. Every config field. The Brain natural-language builder. {{result}} chaining. Auto-run. Save & Publish for cross-app calls. The APEX hash pipeline. Cinematic UI tour. End-to-end recipes.

No detail skipped. Real PDF attached below ↓`;

    // ── 5. Author info ────────────────────────────────────────────────────
    const authorName = user.username || user.full_name || (user.email ? user.email.split('@')[0] : 'NODA');
    const authorWallet = user.created_wallet_address || user.wallet_address || '';
    const authorRole = user.role === 'admin' ? 'admin' : 'user';

    const postPayload = {
      content: postText,
      author_name: authorName,
      author_role: authorRole,
      media_files: [
        {
          url: fileUrl,
          type: 'application/pdf',
          name: 'NODA-APEX-Complete-Guide.pdf',
          size: pdfBytes.byteLength,
        },
      ],
    };
    if (authorWallet) postPayload.author_wallet_address = authorWallet;

    const created = await base44.entities.Post.create(postPayload);

    return Response.json({
      success: true,
      post_id: created?.id,
      pdf_url: fileUrl,
      pdf_size_bytes: pdfBytes.byteLength,
      author: authorName,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});