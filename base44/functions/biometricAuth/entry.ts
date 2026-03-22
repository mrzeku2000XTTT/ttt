import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// In-memory challenge storage (in production, use Redis or database)
const challenges = new Map();

// Challenge timeout: 5 minutes
const CHALLENGE_TIMEOUT = 5 * 60 * 1000;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, username, credentialId, authenticatorData, clientDataJSON, signature } = await req.json();

    // Generate challenge for registration/login
    if (action === 'challenge') {
      const challenge = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
      
      // Store challenge with timestamp
      challenges.set(user.email, {
        challenge,
        timestamp: Date.now(),
        username: user.email
      });

      return Response.json({
        challenge,
        userId: btoa(user.email),
        username: user.email
      });
    }

    // Verify biometric authentication
    if (action === 'verify') {
      const stored = challenges.get(user.email);
      
      // Verify challenge exists and is recent
      if (!stored) {
        return Response.json({ error: 'No challenge found' }, { status: 400 });
      }
      
      if (Date.now() - stored.timestamp > CHALLENGE_TIMEOUT) {
        challenges.delete(user.email);
        return Response.json({ error: 'Challenge expired' }, { status: 400 });
      }

      // In production, verify the signature using the stored public key
      // For now, we'll accept if the challenge was valid
      challenges.delete(user.email);

      // Create signed terms message
      const termsMessage = `I accept the TTT Terms of Service.

By signing this message, I acknowledge:
- TTT is in ALPHA stage with potential bugs
- I am solely responsible for my private keys and funds
- TTT does not custody or control my funds
- TTT Wallet may display 0 balance as a security feature
- I accept all risks associated with cryptocurrency transactions
- Developers are not liable for any financial losses

Authentication Method: Face ID / Touch ID (WebAuthn)
User: ${user.email}
Timestamp: ${new Date().toISOString()}
Credential ID: ${credentialId?.substring(0, 20)}...`;

      // Store terms acceptance in user profile
      await base44.auth.updateMe({
        terms_accepted: true,
        terms_accepted_date: new Date().toISOString(),
        terms_signature: credentialId,
        terms_method: 'biometric'
      });

      return Response.json({
        success: true,
        signature: termsMessage,
        message: 'Terms accepted via biometric authentication'
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Biometric auth error:', error);
    return Response.json({ 
      error: error.message || 'Authentication failed' 
    }, { status: 500 });
  }
});