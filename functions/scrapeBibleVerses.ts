import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Bible API endpoint
    const bibleApiUrl = 'https://bible-api.com/';
    
    // Get all books of the Bible
    const books = [
      // Old Testament
      'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
      'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
      '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
      'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
      'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
      'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah',
      'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
      // New Testament
      'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans',
      '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
      'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
      '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
      '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
    ];

    const versesToAdd = [];
    let addedCount = 0;
    const batchSize = 50;

    // Sample popular verses from each book
    for (const book of books) {
      try {
        // Get chapter 1 verse 1 from each book
        const response = await fetch(`${bibleApiUrl}${encodeURIComponent(book)}+1:1`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.verses && data.verses.length > 0) {
            const verse = data.verses[0];
            
            versesToAdd.push({
              book: book,
              chapter: verse.chapter,
              verse: verse.verse.toString(),
              text: verse.text.trim(),
              author_name: 'TTT Admin',
              author_wallet_address: user.created_wallet_address || 'admin',
              likes: 0,
              is_favorite: false
            });

            addedCount++;
          }
        }
        
        // Add some delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Insert in batches
        if (versesToAdd.length >= batchSize) {
          await base44.asServiceRole.entities.BibleVerse.bulkCreate(versesToAdd);
          versesToAdd.length = 0;
        }
      } catch (err) {
        console.error(`Error fetching ${book}:`, err);
      }
    }

    // Insert remaining verses
    if (versesToAdd.length > 0) {
      await base44.asServiceRole.entities.BibleVerse.bulkCreate(versesToAdd);
    }

    return Response.json({
      success: true,
      message: `Successfully added ${addedCount} Bible verses`,
      count: addedCount
    });
  } catch (error) {
    console.error('Bible scrape error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});