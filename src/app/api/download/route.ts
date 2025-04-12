import { NextRequest, NextResponse } from 'next/server';

// YouTube URL validation regex
const youtubeUrlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[\?&].+)?$/;

async function getVideoInfo(videoId: string) {
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    if (response.ok) {
      const data = await response.json();
      return {
        title: data.title,
        author: data.author_name
      };
    }
  } catch (e) {
    console.error('获取视频信息失败:', e);
  }
  return null;
}

async function getDownloadUrl(videoId: string): Promise<string> {
  try {
    // 尝试使用y2mate API获取下载链接
    const searchParams = new URLSearchParams({
      q: `https://www.youtube.com/watch?v=${videoId}`,
      vt: 'mp3'
    });

    const response = await fetch(`https://yt2mp3s.com/api/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      body: searchParams.toString()
    });

    if (!response.ok) {
      throw new Error('转换请求失败');
    }

    const data = await response.json();
    if (data.url) {
      return data.url;
    }
    throw new Error('未找到下载链接');
  } catch (error) {
    console.error('获取下载链接失败:', error);
    throw error;
  }
}

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
      
      // 获取视频ID
      const videoId = url.match(youtubeUrlRegex)?.[4] || '';
      
      // 获取视频信息
      const info = await getVideoInfo(videoId);
      const title = info?.title || videoId;
      const sanitizedTitle = title.replace(/[^\w\s]/gi, '') || videoId;
      
      console.log('获取视频信息成功:', title);
      
      // 获取下载链接
      const downloadUrl = await getDownloadUrl(videoId);
      console.log('获取下载链接成功');
      
      // 获取音频内容
      const audioResponse = await fetch(downloadUrl);
      
      if (!audioResponse.ok) {
        throw new Error(`下载失败，HTTP状态: ${audioResponse.status}`);
      }
      
      const audioBuffer = await audioResponse.arrayBuffer();
      console.log('音频下载成功，大小:', audioBuffer.byteLength, '字节');
      
      // 返回音频文件
      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': `attachment; filename="${sanitizedTitle}.mp3"`,
          'Content-Length': audioBuffer.byteLength.toString(),
        }
      });
    } catch (err) {
      console.error('处理下载失败:', err);
      
      // 备选方法：使用第三方服务
      console.log('尝试使用备选下载方法...');
      const videoId = url.match(youtubeUrlRegex)?.[4] || '';
      
      // 尝试不同的备选服务
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
    
    // 作为最后手段使用重定向
    try {
      const videoId = (error instanceof Error && error.message.includes('videoId')) 
        ? error.message.split('videoId: ')[1]
        : request.nextUrl.searchParams.get('url')?.match(youtubeUrlRegex)?.[4];
        
      if (videoId) {
        const mp3ConvertApiUrl = `https://api.vevioz.com/api/button/mp3/${videoId}`;
        return NextResponse.redirect(mp3ConvertApiUrl, { status: 302 });
      }
    } catch (e) {
      console.error('重定向失败:', e);
    }
    
    return NextResponse.json(
      { error: `下载失败: ${errorMessage}` },
      { status: 500 }
    );
  }
} 