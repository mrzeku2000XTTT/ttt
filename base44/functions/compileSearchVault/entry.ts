import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { Sandbox } from 'npm:e2b@2.36.1';
import { secrets } from 'base44:runtime';

// Search Kaspa SearchVault — compiles the official SilverScript v1.0.0 covenant
// (kaspanet/silverscript, prebuilt silverc) with per-user constructor args:
//   [0] owner = the searcher's 32-byte Schnorr public key (from Scorpion connect)
//   [1] feeRecipient = the TTT Search treasury Schnorr public key (ews chip)
// Only PUBLIC keys flow through this function — keys stay in KCC20 Wallet.
// Returns the SilAbiArtifact (schema_version 1) the wallet's compileVault funds.

const TREASURY_PUBKEY = '284bb3e4d46276c03d2ef6aaa0e0d62ec2698f939d1b55a8011d77fe5ca6f7ba';
const SILVERC_URL = 'https://github.com/kaspanet/silverscript/releases/download/v1.0.0/silverc-linux-x86_64.tar.gz';

const SEARCH_VAULT_SIL = `pragma silverscript ^1.0.0;

// Search Kaspa metering vault — official SilverScript v1.0.0 (kaspanet/silverscript).
// Each pay_search_fee spends this UTXO and MUST emit:
//   outputs[0] = EXACTLY 100_000 sompi (0.001 KAS) to feeRecipient P2PK
//   outputs[1] = remaining - MINER_FEE back to THIS same covenant scriptPubKey
//   tx.outputs.length == 2  (no piggyback outputs)
// No CLTV, no tx.time, no this.ageDaa. Replay is impossible: a UTXO spends once.
// Owner must sign pay_search_fee so a stranger cannot burn prepaid searches.
// unlock: owner takes the remainder to their P2PK (emergency exit).
// Compile: silverc SearchVault.sil --constructor-args args.json
// KCC20 Argent does NOT compile .sil — paste the artifact into compileVault type searchvault.

contract SearchVault(pubkey owner, pubkey feeRecipient) {
    int constant FEE_SOMPI = 100000;
    int constant MINER_FEE = 1000;

    entry pay_search_fee(sig ownerSig) {
        require(checkSig(ownerSig, owner));
        require(tx.outputs.length == 2);

        byte[36] feeSpk = new ScriptPubKeyP2PK(feeRecipient);
        require(tx.outputs[0].scriptPubKey == byte[](feeSpk));
        require(tx.outputs[0].value == FEE_SOMPI);

        require(tx.outputs[1].scriptPubKey == this.activeScriptPubKey);
        int inVal = tx.inputs[this.activeInputIndex].value;
        int change = inVal - FEE_SOMPI - MINER_FEE;
        require(change > 0);
        require(tx.outputs[1].value == change);
    }

    entry unlock(sig ownerSig) {
        require(checkSig(ownerSig, owner));
        require(tx.outputs.length == 1);
        byte[36] ownerSpk = new ScriptPubKeyP2PK(owner);
        require(tx.outputs[0].scriptPubKey == byte[](ownerSpk));
    }
}
`;

export default async function (req) {
  const logs = [];
  let sandbox = null;
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden — paid search is admin-only for now' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const owner = String(body?.owner_pubkey ?? '').toLowerCase().replace(/^0x/, '');
    if (!/^[0-9a-f]{64}$/.test(owner)) {
      return Response.json({ error: 'owner_pubkey must be a 32-byte Schnorr pubkey (64 hex chars)' }, { status: 400 });
    }

    const apiKey = secrets.get('E2B_API_KEY');
    if (!apiKey) return Response.json({ error: 'E2B_API_KEY is not set' }, { status: 500 });

    // Official silverc args format: portable ABI values with bytes as a byte
    // sequence — {"kind":"bytes","value":[1,2,3,...]} (kaspanet/silverscript docs).
    const hexToBytes = (hex) => hex.match(/.{2}/g).map((b) => parseInt(b, 16));

    sandbox = await Sandbox.create({ apiKey, timeoutMs: 5 * 60 * 1000 });
    logs.push('sandbox started');

    await sandbox.files.write([
      { path: '/home/user/SearchVault.sil', data: SEARCH_VAULT_SIL },
      {
        path: '/home/user/args.json',
        data: JSON.stringify([
          { kind: 'bytes', value: hexToBytes(owner) },
          { kind: 'bytes', value: hexToBytes(TREASURY_PUBKEY) },
        ], null, 2),
      },
      {
        path: '/home/user/try_compile.sh',
        data: [
          '#!/bin/bash',
          'set +e',
          'BIN=$(find . -type f -name silverc | head -1)',
          '[ -z "$BIN" ] && BIN=$(find . -type f -name "silverc*" ! -name "*.tar.gz" | head -1)',
          'echo "BIN=$BIN"',
          'chmod +x "$BIN"',
          'for P in "^1.0.0" "^0.1.0" "1.0.0" "=1.0.0"; do',
          '  printf "pragma silverscript %s;\\n" "$P" > /tmp/first.sil',
          '  tail -n +2 SearchVault.sil | cat /tmp/first.sil - > /tmp/SV.sil',
          '  cp /tmp/SV.sil SearchVault.sil',
          '  if "$BIN" SearchVault.sil --constructor-args args.json > /tmp/silverc.out 2>&1; then',
          '    echo "PRAGMA_OK=$P"',
          '    cat /tmp/silverc.out',
          '    exit 0',
          '  else',
          '    echo "PRAGMA_FAIL=$P"',
          '    tail -2 /tmp/silverc.out',
          '  fi',
          'done',
          'exit 1',
        ].join('\n'),
      },
    ]);
    logs.push('wrote SearchVault.sil + args.json + try_compile.sh');

    const dl = await sandbox.commands.run(
      `curl -sL -o silverc.tar.gz ${SILVERC_URL} && tar -xzf silverc.tar.gz && echo DOWNLOAD_OK`,
      { cwd: '/home/user', timeoutMs: 180000 }
    );
    logs.push('download exit ' + dl.exitCode);
    if (dl.exitCode !== 0) {
      if (dl.stderr) logs.push(dl.stderr.slice(-1500));
      return Response.json({ error: 'Could not download silverc v1.0.0', logs }, { status: 500 });
    }

    const compile = await sandbox.commands.run('bash try_compile.sh', { cwd: '/home/user', timeoutMs: 120000 });
    if (compile.stdout) logs.push(compile.stdout.slice(-2500));
    if (compile.stderr) logs.push(compile.stderr.slice(-2500));

    // silverc writes a SilAbiArtifact JSON next to the source — find and parse it.
    const ls = await sandbox.commands.run('ls -1 *.json', { cwd: '/home/user', timeoutMs: 15000 });
    const names = (ls.stdout || '').split('\n').map((s) => s.trim()).filter((n) => n && n !== 'args.json');
    for (const name of names) {
      const cat = await sandbox.commands.run(`cat '${name}'`, { cwd: '/home/user', timeoutMs: 15000 });
      try {
        const artifact = JSON.parse(cat.stdout);
        if (artifact?.contracts?.SearchVault) {
          return Response.json({ artifact, treasury_pubkey: TREASURY_PUBKEY, logs });
        }
      } catch { /* not the artifact — keep looking */ }
    }

    return Response.json({ error: 'silverc ran but produced no SearchVault artifact JSON', logs }, { status: 500 });
  } catch (error) {
    return Response.json({ error: error.message, logs }, { status: 500 });
  } finally {
    if (sandbox) {
      try { await Sandbox.kill(sandbox.sandboxId, { apiKey }); } catch { /* already gone */ }
    }
  }
}