import { NextRequest } from 'next/server';
import ytdl from 'ytdl-core';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// YouTube URL validation regex
const youtubeUrlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[\?&].+)?$/;

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');
    
    if (!url) {
      return new Response(JSON.stringify({ error: 'YouTube URL is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate YouTube URL format
    if (!youtubeUrlRegex.test(url)) {
      return new Response(JSON.stringify({ error: 'Invalid YouTube URL format' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 确保视频可用
    let info;
    try {
      info = await ytdl.getInfo(url);
    } catch (error) {
      console.error('获取视频信息失败:', error);
      return new Response(JSON.stringify({ error: '无法获取视频信息' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 获取音频格式
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
    if (audioFormats.length === 0) {
      return new Response(JSON.stringify({ error: '没有可用的音频格式' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 获取最佳音质
    const bestAudioFormat = audioFormats
      .sort((a: ytdl.videoFormat, b: ytdl.videoFormat) => (b.audioBitrate || 0) - (a.audioBitrate || 0))[0];

    // 创建文件名
    const sanitizedTitle = info.videoDetails.title
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '_');
    const fileName = `${sanitizedTitle}.mp3`;

    // 设置响应头
    const headers = new Headers();
    headers.set('Content-Type', 'audio/mpeg');
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    
    // 获取音频流
    const audioStream = ytdl(url, { format: bestAudioFormat });
    
    // 创建流式响应
    const stream = new ReadableStream({
      async start(controller) {
        audioStream.on('data', (chunk: Uint8Array) => {
          controller.enqueue(chunk);
        });
        
        audioStream.on('end', () => {
          controller.close();
        });
        
        audioStream.on('error', (error: Error) => {
          console.error('音频流错误:', error);
          controller.error(error);
        });
      }
    });

    // 返回流式响应
    return new Response(stream, { headers });
    
  } catch (error: any) {
    console.error('直接下载处理出错:', error);
    const errorMessage = error.message || '未知错误';
    return new Response(JSON.stringify({ error: `下载失败: ${errorMessage}` }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 