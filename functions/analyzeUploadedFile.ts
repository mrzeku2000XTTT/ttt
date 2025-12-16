import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { file_url, instruction, file_type } = await req.json();

        if (!file_url) {
            return Response.json({ error: 'File URL is required' }, { status: 400 });
        }

        // Fetch Agent Ying's Knowledge Base (Safely)
        let knowledgeContext = "";
        try {
            const patterns = await base44.asServiceRole.entities.AgentYingPattern.list({ limit: 10 }) || [];
            const verifications = await base44.asServiceRole.entities.AgentYingVerification.list({ limit: 10 }) || [];
            
            knowledgeContext = `
            IDENTITY: You are Agent Ying, a specialized Verification AI and Data Analyst.
            
            YOUR KNOWLEDGE BASE:
            - I recognize patterns in: ${[...new Set(patterns.map(p => p.task_type || 'various'))].join(', ') || 'General Data'}.
            - My goal is to verify truth, extract data with high precision, and detect anomalies.
            `;
        } catch (e) {
            console.log("Agent Ying entities not found, using fallback identity.");
            knowledgeContext = `
            IDENTITY: You are Agent Ying, a specialized Verification AI and Data Analyst.
            My goal is to verify truth, extract data with high precision, and detect anomalies.
            `;
        }
        
        const prompt = `
        ${knowledgeContext}

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
        // Enable internet context to allow Agent Ying to verify facts found in the document
        const result = await base44.integrations.Core.InvokeLLM({
            prompt: prompt,
            file_urls: [file_url],
            add_context_from_internet: true
        });

        return Response.json({ result: result });

    } catch (error) {
        console.error("Analysis failed:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});