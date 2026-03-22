import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Reveal a Bingo word and check for winner
 * UPDATED: Supports both single-player and multi-card lobbies
 */

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { game_id, word_index, card_number } = body;

        console.log('🎰 [Bingo] Revealing:', { game_id, word_index, card_number, user: user.email });

        // Get game
        const games = await base44.asServiceRole.entities.BingoGame.filter({ game_id });
        
        if (games.length === 0) {
            return Response.json({ success: false, error: 'Game not found' });
        }

        const game = games[0];

        if (game.status === 'completed') {
            return Response.json({ success: false, error: 'Game already finished' });
        }

        const revealedWords = game.revealed_words || [];
        const isLobbyGame = game.game_type === 'lobby';

        // For lobby games, check if this specific card already revealed this word
        const alreadyRevealed = isLobbyGame 
            ? revealedWords.find(r => r.word_index === word_index && r.card_number === card_number)
            : revealedWords.find(r => r.word_index === word_index);
        
        if (alreadyRevealed) {
            return Response.json({ 
                success: true, 
                already_revealed: true,
                revealed_by: alreadyRevealed.revealed_by,
                word: alreadyRevealed.word
            });
        }

        // Decrypt and get the word
        const seedPhrase = atob(game.encrypted_seed_phrase);
        const words = seedPhrase.split(' ');
        
        if (word_index < 0 || word_index >= 24) {
            return Response.json({ success: false, error: 'Invalid word index' });
        }

        const revealedWord = words[word_index];

        // Add to revealed words
        const newReveal = {
            word_index,
            word: revealedWord,
            revealed_by: user.email,
            revealed_at: new Date().toISOString(),
            ...(isLobbyGame && { card_number })
        };

        const updatedRevealed = [...revealedWords, newReveal];

        // Check if this user/card has revealed all 24 words
        const userCardReveals = isLobbyGame
            ? updatedRevealed.filter(r => r.card_number === card_number)
            : updatedRevealed.filter(r => r.revealed_by === user.email);

        const isWinner = userCardReveals.length === 24;

        let updateData = {
            revealed_words: updatedRevealed
        };

        if (isWinner) {
            updateData.winner_email = user.email;
            updateData.winner_address = user.created_wallet_address || 'no_wallet';
            updateData.won_at = new Date().toISOString();
            updateData.status = 'completed';
            
            if (isLobbyGame) {
                updateData.winner_card_number = card_number;
            }
            
            console.log('🎉 [Bingo] WINNER!', user.email, isLobbyGame ? `Card #${card_number}` : '');
        }

        await base44.asServiceRole.entities.BingoGame.update(game.id, updateData);

        return Response.json({
            success: true,
            word: revealedWord,
            word_index,
            total_revealed: updatedRevealed.length,
            user_revealed: userCardReveals.length,
            is_winner: isWinner,
            full_seed_phrase: isWinner ? seedPhrase : null
        });

    } catch (error) {
        console.error('❌ [Bingo] Error:', error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
});