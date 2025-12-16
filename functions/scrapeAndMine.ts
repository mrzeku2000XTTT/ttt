import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { url, instruction } = await req.json();

        if (!url) {
            return Response.json({ error: 'URL is required' }, { status: 400 });
        }

        // Fetch the website content
        // Using a User-Agent to avoid some basic blocks
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            return Response.json({ error: `Failed to fetch URL: ${response.status} ${response.statusText}` }, { status: 500 });
        }

        const html = await response.text();

        // Simple cleanup to reduce token usage
        // Remove scripts, styles, and comments
        const cleanHtml = html
            .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
            .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
            .replace(/<!--[\s\S]*?-->/g, "")
            .replace(/\s+/g, " ")
            .trim();

        // Truncate if still too long (e.g. 100k chars)
        const content = cleanHtml.substring(0, 100000);

        const prompt = `
        You are a "Deep Research AI" acting like a perplexity-style search engine. 
        Your goal is to investigate the provided Target URL and generate a comprehensive research report.

        **Target Subject / URL:** ${url}
        **User Instruction:** ${instruction || "Investigate this website/topic deeply. Explain what it is, find external reviews, relevant news, and related data."}

        **Investigation Strategy:**
        1. **Analyze the Direct Content:** Use the provided website content below as a starting point.
        2. **Deep Web Search (CRITICAL):** Use your internet browsing capabilities to search *about* this URL/Entity. 
           - Look for: Official documentation, user reviews, news articles, GitHub repositories, social media discussions (Reddit, X), and competitor comparisons.
           - Verify the legitimacy and current status of the project/site.
        3. **Synthesize:** Combine the direct content with external findings.

        **Website Content (Direct Fetch):**
        ${content}

        **Output Format (Research Report):**
        Please structure your response exactly like a high-quality AI research report:

        # 🧠 Research: [Title of Entity/Site]

        ## 📋 Executive Summary
        A concise, high-level overview of what this is.

        ## 🔍 Key Findings
        *   **Core Functionality:** What does it actually do?
        *   **Data/Stats:** Any numbers, pricing, or technical specs found.
        *   **Recent Developments:** Latest news or updates found via web search.

        ## 🌐 External Context & Validation
        *   **Community Sentiment:** What are people saying? (Cite sources if possible, e.g., "According to Reddit threads...")
        *   **Competitors/Alternatives:** How does it compare to others?

        ## 🔗 Sources & References
        *   List key URLs you found during your search that validated this information.

        **Style:** Professional, objective, comprehensive, and well-structured Markdown.
        `;

        const result = await base44.integrations.Core.InvokeLLM({
            prompt: prompt,
            add_context_from_internet: true
        });

        return Response.json({ result: result });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});