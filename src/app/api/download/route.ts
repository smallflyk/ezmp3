import { NextRequest, NextResponse } from 'next/server';

// Get configuration from environment variables
const apiKey = process.env.OPENROUTER_API_KEY || '';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ezmp3.vercel.app';
const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'EZ MP3 Converter';

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
      // 使用 y2mate.com 作为备用下载链接
      // 这个服务提供免费的 YouTube 下载功能
      const y2mateUrl = `https://www.y2mate.com/youtube/${videoId}`;
      
      return NextResponse.json(
        { 
          message: "使用外部下载服务",
          videoId,
          downloadUrl: y2mateUrl,
          externalService: true
        },
        { status: 200 }
      );
    } catch (err) {
      console.error('Error processing download:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return NextResponse.json(
        { error: `Failed to download: ${errorMessage}` },
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