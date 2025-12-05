import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Fetch real-time threat data
    const threats = [];

    // Economic threats - check crypto/stock markets
    try {
      const kaspaPrice = await fetch('https://api.kaspa.org/info/price');
      const priceData = await kaspaPrice.json();
      
      const economicThreat = {
        threat_type: 'economic',
        severity: priceData.price < 0.10 ? 'high' : 'medium',
        title: 'Cryptocurrency Market Volatility',
        description: `Kaspa trading at $${priceData.price}. Market showing ${priceData.price < 0.10 ? 'high' : 'moderate'} volatility.`,
        source: 'Kaspa API',
        confidence: 85,
        verified: true,
        verification_count: 1
      };
      threats.push(economicThreat);
    } catch (err) {
      console.error('Kaspa API error:', err);
    }

    // Nuclear threats - check news
    try {
      const newsResponse = await base44.integrations.Core.InvokeLLM({
        prompt: 'Search current news for nuclear threats, military tensions, DEFCON status changes, and geopolitical conflicts. Provide a severity assessment (low/medium/high/critical) and brief summary. Format: SEVERITY|Title|Description',
        add_context_from_internet: true
      });

      const parts = newsResponse.split('|');
      if (parts.length >= 3) {
        threats.push({
          threat_type: 'nuclear',
          severity: parts[0].toLowerCase().trim(),
          title: parts[1].trim(),
          description: parts[2].trim(),
          source: 'Live News Analysis',
          confidence: 75,
          verified: false,
          verification_count: 0
        });
      }
    } catch (err) {
      console.error('Nuclear threat check error:', err);
    }

    // Natural disasters - earthquakes, weather
    try {
      const earthquakeResponse = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson');
      const earthquakeData = await earthquakeResponse.json();
      
      if (earthquakeData.features && earthquakeData.features.length > 0) {
        const recent = earthquakeData.features[0];
        const mag = recent.properties.mag;
        
        threats.push({
          threat_type: 'natural',
          severity: mag > 7 ? 'critical' : mag > 6 ? 'high' : 'medium',
          title: `Magnitude ${mag} Earthquake`,
          description: `${recent.properties.place}. Occurred ${new Date(recent.properties.time).toLocaleString()}`,
          source: 'USGS',
          confidence: 95,
          verified: true,
          verification_count: 1,
          location: recent.properties.place
        });
      }
    } catch (err) {
      console.error('USGS API error:', err);
    }

    // Prophetic analysis
    try {
      const prophecyResponse = await base44.integrations.Core.InvokeLLM({
        prompt: 'Based on current world events from news today, identify patterns matching biblical prophecy from Revelation. Rate severity (low/medium/high/critical) based on prophetic significance. Format: SEVERITY|Title|Description with scripture reference',
        add_context_from_internet: true
      });

      const parts = prophecyResponse.split('|');
      if (parts.length >= 3) {
        threats.push({
          threat_type: 'prophetic',
          severity: parts[0].toLowerCase().trim(),
          title: parts[1].trim(),
          description: parts[2].trim(),
          source: 'Prophecy Analysis AI',
          confidence: 70,
          verified: false,
          verification_count: 0,
          scripture_reference: 'Revelation'
        });
      }
    } catch (err) {
      console.error('Prophecy analysis error:', err);
    }

    // Store all threats in database
    for (const threat of threats) {
      try {
        await base44.asServiceRole.entities.ThreatIntel.create(threat);
      } catch (err) {
        console.error('Failed to store threat:', err);
      }
    }

    return Response.json({
      success: true,
      threats: threats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Threat intel fetch error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});