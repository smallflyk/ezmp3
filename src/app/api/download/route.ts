import { NextRequest, NextResponse } from 'next/server';

// YouTube URL validation regex
const youtubeUrlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[\?&].+)?$/;

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');
    const bitrate = request.nextUrl.searchParams.get('bitrate') || '128';
    const mode = request.nextUrl.searchParams.get('mode') || 'info'; // 'info' 或 'download'
    
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

    // 直接下载模式 - 返回下载选项而不是重定向
    if (mode === 'download') {
      return NextResponse.json({
        success: true,
        videoId,
        bitrate,
        downloadOptions: {
          ssyoutube: `https://ssyoutube.com/youtube/6?url=https://www.youtube.com/watch?v=${videoId}`,
          yt1s: `https://yt1s.com/youtube-to-mp3/youtube-to-mp3?url=https://www.youtube.com/watch?v=${videoId}`,
          savefrom: `https://en.savefrom.net/391/youtube-mp3?url=https://www.youtube.com/watch?v=${videoId}`,
          y2mate: `https://www.y2mate.com/youtube-mp3/${videoId}`,
          flvto: `https://flvto.pro/youtube-to-mp3?url=https://www.youtube.com/watch?v=${videoId}`,
          converterbear: `https://converterbear.org/youtube-to-mp3?url=https://www.youtube.com/watch?v=${videoId}`,
          onlinevideoconverter: `https://onlinevideoconverter.pro/youtube-converter/youtube-to-mp3?url=https://www.youtube.com/watch?v=${videoId}`,
          ytmp3download: `https://ytmp3download.cc/yt-to-mp3/?url=https://www.youtube.com/watch?v=${videoId}`
        }
      });
    }

    // 默认信息模式
    return NextResponse.json({
      success: true,
      title: `YouTube Video ${videoId}`,
      videoId,
      downloadOptions: {
        ssyoutube: `https://ssyoutube.com/youtube/6?url=https://www.youtube.com/watch?v=${videoId}`,
        yt1s: `https://yt1s.com/youtube-to-mp3/youtube-to-mp3?url=https://www.youtube.com/watch?v=${videoId}`,
        savefrom: `https://en.savefrom.net/391/youtube-mp3?url=https://www.youtube.com/watch?v=${videoId}`,
        y2mate: `https://www.y2mate.com/youtube-mp3/${videoId}`,
        flvto: `https://flvto.pro/youtube-to-mp3?url=https://www.youtube.com/watch?v=${videoId}`,
        converterbear: `https://converterbear.org/youtube-to-mp3?url=https://www.youtube.com/watch?v=${videoId}`,
        onlinevideoconverter: `https://onlinevideoconverter.pro/youtube-converter/youtube-to-mp3?url=https://www.youtube.com/watch?v=${videoId}`,
        ytmp3download: `https://ytmp3download.cc/yt-to-mp3/?url=https://www.youtube.com/watch?v=${videoId}`
      },
      selectedBitrate: bitrate
    });

  } catch (error: unknown) {
    console.error('下载处理出错:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json(
      { error: `下载失败: ${errorMessage}` },
      { status: 500 }
    );
  }
} 