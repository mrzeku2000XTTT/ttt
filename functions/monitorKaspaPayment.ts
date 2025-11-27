import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { order_id } = await req.json();
    
    if (!order_id) {
      return Response.json({ error: 'order_id required' }, { status: 400 });
    }

    // Get order details
    const orders = await base44.asServiceRole.entities.ShopOrder.filter({ id: order_id });
    
    if (orders.length === 0) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orders[0];
    
    if (order.status !== 'pending_payment') {
      return Response.json({ 
        status: order.status,
        message: 'Order already processed',
        tx_id: order.payment_tx_id
      });
    }

    // Check if order expired
    if (order.expires_at && new Date(order.expires_at) < new Date()) {
      await base44.asServiceRole.entities.ShopOrder.update(order_id, {
        status: 'cancelled'
      });
      return Response.json({ 
        error: 'Payment window expired',
        status: 'cancelled'
      }, { status: 400 });
    }

    // Call Kaspa API to check transactions to seller's address
    const kaspaApiKey = Deno.env.get('KASPA_API_KEY');
    const sellerAddress = order.seller_kaspa_address;
    
    // Get recent transactions for the address
    const response = await fetch(
      `https://api.kaspa.org/addresses/${sellerAddress}/full-transactions?limit=10&resolve_previous_outpoints=light`,
      {
        headers: {
          'Authorization': `Bearer ${kaspaApiKey}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Kaspa API error: ${response.status}`);
    }

    const data = await response.json();
    const transactions = data.transactions || [];

    // Look for a transaction with the correct amount from the last 30 minutes
    const orderCreatedAt = new Date(order.created_date).getTime();
    const expectedAmount = Math.round(order.amount_kas * 100000000); // Convert to sompi (8 decimals)
    
    for (const tx of transactions) {
      const txTime = tx.block_time ? tx.block_time * 1000 : Date.now();
      
      // Skip transactions older than order creation
      if (txTime < orderCreatedAt) continue;
      
      // Check outputs to seller's address
      for (const output of tx.outputs || []) {
        if (output.script_public_key_address === sellerAddress) {
          const receivedAmount = parseInt(output.amount);
          
          // Check if amount matches (allow 1% tolerance for fees)
          const amountDiff = Math.abs(receivedAmount - expectedAmount);
          const tolerance = expectedAmount * 0.01;
          
          if (amountDiff <= tolerance) {
            // Payment found! Update order
            await base44.asServiceRole.entities.ShopOrder.update(order_id, {
              status: 'payment_confirmed',
              payment_tx_id: tx.transaction_id,
              payment_detected_at: new Date(txTime).toISOString()
            });

            // Send notification email to seller
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: order.seller_email,
              subject: '💰 Payment Received for Your Product!',
              body: `Great news! Payment of ${order.amount_kas} KAS has been received for "${order.item_name}".\n\nBuyer: ${order.buyer_name}\nDelivery Info: ${order.delivery_info}\n\nTransaction ID: ${tx.transaction_id}\n\nPlease deliver the product to the buyer.`
            });

            // Send confirmation to buyer
            if (order.buyer_email) {
              await base44.asServiceRole.integrations.Core.SendEmail({
                to: order.buyer_email,
                subject: '✅ Payment Confirmed!',
                body: `Your payment of ${order.amount_kas} KAS for "${order.item_name}" has been confirmed!\n\nThe seller will process your order shortly.\n\nTransaction ID: ${tx.transaction_id}`
              });
            }

            return Response.json({
              success: true,
              status: 'payment_confirmed',
              tx_id: tx.transaction_id,
              amount: receivedAmount / 100000000,
              timestamp: new Date(txTime).toISOString()
            });
          }
        }
      }
    }

    // No matching payment found yet
    return Response.json({
      success: false,
      status: 'pending_payment',
      message: 'No matching payment detected yet',
      checked_transactions: transactions.length
    });

  } catch (error) {
    console.error('Payment monitoring error:', error);
    return Response.json({ 
      error: error.message,
      details: 'Failed to check payment status'
    }, { status: 500 });
  }
});