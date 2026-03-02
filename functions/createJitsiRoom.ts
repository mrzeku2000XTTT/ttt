import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const { caller_email, receiver_email } = await req.json();
    
    if (!caller_email || !receiver_email) {
      return Response.json({ error: 'caller_email and receiver_email required' }, { status: 400 });
    }

    // Generate a unique room name based on participants + timestamp
    const timestamp = Date.now();
    const raw = `rufzeitk-${caller_email}-${receiver_email}-${timestamp}`;
    // Simple base64-ish safe room name
    const roomName = btoa(raw).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);

    return Response.json({ room_name: roomName });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});