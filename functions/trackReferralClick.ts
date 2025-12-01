import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { referral_code, ip_address } = await req.json();

    if (!referral_code) {
      return Response.json({ error: 'Referral code required' }, { status: 400 });
    }

    // Find creator by referral code
    const allUsers = await base44.asServiceRole.entities.User.list();
    const creator = allUsers.find(u => u.referral_code === referral_code);

    if (!creator) {
      return Response.json({ error: 'Invalid referral code' }, { status: 404 });
    }

    // Track the click
    const click = await base44.asServiceRole.entities.CreatorReferral.create({
      creator_email: creator.email,
      creator_wallet: creator.created_wallet_address || '',
      referral_code: referral_code,
      clicked_at: new Date().toISOString(),
      converted: false,
      conversion_type: 'none',
      earnings: 0,
      ip_address: ip_address || 'unknown'
    });

    return Response.json({ 
      success: true,
      message: 'Click tracked',
      click_id: click.id
    });
  } catch (error) {
    console.error('Track error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});