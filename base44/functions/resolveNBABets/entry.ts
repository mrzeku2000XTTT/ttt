import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch today's ESPN scores
    const now = new Date();
    const chicagoTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    const yr = chicagoTime.getFullYear();
    const mo = String(chicagoTime.getMonth() + 1).padStart(2, '0');
    const dy = String(chicagoTime.getDate()).padStart(2, '0');
    const dateStr = `${yr}${mo}${dy}`;
    
    const espnRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dateStr}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (!espnRes.ok) {
      return Response.json({ error: 'ESPN API failed' }, { status: 502 });
    }

    const espnData = await espnRes.json();
    const events = espnData?.events || [];

    // Build a map of finished games
    const finishedGames = {};
    for (const event of events) {
      const comp = event.competitions?.[0];
      const statusType = comp?.status?.type?.name;
      if (statusType !== 'STATUS_FINAL') continue;

      const competitors = comp?.competitors || [];
      const away = competitors.find(c => c.homeAway === 'away');
      const home = competitors.find(c => c.homeAway === 'home');

      finishedGames[event.id] = {
        scoreA: parseInt(away?.score || '0'),
        scoreB: parseInt(home?.score || '0'),
        teamA: away?.team?.displayName,
        teamB: home?.team?.displayName,
      };
    }

    if (Object.keys(finishedGames).length === 0) {
      return Response.json({ message: 'No finished games to resolve', resolved: 0 });
    }

    // Get all active bets
    const activeBets = await base44.asServiceRole.entities.SportsBet.filter({ status: 'active' });
    let resolved = 0;
    let errors = 0;

    for (const bet of activeBets) {
      const gameResult = finishedGames[bet.game_id];
      if (!gameResult) continue;

      let won = false;
      const { scoreA, scoreB } = gameResult;
      const totalPoints = scoreA + scoreB;

      if (bet.bet_type === 'moneyline') {
        // Pick is team name — check if that team won
        if (bet.pick === gameResult.teamA) {
          won = scoreA > scoreB;
        } else {
          won = scoreB > scoreA;
        }
      } else if (bet.bet_type === 'spread') {
        const spreadVal = parseFloat(bet.pick_detail);
        // Spread is from picked team's perspective
        if (bet.pick === gameResult.teamA) {
          won = (scoreA + spreadVal) > scoreB;
        } else {
          won = (scoreB + spreadVal) > scoreA;
        }
      } else if (bet.bet_type === 'over_under') {
        const line = parseFloat(bet.pick_detail);
        if (bet.pick === 'Over') {
          won = totalPoints > line;
        } else {
          won = totalPoints < line;
        }
      }

      try {
        await base44.asServiceRole.entities.SportsBet.update(bet.id, {
          status: won ? 'won' : 'lost',
          final_score_a: scoreA,
          final_score_b: scoreB,
          resolved_at: new Date().toISOString()
        });
        resolved++;
      } catch (err) {
        console.error(`Failed to resolve bet ${bet.id}:`, err.message);
        errors++;
      }
    }

    return Response.json({
      message: `Resolved ${resolved} bets`,
      resolved,
      errors,
      finishedGames: Object.keys(finishedGames).length,
      totalActiveBets: activeBets.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});