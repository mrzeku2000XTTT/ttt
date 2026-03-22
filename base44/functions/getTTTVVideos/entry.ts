import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { category } = body;
    
    console.log('📺 Fetching TTTV videos for category:', category || 'all');
    
    // Define all TTTV categories with their videos
    const tttvData = {
      "Viral Hits": [
        { title: "MrBeast $1 vs $1,000,000 Hotel Room", videoId: "YBHQbu1Y6tk", category: "Viral Hits" },
        { title: "Sidemen $10,000 vs $100 Holiday", videoId: "4zKy8MN5K7M", category: "Viral Hits" },
        { title: "I Survived 7 Days In Abandoned City", videoId: "YikWP1cCmfU", category: "Viral Hits" },
        { title: "World's Most Dangerous Trap!", videoId: "7TavVZMewpY", category: "Viral Hits" },
        { title: "I Built Willy Wonka's Chocolate Factory!", videoId: "qM_Q0w9JMOM", category: "Viral Hits" }
      ],
      "Music Legends": [
        { title: "The Weeknd - Blinding Lights", videoId: "4NRXx6U8ABQ", category: "Music Legends" },
        { title: "Ed Sheeran - Shape of You", videoId: "JGwWNGJdvx8", category: "Music Legends" },
        { title: "Imagine Dragons - Believer", videoId: "7wtfhZwyrcc", category: "Music Legends" },
        { title: "Billie Eilish - bad guy", videoId: "DyDfgMOUjCI", category: "Music Legends" },
        { title: "Post Malone - Circles", videoId: "wXhTHyIgQ_U", category: "Music Legends" }
      ],
      "Gaming": [
        { title: "Minecraft Hardcore Survival 100 Days", videoId: "nxX2FeCjRfM", category: "Gaming" },
        { title: "I Spent 100 Days in GTA 5", videoId: "7xLZ-pZ0Jv4", category: "Gaming" },
        { title: "Among Us But Everything is RANDOM", videoId: "sX4yVKS8z-E", category: "Gaming" },
        { title: "Fortnite World Cup Finals", videoId: "TfQc3pDBHaY", category: "Gaming" },
        { title: "Speedrunning Minecraft Any%", videoId: "7jXWPX90S-w", category: "Gaming" }
      ],
      "Comedy": [
        { title: "Key & Peele - Substitute Teacher", videoId: "Dd7FixvoKBw", category: "Comedy" },
        { title: "SNL: Weekend Update", videoId: "YqmdiiqIRA8", category: "Comedy" },
        { title: "John Mulaney - Kid Gorgeous", videoId: "U_LhqHhhYZA", category: "Comedy" },
        { title: "The Office - Best Cold Opens", videoId: "zAGTyBYvRws", category: "Comedy" },
        { title: "Brooklyn Nine-Nine Funniest Moments", videoId: "sj6-LG5VpGk", category: "Comedy" }
      ],
      "Movies & Trailers": [
        { title: "Dune: Part Two - Official Trailer", videoId: "U2Qp5pL3ovA", category: "Movies & Trailers" },
        { title: "Oppenheimer - Final Trailer", videoId: "bK6ldnjE3Y0", category: "Movies & Trailers" },
        { title: "Barbie - Official Trailer", videoId: "pBk4NYhWNMM", category: "Movies & Trailers" },
        { title: "Spider-Man: Across the Spider-Verse", videoId: "cqGjhVJWtEg", category: "Movies & Trailers" },
        { title: "Avengers: Endgame - Official Trailer", videoId: "TcMBFSGVi1c", category: "Movies & Trailers" }
      ],
      "Education": [
        { title: "Kurzgesagt - What If We Nuked a City?", videoId: "5iPH-br_eJQ", category: "Education" },
        { title: "Veritasium - Why Gravity is NOT a Force", videoId: "XRr1kaXKBsU", category: "Education" },
        { title: "Mark Rober - Glitter Bomb Trap", videoId: "xoxhDk-hwuo", category: "Education" },
        { title: "CGP Grey - The Rules for Rulers", videoId: "rStL7niR7gs", category: "Education" },
        { title: "3Blue1Brown - Essence of Calculus", videoId: "WUvTyaaNkzM", category: "Education" }
      ],
      "Stock Market": [
        { title: "Warren Buffett: How To Invest For Beginners", videoId: "5fJhFzkvTwU", category: "Stock Market" },
        { title: "The S&P 500 Explained Simply", videoId: "0RnDDIb3ld8", category: "Stock Market" },
        { title: "How The Stock Market Works", videoId: "p7HKvqRI_Bo", category: "Stock Market" },
        { title: "Technical Analysis for Beginners", videoId: "08c8uUrR3f0", category: "Stock Market" },
        { title: "Understanding Market Crashes", videoId: "Fy1KECWq8Q8", category: "Stock Market" }
      ],
      "Crypto & Bitcoin": [
        { title: "Bitcoin Explained Simply", videoId: "Gc2en3nHxA4", category: "Crypto & Bitcoin" },
        { title: "How Cryptocurrency ACTUALLY Works", videoId: "rYQgy8QDEBI", category: "Crypto & Bitcoin" },
        { title: "Ethereum 2.0 Explained", videoId: "pA6CGuXEKtQ", category: "Crypto & Bitcoin" },
        { title: "DeFi Explained for Beginners", videoId: "H-O3r2YMWJ4", category: "Crypto & Bitcoin" },
        { title: "NFTs Explained in 4 Minutes", videoId: "FkUn86bH34M", category: "Crypto & Bitcoin" }
      ],
      "Elon Musk": [
        { title: "Elon Musk on Joe Rogan", videoId: "ycPr5-27vSI", category: "Elon Musk" },
        { title: "SpaceX Starship Test Flight", videoId: "L7M7Q0LNvLs", category: "Elon Musk" },
        { title: "Tesla AI Day 2022", videoId: "ODSJsviD_SU", category: "Elon Musk" },
        { title: "Elon Musk Interview with Lex Fridman", videoId: "DxREm3s1scA", category: "Elon Musk" },
        { title: "Neuralink Show and Tell", videoId: "YreDYUSxFSQ", category: "Elon Musk" }
      ],
      "Donald Trump": [
        { title: "Trump 2024 Campaign Launch", videoId: "iqvE5W5RtbU", category: "Donald Trump" },
        { title: "Trump Interview with Tucker Carlson", videoId: "OZXGBDl4Rv0", category: "Donald Trump" },
        { title: "Trump at Iowa Rally 2024", videoId: "2s3b7xJSXpU", category: "Donald Trump" },
        { title: "Trump on Hannity", videoId: "kj3MkN3eSPE", category: "Donald Trump" },
        { title: "Trump Press Conference", videoId: "Z0VzQBNXfAE", category: "Donald Trump" }
      ],
      "War & Conflicts": [
        { title: "Ukraine War Explained", videoId: "7MaKHnB3N1k", category: "War & Conflicts" },
        { title: "Israel-Palestine Conflict History", videoId: "iRYZjOuUnfU", category: "War & Conflicts" },
        { title: "Syria War Documentary", videoId: "Z2E8XoXJdKs", category: "War & Conflicts" },
        { title: "Taiwan Strait Crisis Explained", videoId: "p2LiMTtGrAY", category: "War & Conflicts" },
        { title: "Modern Warfare Technology", videoId: "9CO6M2HsoIA", category: "War & Conflicts" }
      ],
      "Trending Now": [
        { title: "MrBeast Latest Video", videoId: "YBHQbu1Y6tk", category: "Trending Now" },
        { title: "Viral TikTok Compilation", videoId: "r_0JjYUe5jo", category: "Trending Now" },
        { title: "Breaking News Update", videoId: "LqHdDzI3TKw", category: "Trending Now" },
        { title: "Top 10 Trending Videos This Week", videoId: "wvsP_lzh2-8", category: "Trending Now" },
        { title: "Internet's Funniest Moments", videoId: "eBGIQ7ZuuiU", category: "Trending Now" }
      ]
    };

    // Get videos based on category
    let videos = [];
    if (category && tttvData[category]) {
      videos = tttvData[category];
    } else {
      // If no category specified, return Trending Now by default
      videos = tttvData["Trending Now"];
    }

    // Calculate total videos across all categories
    const totalVideos = Object.values(tttvData).reduce((sum, cat) => sum + cat.length, 0);
    const totalCategories = Object.keys(tttvData).length;

    console.log('✅ Found', videos.length, 'videos');

    return Response.json({
      success: true,
      category: category || "Trending Now",
      videos: videos,
      totalVideos: totalVideos,
      totalCategories: totalCategories,
      availableCategories: Object.keys(tttvData),
      message: `Found ${videos.length} videos in ${category || "Trending Now"}`
    });

  } catch (error) {
    console.error('❌ Error fetching TTTV videos:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});