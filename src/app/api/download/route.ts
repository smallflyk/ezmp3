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
      // 使用RapidAPI的YouTube到MP3转换服务
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-rapidapi-host': 'youtube-to-mp335.p.rapidapi.com',
          'x-rapidapi-key': process.env.RAPIDAPI_KEY || '511c5bcf88msh9c41cd1a0f30623p10a3d0jsn95e8806e2d45'
        },
        body: JSON.stringify({ url })
      };

      console.log('请求RapidAPI:', options);
      
      const response = await fetch('https://youtube-to-mp335.p.rapidapi.com/api/rapidAPIconverttomp3', options);
      
      if (!response.ok) {
        throw new Error(`RapidAPI响应错误: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('RapidAPI响应:', data);
      
      if (data.error) {
        throw new Error(`API错误: ${data.error}`);
      }
      
      // RapidAPI成功响应
      return NextResponse.json({
        success: true,
        title: data.title || `YouTube Video ${videoId}`,
        audioUrl: data.link || data.mp3,
        contentType: 'audio/mp3',
        videoId,
        selectedBitrate: bitrate,
        thumbnail: data.thumbnail || '',
        duration: data.duration || ''
      });
      
    } catch (apiError) {
      console.error('API处理错误:', apiError);
      
      // 回退方案：使用其他服务或ytdl-core作为备用
      try {
        // 这里可以添加其他备用API或方法
        // 回退到基于videoId的备用服务
        const fallbackServices = [
          `https://youtube-to-mp335.p.rapidapi.com/api/fallback?videoId=${videoId}&bitrate=${bitrate}`,
          `https://api.vevioz.com/api/button/mp3/${videoId}?bitrate=${bitrate}`,
          `https://loader.to/api/button/?url=https://www.youtube.com/watch?v=${videoId}&f=mp3&bitrate=${bitrate}`
        ];
        
        return NextResponse.json({
          success: true,
          fallback: true,
          services: fallbackServices,
          selectedBitrate: bitrate
        });
      } catch (fallbackError) {
        throw new Error(`所有转换方法都失败: ${fallbackError}`);
      }
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