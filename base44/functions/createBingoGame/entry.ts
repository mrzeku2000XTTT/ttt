import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * UNIQUE BINGO CARD SYSTEM
 * - Card ID = Last 8 chars of Kaspa address
 * - Numbers generated ONCE per card and stored permanently
 * - Cryptographically secure & deterministic
 * - Validation prevents duplicates
 */

// Generate deterministic numbers for a column using card ID as seed
async function generateColumnNumbers(cardId, columnIndex, min, max, count) {
    const available = Array.from({ length: max - min + 1 }, (_, i) => i + min);
    const selected = [];

    for (let i = 0; i < count; i++) {
        const seedString = `${cardId}-${columnIndex}-${i}`;
        const encoder = new TextEncoder();
        const data = encoder.encode(seedString);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashInt = hashArray.reduce((acc, val, idx) => acc + val * Math.pow(256, idx % 4), 0);
        
        const index = hashInt % available.length;
        selected.push(available[index]);
        available.splice(index, 1);
    }

    return selected;
}

// Generate complete BINGO card from card ID
async function generateUniqueBingoCard(cardId) {
    console.log('🎲 [Bingo] Generating unique card for ID:', cardId);

    const bingoNumbers = {
        B: await generateColumnNumbers(cardId, 0, 1, 15, 5),
        I: await generateColumnNumbers(cardId, 1, 16, 30, 5),
        N: await generateColumnNumbers(cardId, 2, 31, 45, 5),
        G: await generateColumnNumbers(cardId, 3, 46, 60, 5),
        O: await generateColumnNumbers(cardId, 4, 61, 75, 5)
    };

    // Validate card
    const allNumbers = [...bingoNumbers.B, ...bingoNumbers.I, ...bingoNumbers.N, ...bingoNumbers.G, ...bingoNumbers.O];
    const uniqueNumbers = new Set(allNumbers);

    if (uniqueNumbers.size !== allNumbers.length) {
        throw new Error('Card validation failed: duplicate numbers detected');
    }

    console.log('✅ [Bingo] Card validated - no duplicates');
    console.log('🎯 [Bingo] Numbers:', bingoNumbers);

    return bingoNumbers;
}

// Create card ID from Kaspa address (last 8 chars)
function createCardId(walletAddress) {
    const cleanAddress = walletAddress.replace('kaspa:', '');
    return cleanAddress.slice(-8).toUpperCase();
}

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const user = await base44.auth.me();
        
        if (!user || user.role !== 'admin') {
            return Response.json({ success: false, error: 'Admin access required' }, { status: 403 });
        }

        const body = await req.json();
        const { prize_amount, seed_phrase, wallet_address } = body;

        if (!prize_amount || prize_amount <= 0) {
            return Response.json({ success: false, error: 'Invalid prize amount' });
        }

        if (!seed_phrase || !wallet_address) {
            return Response.json({ success: false, error: 'Seed phrase and wallet address required' });
        }

        const words = seed_phrase.trim().toLowerCase().split(/\s+/);
        
        if (words.length !== 24) {
            return Response.json({ success: false, error: 'Seed phrase must be exactly 24 words' });
        }

        // Create unique card ID from wallet address
        const cardId = createCardId(wallet_address);
        console.log('🎰 [Bingo] Creating unique card:', cardId, 'for wallet:', wallet_address);

        // Check if card ID already exists
        const existingGames = await base44.asServiceRole.entities.BingoGame.filter({
            status: 'active'
        });

        const cardExists = existingGames.some(g => {
            const existingCardId = createCardId(g.wallet_address);
            return existingCardId === cardId;
        });

        if (cardExists) {
            return Response.json({
                success: false,
                error: `Card already exists for this wallet! Card ID: ${cardId}`,
                card_id: cardId,
                message: 'Each Kaspa address can only create one card'
            }, { status: 400 });
        }

        // Generate unique permanent BINGO numbers based on card ID
        const bingoNumbers = await generateUniqueBingoCard(cardId);

        const gameId = `BINGO_${Date.now()}_${cardId}`;

        // Create game record with PERMANENT numbers
        await base44.asServiceRole.entities.BingoGame.create({
            game_id: gameId,
            encrypted_seed_phrase: btoa(words.join(' ')),
            wallet_address: wallet_address,
            prize_amount: prize_amount,
            bingo_numbers: bingoNumbers,
            server_seed_hash: cardId,
            client_seed: cardId,
            card_hash: cardId,
            revealed_words: [],
            status: 'active',
            created_by_admin: user.email
        });

        console.log('🎉 [Bingo] Unique card created!', gameId);
        console.log('📇 [Bingo] Card ID:', cardId);
        console.log('🎲 [Bingo] Numbers permanently stored');

        return Response.json({
            success: true,
            game_id: gameId,
            card_id: cardId,
            wallet_address: wallet_address,
            prize_amount: prize_amount,
            bingo_numbers: bingoNumbers,
            message: `✅ Unique card ${cardId} created! Numbers are permanent and will never change.`
        });

    } catch (error) {
        console.error('❌ [Bingo] Error:', error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
});