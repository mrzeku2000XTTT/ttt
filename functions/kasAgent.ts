import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Anthropic from 'npm:@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });

const SYSTEM_PROMPT = `You are kasAgent, an expert SilverScript smart contract developer for the Kaspa blockchain.

SilverScript is a covenant scripting language for Kaspa. Here is everything you know about it:

PRAGMA:
  pragma silverscript ^0.1.0;

TYPES:
  pubkey  - compressed 33-byte public key (0x02... or 0x03...)
  sig     - cryptographic signature
  byte[N] - fixed-size byte array (e.g. byte[32] for hashes)
  int     - integer number
  bool    - boolean

BUILT-IN FUNCTIONS:
  checkSig(sig s, pubkey pk)               - verify signature against pubkey, returns bool
  checkMultiSig(sig[] sigs, pubkey[] pks)  - verify m-of-n multisig
  blake2b(bytes data)                      - returns byte[32] hash

TRANSACTION CONTEXT (tx.*):
  tx.time                  - current block time (unix timestamp, int)
  tx.inputs[i].value       - value of input i in sompi
  tx.inputs[i].scriptPubKey - script of input i
  tx.outputs[i].value      - value of output i in sompi
  tx.outputs[i].scriptPubKey - script of output i
  tx.activeInputIndex      - index of currently executing input

CONTRACT CONTEXT (this.*):
  this.age                 - how long the UTXO has existed (int, in seconds)

TIME UNITS:
  Use: days (e.g. "7 days" = 604800 seconds)
  1 KAS = 100,000,000 sompi

SCRIPT HELPERS:
  new ScriptPubKeyP2PK(pubkey pk) - creates a standard P2PK locking script (byte[34])

CONTRACT STRUCTURE:
  contract ContractName(arg1Type arg1Name, ...) {
      entrypoint function functionName(param1Type param1Name, ...) {
          require(condition);
          ...
      }
  }

RULES:
- Every contract needs: pragma line, contract definition, at least one entrypoint function
- Only require() statements — no arithmetic operators, no if/else flow control
- All conditions must be expressed as require() checks
- Constructor args are locked at deployment time
- Function parameters come from the spending transaction

When user asks for a contract, respond with:
1. A brief explanation of what you built (1-2 sentences)
2. The complete SilverScript code in a \`\`\`silverscript block
3. A note on constructor args they'll need to fill in

Keep explanations short. Generate correct, complete, working SilverScript code.`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { prompt, history } = await req.json();

    if (!prompt) {
      return Response.json({ error: 'prompt is required' }, { status: 400 });
    }

    // Build messages with history for context
    const messages = [];
    if (history && Array.isArray(history)) {
      for (const msg of history.slice(-6)) { // last 6 messages for context
        messages.push({ role: msg.role, content: msg.content });
      }
    }
    messages.push({ role: 'user', content: prompt });

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages,
    });

    const fullText = response.content[0].text;

    // Extract code block
    const codeMatch = fullText.match(/```(?:silverscript|sil|sol)?\n([\s\S]*?)```/);
    const contractCode = codeMatch ? codeMatch[1].trim() : null;

    // Extract contract name
    let contractName = 'contract';
    if (contractCode) {
      const nameMatch = contractCode.match(/contract\s+(\w+)/);
      if (nameMatch) contractName = nameMatch[1].toLowerCase();
    }

    // Get explanation (text outside code block)
    const explanation = fullText.replace(/```[\s\S]*?```/g, '').trim();

    return Response.json({
      explanation,
      contractCode,
      contractName: contractName + '.sil',
      fullText,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});