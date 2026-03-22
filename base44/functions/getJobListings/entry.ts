import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobs = await base44.asServiceRole.entities.HRJobListing.filter({ status: 'active' });
    
    const enrichedJobs = [];
    
    for (const job of jobs) {
      let posterProfile = null;
      
      if (job.posted_by_wallet) {
        try {
          const profiles = await base44.asServiceRole.entities.AgentZKProfile.filter({
            wallet_address: job.posted_by_wallet
          });
          
          if (profiles.length > 0) {
            posterProfile = {
              username: profiles[0].username,
              agent_zk_id: profiles[0].agent_zk_id,
              agent_zk_photo: profiles[0].agent_zk_photo,
              role: profiles[0].role,
              wallet_address: profiles[0].wallet_address
            };
          }
        } catch (err) {
          console.log('Could not load profile for job:', job.id);
        }
      }
      
      enrichedJobs.push({
        ...job,
        poster_profile: posterProfile
      });
    }
    
    enrichedJobs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    
    return Response.json({ 
      success: true, 
      jobs: enrichedJobs,
      total: enrichedJobs.length 
    });

  } catch (error) {
    console.error('Error fetching jobs:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});