import { NextRequest, NextResponse } from 'next/server';
import { YouTubeService } from '@/lib/youtube-service';
import { generateSafeFilename, extractVideoId } from '@/lib/youtube';
import path from 'path';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function POST(request: NextRequest) {
  try {
    // 解析表单数据
    const formData = await request.formData();
    const videoId = formData.get('vid')?.toString();
    const fileType = formData.get('ftype')?.toString();
    const fileQuality = formData.get('fquality')?.toString();
    const fileName = formData.get('fname')?.toString();
    
    // 验证必要参数
    if (!videoId || !fileType || !fileQuality) {
      return NextResponse.json(
        { status: 'error', error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    // 验证类型和质量
    if (fileType !== 'mp3' || !['mp3-64', 'mp3-128', 'mp3-256', 'mp3-320'].includes(fileQuality)) {
      return NextResponse.json(
        { status: 'error', error: '不支持的格式或质量' },
        { status: 400 }
      );
    }
    
    // 清理质量数值（移除"mp3-"前缀）
    const quality = fileQuality.replace('mp3-', '');
    const title = fileName || `YouTube Video ${videoId}`;
    
    // 创建安全的文件名
    const filename = generateSafeFilename(title, videoId);
    
    // 构建直接下载URL，使用我们的y2mate-mp3 API
    const downloadUrl = `/api/v1/y2mate-mp3?url=https://www.youtube.com/watch?v=${videoId}&bitrate=${quality}`;
    
    // 返回响应，包含直接下载链接
    return NextResponse.json({
      status: 'success',
      vid: videoId,
      title: title,
      ftype: fileType,
      fquality: fileQuality,
      dlink: downloadUrl
    });
  } catch (error) {
    console.error('转换视频失败:', error);
    return NextResponse.json(
      { status: 'error', error: '转换视频失败' },
      { status: 500 }
    );
  }
} 