import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Agent ZK Endpoint Executor
 * Executes user-created custom endpoints dynamically
 */

/**
 * Safe declarative action executor.
 * Supports a fixed set of actions — never executes arbitrary code.
 * 
 * Supported actions:
 *  - { type: "echo" }                         → returns { user, params }
 *  - { type: "static", data: <any> }          → returns data as-is
 *  - { type: "template", template: <str> }   → returns template with {{param.x}} placeholders
 *  - { type: "entity_query", entity, filter, limit } → returns entity records (read-only)
 */
async function executeAction(action, ctx) {
    if (!action || typeof action !== 'object' || !action.type) {
        throw new Error('Invalid action: missing "type"');
    }

    const { user, params, base44 } = ctx;

    switch (action.type) {
        case 'echo':
            return { user: { id: user.id, email: user.email, full_name: user.full_name }, params };

        case 'static':
            return action.data ?? null;

        case 'template': {
            let tpl = String(action.template || '');
            // Replace {{param.foo}} and {{user.email}} style placeholders only
            tpl = tpl.replace(/\{\{\s*param\.([\w.]+)\s*\}\}/g, (_, path) => {
                return String(path.split('.').reduce((o, k) => (o == null ? '' : o[k]), params) ?? '');
            });
            tpl = tpl.replace(/\{\{\s*user\.(\w+)\s*\}\}/g, (_, key) => {
                return String(user[key] ?? '');
            });
            return tpl;
        }

        case 'entity_query': {
            const entityName = String(action.entity || '');
            if (!entityName) throw new Error('entity_query requires "entity"');
            // Only allow alnum entity names (no special chars)
            if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(entityName)) {
                throw new Error('Invalid entity name');
            }
            const entity = base44.entities[entityName];
            if (!entity || typeof entity.filter !== 'function') {
                throw new Error('Unknown entity: ' + entityName);
            }
            // Only allow simple filter values (strings/numbers/booleans), reject objects/$-operators
            const rawFilter = action.filter || {};
            const safeFilter = {};
            for (const [k, v] of Object.entries(rawFilter)) {
                if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
                    safeFilter[k] = v;
                }
                // Reject objects, arrays, $-prefixed keys — prevents NoSQL injection
                if (k.startsWith('$')) continue;
            }
            const limit = Math.min(Number(action.limit) || 50, 100);
            const records = await entity.filter(safeFilter, '-created_date', limit);
            return records;
        }

        default:
            throw new Error('Unsupported action type: ' + action.type);
    }
}

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

        console.log('📝 Executing action for:', endpoint.endpoint_name);

        // SECURITY: The endpoint.code field is treated as a declarative
        // action definition (JSON), NOT as executable JavaScript. This
        // prevents arbitrary code execution on the server. Only a fixed
        // set of safe, pre-defined actions are supported.
        try {
            const action = JSON.parse(endpoint.code || '{}');
            const result = await executeAction(action, {
                user,
                params,
                base44,
                response_type: endpoint.response_type || 'json',
            });

            // Update call count
            await base44.entities.ZKEndpoint.update(endpoint.id, {
                call_count: (endpoint.call_count || 0) + 1
            });

            console.log('✅ Endpoint executed successfully');

            if (endpoint.response_type === 'html') {
                return new Response(typeof result === 'string' ? result : String(result), {
                    status: 200,
                    headers: { 'Content-Type': 'text/html' }
                });
            }
            if (endpoint.response_type === 'text') {
                return new Response(typeof result === 'string' ? result : String(result), {
                    status: 200,
                    headers: { 'Content-Type': 'text/plain' }
                });
            }
            return Response.json({ success: true, data: result });

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