import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// YouTube URL validation regex
const youtubeUrlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[\?&].+)?$/;

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');
    
    if (!url) {
      return new Response(JSON.stringify({ error: 'YouTube URL is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate YouTube URL format
    if (!youtubeUrlRegex.test(url)) {
      return new Response(JSON.stringify({ error: 'Invalid YouTube URL format' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Extract video ID
    const videoId = url.match(youtubeUrlRegex)?.[4];
    if (!videoId) {
      return new Response(JSON.stringify({ error: 'Could not extract video ID' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the video title to use in the filename (optional)
    // Try to get video info from API
    let filename = `youtube-${videoId}.mp3`;
    try {
      const apiUrl = `https://directdownloader.net/api/v2/info/${videoId}`;
      const infoResponse = await fetch(apiUrl);
      if (infoResponse.ok) {
        const info = await infoResponse.json();
        if (info.title) {
          // Clean the title to make it a valid filename
          filename = `${info.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')}.mp3`;
        }
      }
    } catch (error) {
      console.warn('Could not get video title, using default filename');
    }

    // URL to the third-party service that provides MP3
    const mp3ServiceUrl = `https://directdownloader.net/api/v2/mp3/${videoId}/320`;
    
    // Fetch the MP3 file from the service
    const mp3Response = await fetch(mp3ServiceUrl);
    
    if (!mp3Response.ok) {
      return new Response(JSON.stringify({ error: 'Failed to get MP3 file from conversion service' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get the response body as a readable stream
    const mp3Stream = mp3Response.body;
    
    if (!mp3Stream) {
      return new Response(JSON.stringify({ error: 'Failed to get MP3 stream' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Return the MP3 stream directly to the client with proper headers
    return new Response(mp3Stream, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${filename}"`,
        // Disable caching to ensure fresh content
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error: any) {
    console.error('Download error:', error);
    const errorMessage = error.message || 'Unknown error';
    return new Response(JSON.stringify({ error: `Download failed: ${errorMessage}` }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 