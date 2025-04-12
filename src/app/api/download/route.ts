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
      // 1. 获取视频信息
      const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
      let title = videoId;
      
      if (response.ok) {
        const data = await response.json();
        title = data.title || videoId;
      }
      
      const sanitizedTitle = title.replace(/[^\w\s]/gi, ''); // 移除特殊字符
      
      // 2. 使用 rapidsave.com API 获取直接下载链接
      const rapidSaveUrl = `https://rapidsave.com/info?url=${encodeURIComponent(url)}`;
      const saveResponse = await fetch(rapidSaveUrl);
      
      if (!saveResponse.ok) {
        throw new Error(`无法获取下载链接: ${saveResponse.status}`);
      }
      
      const saveData = await saveResponse.json();
      
      if (!saveData.links || !saveData.links.mp3) {
        throw new Error('未找到MP3下载链接');
      }
      
      const mp3Url = saveData.links.mp3.url;
      
      // 3. 获取音频文件
      const audioResponse = await fetch(mp3Url);
      
      if (!audioResponse.ok) {
        throw new Error(`无法下载音频文件: ${audioResponse.status}`);
      }
      
      const audioBuffer = await audioResponse.arrayBuffer();
      
      // 4. 返回音频文件给用户
      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': `attachment; filename="${sanitizedTitle}.mp3"`,
          'Content-Length': audioBuffer.byteLength.toString(),
        }
      });
    } catch (err) {
      console.error('Error processing download:', err);
      
      // 如果下载失败，就使用备用方法：重定向到可靠的第三方服务
      const mp3DownloadUrl = `https://api.vevioz.com/api/button/mp3/${videoId}`;
      return NextResponse.redirect(mp3DownloadUrl, { status: 302 });
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