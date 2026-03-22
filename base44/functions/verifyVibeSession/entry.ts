import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { session_id, scanned_wallet } = await req.json();

    if (!session_id || !scanned_wallet) {
      return Response.json({ error: 'Missing session_id or wallet address' }, { status: 400 });
    }

    // Get session from user's stored data
    const sessionKey = `vibe_session_${session_id}`;
    
    // Create or get session
    let sessions = [];
    try {
      const existingSessions = await base44.entities.User.filter({
        email: user.email
      });
      
      if (existingSessions.length > 0 && existingSessions[0].vibe_sessions) {
        sessions = JSON.parse(existingSessions[0].vibe_sessions || '[]');
      }
    } catch (err) {
      console.log('No existing sessions');
    }

    // Find matching session
    const matchingSession = sessions.find(s => s.session_id === session_id);
    
    if (!matchingSession) {
      return Response.json({ 
        success: false, 
        error: 'Session not found' 
      }, { status: 404 });
    }

    // Verify wallet matches
    if (matchingSession.wallet_address !== scanned_wallet) {
      return Response.json({ 
        success: false, 
        error: 'Wallet address mismatch' 
      }, { status: 403 });
    }

    // Update session status
    matchingSession.status = 'connected';
    matchingSession.connected_at = Date.now();
    
    // Save updated sessions
    const updatedSessions = sessions.map(s => 
      s.session_id === session_id ? matchingSession : s
    );

    await base44.auth.updateMe({
      vibe_sessions: JSON.stringify(updatedSessions)
    });

    return Response.json({
      success: true,
      session: matchingSession,
      redirect_url: `/VibeSession?session_id=${session_id}`
    });

  } catch (error) {
    console.error('Session verification error:', error);
    return Response.json({ 
      error: 'Verification failed',
      details: error.message 
    }, { status: 500 });
  }
});