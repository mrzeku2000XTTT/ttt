import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { itemId, newPrice } = await req.json();

    if (!itemId || !newPrice) {
      return Response.json({ error: 'Missing itemId or newPrice' }, { status: 400 });
    }

    const item = await base44.asServiceRole.entities.WishlistItem.filter({ id: itemId });
    if (!item || item.length === 0) {
      return Response.json({ error: 'Item not found' }, { status: 404 });
    }

    const wishlistItem = item[0];
    const priceHistory = wishlistItem.price_history || [];
    
    priceHistory.push({
      price_usd: newPrice,
      date: new Date().toISOString()
    });

    await base44.asServiceRole.entities.WishlistItem.update(itemId, {
      price_usd: newPrice,
      price_kas: newPrice / 0.15,
      price_history: priceHistory
    });

    const alerts = await base44.asServiceRole.entities.PriceAlert.filter({
      wishlist_item_id: itemId,
      is_triggered: false
    });

    for (const alert of alerts) {
      if (newPrice <= alert.target_price_usd) {
        await base44.asServiceRole.entities.PriceAlert.update(alert.id, {
          is_triggered: true
        });

        await base44.asServiceRole.entities.GiftNotification.create({
          user_email: alert.user_email,
          type: 'price_alert',
          title: '🎉 Price Alert Triggered!',
          message: `${wishlistItem.product_name} dropped to $${newPrice.toFixed(2)}!`,
          item_id: itemId
        });
      }
    }

    return Response.json({ 
      success: true, 
      priceHistory: priceHistory.slice(-10) 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});