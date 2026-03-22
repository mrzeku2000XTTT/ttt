import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user authentication
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get search parameters
    const { query, location, page = 1, num_pages = 1 } = await req.json();

    if (!query) {
      return Response.json({ 
        error: 'Job query is required' 
      }, { status: 400 });
    }

    console.log(`🔍 Searching Indeed jobs: "${query}" in ${location || 'Any location'}`);

    // Call JSearch API
    const url = 'https://jsearch.p.rapidapi.com/search';
    const params = new URLSearchParams({
      query: query,
      page: page.toString(),
      num_pages: num_pages.toString(),
      date_posted: 'all'
    });

    if (location) {
      params.append('location', location);
    }

    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': Deno.env.get('RAPIDAPI_KEY'),
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      throw new Error(`JSearch API error: ${response.status}`);
    }

    const data = await response.json();

    console.log(`✅ Found ${data.data?.length || 0} jobs`);

    // Format job data for easier consumption
    const jobs = data.data?.map(job => ({
      id: job.job_id,
      title: job.job_title,
      company: job.employer_name,
      company_logo: job.employer_logo,
      location: job.job_city ? `${job.job_city}, ${job.job_state}, ${job.job_country}` : 'Remote',
      description: job.job_description,
      requirements: job.job_highlights?.Qualifications || [],
      responsibilities: job.job_highlights?.Responsibilities || [],
      apply_link: job.job_apply_link,
      posted_date: job.job_posted_at_datetime_utc,
      employment_type: job.job_employment_type,
      salary_min: job.job_min_salary,
      salary_max: job.job_max_salary,
      salary_currency: job.job_salary_currency,
      is_remote: job.job_is_remote,
      source: 'Indeed via JSearch'
    })) || [];

    return Response.json({
      success: true,
      query,
      location: location || 'Any',
      total_results: jobs.length,
      jobs
    });

  } catch (error) {
    console.error('❌ Job search error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});