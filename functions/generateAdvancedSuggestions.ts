import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipientProfileId, occasion, budget } = await req.json();

    const activities = await base44.entities.UserActivity.filter({
      user_email: user.email
    }, '-created_date', 50);

    const wishlist = await base44.entities.WishlistItem.filter({
      user_email: user.email
    }, '-created_date', 20);

    let recipientProfile = null;
    if (recipientProfileId) {
      const profiles = await base44.entities.RecipientProfile.filter({
        id: recipientProfileId
      });
      recipientProfile = profiles[0];
    }

    const activitySummary = activities.map(a => 
      `${a.activity_type}: ${a.category || 'N/A'}`
    ).join(', ');

    const wishlistSummary = wishlist.map(w => 
      `${w.product_name} (${w.category}, $${w.price_usd})`
    ).join(', ');

    const trendResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `What are the top 5 trending products in 2025 for ${occasion || 'general gifting'}? List product names and categories.`,
      add_context_from_internet: true
    });

    const prompt = `Generate 8 personalized gift suggestions based on:

USER BEHAVIOR:
${activitySummary}

WISHLIST ITEMS:
${wishlistSummary}

${recipientProfile ? `RECIPIENT PROFILE:
- Name: ${recipientProfile.recipient_name}
- Relationship: ${recipientProfile.relationship}
- Age: ${recipientProfile.age_group}
- Interests: ${recipientProfile.interests?.join(', ')}
- Budget: ${recipientProfile.budget_range}
` : ''}

OCCASION: ${occasion || 'General'}
BUDGET: ${budget || 'Flexible'}

TRENDING PRODUCTS:
${trendResponse}

Provide creative, personalized gift suggestions with:
- product_name (exact product with brand name)
- estimated_price_usd
- store_name (Amazon, Walmart, Target, Best Buy, etc.)
- product_url (real clickable store URL - use format: https://www.amazon.com/s?k=PRODUCT_NAME or https://www.walmart.com/search?q=PRODUCT_NAME)
- product_image (real product image URL if available)
- category
- reason (why it fits based on their profile/behavior)
- trending_score (1-10)

IMPORTANT: Always include valid product_url using store search URLs.
Focus on items that complement their existing wishlist and match recipient profile.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                product_name: { type: "string" },
                estimated_price_usd: { type: "number" },
                store_name: { type: "string" },
                product_url: { type: "string" },
                product_image: { type: "string" },
                category: { type: "string" },
                reason: { type: "string" },
                trending_score: { type: "number" }
              }
            }
          }
        }
      }
    });

    await base44.entities.GiftNotification.create({
      user_email: user.email,
      type: 'ai_suggestion',
      title: '✨ New AI Gift Suggestions',
      message: `We found ${response.suggestions?.length || 0} personalized gift ideas for you!`
    });

    return Response.json({ 
      success: true,
      suggestions: response.suggestions || []
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});