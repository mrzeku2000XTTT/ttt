import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Agent ZK Endpoint Executor
 * Executes user-created custom endpoints dynamically
 */

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        // Authenticate user
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ 
                success: false,
                error: 'Unauthorized - Please log in' 
            }, { status: 401 });
        }

        const { endpoint_id, params = {} } = await req.json();

        if (!endpoint_id) {
            return Response.json({
                success: false,
                error: 'endpoint_id is required'
            }, { status: 400 });
        }

        console.log('🚀 Executing ZK Endpoint:', endpoint_id);

        // Load endpoint from database
        const endpoints = await base44.entities.ZKEndpoint.filter({ 
            id: endpoint_id 
        });

        if (!endpoints || endpoints.length === 0) {
            return Response.json({
                success: false,
                error: 'Endpoint not found'
            }, { status: 404 });
        }

        const endpoint = endpoints[0];

        // Check if endpoint is active
        if (!endpoint.is_active) {
            return Response.json({
                success: false,
                error: 'Endpoint is disabled'
            }, { status: 403 });
        }

        // Check authentication requirement
        if (endpoint.requires_auth && !user) {
            return Response.json({
                success: false,
                error: 'Authentication required'
            }, { status: 401 });
        }

        console.log('📝 Executing code for:', endpoint.endpoint_name);

        // Create execution context
        const context = {
            user: user,
            params: params,
            base44: base44,
            req: req,
            Response: Response
        };

        // Execute the user's code in a safe context
        try {
            // Wrap user code in async function
            const userFunction = new Function(
                'user', 
                'params', 
                'base44', 
                'req', 
                'Response',
                `
                return (async () => {
                    ${endpoint.code}
                })();
                `
            );

            // Execute with timeout
            const timeoutMs = 30000; // 30 seconds
            const resultPromise = userFunction(
                context.user,
                context.params,
                context.base44,
                context.req,
                context.Response
            );

            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Execution timeout')), timeoutMs)
            );

            const result = await Promise.race([resultPromise, timeoutPromise]);

            // Update call count
            await base44.entities.ZKEndpoint.update(endpoint.id, {
                call_count: (endpoint.call_count || 0) + 1
            });

            console.log('✅ Endpoint executed successfully');

            // Return the result from user's code
            return result;

        } catch (execError) {
            console.error('❌ Endpoint execution error:', execError);
            
            return Response.json({
                success: false,
                error: 'Endpoint execution failed',
                details: execError.message,
                endpoint: endpoint.endpoint_name
            }, { status: 500 });
        }

    } catch (error) {
        console.error('❌ ZK Endpoint Executor error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});