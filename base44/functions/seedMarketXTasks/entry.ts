import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate as the admin user making the request
    const user = await base44.auth.me();
    
    console.log('🔍 Creating tasks as user:', user?.email, '| Role:', user?.role);
    
    if (!user) {
      return Response.json({ 
        success: false, 
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Sample tasks data - will be created by the requesting user
    const sampleTasks = [
      {
        task_name: "Design a Modern Logo",
        description: "Need a sleek, modern logo for my crypto startup. Must include blockchain elements and be scalable. Prefer minimalist style with purple/cyan colors. Deliver in SVG, PNG formats.",
        tip_amount: 250,
        burner_wallet_address: "kaspa:qz8xqk4rm8kx5qkqxqk4rm8kx5qkqxqk4rm8kx5qkqxqk4rm8kx5qkq1",
        status: "active",
        employer_id: user.email, // Current user becomes employer
        mzk_bot_id: "MZK-LOGO-001",
        balance_verified: true
      },
      {
        task_name: "Write 5 Blog Posts on Kaspa",
        description: "Write 5 high-quality blog posts (800+ words each) about Kaspa blockchain. Topics: Mining, Wallets, DeFi, Future Roadmap, and Community. SEO optimized, engaging content needed.",
        tip_amount: 180,
        burner_wallet_address: "kaspa:qz8xqk4rm8kx5qkqxqk4rm8kx5qkqxqk4rm8kx5qkqxqk4rm8kx5qkq2",
        status: "active",
        employer_id: user.email,
        mzk_bot_id: "MZK-BLOG-002",
        balance_verified: true
      },
      {
        task_name: "Build a Simple Landing Page",
        description: "Create a responsive landing page for a DeFi project. Must include hero section, features, testimonials, and contact form. Clean design, mobile-friendly. HTML/CSS/JS only.",
        tip_amount: 320,
        burner_wallet_address: "kaspa:qz8xqk4rm8kx5qkqxqk4rm8kx5qkqxqk4rm8kx5qkqxqk4rm8kx5qkq3",
        status: "active",
        employer_id: user.email,
        mzk_bot_id: "MZK-LAND-003",
        balance_verified: true
      },
      {
        task_name: "Social Media Management (1 Week)",
        description: "Manage Twitter and Reddit for crypto project for 1 week. 3 posts per day on Twitter, engage with community, respond to DMs. Must have crypto experience.",
        tip_amount: 150,
        burner_wallet_address: "kaspa:qz8xqk4rm8kx5qkqxqk4rm8kx5qkqxqk4rm8kx5qkqxqk4rm8kx5qkq4",
        status: "active",
        employer_id: user.email,
        mzk_bot_id: "MZK-SOCIAL-004",
        balance_verified: true
      },
      {
        task_name: "Create 10 Animated GIFs",
        description: "Design 10 crypto-themed animated GIFs for social media. Include: Bitcoin rocket, Kaspa logo animation, diamond hands, moon, lambo, etc. Fun and engaging style.",
        tip_amount: 200,
        burner_wallet_address: "kaspa:qz8xqk4rm8kx5qkqxqk4rm8kx5qkqxqk4rm8kx5qkqxqk4rm8kx5qkq5",
        status: "active",
        employer_id: user.email,
        mzk_bot_id: "MZK-GIFS-005",
        balance_verified: true
      },
      {
        task_name: "Translate Website to Spanish",
        description: "Translate crypto website from English to Spanish. About 5000 words total. Must be native Spanish speaker, understand crypto terminology. Maintain tone and style.",
        tip_amount: 120,
        burner_wallet_address: "kaspa:qz8xqk4rm8kx5qkqxqk4rm8kx5qkqxqk4rm8kx5qkqxqk4rm8kx5qkq6",
        status: "active",
        employer_id: user.email,
        mzk_bot_id: "MZK-TRANS-006",
        balance_verified: true
      },
      {
        task_name: "Smart Contract Audit",
        description: "Audit a simple ERC-20 token smart contract (200 lines). Check for vulnerabilities, gas optimization, best practices. Provide detailed report with recommendations.",
        tip_amount: 450,
        burner_wallet_address: "kaspa:qz8xqk4rm8kx5qkqxqk4rm8kx5qkqxqk4rm8kx5qkqxqk4rm8kx5qkq7",
        status: "active",
        employer_id: user.email,
        mzk_bot_id: "MZK-AUDIT-007",
        balance_verified: true
      },
      {
        task_name: "Video Editing - Crypto Explainer",
        description: "Edit a 5-minute crypto explainer video. Add subtitles, transitions, background music, and graphics. Professional quality for YouTube. Provide draft for feedback.",
        tip_amount: 280,
        burner_wallet_address: "kaspa:qz8xqk4rm8kx5qkqxqk4rm8kx5qkqxqk4rm8kx5qkqxqk4rm8kx5qkq8",
        status: "active",
        employer_id: user.email,
        mzk_bot_id: "MZK-VIDEO-008",
        balance_verified: true
      },
      {
        task_name: "Research Competitor Analysis",
        description: "Research and analyze 10 competing crypto platforms. Compare features, pricing, user base, strengths/weaknesses. Deliver comprehensive report with charts and insights.",
        tip_amount: 220,
        burner_wallet_address: "kaspa:qz8xqk4rm8kx5qkqxqk4rm8kx5qkqxqk4rm8kx5qkqxqk4rm8kx5qkq9",
        status: "active",
        employer_id: user.email,
        mzk_bot_id: "MZK-RESEARCH-009",
        balance_verified: true
      },
      {
        task_name: "Bug Testing - Mobile App",
        description: "Test crypto wallet mobile app for bugs. Test on iOS and Android. Document all issues with screenshots, steps to reproduce. Must have experience testing apps.",
        tip_amount: 160,
        burner_wallet_address: "kaspa:qz8xqk4rm8kx5qkqxqk4rm8kx5qkqxqk4rm8kx5qkqxqk4rm8kx5qkq10",
        status: "active",
        employer_id: user.email,
        mzk_bot_id: "MZK-TESTING-010",
        balance_verified: true
      }
    ];

    console.log('📦 Creating', sampleTasks.length, 'tasks as', user.email);

    const createdTasks = [];
    const errors = [];
    
    for (let i = 0; i < sampleTasks.length; i++) {
      const taskData = sampleTasks[i];
      console.log(`  Creating task ${i + 1}/${sampleTasks.length}:`, taskData.task_name);
      
      try {
        // Use regular entities method - RLS will be satisfied because employer_id matches the authenticated user
        const task = await base44.entities.PeraTask.create(taskData);
        createdTasks.push(task);
        console.log(`  ✅ Created task ${i + 1}:`, task.id);
      } catch (taskError) {
        console.error(`  ❌ Failed task ${i + 1}:`, taskError.message);
        errors.push({
          taskName: taskData.task_name,
          error: taskError.message
        });
      }
    }

    const successCount = createdTasks.length;
    const failCount = errors.length;

    console.log('✅ Completed:', successCount, 'successful,', failCount, 'failed');

    return Response.json({
      success: successCount > 0,
      message: `Successfully created ${successCount} out of ${sampleTasks.length} tasks`,
      created: successCount,
      failed: failCount,
      errors: errors.length > 0 ? errors : undefined,
      tasks: createdTasks.map(t => ({
        id: t.id,
        name: t.task_name,
        reward: t.tip_amount + ' KAS'
      })),
      employer: user.email
    });

  } catch (error) {
    console.error('❌ Fatal error:', error);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});