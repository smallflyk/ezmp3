import { NextRequest, NextResponse } from 'next/server';

// YouTube URL validation regex
const youtubeUrlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[\?&].+)?$/;

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');
    
    if (!url) {
      return NextResponse.json(
        { error: 'YouTube URL is required' },
        { status: 400 }
      );
    }

    // Validate YouTube URL format
    if (!youtubeUrlRegex.test(url)) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL format' },
        { status: 400 }
      );
    }

    // Extract YouTube video ID
    const videoId = url.match(youtubeUrlRegex)?.[4];
    if (!videoId) {
      return NextResponse.json(
        { error: 'Could not extract video ID' },
        { status: 400 }
      );
    }

    try {
      // 获取视频基本信息
      const videoInfoUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const videoInfoResponse = await fetch(videoInfoUrl);
      let title = videoId;
      
      if (videoInfoResponse.ok) {
        const videoInfo = await videoInfoResponse.json();
        title = videoInfo.title || videoId;
      }
      
      const sanitizedTitle = title.replace(/[^\w\s]/gi, ''); // 移除特殊字符
      
      // 使用可靠的第三方服务
      const mp3ServiceUrl = `https://www.yt-download.org/api/button/mp3/${videoId}`;
      
      // 重定向到可靠的第三方服务，让用户直接在那里下载
      return NextResponse.redirect(mp3ServiceUrl, { status: 302 });
      
    } catch (err) {
      console.error('Error processing download:', err);
      
      return NextResponse.json(
        { 
          error: `下载失败: ${err instanceof Error ? err.message : '未知错误'}`
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Error downloading YouTube video:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to download YouTube video: ${errorMessage}` },
      { status: 500 }
    );
  }
} 