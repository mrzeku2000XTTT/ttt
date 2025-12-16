import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Authenticate User
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { file_url, instruction, file_type, file_name } = await req.json();

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
        
        OUTPUT REQUIREMENT:
        Return a JSON object with the following fields:
        1. report: A detailed Markdown report (Executive Summary, Key Intelligence, Pattern Recognition, Verification/Conclusion).
        2. verification_score: A number between 0 and 100 indicating confidence/validity/quality.
        3. task_type: A short string categorizing the file content (e.g., "financial_report", "code_snippet", "identity_doc", "research_paper", "image_proof").
        4. summary: A one-sentence summary.
        
        Tone: Analytical, precise, slightly futuristic/cyberpunk but professional.
        `;

        // Use InvokeLLM with the file_url attached and JSON schema enforcement
        const result = await base44.integrations.Core.InvokeLLM({
            prompt: prompt,
            file_urls: [file_url],
            add_context_from_internet: true,
            response_json_schema: {
                type: "object",
                properties: {
                    report: { type: "string" },
                    verification_score: { type: "number" },
                    task_type: { type: "string" },
                    summary: { type: "string" }
                },
                required: ["report", "verification_score", "task_type", "summary"]
            }
        });

        // Parse result if it's a string (though SDK usually returns object for json schema)
        // Base44 SDK returns dict/object if schema is provided
        const analysisData = result; 

        // Auto-save to Agent Ying's Database
        const verificationId = crypto.randomUUID();
        await base44.asServiceRole.entities.AgentYingVerification.create({
            verification_id: verificationId,
            user_email: user.email,
            file_url: file_url,
            file_name: file_name || "uploaded_file",
            file_type: file_type || "unknown",
            user_explanation: instruction || "No instruction provided",
            enhanced_explanation: analysisData.report,
            task_type: analysisData.task_type || "general",
            verification_score: analysisData.verification_score || 0,
            quality_score: (analysisData.verification_score || 0) / 100,
            complexity_score: 0.5, // Default
            pattern_match: {
                found: true,
                confidence: (analysisData.verification_score || 0) / 100,
                pattern_id: "auto-generated"
            },
            verified_at: new Date().toISOString()
        });

        return Response.json({ 
            result: analysisData.report, 
            data: analysisData,
            verification_id: verificationId,
            file_url: file_url 
        });

    } catch (error) {
        console.error("Analysis failed:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});