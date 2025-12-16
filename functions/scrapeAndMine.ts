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
        You are a professional technical writer and data analyst. 
        Your task is to analyze the provided website content and produce a high-quality "Article / Documentation" that explains the site.
        
        User Instruction: ${instruction || "Create a comprehensive article explaining this website, its purpose, key features, and data."}
        
        Website Content (truncated):
        ${content}
        
        **Output Format Requirements:**
        - **Title:** A clear, engaging title for the article.
        - **Introduction:** A professional summary of what the site is.
        - **Key Features/Data:** Structured sections (using H2/H3 headers) detailing the main content, products, or data found.
        - **Analysis:** Insights or summary of the value proposition.
        - **Format:** Use clean Markdown with headers, bullet points, and **bold** text for readability. Make it look like a polished documentation page or blog post.
        `;

        const result = await base44.integrations.Core.InvokeLLM({
            prompt: prompt
        });

        return Response.json({ result: result });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});