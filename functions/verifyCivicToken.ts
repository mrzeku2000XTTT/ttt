import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await req.json();

    if (!token) {
      return Response.json({ error: 'Token required' }, { status: 400 });
    }

    const civicClientSecret = Deno.env.get('CIVIC_CLIENT_SECRET');
    if (!civicClientSecret) {
      return Response.json({ 
        error: 'Civic configuration missing',
        verified: false 
      }, { status: 500 });
    }

    // Verify the Civic token with Civic's API using the secret
    const civicResponse = await fetch('https://api.civic.com/sip/prod/scopeRequest/getUserData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Civic ${civicClientSecret}`,
        'X-Civic-Token': token
      },
      body: JSON.stringify({ token })
    });

    if (!civicResponse.ok) {
      const errorText = await civicResponse.text();
      console.error('Civic API error:', errorText);
      return Response.json({ 
        error: 'Invalid Civic token',
        verified: false 
      }, { status: 400 });
    }

    const civicData = await civicResponse.json();

    // Ensure we have valid data from Civic
    if (!civicData.data || !Array.isArray(civicData.data)) {
      return Response.json({ 
        error: 'Invalid Civic response',
        verified: false 
      }, { status: 400 });
    }

    // Extract age from Civic data
    const birthDate = civicData.data?.find(item => item.label === 'contact.personal.dateOfBirth')?.value;
    let age = 0;

    if (birthDate) {
      const today = new Date();
      const birth = new Date(birthDate);
      age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
    }

    // Store verification in user profile
    await base44.auth.updateMe({
      civic_verified: age >= 18,
      civic_verification_date: new Date().toISOString()
    });

    return Response.json({
      verified: age >= 18,
      age: age,
      verificationDate: new Date().toISOString()
    });

  } catch (error) {
    console.error('Civic verification error:', error);
    return Response.json({ 
      error: error.message,
      verified: false 
    }, { status: 500 });
  }
});