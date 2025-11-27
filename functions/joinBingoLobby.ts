import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * JOIN BINGO LOBBY WITH GAME CODE
 * Returns available cards for claiming
 */

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ success: false, error: 'Please login' }, { status: 401 });
        }

        const body = await req.json();
        const { game_code } = body;

        if (!game_code || game_code.length !== 6) {
            return Response.json({ success: false, error: 'Invalid game code' });
        }

        console.log('🔍 [Lobby] Looking for game:', game_code);

        // Find game by code
        const games = await base44.asServiceRole.entities.BingoGame.filter({
            game_code: game_code.toUpperCase(),
            game_type: 'lobby'
        });

        if (games.length === 0) {
            return Response.json({ success: false, error: 'Game not found' });
        }

        const game = games[0];

        if (game.status === 'completed') {
            return Response.json({ success: false, error: 'Game already finished' });
        }

        if (game.status === 'active') {
            return Response.json({ success: false, error: 'Game already started - cannot join' });
        }

        // Get available cards
        const availableCards = (game.cards || []).filter(c => !c.claimed);
        const claimedCount = (game.cards || []).length - availableCards.length;

        console.log(`✅ [Lobby] Found game - ${availableCards.length} cards available`);

        return Response.json({
            success: true,
            game_id: game.game_id,
            game_code: game.game_code,
            prize_amount: game.prize_amount,
            total_cards: game.total_cards,
            available_cards: availableCards.length,
            claimed_cards: claimedCount,
            players_count: (game.players || []).length,
            cards: availableCards.map(c => ({
                cardNumber: c.cardNumber,
                numbers: c.numbers
            }))
        });

    } catch (error) {
        console.error('❌ [Lobby] Error:', error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
});