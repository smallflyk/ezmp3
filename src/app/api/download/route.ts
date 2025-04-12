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

    try {
      console.log('开始处理视频下载:', url);
      
      // 获取视频信息
      const info = await ytdl.getInfo(url);
      console.log('获取视频信息成功');
      
      // 获取视频标题
      const videoTitle = info.videoDetails.title;
      const sanitizedTitle = videoTitle.replace(/[^\w\s]/gi, '') || 'audio';
      
      // 获取最佳音频格式
      const format = ytdl.chooseFormat(info.formats, {
        quality: 'highestaudio',
        filter: 'audioonly',
      });
      
      if (!format || !format.url) {
        throw new Error('无法获取音频URL');
      }
      
      console.log('获取音频URL成功');
      
      // 获取音频内容
      const response = await fetch(format.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`下载失败: ${response.status}`);
      }
      
      const audioBuffer = await response.arrayBuffer();
      console.log('音频下载成功，大小:', audioBuffer.byteLength);
      
      // 返回音频文件
      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': format.mimeType || 'audio/mp4',
          'Content-Disposition': `attachment; filename="${sanitizedTitle}.mp3"`,
          'Content-Length': audioBuffer.byteLength.toString(),
        }
      });
    } catch (err) {
      console.error('处理下载失败:', err);
      
      // 如果处理失败，尝试使用备选服务
      const videoId = url.match(youtubeUrlRegex)?.[4] || '';
      
      // 尝试使用不同的备选服务
      const backupServices = [
        `https://api.vevioz.com/api/button/mp3/${videoId}`,
        `https://api.mp3download.to/v1/youtube/${videoId}`,
        `https://loader.to/api/button/?url=https://www.youtube.com/watch?v=${videoId}&f=mp3`
      ];
      
      // 使用第一个备选服务
      return NextResponse.redirect(backupServices[0], { status: 302 });
    }
  } catch (error: unknown) {
    console.error('视频下载出现错误:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `下载失败: ${errorMessage}` },
      { status: 500 }
    );
  }
} 