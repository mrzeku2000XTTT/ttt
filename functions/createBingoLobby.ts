
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * CREATE MULTI-CARD BINGO LOBBY
 * - Generates up to 30 unique cards
 * - Creates 6-character game code
 * - Players join and claim cards
 * - OPEN TO ALL AGENT ZK USERS (not just admins)
 */

// Generate 6-character game code
function generateGameCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        code += chars[randomIndex];
    }
    return code;
}

// Generate unique numbers for a column
async function generateColumnNumbers(seed, columnIndex, min, max) {
    const available = Array.from({ length: max - min + 1 }, (_, i) => i + min);
    const selected = [];

    for (let i = 0; i < 5; i++) {
        const seedString = `${seed}-${columnIndex}-${i}`;
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

// Generate a single BINGO card
async function generateSingleCard(cardNumber, gameSeed) {
    const cardSeed = `${gameSeed}-card-${cardNumber}`;
    
    const card = {
        B: await generateColumnNumbers(cardSeed, 0, 1, 15),
        I: await generateColumnNumbers(cardSeed, 1, 16, 30),
        N: await generateColumnNumbers(cardSeed, 2, 31, 45),
        G: await generateColumnNumbers(cardSeed, 3, 46, 60),
        O: await generateColumnNumbers(cardSeed, 4, 61, 75)
    };

    return card;
}

// Validate card has no duplicates
function validateCard(card) {
    const allNumbers = [];
    ['B', 'I', 'N', 'G', 'O'].forEach(col => {
        card[col].forEach(num => allNumbers.push(num));
    });

    const uniqueNumbers = new Set(allNumbers);
    
    if (uniqueNumbers.size !== allNumbers.length) {
        return { isValid: false, error: 'Duplicate numbers in card' };
    }

    return { isValid: true };
}

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ success: false, error: 'Please login' }, { status: 401 });
        }

        // Check if user is Agent ZK or admin
        const isAgentZK = user.agent_zk_id || user.created_wallet_address;
        const isAdmin = user.role === 'admin';

        if (!isAgentZK && !isAdmin) {
            return Response.json({ 
                success: false, 
                error: 'You need to be an Agent ZK user to create games. Please create a TTT Wallet first.' 
            }, { status: 403 });
        }

        const body = await req.json();
        const { prize_amount, seed_phrase, num_cards = 10, call_interval = 10 } = body;

        if (!prize_amount || prize_amount <= 0) {
            return Response.json({ success: false, error: 'Invalid prize amount' });
        }

        if (!seed_phrase) {
            return Response.json({ success: false, error: 'Seed phrase required' });
        }

        if (num_cards < 1 || num_cards > 30) {
            return Response.json({ success: false, error: 'Number of cards must be 1-30' });
        }

        const words = seed_phrase.trim().toLowerCase().split(/\s+/).filter(w => w);
        
        if (words.length !== 24) {
            return Response.json({ success: false, error: 'Seed phrase must be exactly 24 words' });
        }

        console.log(`🎰 [Lobby] ${user.email} creating game with ${num_cards} cards, interval: ${call_interval}s`);

        // Generate game code
        const gameCode = generateGameCode();
        const gameId = `LOBBY_${Date.now()}_${gameCode}`;

        // Create game seed from seed phrase
        const encoder = new TextEncoder();
        const data = encoder.encode(seed_phrase);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const gameSeed = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        console.log(`🎲 [Lobby] Generating ${num_cards} unique cards...`);

        // Generate all cards
        const cards = [];
        for (let i = 1; i <= num_cards; i++) {
            const cardNumbers = await generateSingleCard(i, gameSeed);
            
            const validation = validateCard(cardNumbers);
            if (!validation.isValid) {
                throw new Error(`Card ${i} validation failed: ${validation.error}`);
            }

            cards.push({
                cardNumber: i,
                numbers: cardNumbers,
                claimed: false,
                claimedBy: null,
                claimedByEmail: null
            });
        }

        console.log(`✅ [Lobby] All ${num_cards} cards validated`);

        // Create lobby in database
        await base44.asServiceRole.entities.BingoGame.create({
            game_id: gameId,
            encrypted_seed_phrase: btoa(words.join(' ')),
            wallet_address: `lobby:${gameCode}`,
            prize_amount: prize_amount,
            bingo_numbers: null,
            server_seed_hash: gameSeed,
            client_seed: gameCode,
            card_hash: gameCode,
            revealed_words: [],
            status: 'waiting',
            created_by_admin: user.email,
            game_type: 'lobby',
            game_code: gameCode,
            total_cards: num_cards,
            cards: cards,
            players: [],
            call_interval: call_interval,
            game_master: {
                enabled: false,
                call_interval: call_interval,
                ball_display_time: 8,
                status: 'ready',
                called_numbers: [],
                current_call: null,
                call_history: [],
                next_call_time: null
            }
        });

        console.log('🎉 [Lobby] Game created!', gameCode);

        return Response.json({
            success: true,
            game_id: gameId,
            game_code: gameCode,
            prize_amount: prize_amount,
            total_cards: num_cards,
            available_cards: num_cards,
            call_interval: call_interval,
            message: `✅ Lobby created! Share code: ${gameCode}`
        });

    } catch (error) {
        console.error('❌ [Lobby] Error:', error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
});
