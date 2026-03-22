import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { itemId } = await req.json();

    const item = await base44.asServiceRole.entities.WishlistItem.filter({ id: itemId });
    if (!item || item.length === 0) {
      return Response.json({ error: 'Item not found' }, { status: 404 });
    }

    const wishlistItem = item[0];
    const priceHistory = wishlistItem.price_history || [];

    if (priceHistory.length < 3) {
      return Response.json({ 
        prediction: 'insufficient_data',
        message: 'Not enough price history to predict'
      });
    }

    const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Analyze this price history for ${wishlistItem.product_name}:
${JSON.stringify(priceHistory)}

Current price: $${wishlistItem.price_usd}
Category: ${wishlistItem.category}

Predict:
1. Likelihood of price drop in next 7 days (percentage)
2. Expected lowest price in next 30 days
3. Best time to buy (now, wait 1 week, wait 1 month)
4. Reasoning

Return JSON format.`,
      response_json_schema: {
        type: "object",
        properties: {
          drop_probability: { type: "number" },
          predicted_lowest_price: { type: "number" },
          best_time_to_buy: { type: "string" },
          reasoning: { type: "string" }
        }
      }
    });

    return Response.json({ 
      success: true,
      prediction: response
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});