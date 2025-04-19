import { NextRequest, NextResponse } from 'next/server';

// YouTube URL validation regex
const youtubeUrlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[\?&].+)?$/;

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');
    const bitrate = request.nextUrl.searchParams.get('bitrate') || '128';
    
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
      // 使用RapidAPI进行直接MP3转换和下载
      const rapidApiKey = process.env.RAPIDAPI_KEY;
      if (!rapidApiKey) {
        return NextResponse.json(
          { error: 'RapidAPI Key not configured' },
          { status: 500 }
        );
      }

      // 调用RapidAPI进行转换
      const rapidApiOptions = {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'youtube-mp36.p.rapidapi.com'
        }
      };

      const rapidApiUrl = `https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}&quality=${bitrate}`;
      const rapidApiResponse = await fetch(rapidApiUrl, rapidApiOptions);
      const rapidApiData = await rapidApiResponse.json();

      if (rapidApiData.status === 'ok' && rapidApiData.link) {
        // 跳转到实际的音频文件URL进行下载
        return NextResponse.redirect(rapidApiData.link);
      } else {
        throw new Error(rapidApiData.msg || '转换失败');
      }
    } catch (apiError) {
      console.error('RapidAPI调用失败:', apiError);
      return NextResponse.json(
        { error: `API调用失败: ${apiError instanceof Error ? apiError.message : '未知错误'}` },
        { status: 502 }
      );
    }
  } catch (error: unknown) {
    console.error('直接下载处理出错:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json(
      { error: `下载失败: ${errorMessage}` },
      { status: 500 }
    );
  }
} 