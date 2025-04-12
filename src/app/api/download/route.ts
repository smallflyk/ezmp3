import { NextRequest, NextResponse } from 'next/server';
import ytdl from 'ytdl-core';

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

    // Extract video ID
    const videoId = url.match(youtubeUrlRegex)?.[4];
    if (!videoId) {
      return NextResponse.json(
        { error: '无法提取视频ID' },
        { status: 400 }
      );
    }

    try {
      // 获取视频信息
      const info = await ytdl.getInfo(url);
      const title = info.videoDetails.title.replace(/[^\w\s]/gi, '') || videoId; 
      
      // 获取最佳音频格式的URL
      const audioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });
      
      if (!audioFormat) {
        return NextResponse.json(
          { error: '无法找到合适的音频格式' },
          { status: 400 }
        );
      }
      
      // 创建包含下载信息的响应
      return NextResponse.json({
        success: true,
        title,
        audioUrl: audioFormat.url,
        contentType: audioFormat.mimeType || 'audio/mp4',
        videoId
      });
    } catch (ytError) {
      console.error('YouTube处理错误:', ytError);
      
      // 回退方案：使用第三方服务
      const fallbackServices = [
        `https://api.vevioz.com/api/button/mp3/${videoId}`,
        `https://api.mp3download.to/v1/youtube/${videoId}`,
        `https://loader.to/api/button/?url=https://www.youtube.com/watch?v=${videoId}&f=mp3`
      ];
      
      return NextResponse.json({
        success: true,
        fallback: true,
        services: fallbackServices
      });
    }

  } catch (error: unknown) {
    console.error('下载处理出错:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json(
      { error: `下载失败: ${errorMessage}` },
      { status: 500 }
    );
  }
} 