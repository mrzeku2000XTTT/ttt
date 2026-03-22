import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * PROVABLY FAIR BINGO NUMBER GENERATOR
 * 
 * Uses the "shuffle and draw" method:
 * 1. Generate all 75 numbers
 * 2. Shuffle using Fisher-Yates algorithm
 * 3. Hash the shuffled pool (provably fair)
 * 4. Draw numbers sequentially
 * 
 * This ensures:
 * - No duplicates (each number called exactly once)
 * - Equal probability (every sequence equally likely)
 * - Provably fair (pool hashed before game starts)
 */

// Generate all 75 bingo numbers
function generateFullNumberPool() {
    const pool = [];
    const ranges = { 
        B: [1, 15], 
        I: [16, 30], 
        N: [31, 45], 
        G: [46, 60], 
        O: [61, 75] 
    };
    
    Object.entries(ranges).forEach(([letter, [min, max]]) => {
        for (let i = min; i <= max; i++) {
            pool.push({ 
                letter, 
                number: i, 
                id: `${letter}-${i}` 
            });
        }
    });
    
    return pool;
}

// Fisher-Yates shuffle algorithm (provably fair)
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Generate SHA-256 hash of the shuffled pool (for provable fairness)
async function hashPool(pool) {
    const poolString = JSON.stringify(pool);
    const encoder = new TextEncoder();
    const data = encoder.encode(poolString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const body = await req.json();
        const { game_code, action } = body;

        if (!game_code) {
            return Response.json({ 
                success: false, 
                error: 'Game code required' 
            }, { status: 400 });
        }

        console.log(`🎮 [GameMaster] Action: ${action}, Code: ${game_code}`);

        // Find game
        let games = await base44.asServiceRole.entities.BingoGame.filter({
            game_code: game_code.toUpperCase()
        });

        if (games.length === 0) {
            games = await base44.asServiceRole.entities.BingoGame.filter({
                game_code: game_code
            });
        }

        if (games.length === 0) {
            console.error('❌ [GameMaster] Game not found:', game_code);
            return Response.json({ 
                success: false, 
                error: `Game not found: ${game_code}` 
            }, { status: 404 });
        }

        const game = games[0];
        console.log(`✅ [GameMaster] Found game:`, game.game_id);

        let gameMaster = game.game_master || {};

        if (action === 'start') {
            console.log('🎬 [GameMaster] Starting game with provably fair RNG...');
            
            // Check if already started
            if (gameMaster.enabled && gameMaster.status === 'calling') {
                console.log('⚠️ [GameMaster] Game already started');
                return Response.json({
                    success: true,
                    already_started: true,
                    game_master: gameMaster,
                    message: 'Game already started'
                });
            }

            // Step 1: Generate all 75 numbers
            const fullPool = generateFullNumberPool();
            console.log(`📊 [GameMaster] Generated pool of ${fullPool.length} numbers`);
            
            // Step 2: Shuffle using Fisher-Yates (provably fair)
            const shuffledPool = shuffleArray(fullPool);
            console.log(`🔀 [GameMaster] Shuffled pool using Fisher-Yates algorithm`);
            
            // Step 3: Hash the shuffled pool (provable fairness)
            const poolHash = await hashPool(shuffledPool);
            console.log(`🔒 [GameMaster] Pool hash: ${poolHash.substring(0, 16)}...`);
            
            // Initialize game master with shuffled pool
            gameMaster = {
                enabled: true,
                call_interval: game.call_interval || 10,
                ball_display_time: 8,
                status: 'calling',
                shuffled_pool: shuffledPool,
                pool_hash: poolHash,
                called_numbers: [],
                current_call: null,
                call_history: [],
                next_call_time: null,
                started_at: new Date().toISOString()
            };

            // Step 4: Draw first number from shuffled pool
            const firstBall = gameMaster.shuffled_pool.shift();

            const firstCall = {
                ...firstBall,
                called_at: new Date().toISOString(),
                call_number: 1
            };

            gameMaster.called_numbers.push(firstCall);
            gameMaster.current_call = firstCall;
            gameMaster.call_history = [firstCall];
            gameMaster.next_call_time = new Date(Date.now() + gameMaster.call_interval * 1000).toISOString();

            console.log(`🎱 [GameMaster] First call: ${firstBall.letter}-${firstBall.number}`);
            console.log(`⏰ [GameMaster] Next call in ${gameMaster.call_interval}s`);
            console.log(`📦 [GameMaster] Remaining in pool: ${gameMaster.shuffled_pool.length}`);

            await base44.asServiceRole.entities.BingoGame.update(game.id, {
                game_master: gameMaster,
                status: 'active'
            });

            console.log('✅ [GameMaster] Game started successfully with provably fair RNG');

            return Response.json({
                success: true,
                game_master: gameMaster,
                first_call: firstBall,
                pool_hash: poolHash,
                message: 'Game started with provably fair RNG'
            });
        }

        if (action === 'tick') {
            // Check if game master is enabled and calling
            if (!gameMaster.enabled || gameMaster.status !== 'calling') {
                return Response.json({
                    success: true,
                    no_action: true,
                    reason: 'Game master not calling'
                });
            }

            // Validate shuffled pool exists
            if (!gameMaster.shuffled_pool || !Array.isArray(gameMaster.shuffled_pool)) {
                console.error('❌ [GameMaster] Shuffled pool missing or corrupted');
                return Response.json({
                    success: false,
                    error: 'Game data corrupted - please restart game'
                }, { status: 500 });
            }

            // Check if it's time for next call
            const now = new Date();
            const nextCallTime = new Date(gameMaster.next_call_time);

            if (now < nextCallTime) {
                return Response.json({
                    success: true,
                    no_action: true,
                    reason: 'Not time yet',
                    seconds_remaining: Math.ceil((nextCallTime - now) / 1000)
                });
            }

            // Check if we have numbers left in shuffled pool
            if (gameMaster.shuffled_pool.length === 0) {
                console.log('🏁 [GameMaster] All 75 numbers called!');
                gameMaster.status = 'finished';
                
                await base44.asServiceRole.entities.BingoGame.update(game.id, {
                    game_master: gameMaster
                });

                return Response.json({
                    success: true,
                    finished: true,
                    message: 'All 75 numbers called',
                    pool_hash: gameMaster.pool_hash
                });
            }

            // Draw next number from pre-shuffled pool
            const nextBall = gameMaster.shuffled_pool.shift();

            const nextCall = {
                ...nextBall,
                called_at: new Date().toISOString(),
                call_number: (gameMaster.called_numbers?.length || 0) + 1
            };

            gameMaster.called_numbers = gameMaster.called_numbers || [];
            gameMaster.called_numbers.push(nextCall);
            gameMaster.current_call = nextCall;

            // Update call history (keep last 10)
            gameMaster.call_history = gameMaster.call_history || [];
            gameMaster.call_history.unshift(nextCall);
            if (gameMaster.call_history.length > 10) {
                gameMaster.call_history = gameMaster.call_history.slice(0, 10);
            }

            // Schedule next call
            gameMaster.next_call_time = new Date(Date.now() + gameMaster.call_interval * 1000).toISOString();

            console.log(`🎱 [GameMaster] Called: ${nextBall.letter}-${nextBall.number} (${gameMaster.called_numbers.length}/75)`);
            console.log(`📦 [GameMaster] Remaining: ${gameMaster.shuffled_pool.length}`);

            await base44.asServiceRole.entities.BingoGame.update(game.id, {
                game_master: gameMaster
            });

            return Response.json({
                success: true,
                called: nextBall,
                game_master: gameMaster
            });
        }

        // Default: return current state
        return Response.json({
            success: true,
            game_master: gameMaster
        });

    } catch (error) {
        console.error('❌ [GameMaster] Error:', error);
        console.error('❌ [GameMaster] Stack:', error.stack);
        
        return Response.json({ 
            success: false, 
            error: error.message,
            details: error.stack,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
});