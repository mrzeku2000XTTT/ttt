import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      console.error('[AgentNegotiation] ❌ No user authenticated');
      return Response.json({ 
        success: false, 
        error: 'Unauthorized - Please log in' 
      }, { status: 401 });
    }

    const body = await req.json();
    console.log('[AgentNegotiation] 📦 Request body:', JSON.stringify(body));
    
    const { service_id, proposed_price, message } = body;

    if (!service_id) {
      console.error('[AgentNegotiation] ❌ Missing service_id');
      return Response.json({
        success: false,
        error: 'service_id is required'
      }, { status: 400 });
    }

    console.log('[AgentNegotiation] 🤝 Starting negotiation for service:', service_id);
    console.log('[AgentNegotiation] 👤 User:', user.email);
    console.log('[AgentNegotiation] 💰 Proposed price:', proposed_price);

    const service = await base44.asServiceRole.entities.AgentZKService.get(service_id);
    
    if (!service) {
      console.error('[AgentNegotiation] ❌ Service not found:', service_id);
      return Response.json({
        success: false,
        error: `Service not found with ID: ${service_id}`
      }, { status: 404 });
    }

    console.log('[AgentNegotiation] ✅ Service found:', service.service_name);

    if (!service.is_active) {
      console.error('[AgentNegotiation] ❌ Service not active');
      return Response.json({
        success: false,
        error: 'Service is no longer available'
      }, { status: 400 });
    }

    if (service.provider_email === user.email) {
      console.error('[AgentNegotiation] ❌ User trying to negotiate own service');
      return Response.json({
        success: false,
        error: 'Cannot negotiate your own service'
      }, { status: 400 });
    }

    if (!user.created_wallet_address) {
      console.error('[AgentNegotiation] ❌ User has no wallet');
      return Response.json({
        success: false,
        error: 'Create a wallet first to use Agent ZK'
      }, { status: 400 });
    }

    const negotiationId = `NEG-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const buyerZKId = `ZK-${user.created_wallet_address.slice(-10).toUpperCase()}`;

    console.log('[AgentNegotiation] 🆔 Buyer ZK ID:', buyerZKId);
    console.log('[AgentNegotiation] 🆔 Negotiation ID:', negotiationId);

    let buyerProofOfFunds = null;
    try {
      const balanceResponse = await base44.functions.invoke('verifyAgentBalance', {
        negotiation_address: user.created_wallet_address
      });

      if (balanceResponse.data.success) {
        buyerProofOfFunds = {
          balance_kas: balanceResponse.data.verification.balance_kas,
          verified_at: balanceResponse.data.verification.verified_at,
          trust_score: balanceResponse.data.analysis.trust_score
        };
        console.log('[AgentNegotiation] ✅ Buyer funds verified:', buyerProofOfFunds.balance_kas, 'KAS');
      }
    } catch (err) {
      console.warn('[AgentNegotiation] ⚠️ Could not verify buyer funds:', err.message);
    }

    let providerProof = null;
    if (service.negotiation_wallet_address || service.payment_address) {
      try {
        const providerBalanceResponse = await base44.functions.invoke('verifyAgentBalance', {
          service_id: service_id
        });

        if (providerBalanceResponse.data.success) {
          providerProof = {
            balance_kas: providerBalanceResponse.data.verification.balance_kas,
            total_reviews: service.total_reviews || 0,
            average_rating: service.average_rating || 0,
            trust_score: providerBalanceResponse.data.analysis.trust_score
          };
          console.log('[AgentNegotiation] ✅ Provider verified:', providerProof.balance_kas, 'KAS');
        }
      } catch (err) {
        console.warn('[AgentNegotiation] ⚠️ Could not verify provider:', err.message);
      }
    }

    const initialMessage = {
      from_agent: buyerZKId,
      to_agent: service.provider_agent_zk_id,
      message: message || `Hello! I'm interested in your service "${service.service_name}". ${proposed_price ? `I'd like to offer ${proposed_price} KAS.` : 'Can we discuss pricing?'}`,
      timestamp: new Date().toISOString(),
      message_type: 'initial_inquiry'
    };

    console.log('[AgentNegotiation] 💬 Creating negotiation record...');

    const negotiation = await base44.asServiceRole.entities.AgentNegotiation.create({
      service_id: service_id,
      buyer_email: user.email,
      buyer_agent_zk_id: buyerZKId,
      provider_email: service.provider_email,
      provider_agent_zk_id: service.provider_agent_zk_id,
      negotiation_id: negotiationId,
      status: proposed_price ? 'offer_made' : 'initiated',
      original_price: service.price_kas,
      proposed_price: proposed_price || null,
      buyer_proof_of_funds: buyerProofOfFunds,
      provider_proof_of_service: providerProof,
      agent_messages: [initialMessage],
      buyer_approved: false,
      provider_approved: false,
      initiated_at: new Date().toISOString()
    });

    console.log('[AgentNegotiation] ✅ Negotiation created:', negotiationId);

    return Response.json({
      success: true,
      negotiation: {
        negotiation_id: negotiationId,
        status: negotiation.status,
        service: {
          name: service.service_name,
          description: service.description,
          original_price: service.price_kas,
          category: service.category,
          provider: service.provider_agent_zk_id
        },
        buyer_analysis: buyerProofOfFunds ? {
          has_funds: buyerProofOfFunds.balance_kas >= (proposed_price || service.price_kas),
          balance: buyerProofOfFunds.balance_kas,
          trust_score: buyerProofOfFunds.trust_score,
          sufficient: buyerProofOfFunds.balance_kas >= service.price_kas
        } : null,
        provider_analysis: providerProof ? {
          balance: providerProof.balance_kas,
          reviews: providerProof.total_reviews,
          rating: providerProof.average_rating,
          trust_score: providerProof.trust_score,
          reputation: providerProof.trust_score >= 70 ? 'excellent' : 
                     providerProof.trust_score >= 50 ? 'good' : 
                     providerProof.trust_score >= 30 ? 'fair' : 'new'
        } : null,
        proposed_price: proposed_price || null,
        recommendation: {
          fair_price: service.price_kas * 0.95,
          confidence: buyerProofOfFunds && providerProof ? 'high' : 'medium',
          next_steps: [
            'Provider\'s Agent ZK will review your offer',
            'Expect response within 24 hours',
            'Check negotiation status in chat'
          ]
        },
        agent_message_sent: initialMessage.message
      }
    });

  } catch (error) {
    console.error('[AgentNegotiation] ❌ Fatal Error:', error);
    console.error('[AgentNegotiation] ❌ Error stack:', error.stack);
    return Response.json({ 
      success: false,
      error: error.message,
      details: error.stack
    }, { status: 500 });
  }
});