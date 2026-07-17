// KLIPZ MP4 engine — our own extractor, talks directly to YouTube's player API. No third-party API keys.
Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { videoId } = body;
    if (!videoId) return Response.json({ error: 'videoId required' }, { status: 400 });

    // Try multiple Innertube clients in priority order.
    // TV clients are embedded-player contexts — they bypass the "Sign in to confirm
    // you're not a bot" gate that blocks WEB/MWEB on server-side requests.
    const clients = [
      {
        name: 'TV',
        payload: {
          context: {
            client: {
              clientName: 'TV',
              clientVersion: '2.0',
              hl: 'en', gl: 'US'
            }
          },
          videoId,
          contentCheckOk: true,
          racyCheckOk: true
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (PlayStation; PlayStation 4/9.00) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
          'Origin': 'https://www.youtube.com',
          'Referer': 'https://www.youtube.com/tv'
        }
      },
      {
        name: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER',
        payload: {
          context: {
            client: {
              clientName: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER',
              clientVersion: '2.0',
              hl: 'en', gl: 'US'
            },
            thirdParty: {
              embedUrl: 'https://www.youtube.com'
            }
          },
          videoId,
          contentCheckOk: true,
          racyCheckOk: true
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (PlayStation; PlayStation 4/9.00) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
          'Origin': 'https://www.youtube.com',
          'Referer': 'https://www.youtube.com/tv'
        }
      },
      {
        name: 'ANDROID_VR',
        payload: {
          context: {
            client: {
              clientName: 'ANDROID_VR',
              clientVersion: '1.60.19',
              deviceModel: 'Quest 3',
              osName: 'Android',
              osVersion: '12L',
              androidSdkVersion: 32,
              hl: 'en', gl: 'US'
            }
          },
          videoId,
          contentCheckOk: true,
          racyCheckOk: true
        },
        headers: {
          'User-Agent': 'com.google.android.apps.youtube.vr.oculus/1.60.19 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip'
        }
      },
      {
        name: 'IOS',
        payload: {
          context: {
            client: {
              clientName: 'IOS',
              clientVersion: '20.10.4',
              deviceMake: 'Apple',
              deviceModel: 'iPhone16,2',
              osName: 'iPhone',
              osVersion: '18.3.2.22D82',
              hl: 'en', gl: 'US'
            }
          },
          videoId,
          contentCheckOk: true,
          racyCheckOk: true
        },
        headers: {
          'User-Agent': 'com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)'
        }
      }
    ];

    let lastError = 'No playable MP4 stream found';

    for (const client of clients) {
      try {
        const res = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...client.headers },
          body: JSON.stringify(client.payload),
          signal: AbortSignal.timeout(20000)
        });
        if (!res.ok) {
          const errText = await res.text();
          console.error(`[${client.name}] Player API ${res.status}:`, errText.slice(0, 500));
          lastError = `Player API ${res.status}`;
          continue;
        }

        const data = await res.json();
        const status = data.playabilityStatus?.status;
        if (status !== 'OK') {
          lastError = data.playabilityStatus?.reason || `Video not playable (${status})`;
          continue;
        }

        // Progressive formats = video+audio muxed MP4 (itag 18/22 etc.)
        const progressive = (data.streamingData?.formats || []).filter(
          (f) => f.mimeType?.includes('video/mp4') && f.url
        );
        // Adaptive video-only MP4 streams — usable as fallback for preview
        const adaptiveVideo = (data.streamingData?.adaptiveFormats || []).filter(
          (f) => f.mimeType?.includes('video/mp4') && f.url && f.videoOnly !== false
        );
        // Adaptive muxed (video+audio in separate streams) — for direct preview
        const adaptiveMuxed = (data.streamingData?.adaptiveFormats || []).filter(
          (f) => f.mimeType?.includes('video/mp4') && f.url
        );

        const best = progressive.length > 0
          ? progressive.reduce((a, b) => ((b.height || 0) > (a.height || 0) ? b : a))
          : adaptiveMuxed.length > 0
            ? adaptiveMuxed.reduce((a, b) => ((b.height || 0) > (a.height || 0) ? b : a))
            : null;

        if (!best) {
          lastError = 'No playable MP4 stream for this video';
          continue;
        }

        const title = data.videoDetails?.title || '';

        return Response.json({
          url: best.url,
          quality: best.qualityLabel || `${best.height}p`,
          title,
          source: client.name
        });
      } catch (e) {
        lastError = e.message;
      }
    }

    return Response.json({ error: `MP4 source unavailable: ${lastError}` }, { status: 503 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});