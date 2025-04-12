import { NextRequest, NextResponse } from 'next/server';
import ytdl from 'ytdl-core';

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
      // 获取视频信息
      const info = await ytdl.getInfo(url);
      const title = info.videoDetails.title.replace(/[^\w\s]/gi, '') || videoId; 
      
      // 获取指定音质的音频格式
      // 选择最接近所选bitrate的音频格式
      const selectedBitrateNum = parseInt(bitrate);
      const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
      
      // 根据bitrate排序获取合适的格式
      let audioFormat = audioFormats[0]; // 默认选择第一个
      
      if (audioFormats.length > 1) {
        // 尝试找到最接近所选bitrate的格式
        let closestFormat = audioFormats[0];
        let minDiff = Number.MAX_SAFE_INTEGER;
        
        for (const format of audioFormats) {
          const formatBitrate = format.audioBitrate || 0;
          const diff = Math.abs(formatBitrate - selectedBitrateNum);
          
          if (diff < minDiff) {
            minDiff = diff;
            closestFormat = format;
          }
        }
        
        audioFormat = closestFormat;
      }
      
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
        videoId,
        selectedBitrate: bitrate
      });
    } catch (ytError) {
      console.error('YouTube处理错误:', ytError);
      
      // 回退方案：使用第三方服务，传递bitrate参数
      const fallbackServices = [
        `https://api.vevioz.com/api/button/mp3/${videoId}?bitrate=${bitrate}`,
        `https://api.mp3download.to/v1/youtube/${videoId}?bitrate=${bitrate}`,
        `https://loader.to/api/button/?url=https://www.youtube.com/watch?v=${videoId}&f=mp3&bitrate=${bitrate}`
      ];
      
      return NextResponse.json({
        success: true,
        fallback: true,
        services: fallbackServices,
        selectedBitrate: bitrate
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