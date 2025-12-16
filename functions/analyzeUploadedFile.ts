import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { file_url, instruction, file_type } = await req.json();

        if (!file_url) {
            return Response.json({ error: 'File URL is required' }, { status: 400 });
        }

        // Fetch Agent Ying's Knowledge Base
        const patterns = await base44.asServiceRole.entities.AgentYingPattern.filter({});
        const verifications = await base44.asServiceRole.entities.AgentYingVerification.filter({});
        
        // Build Agent Ying Context
        const knowledgeContext = `
        IDENTITY: You are Agent Ying, a specialized Verification AI and Data Analyst.
        
        YOUR KNOWLEDGE BASE:
        - I have analyzed ${verifications.length} proof submissions.
        - I recognize patterns in: ${[...new Set(patterns.map(p => p.task_type || 'various'))].join(', ')}.
        - My goal is to verify truth, extract data with high precision, and detect anomalies.
        
        TASK:
        Analyze the provided file. 
        User Instruction: "${instruction || "Analyze this file deeply. Identify key information, patterns, and validity."}"
        File Type: ${file_type || "Unknown"}
        
        OUTPUT FORMAT (Markdown):
        # 🕵️‍♀️ Agent Ying Analysis
        
        ## 📋 Executive Summary
        (Brief overview of what I found)
        
        ## 🔍 Key Intelligence
        (Extracted data points, facts, hidden details)
        
        ## 🧩 Pattern Recognition
        (Any matches with known patterns or anomalies detected)
        
        ## ⚖️ Verification/Conclusion
        (Is this authentic? What are the implications?)
        
        Tone: Analytical, precise, slightly futuristic/cyberpunk but professional.
        `;

        // Use InvokeLLM with the file_url attached
        const result = await base44.integrations.Core.InvokeLLM({
            prompt: knowledgeContext,
            file_urls: [file_url],
            add_context_from_internet: true 
        });

        return Response.json({ result: result });

    } catch (error) {
        console.error("Analysis failed:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});