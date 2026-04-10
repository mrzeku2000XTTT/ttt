import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { category } = await req.json().catch(() => ({}));

    // Fetch real data from multiple sources
    const markets = [];

    // 1. NBA Games from ESPN
    try {
      const tz = 'America/Chicago';
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-CA', { timeZone: tz }).replace(/-/g, '');
      const nbaRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dateStr}`);
      const nbaData = await nbaRes.json();
      
      for (const event of (nbaData?.events || [])) {
        const comp = event.competitions?.[0];
        if (!comp) continue;
        const away = comp.competitors?.find(c => c.homeAway === 'away');
        const home = comp.competitors?.find(c => c.homeAway === 'home');
        if (!away || !home) continue;
        
        const status = comp.status?.type?.name === 'STATUS_IN_PROGRESS' ? 'live' : 
                       comp.status?.type?.name === 'STATUS_FINAL' ? 'closed' : 'open';
        
        const hash = (event.id || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        const homeProb = 40 + (hash % 20);
        
        markets.push({
          id: `nba_${event.id}`,
          category: 'Sports',
          subcategory: 'NBA',
          title: `${away.team.shortDisplayName} vs ${home.team.shortDisplayName}`,
          question: `Will ${home.team.shortDisplayName} win?`,
          yes_label: `${home.team.shortDisplayName} wins`,
          no_label: `${away.team.shortDisplayName} wins`,
          yes_price: homeProb,
          no_price: 100 - homeProb,
          volume: Math.floor(1000 + (hash % 9000)),
          status,
          expires: comp.date,
          icon_url: home.team.logo,
          icon_url_2: away.team.logo,
          detail: comp.status?.type?.detail || '',
          score: status !== 'open' ? `${away.score} - ${home.score}` : null,
          result: status === 'closed' ? (parseInt(home.score) > parseInt(away.score) ? 'yes' : 'no') : null,
          tags: ['NBA', 'Basketball'],
          source: 'ESPN'
        });

        // Over/Under market
        const total = 210 + (hash % 30) + 0.5;
        markets.push({
          id: `nba_ou_${event.id}`,
          category: 'Sports',
          subcategory: 'NBA',
          title: `${away.team.shortDisplayName} vs ${home.team.shortDisplayName} — Total`,
          question: `Will total score be over ${total}?`,
          yes_label: `Over ${total}`,
          no_label: `Under ${total}`,
          yes_price: 45 + (hash % 12),
          no_price: 55 - (hash % 12),
          volume: Math.floor(500 + (hash % 5000)),
          status,
          expires: comp.date,
          icon_url: home.team.logo,
          icon_url_2: away.team.logo,
          detail: `Line: ${total}`,
          score: status !== 'open' ? `${away.score} - ${home.score}` : null,
          result: status === 'closed' ? ((parseInt(away.score) + parseInt(home.score)) > total ? 'yes' : 'no') : null,
          tags: ['NBA', 'Over/Under'],
          source: 'ESPN'
        });
      }
    } catch (e) { console.error('NBA fetch failed:', e); }

    // 2. Crypto Markets from CoinGecko
    try {
      const cryptoRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,kaspa,solana,dogecoin&vs_currencies=usd&include_24hr_change=true');
      const cryptoData = await cryptoRes.json();
      
      const cryptoMarkets = [
        { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', icon: 'https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png' },
        { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', icon: 'https://assets.coingecko.com/coins/images/279/thumb/ethereum.png' },
        { id: 'kaspa', name: 'Kaspa', symbol: 'KAS', icon: 'https://assets.coingecko.com/coins/images/25751/thumb/kaspa-icon-exchanges.png' },
        { id: 'solana', name: 'Solana', symbol: 'SOL', icon: 'https://assets.coingecko.com/coins/images/4128/thumb/solana.png' },
        { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE', icon: 'https://assets.coingecko.com/coins/images/5/thumb/dogecoin.png' },
      ];

      for (const coin of cryptoMarkets) {
        const data = cryptoData[coin.id];
        if (!data) continue;
        const price = data.usd;
        const change24h = data.usd_24h_change || 0;
        
        // Create "price above X by end of day" market
        const roundedPrice = Math.round(price / (price > 1000 ? 500 : price > 100 ? 10 : price > 1 ? 0.5 : 0.01)) * (price > 1000 ? 500 : price > 100 ? 10 : price > 1 ? 0.5 : 0.01);
        const target = change24h > 0 ? roundedPrice * 1.02 : roundedPrice * 0.98;
        const targetRounded = price > 1000 ? Math.round(target) : price > 1 ? parseFloat(target.toFixed(2)) : parseFloat(target.toFixed(4));

        const bullProb = change24h > 2 ? 62 + Math.floor(Math.random() * 8) : change24h > 0 ? 52 + Math.floor(Math.random() * 8) : 38 + Math.floor(Math.random() * 12);
        
        markets.push({
          id: `crypto_${coin.id}_daily`,
          category: 'Crypto',
          subcategory: coin.symbol,
          title: `${coin.symbol} Price Prediction`,
          question: `Will ${coin.symbol} close above $${targetRounded.toLocaleString()} today?`,
          yes_label: `Yes — above $${targetRounded.toLocaleString()}`,
          no_label: `No — below $${targetRounded.toLocaleString()}`,
          yes_price: bullProb,
          no_price: 100 - bullProb,
          volume: Math.floor(2000 + Math.random() * 15000),
          status: 'open',
          expires: new Date(new Date().setHours(23, 59, 59)).toISOString(),
          icon_url: coin.icon,
          detail: `Current: $${price.toLocaleString()} (${change24h > 0 ? '+' : ''}${change24h.toFixed(1)}%)`,
          tags: ['Crypto', coin.symbol],
          source: 'CoinGecko',
          metadata: { current_price: price, change_24h: change24h }
        });
      }
    } catch (e) { console.error('Crypto fetch failed:', e); }

    // 3. Weather markets (from Open-Meteo - free, no API key)
    try {
      const cities = [
        { name: 'New York', lat: 40.71, lon: -74.01 },
        { name: 'Los Angeles', lat: 34.05, lon: -118.24 },
        { name: 'Chicago', lat: 41.88, lon: -87.63 },
      ];
      
      for (const city of cities) {
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&daily=temperature_2m_max,precipitation_probability_max&timezone=America%2FChicago&forecast_days=1`);
        const weatherData = await weatherRes.json();
        const maxTemp = weatherData?.daily?.temperature_2m_max?.[0];
        const precipProb = weatherData?.daily?.precipitation_probability_max?.[0] || 0;
        
        if (maxTemp != null) {
          const tempF = Math.round(maxTemp * 9/5 + 32);
          const threshold = Math.round(tempF / 5) * 5;
          
          markets.push({
            id: `weather_${city.name.toLowerCase().replace(' ', '_')}_temp`,
            category: 'Weather',
            subcategory: city.name,
            title: `${city.name} Temperature`,
            question: `Will ${city.name} exceed ${threshold}°F today?`,
            yes_label: `Yes — above ${threshold}°F`,
            no_label: `No — at or below ${threshold}°F`,
            yes_price: tempF > threshold ? 72 + Math.floor(Math.random() * 10) : 28 + Math.floor(Math.random() * 15),
            no_price: tempF > threshold ? 28 - Math.floor(Math.random() * 10) + 10 : 72 - Math.floor(Math.random() * 15) + 15,
            volume: Math.floor(500 + Math.random() * 3000),
            status: 'open',
            expires: new Date(new Date().setHours(23, 59, 59)).toISOString(),
            icon_url: tempF > 75 ? '☀️' : tempF > 50 ? '⛅' : '❄️',
            detail: `Forecast: ${tempF}°F | Rain: ${precipProb}%`,
            tags: ['Weather', city.name],
            source: 'Open-Meteo',
            isEmoji: true
          });
        }
      }
    } catch (e) { console.error('Weather fetch failed:', e); }

    // Filter by category if specified
    const filtered = category && category !== 'All' 
      ? markets.filter(m => m.category === category) 
      : markets;

    return Response.json({ markets: filtered, categories: ['All', 'Sports', 'Crypto', 'Weather'] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});