import { NextRequest, NextResponse } from 'next/server';
import ytdl from 'ytdl-core';

// Get configuration from environment variables
const apiKey = process.env.OPENROUTER_API_KEY || '';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ezmp3.vercel.app';
const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'EZ MP3 Converter';

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
      // 尝试获取视频信息
      const videoInfo = await ytdl.getInfo(url);
      const title = videoInfo.videoDetails.title;
      const sanitizedTitle = title.replace(/[^\w\s]/gi, ''); // 移除特殊字符
      
      // 获取音频格式
      const audioFormats = ytdl.filterFormats(videoInfo.formats, 'audioonly');
      if (audioFormats.length === 0) {
        throw new Error('No audio formats available');
      }
      
      // 选择最佳音频格式
      const bestFormat = audioFormats.reduce((prev, current) => {
        return (prev.audioBitrate || 0) > (current.audioBitrate || 0) ? prev : current;
      });

      // 创建一个 ReadableStream
      const stream = ytdl.downloadFromInfo(videoInfo, { format: bestFormat });

      // 从流中读取数据
      return new Promise((resolve, reject) => {
        const chunks: Uint8Array[] = [];
        
        stream.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        stream.on('end', () => {
          try {
            const buffer = Buffer.concat(chunks);
            
            // 返回音频文件
            resolve(new NextResponse(buffer, {
              headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Disposition': `attachment; filename="${sanitizedTitle || videoId}.mp3"`,
                'Content-Length': buffer.length.toString(),
              }
            }));
          } catch (error) {
            reject(error);
          }
        });
        
        stream.on('error', (error) => {
          reject(error);
        });
      });
    } catch (err) {
      console.error('Error processing download:', err);
      
      return NextResponse.json(
        { 
          error: `下载失败: ${err instanceof Error ? err.message : '未知错误'}`
        },
        { status: 500 }
      );
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