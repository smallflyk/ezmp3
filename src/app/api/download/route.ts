import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore - 强制导入ytdl-core-browser
import * as ytdlBrowser from 'ytdl-core-browser';

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

    // 确保ytdlBrowser已正确加载
    if (!ytdlBrowser || typeof ytdlBrowser.getInfo !== 'function') {
      return NextResponse.json(
        { error: 'YouTube下载库加载失败' },
        { status: 500 }
      );
    }

    try {
      console.log('开始处理视频下载:', url);
      
      // 获取视频ID，用于备选方法
      const videoId = url.match(youtubeUrlRegex)?.[4] || '';
      
      // 尝试使用ytdl-core-browser获取信息
      const info = await ytdlBrowser.getInfo(url);
      console.log('获取视频信息成功，标题:', info.videoDetails.title);
      
      // 获取视频标题
      const videoTitle = info.videoDetails.title;
      const sanitizedTitle = videoTitle.replace(/[^\w\s]/gi, '') || videoId; 
      
      // 查找可用的音频格式
      console.log('开始筛选音频格式...');
      const audioFormats = ytdlBrowser.filterFormats(info.formats, 'audioonly');
      
      if (!audioFormats || audioFormats.length === 0) {
        console.error('未找到音频格式');
        throw new Error('没有找到可用的音频格式');
      }
      
      console.log(`找到 ${audioFormats.length} 个音频格式`);
      
      // 选择最佳音频格式
      let bestFormat = audioFormats[0];
      for (const format of audioFormats) {
        if ((format.audioBitrate || 0) > (bestFormat.audioBitrate || 0)) {
          bestFormat = format;
        }
      }
      
      if (!bestFormat || !bestFormat.url) {
        throw new Error('无法获取有效的音频URL');
      }
      
      console.log('选择的音频格式:', bestFormat.mimeType, '比特率:', bestFormat.audioBitrate);
      console.log('开始下载音频...');
      
      // 获取音频内容
      const audioResponse = await fetch(bestFormat.url);
      
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
      const mp3ConvertApiUrl = `https://api.vevioz.com/api/button/mp3/${videoId}`;
      
      return NextResponse.redirect(mp3ConvertApiUrl, { status: 302 });
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