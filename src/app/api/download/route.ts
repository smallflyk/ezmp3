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

    // Extract video ID
    const videoId = url.match(youtubeUrlRegex)?.[4];
    if (!videoId) {
      return NextResponse.json(
        { error: '无法提取视频ID' },
        { status: 400 }
      );
    }

    // 获取视频信息
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, ''); // 清理标题中的特殊字符
    
    // 获取最高质量的音频格式
    const audioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });
    
    if (!audioFormat) {
      return NextResponse.json(
        { error: '无法找到合适的音频格式' },
        { status: 400 }
      );
    }
    
    // 设置响应头
    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename="${title}.mp3"`);
    headers.set('Content-Type', 'audio/mpeg');
    
    // 创建响应流
    const stream = ytdl(url, { format: audioFormat });
    
    // 使用Web Streams API
    const readableStream = new ReadableStream({
      async start(controller) {
        stream.on('data', (chunk) => {
          controller.enqueue(chunk);
        });
        
        stream.on('end', () => {
          controller.close();
        });
        
        stream.on('error', (error) => {
          controller.error(error);
        });
      }
    });
    
    // 返回流式响应
    return new NextResponse(readableStream, {
      status: 200,
      headers
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