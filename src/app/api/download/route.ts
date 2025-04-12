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

    // 直接下载模式 - 使用更可靠的YouTube MP3下载服务
    if (mode === 'download') {
      try {
        // 选择更稳定可靠的下载服务 - 使用ytmp3.cc的服务
        const directDownloadUrl = `https://ytmp3.cc/download/${videoId}/${bitrate}`;
        
        // 重定向到直接下载链接
        return NextResponse.redirect(directDownloadUrl);
      } catch (directDownloadError) {
        console.error('直接下载错误:', directDownloadError);
        return NextResponse.json(
          { error: '直接下载失败' },
          { status: 500 }
        );
      }
    }

    // 默认信息模式
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

      console.log('请求RapidAPI:', { url, videoId, bitrate });
      
      const response = await fetch('https://youtube-to-mp335.p.rapidapi.com/api/rapidAPIconverttomp3', options);
      
      if (!response.ok) {
        throw new Error(`RapidAPI响应错误: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('RapidAPI响应:', data);
      
      if (data.error) {
        throw new Error(`API错误: ${data.error}`);
      }
      
      // 准备多种下载选项，确保用户可以下载
      const downloadOptions = {
        rapidApi: data.link || data.mp3 || null,
        ytmp3cc: `https://ytmp3.cc/download/${videoId}/${bitrate}`,
        savemp3: `https://savemp3.app/download/?url=https://www.youtube.com/watch?v=${videoId}`,
        mp3download: `https://mp3download.to/download?v=${videoId}`
      };
      
      // RapidAPI成功响应
      return NextResponse.json({
        success: true,
        title: data.title || `YouTube Video ${videoId}`,
        videoId,
        downloadUrl: `/api/download?url=${encodeURIComponent(url)}&bitrate=${bitrate}&mode=download`,
        downloadOptions,
        selectedBitrate: bitrate,
        thumbnail: data.thumbnail || '',
        duration: data.duration || ''
      });
      
    } catch (apiError) {
      console.error('API处理错误:', apiError);
      
      // 构建备用下载选项
      const downloadOptions = {
        ytmp3cc: `https://ytmp3.cc/download/${videoId}/${bitrate}`,
        savemp3: `https://savemp3.app/download/?url=https://www.youtube.com/watch?v=${videoId}`,
        mp3download: `https://mp3download.to/download?v=${videoId}`,
        y2mate: `https://www.y2mate.com/youtube-mp3/${videoId}`
      };
      
      return NextResponse.json({
        success: true,
        title: `YouTube Video ${videoId}`,
        videoId,
        downloadUrl: `/api/download?url=${encodeURIComponent(url)}&bitrate=${bitrate}&mode=download`,
        downloadOptions,
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