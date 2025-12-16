import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { file_url, instruction, file_type } = await req.json();

        if (!file_url) {
            return Response.json({ error: 'File URL is required' }, { status: 400 });
        }

        const prompt = `
        You are an advanced AI Data Analyst and Researcher.
        
        **Task:** Analyze the provided file(s) and extract information based on the user's instruction.
        
        **User Instruction:** ${instruction || "Analyze this file and provide a comprehensive summary of its contents, key data points, and any important insights."}
        
        **File Type:** ${file_type || "Unknown"}
        
        **Output Format:**
        Provide a well-structured Markdown report.
        - **Executive Summary:** Brief overview.
        - **Key Details:** Extracted data points, facts, or content summaries.
        - **Analysis:** Insights or conclusions.
        - **Raw Data (if applicable):** Tables or lists of specific data found.
        
        Be precise, thorough, and professional.
        `;

        // Use InvokeLLM with the file_url attached
        // The Core integration handles downloading and processing the file context for the LLM
        const result = await base44.integrations.Core.InvokeLLM({
            prompt: prompt,
            file_urls: [file_url],
            add_context_from_internet: true // Keep this true in case the LLM needs to look up terms found in the doc
        });

        return Response.json({ result: result });

    } catch (error) {
        console.error("Analysis failed:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});