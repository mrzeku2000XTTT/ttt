import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import * as bip39 from 'npm:@scure/bip39@1.3.0';
import { wordlist } from 'npm:@scure/bip39@1.3.0/wordlists/english';
import { KaspaWallet } from 'npm:@okxweb3/coin-kaspa@2.4.9';

// Creates a new prediction game with a fresh escrow wallet
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { question, yes_label, no_label, category, subcategory, source_data, duration_minutes } = await req.json();

    if (!question) return Response.json({ error: 'Question required' }, { status: 400 });

    // Generate a fresh escrow wallet
    const mnemonic = bip39.generateMnemonic(wordlist, 128);
    const wallet = new KaspaWallet();
    const privateKey = await wallet.getDerivedPrivateKey({
      mnemonic,
      hdPath: "m/44'/111111'/0'/0/0",
    });
    const { address } = await wallet.getNewAddress({ privateKey });
    const cleanAddress = address.startsWith('kaspa:') ? address.slice(6) : address;

    // Game number = first 8 chars of address (unique identifier)
    const gameNumber = cleanAddress.slice(0, 8).toUpperCase();

    const now = new Date();
    const endTime = new Date(now.getTime() + (duration_minutes || 15) * 60 * 1000);

    // Create the game record (private key + mnemonic stored securely in DB, never sent to frontend)
    const game = await base44.asServiceRole.entities.PredictionGame.create({
      game_number: gameNumber,
      escrow_address: cleanAddress,
      escrow_private_key: privateKey,
      escrow_mnemonic: mnemonic,
      market_id: `game_${Date.now()}`,
      question,
      yes_label: yes_label || 'Yes',
      no_label: no_label || 'No',
      category: category || 'Live',
      subcategory: subcategory || 'Prediction',
      source_data: source_data || 'live_data',
      status: 'open',
      start_time: now.toISOString(),
      end_time: endTime.toISOString(),
      total_pool_kas: 0,
      yes_pool_kas: 0,
      no_pool_kas: 0,
      yes_count: 0,
      no_count: 0,
      bot_status: 'ready'
    });

    // Return game info WITHOUT private key/mnemonic
    return Response.json({
      success: true,
      game: {
        id: game.id,
        game_number: gameNumber,
        escrow_address: cleanAddress,
        question,
        yes_label: yes_label || 'Yes',
        no_label: no_label || 'No',
        start_time: now.toISOString(),
        end_time: endTime.toISOString(),
        status: 'open',
        bot_status: 'ready'
      }
    });
  } catch (error) {
    console.error('kachingCreateGame error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});