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

      // Send PIN via FluxKmail using SendEmail integration
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: 'CreditCode Registration - Verify Your Identity',
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 20px; border: 1px solid #333;">
            <h1 style="color: #06b6d4; margin: 0 0 20px 0;">CreditCode Verification</h1>
            <p style="margin: 0 0 20px 0; color: #ccc;">Welcome to CreditCode! Your verification PIN is:</p>
            <div style="background: linear-gradient(135deg, #06b6d4, #0891b2); padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <div style="font-size: 36px; letter-spacing: 8px; font-weight: bold; font-family: monospace;">${pin}</div>
            </div>
            <p style="margin: 20px 0; color: #999; font-size: 14px;">
              <strong>Kaspa Address:</strong> ${kaspaAddress}
            </p>
            <p style="margin: 20px 0 0 0; color: #666; font-size: 12px;">This PIN will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
          </div>
        `
      });

      return Response.json({
        success: true,
        message: 'PIN sent to your email',
        expiresIn: 600 // seconds
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});