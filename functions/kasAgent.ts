import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

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
  tx.outputs[i].value      - value of output i in sompi
  tx.outputs[i].scriptPubKey - script of output i
  tx.activeInputIndex      - index of currently executing input

CONTRACT CONTEXT (this.*):
  this.age                 - how long the UTXO has existed (int, in seconds)

TIME UNITS:
  Use: days (e.g. "7 days" = 604800 seconds)
  1 KAS = 100,000,000 sompi

DATE & TIME HANDLING:
  When a user specifies a specific date and/or time (e.g. "March 15 2027 at 9pm", "2027-06-01 14:30 UTC"), you MUST:
  1. Convert that exact date+time to a Unix timestamp (seconds since Jan 1 1970 UTC)
  2. Use that integer directly as the constructor argument (e.g. int unlockTime = 1805090400)
  3. Show the user the exact Unix timestamp you used and confirm the date/time it represents
  4. If the user gives a timezone (e.g. CST = UTC-6), account for it in your conversion
  5. If only a date is given with no time, default to 00:00:00 UTC on that date
  Always show: "Unlocks at: [original date/time] = Unix timestamp [value]" in your explanation.

SCRIPT HELPERS:
  new ScriptPubKeyP2PK(pubkey pk) - creates a standard P2PK locking script (byte[34])

CONTRACT STRUCTURE:
  contract ContractName(arg1Type arg1Name, ...) {
      entrypoint function functionName(param1Type param1Name, ...) {
          require(condition);
      }
  }

RULES:
- Every contract needs: pragma line, contract definition, at least one entrypoint function
- Only require() statements for logic — no if/else
- Constructor args are locked at deployment time
- Function parameters come from the spending transaction

Respond with:
1. One or two sentences explaining what the contract does
2. The complete SilverScript code in a triple-backtick silverscript code block
3. A brief note on what constructor args to fill in`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { prompt, history } = await req.json();

    if (!prompt) {
      return Response.json({ error: 'prompt is required' }, { status: 400 });
    }

    // Build conversation context
    let contextMessages = '';
    if (history && history.length > 0) {
      contextMessages = history.slice(-4).map(m =>
        `${m.role === 'user' ? 'User' : 'kasAgent'}: ${m.content}`
      ).join('\n') + '\n\n';
    }

    const fullPrompt = `${SYSTEM_PROMPT}\n\n${contextMessages}User: ${prompt}\n\nkasAgent:`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: fullPrompt,
      model: 'claude_sonnet_4_6',
    });

    const fullText = typeof result === 'string' ? result : JSON.stringify(result);

    // Extract code block
    const codeMatch = fullText.match(/```(?:silverscript|sil|sol)?\n([\s\S]*?)```/);
    const contractCode = codeMatch ? codeMatch[1].trim() : null;

    // Extract contract name
    let contractName = 'contract';
    if (contractCode) {
      const nameMatch = contractCode.match(/contract\s+(\w+)/);
      if (nameMatch) contractName = nameMatch[1].toLowerCase();
    }

    // Clean explanation — remove code block from text
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