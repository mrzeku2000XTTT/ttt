import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const tabs = ['latest', 'trending', 'technology', 'price-analysis', 'ecosystem'];
    const allNews = [];
    
    for (const tab of tabs) {
      const url = tab === 'latest' 
        ? 'https://kaspa.news' 
        : `https://kaspa.news/${tab}`;
      
      const response = await fetch(url);
      const html = await response.text();
      
      // Extract news articles from HTML
      const articleMatches = html.matchAll(/<article[^>]*>(.*?)<\/article>/gs);
      
      for (const match of articleMatches) {
        const article = match[1];
        const titleMatch = article.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/s);
        const linkMatch = article.match(/href="([^"]+)"/);
        const descMatch = article.match(/<p[^>]*>(.*?)<\/p>/s);
        
        if (titleMatch && linkMatch) {
          allNews.push({
            title: titleMatch[1].replace(/<[^>]+>/g, '').trim(),
            url: linkMatch[1].startsWith('http') ? linkMatch[1] : `https://kaspa.news${linkMatch[1]}`,
            description: descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : '',
            category: tab,
            scraped_at: new Date().toISOString()
          });
        }
      }
    }
    
    return Response.json({ 
      success: true, 
      articles: allNews,
      total: allNews.length 
    });
    
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});