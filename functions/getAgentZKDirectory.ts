import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Get Agent ZK Directory with Roles
 * Returns all Agent ZK profiles with their roles and hiring info
 */

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        console.log('📋 [Directory] Fetching Agent ZK directory...');

        // Get filter parameters from request
        const url = new URL(req.url);
        const roleFilter = url.searchParams.get('role');
        const hireableOnly = url.searchParams.get('hireable') === 'true';
        const searchQuery = url.searchParams.get('search');

        // Fetch all Agent ZK profiles
        let profiles = await base44.asServiceRole.entities.AgentZKProfile.filter({
            is_public: true
        });

        console.log('📊 [Directory] Found', profiles.length, 'profiles');

        // Apply filters
        if (roleFilter && roleFilter !== 'all') {
            profiles = profiles.filter(p => p.role === roleFilter);
            console.log('🔍 [Directory] Filtered by role:', roleFilter, '→', profiles.length, 'profiles');
        }

        if (hireableOnly) {
            profiles = profiles.filter(p => p.is_hireable === true);
            console.log('💼 [Directory] Hireable only →', profiles.length, 'profiles');
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            profiles = profiles.filter(p => 
                p.username?.toLowerCase().includes(query) ||
                p.agent_zk_id?.toLowerCase().includes(query) ||
                p.role?.toLowerCase().includes(query) ||
                p.bio?.toLowerCase().includes(query) ||
                p.skills?.some(s => s.toLowerCase().includes(query))
            );
            console.log('🔎 [Directory] Search query:', searchQuery, '→', profiles.length, 'profiles');
        }

        // Sort by last_active (most recent first)
        profiles.sort((a, b) => {
            const timeA = a.last_active ? new Date(a.last_active).getTime() : 0;
            const timeB = b.last_active ? new Date(b.last_active).getTime() : 0;
            return timeB - timeA;
        });

        // Get role distribution
        const roleStats = profiles.reduce((acc, profile) => {
            const role = profile.role || 'Other';
            acc[role] = (acc[role] || 0) + 1;
            return acc;
        }, {});

        console.log('✅ [Directory] Returning', profiles.length, 'profiles');
        console.log('📊 [Directory] Role distribution:', roleStats);

        return Response.json({
            success: true,
            total: profiles.length,
            profiles: profiles,
            role_stats: roleStats,
            filters_applied: {
                role: roleFilter || 'all',
                hireable_only: hireableOnly,
                search_query: searchQuery || null
            }
        });

    } catch (error) {
        console.error('❌ [Directory] Error:', error);
        return Response.json({ 
            success: false,
            error: error.message
        }, { status: 500 });
    }
});