import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { receipt_url, claimed_amount } = await req.json();

    if (!receipt_url) {
      return Response.json({ error: 'Receipt URL required' }, { status: 400 });
    }

    // Use AI to extract data from receipt
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this receipt image and extract the following information:
      - Vendor/Store name
      - Date of purchase
      - Total amount
      - Items purchased (if visible)
      - Category (meals, travel, office_supplies, software, training, other)
      
      Receipt URL: ${receipt_url}
      Claimed Amount: $${claimed_amount}
      
      Verify if the receipt is legitimate and matches the claimed amount.
      Look for signs of fraud or manipulation.
      
      Return structured data.`,
      file_urls: [receipt_url],
      response_json_schema: {
        type: "object",
        properties: {
          vendor: { type: "string" },
          date: { type: "string" },
          total_amount: { type: "number" },
          items: {
            type: "array",
            items: { type: "string" }
          },
          category: { type: "string" },
          is_legitimate: { type: "boolean" },
          matches_claim: { type: "boolean" },
          confidence_score: { type: "number" },
          verification_notes: { type: "string" }
        }
      }
    });

    return Response.json({
      success: true,
      verification: result
    });

  } catch (error) {
    console.error('Receipt verification failed:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});