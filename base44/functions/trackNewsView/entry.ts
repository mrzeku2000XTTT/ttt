import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        const { news_id, view_duration, device_type } = await req.json();

        if (!news_id) {
            return Response.json({ error: 'News ID required' }, { status: 400 });
        }

        console.log('👁️ Tracking view for news:', news_id);

        // Track the view
        const view = await base44.asServiceRole.entities.NewsView.create({
            news_id: news_id,
            viewer_address: user?.kasware_address || 'anonymous',
            viewer_email: user?.email || null,
            view_duration: view_duration || 0,
            device_type: device_type || 'desktop',
            viewed_at: new Date().toISOString()
        });

        // Update view count on the news
        const news = await base44.asServiceRole.entities.StampedNews.get(news_id);
        if (news) {
            await base44.asServiceRole.entities.StampedNews.update(news_id, {
                views: (news.views || 0) + 1
            });
        }

        console.log('✅ View tracked successfully');

        return Response.json({
            success: true,
            view_id: view.id
        });

    } catch (error) {
        console.error('❌ Failed to track view:', error);
        return Response.json({ 
            error: error.message || 'Failed to track view' 
        }, { status: 500 });
    }
});