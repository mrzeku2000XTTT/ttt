import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const url = body?.url;

    console.log('🎵 YouTube to MP3 request:', url);

    if (!url) {
      return Response.json({ error: 'URL is required' }, { status: 400 });
    }

    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      return Response.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    // Extract video ID
    let videoId = '';
    try {
      if (url.includes('youtube.com/watch?v=')) {
        const match = url.match(/[?&]v=([^&]+)/);
        videoId = match ? match[1] : '';
      } else if (url.includes('youtu.be/')) {
        const match = url.match(/youtu\.be\/([^?]+)/);
        videoId = match ? match[1] : '';
      }
    } catch (err) {
      console.error('Error extracting video ID:', err);
    }

    if (!videoId || videoId.length < 11) {
      return Response.json({ error: 'Could not extract valid video ID from URL' }, { status: 400 });
    }

    console.log('📹 Video ID:', videoId);

    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!rapidApiKey) {
      console.error('❌ RAPIDAPI_KEY not configured');
      return Response.json({ error: 'Service temporarily unavailable' }, { status: 503 });
    }

    // API 1: YouTube MP36 (Primary - Most Reliable)
    try {
      console.log('🔄 Trying API 1: youtube-mp36 (Primary)...');
      const response = await fetch(`https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'youtube-mp36.p.rapidapi.com'
        },
        signal: AbortSignal.timeout(45000)
      });

      console.log('API 1 status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API 1 response:', JSON.stringify(data).substring(0, 200));
        
        if (data.link && data.link.startsWith('http')) {
          console.log('✅ API 1 success! Downloading MP3 file...');
          
          // Download the actual MP3 file (proxy it through backend)
          const mp3Response = await fetch(data.link, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            signal: AbortSignal.timeout(90000)
          });
          
          if (mp3Response.ok) {
            const arrayBuffer = await mp3Response.arrayBuffer();
            const filename = (data.title || 'audio').replace(/[^a-z0-9\s]/gi, '_').substring(0, 100) + '.mp3';
            
            console.log('✅ Downloaded MP3:', filename, arrayBuffer.byteLength, 'bytes');
            
            return new Response(arrayBuffer, {
              status: 200,
              headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': arrayBuffer.byteLength.toString()
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('❌ API 1 (youtube-mp36) failed:', error.message);
    }

    // API 2: YouTube MP3 Download V3 (Backup)
    try {
      console.log('🔄 Trying API 2: youtube-mp3-download1...');
      const response = await fetch(`https://youtube-mp3-download1.p.rapidapi.com/dl?id=${videoId}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'youtube-mp3-download1.p.rapidapi.com'
        },
        signal: AbortSignal.timeout(30000)
      });

      console.log('API 2 status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('API 2 response:', JSON.stringify(data).substring(0, 200));
        
        if (data.link && data.link.startsWith('http')) {
          console.log('✅ API 2 success! Downloading MP3 file...');
          
          const mp3Response = await fetch(data.link, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            signal: AbortSignal.timeout(90000)
          });
          
          if (mp3Response.ok) {
            const arrayBuffer = await mp3Response.arrayBuffer();
            const filename = (data.title || 'audio').replace(/[^a-z0-9\s]/gi, '_').substring(0, 100) + '.mp3';
            
            console.log('✅ Downloaded MP3:', filename, arrayBuffer.byteLength, 'bytes');
            
            return new Response(arrayBuffer, {
              status: 200,
              headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': arrayBuffer.byteLength.toString()
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('❌ API 2 failed:', error.message);
    }

    // API 3: YouTube MP3 Downloader v2 (Backup)
    try {
      console.log('🔄 Trying API 3: youtube-mp3-downloader2...');
      const response = await fetch(`https://youtube-mp3-downloader2.p.rapidapi.com/ytmp3/ytmp3/custom/?url=${encodeURIComponent(url)}&quality=192`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'youtube-mp3-downloader2.p.rapidapi.com'
        },
        signal: AbortSignal.timeout(30000)
      });

      console.log('API 3 status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('API 3 response:', JSON.stringify(data).substring(0, 200));
        
        if (data.dlink && data.dlink.startsWith('http')) {
          console.log('✅ API 3 success! Downloading MP3 file...');
          
          const mp3Response = await fetch(data.dlink, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            signal: AbortSignal.timeout(90000)
          });
          
          if (mp3Response.ok) {
            const arrayBuffer = await mp3Response.arrayBuffer();
            const filename = (data.title || 'audio').replace(/[^a-z0-9\s]/gi, '_').substring(0, 100) + '.mp3';
            
            console.log('✅ Downloaded MP3:', filename, arrayBuffer.byteLength, 'bytes');
            
            return new Response(arrayBuffer, {
              status: 200,
              headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': arrayBuffer.byteLength.toString()
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('❌ API 3 failed:', error.message);
    }

    // API 4: YouTube to MP3 Converter (Backup)
    try {
      console.log('🔄 Trying API 4: youtube-to-mp3-converter...');
      const response = await fetch(`https://youtube-mp3-converter3.p.rapidapi.com/dl?id=${videoId}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'youtube-mp3-converter3.p.rapidapi.com'
        },
        signal: AbortSignal.timeout(30000)
      });

      console.log('API 4 status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('API 4 response:', JSON.stringify(data).substring(0, 200));
        
        if (data.link && data.link.startsWith('http')) {
          console.log('✅ API 4 success! Downloading MP3 file...');
          
          const mp3Response = await fetch(data.link, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            signal: AbortSignal.timeout(90000)
          });
          
          if (mp3Response.ok) {
            const arrayBuffer = await mp3Response.arrayBuffer();
            const filename = (data.title || 'audio').replace(/[^a-z0-9\s]/gi, '_').substring(0, 100) + '.mp3';
            
            console.log('✅ Downloaded MP3:', filename, arrayBuffer.byteLength, 'bytes');
            
            return new Response(arrayBuffer, {
              status: 200,
              headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': arrayBuffer.byteLength.toString()
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('❌ API 4 failed:', error.message);
    }

    // API 5: Simple YouTube MP3 (Final Backup)
    try {
      console.log('🔄 Trying API 5: yt-api...');
      const response = await fetch(`https://yt-api.p.rapidapi.com/dl?id=${videoId}&geo=US`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'yt-api.p.rapidapi.com'
        },
        signal: AbortSignal.timeout(30000)
      });

      console.log('API 5 status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('API 5 response:', JSON.stringify(data).substring(0, 200));
        
        const audioFormats = data.formats?.filter(f => f.mimeType?.includes('audio')) || [];
        
        if (audioFormats.length > 0) {
          const bestAudio = audioFormats.reduce((best, current) => {
            return (current.bitrate || 0) > (best.bitrate || 0) ? current : best;
          });
          
          if (bestAudio.url) {
            console.log('✅ API 5 success! Downloading MP3 file...');
            
            const mp3Response = await fetch(bestAudio.url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              },
              signal: AbortSignal.timeout(90000)
            });
            
            if (mp3Response.ok) {
              const arrayBuffer = await mp3Response.arrayBuffer();
              const filename = (data.title || 'audio').replace(/[^a-z0-9\s]/gi, '_').substring(0, 100) + '.mp3';
              
              console.log('✅ Downloaded MP3:', filename, arrayBuffer.byteLength, 'bytes');
              
              return new Response(arrayBuffer, {
                status: 200,
                headers: {
                  'Content-Type': 'audio/mpeg',
                  'Content-Disposition': `attachment; filename="${filename}"`,
                  'Content-Length': arrayBuffer.byteLength.toString()
                }
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ API 5 failed:', error.message);
    }

    console.error('❌ All 5 APIs failed');
    return Response.json({ 
      error: 'Conversion failed: All APIs unavailable or video restricted. Try a different video or try again later.' 
    }, { status: 503 });

  } catch (error) {
    console.error('❌ YouTube to MP3 error:', error);
    return Response.json({ 
      error: error.message || 'Conversion failed' 
    }, { status: 500 });
  }
});