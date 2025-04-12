import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'youtube-dl-exec';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { promisify } from 'util';

const unlink = promisify(fs.unlink);
const readFile = promisify(fs.readFile);

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
      // 创建临时文件名
      const tempDir = '/tmp';
      const uniqueId = uuidv4();
      const outputPath = path.join(tempDir, `${uniqueId}.mp3`);
      
      // 使用youtube-dl-exec下载并转换为MP3
      await exec(url, {
        extractAudio: true,
        audioFormat: 'mp3',
        output: outputPath,
        quiet: true,
      });
      
      // 读取文件
      const fileBuffer = await readFile(outputPath);
      
      // 获取视频标题
      const info = await exec(url, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
      });
      
      const videoInfo = JSON.parse(info.stdout);
      const title = videoInfo.title || videoId;
      const sanitizedTitle = title.replace(/[^\w\s]/gi, ''); // 移除特殊字符
      
      // 清理临时文件
      try {
        await unlink(outputPath);
      } catch (err) {
        console.error('Error deleting temp file:', err);
      }
      
      // 返回MP3文件给用户
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': `attachment; filename="${sanitizedTitle}.mp3"`,
          'Content-Length': fileBuffer.length.toString(),
        }
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