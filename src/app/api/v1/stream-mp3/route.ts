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

    try {
      // Fetch MP3 directly using the RapidAPI YouTube MP3 API
      const rapidApiKey = process.env.RAPIDAPI_KEY;
      if (!rapidApiKey) {
        throw new Error('RapidAPI key not configured');
      }
      
      // Use a reliable RapidAPI endpoint for YouTube MP3 download
      const options = {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'youtube-mp3-converter-dl1.p.rapidapi.com'
        }
      };
      
      // This API returns a direct MP3 download URL
      const apiUrl = `https://youtube-mp3-converter-dl1.p.rapidapi.com/mp3/${videoId}`;
      
      const response = await fetch(apiUrl, options);
      const data = await response.json();
      
      if (data && data.link) {
        // Get the actual MP3 file
        const mp3Response = await fetch(data.link);
        
        if (!mp3Response.ok) {
          throw new Error(`Failed to fetch MP3: ${mp3Response.status}`);
        }
        
        // Get the file content
        const mp3Data = await mp3Response.arrayBuffer();
        
        // Create a file name using the video ID
        const fileName = `YouTube_${videoId}.mp3`;
        
        // Return the MP3 file for direct download
        return new Response(mp3Data, {
          status: 200,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Disposition': `attachment; filename="${fileName}"`,
            'Content-Length': mp3Data.byteLength.toString()
          }
        });
      } else {
        throw new Error('MP3 link not found in API response');
      }
    } catch (apiError) {
      console.error('API error:', apiError);
      
      // Fallback to the simpler approach - just use yt-download.org
      // The Y2mate button API which directly provides the MP3 file
      const downloadUrl = `https://www.y2mate.com/api/mp3convert?url=https://www.youtube.com/watch?v=${videoId}`;
      
      try {
        // Make a simple request to y2mate
        const y2mateResponse = await fetch(downloadUrl);
        
        if (y2mateResponse.ok) {
          // Get the file content
          const y2mateData = await y2mateResponse.arrayBuffer();
          
          // Create a file name
          const fileName = `YouTube_${videoId}.mp3`;
          
          // Return the MP3 file directly
          return new Response(y2mateData, {
            status: 200,
            headers: {
              'Content-Type': 'audio/mpeg',
              'Content-Disposition': `attachment; filename="${fileName}"`,
              'Content-Length': y2mateData.byteLength.toString()
            }
          });
        } else {
          throw new Error(`Y2mate API error: ${y2mateResponse.status}`);
        }
      } catch (y2mateError) {
        console.error('Y2mate error:', y2mateError);
        
        // Last resort: redirect to yt-download.org
        return Response.redirect(`https://www.yt-download.org/api/button/mp3/${videoId}`, 302);
      }
    }
  } catch (error: any) {
    console.error('Download error:', error);
    const errorMessage = error.message || 'Unknown error';
    return new Response(JSON.stringify({ error: `Download failed: ${errorMessage}` }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 