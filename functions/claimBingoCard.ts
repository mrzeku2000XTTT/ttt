import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * CLAIM A BINGO CARD IN LOBBY
 * Player selects and claims a specific card number
 */

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ success: false, error: 'Please login' }, { status: 401 });
        }

        const body = await req.json();
        const { game_code, card_number } = body;

        if (!game_code || !card_number) {
            return Response.json({ success: false, error: 'Game code and card number required' });
        }

        console.log(`🎯 [Lobby] ${user.email} claiming card ${card_number} in game ${game_code}`);

        // Find game
        const games = await base44.asServiceRole.entities.BingoGame.filter({
            game_code: game_code.toUpperCase(),
            game_type: 'lobby'
        });

        if (games.length === 0) {
            return Response.json({ success: false, error: 'Game not found' });
        }

        const game = games[0];

        if (game.status !== 'waiting') {
            return Response.json({ success: false, error: 'Game already started or finished' });
        }

        // Find the card
        const cards = game.cards || [];
        const cardIndex = cards.findIndex(c => c.cardNumber === card_number);

        if (cardIndex === -1) {
            return Response.json({ success: false, error: 'Card not found' });
        }

        const card = cards[cardIndex];

        if (card.claimed) {
            return Response.json({ 
                success: false, 
                error: 'Card already claimed',
                claimedBy: card.claimedBy 
            });
        }

        // Claim the card
        card.claimed = true;
        card.claimedBy = user.username || user.email;
        card.claimedByEmail = user.email;

        // Update cards array
        cards[cardIndex] = card;

        // Add player to lobby
        const players = game.players || [];
        const existingPlayer = players.find(p => p.email === user.email);

        if (!existingPlayer) {
            players.push({
                id: user.id,
                email: user.email,
                name: user.username || user.email,
                cardNumber: card_number,
                joinedAt: new Date().toISOString()
            });
        } else {
            existingPlayer.cardNumber = card_number;
        }

        // Update game
        await base44.asServiceRole.entities.BingoGame.update(game.id, {
            cards: cards,
            players: players
        });

        console.log(`✅ [Lobby] Card ${card_number} claimed by ${user.email}`);

        return Response.json({
            success: true,
            card_number: card_number,
            card_numbers: card.numbers,
            game_code: game.game_code,
            players_count: players.length,
            available_cards: cards.filter(c => !c.claimed).length
        });

    } catch (error) {
        console.error('❌ [Lobby] Error:', error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
});