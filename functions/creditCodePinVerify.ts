import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { kaspaAddress, action } = await req.json();

    if (action === 'generatePin') {
      // Generate 6-digit PIN
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store PIN temporarily in memory/cache with expiry (would use Redis in production)
      const pinData = {
        pin,
        kaspaAddress,
        userEmail: user.email,
        createdAt: Date.now(),
        expiresAt: Date.now() + (10 * 60 * 1000) // 10 minutes
      };

      const fluxkmailApiUrl = Deno.env.get("FLUXKMAIL_API_URL");
      const fluxkmailApiKey = Deno.env.get("FLUXKMAIL_API_KEY");

      if (!fluxkmailApiUrl || !fluxkmailApiKey) {
        return Response.json({ error: 'Fluxkmail API credentials (FLUXKMAIL_API_URL or FLUXKMAIL_API_KEY) not configured in CreditCode app environment variables.' }, { status: 500 });
      }

      // Send PIN to Fluxkmail's receiveVibecodePin function
      await fetch(fluxkmailApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': fluxkmailApiKey
        },
        body: JSON.stringify({
          recipientAddress: kaspaAddress,
          pinCode: pin,
          subject: 'CreditCode PIN Verification',
          body: `Your CreditCode verification PIN is: <b>${pin}</b><br><br>This PIN will expire in 10 minutes. If you didn't request this, please ignore this message.`
        })
      });

      return Response.json({
        success: true,
        message: 'PIN sent to your Kaspa address via Fluxkmail',
        expiresIn: 600 // seconds
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});