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
      // 使用RapidAPI进行直接MP3转换和下载 - 尝试另一个API端点
      const rapidApiKey = process.env.RAPIDAPI_KEY;
      if (!rapidApiKey) {
        return NextResponse.json(
          { error: 'RapidAPI Key not configured' },
          { status: 500 }
        );
      }

      // =================== 方法1：使用youtube-mp3-download-basic API ===================
      const options = {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'youtube-mp3-download-basic.p.rapidapi.com'
        }
      };
      
      const apiUrl = `https://youtube-mp3-download-basic.p.rapidapi.com/mp3download?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&quality=${bitrate}`;
      
      // 首先获取MP3下载链接
      const response = await fetch(apiUrl, options);
      const data = await response.json();
      
      if (data && data.link) {
        // 重定向到实际的MP3下载链接
        // 添加Content-Disposition头以确保浏览器将其作为MP3文件下载
        const filename = data.title ? `${data.title}.mp3` : `youtube_${videoId}.mp3`;
        
        // 创建响应对象并设置所需的标头
        return new Response(null, {
          status: 302, // 临时重定向
          headers: {
            'Location': data.link,
            'Content-Type': 'audio/mpeg',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
          },
        });
      } else {
        // 如果第一种方法失败，尝试第二种方法
        throw new Error('无法获取下载链接');
      }
    } catch (apiError) {
      console.error('第一个API调用失败，尝试备用API:', apiError);
      
      try {
        // =================== 方法2：使用youtube-to-mp3 API ===================
        const rapidApiKey = process.env.RAPIDAPI_KEY;
        if (!rapidApiKey) {
          throw new Error('RapidAPI Key not configured');
        }
        
        const options = {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': rapidApiKey,
            'X-RapidAPI-Host': 'youtube-to-mp3-download.p.rapidapi.com'
          }
        };
        
        const apiUrl = `https://youtube-to-mp3-download.p.rapidapi.com/mp3download?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&quality=${bitrate}`;
        
        // 获取MP3下载链接
        const response = await fetch(apiUrl, options);
        const data = await response.json();
        
        if (data && data.link) {
          // 重定向到实际的MP3下载链接
          const filename = data.title ? `${data.title}.mp3` : `youtube_${videoId}.mp3`;
          
          return new Response(null, {
            status: 302, // 临时重定向
            headers: {
              'Location': data.link,
              'Content-Type': 'audio/mpeg',
              'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
            },
          });
        } else {
          throw new Error('无法获取下载链接');
        }
      } catch (backupError) {
        console.error('备用API调用失败:', backupError);
        
        // 如果两种方法都失败，返回错误
        return NextResponse.json(
          { error: '无法转换视频，请尝试使用第三方网站下载' },
          { status: 502 }
        );
      }
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