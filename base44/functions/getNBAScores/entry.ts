import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ESPN scoreboard API — free, no key needed
    // Use date from request body if provided, otherwise use UTC
    const body = await req.json().catch(() => ({}));
    const dateStr = body.date
      ? body.date.replace(/-/g, '')
      : new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dateStr}`;
    
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (!res.ok) {
      return Response.json({ error: 'ESPN API failed', status: res.status }, { status: 502 });
    }

    const data = await res.json();
    const events = data?.events || [];

    const games = events.map(event => {
      const competition = event.competitions?.[0];
      const competitors = competition?.competitors || [];
      
      const away = competitors.find(c => c.homeAway === 'away');
      const home = competitors.find(c => c.homeAway === 'home');

      const status = competition?.status;
      const statusType = status?.type?.name; // STATUS_SCHEDULED, STATUS_IN_PROGRESS, STATUS_FINAL
      const statusDetail = status?.type?.shortDetail || status?.type?.detail || '';
      const clock = status?.displayClock || '';
      const period = status?.period || 0;

      return {
        id: event.id,
        teamA: away?.team?.displayName || 'TBD',
        teamAShort: away?.team?.abbreviation || '',
        teamALogo: away?.team?.logo || '',
        scoreA: away?.score || '0',
        teamB: home?.team?.displayName || 'TBD',
        teamBShort: home?.team?.abbreviation || '',
        teamBLogo: home?.team?.logo || '',
        scoreB: home?.score || '0',
        status: statusType === 'STATUS_IN_PROGRESS' ? 'live' 
              : statusType === 'STATUS_FINAL' ? 'final' 
              : 'scheduled',
        statusDetail: statusDetail,
        clock: clock,
        period: period,
        startTime: event.date || '',
        headline: event.name || '',
        broadcast: competition?.broadcasts?.[0]?.names?.[0] || ''
      };
    });

    return Response.json({ 
      games, 
      date: data?.day?.date || today.toISOString().slice(0, 10),
      count: games.length 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});