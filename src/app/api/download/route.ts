import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore - ytdl-core-browser模块不包含类型定义
import ytdl from 'ytdl-core-browser';

// YouTube URL validation regex
const youtubeUrlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[\?&].+)?$/;

// 定义格式类型
interface AudioFormat {
  audioBitrate?: number;
  mimeType: string;
  url: string;
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
      
      // 获取视频信息
      const info = await ytdl.getInfo(url);
      console.log('获取视频信息成功');
      
      // 获取视频标题
      const videoTitle = info.videoDetails.title;
      const sanitizedTitle = videoTitle.replace(/[^\w\s]/gi, '') || 'audio'; 
      
      // 选择最佳音频格式
      const audioFormats = ytdl.filterFormats(info.formats, 'audioonly') as AudioFormat[];
      if (audioFormats.length === 0) {
        throw new Error('没有找到可用的音频格式');
      }
      
      // 选择质量最好的音频格式
      const bestAudioFormat = audioFormats.reduce((best: AudioFormat, format: AudioFormat) => {
        return (format.audioBitrate || 0) > (best.audioBitrate || 0) ? format : best;
      }, audioFormats[0]);
      
      console.log('选择的音频格式:', bestAudioFormat.mimeType);
      
      // 直接从YouTube服务器获取音频
      const response = await fetch(bestAudioFormat.url);
      
      if (!response.ok) {
        throw new Error(`无法获取音频文件: ${response.status}`);
      }
      
      const audioBuffer = await response.arrayBuffer();
      console.log('音频下载成功，大小:', audioBuffer.byteLength, '字节');
      
      // 返回音频文件给用户
      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': `attachment; filename="${sanitizedTitle}.mp3"`,
          'Content-Length': audioBuffer.byteLength.toString(),
        }
      });
    } catch (err) {
      console.error('处理下载失败:', err);
      
      // 如果主方法失败，尝试使用备选方法
      const videoId = url.match(youtubeUrlRegex)?.[4] || '';
      
      try {
        console.log('尝试备选方法...');
        // 使用备选方法：ytdl-core-browser的备选获取方式
        const alternativeUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
        const alternativeInfo = await ytdl.getInfo(alternativeUrl, {
          requestOptions: {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            }
          }
        });
        
        const audioFormats = ytdl.filterFormats(alternativeInfo.formats, 'audioonly') as AudioFormat[];
        if (audioFormats.length === 0) {
          throw new Error('没有找到可用的音频格式');
        }
        
        // 选择质量最好的音频格式
        const format = audioFormats.reduce((best: AudioFormat, format: AudioFormat) => {
          return (format.audioBitrate || 0) > (best.audioBitrate || 0) ? format : best;
        }, audioFormats[0]);
        
        console.log('备选方法找到的音频格式:', format.mimeType);
        
        // 获取音频内容
        const alternativeResponse = await fetch(format.url);
        
        if (!alternativeResponse.ok) {
          throw new Error(`备选方法无法获取音频: ${alternativeResponse.status}`);
        }
        
        const alternativeBuffer = await alternativeResponse.arrayBuffer();
        
        // 返回音频文件给用户
        return new NextResponse(alternativeBuffer, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Disposition': `attachment; filename="${videoId}.mp3"`,
            'Content-Length': alternativeBuffer.byteLength.toString(),
          }
        });
      } catch (backupError) {
        console.error('备选方法失败:', backupError);
      }
      
      // 所有方法都失败
      return NextResponse.json(
        { error: '下载失败，请稍后再试。详细错误: ' + ((err instanceof Error) ? err.message : '未知错误') },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('视频下载出现错误:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to download YouTube video: ${errorMessage}` },
      { status: 500 }
    );
  }
} 