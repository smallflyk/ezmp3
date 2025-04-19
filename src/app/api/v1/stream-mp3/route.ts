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

    // 提取视频ID
    const videoId = url.match(youtubeUrlRegex)?.[4];
    if (!videoId) {
      return new Response(JSON.stringify({ error: '无法提取视频ID' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 使用可靠的第三方服务 - 使用ytmp3.cc (可靠的下载服务)
    const downloadUrl = `https://www.yt-download.org/api/button/mp3/${videoId}`;
    
    // 重定向到下载URL
    return Response.redirect(downloadUrl, 302);
    
  } catch (error: any) {
    console.error('下载处理出错:', error);
    const errorMessage = error.message || '未知错误';
    return new Response(JSON.stringify({ error: `下载失败: ${errorMessage}` }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 