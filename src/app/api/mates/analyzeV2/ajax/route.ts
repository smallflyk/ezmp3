import { NextRequest, NextResponse } from 'next/server';
import { extractVideoId, generateSignature, buildAnalyzeResultHtml } from '@/lib/youtube';
import { YouTubeService } from '@/lib/youtube-service';

export async function POST(request: NextRequest) {
  try {
    // 解析表单数据
    const formData = await request.formData();
    const youtubeUrl = formData.get('k_query')?.toString() || '';
    
    if (!youtubeUrl) {
      return NextResponse.json(
        { error: '缺少YouTube URL' },
        { status: 400 }
      );
    }
    
    // 提取视频ID
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      return NextResponse.json(
        { error: '无效的YouTube URL' },
        { status: 400 }
      );
    }
    
    // 获取视频信息
    const videoInfo = await YouTubeService.getVideoInfo(videoId);
    
    // 生成签名
    const signature = generateSignature(videoId);
    
    // 构建HTML结果
    const htmlResult = buildAnalyzeResultHtml(
      videoId,
      videoInfo.title,
      videoInfo.thumbnailUrl,
      videoInfo.formats
    );
    
    // 返回与y2mate.nu相同格式的响应
    return NextResponse.json({
      status: 'success',
      vid: videoId,
      title: videoInfo.title,
      result: htmlResult,
      k: signature,
      thumbnails: videoInfo.thumbnailUrl
    });
  } catch (error) {
    console.error('分析视频失败:', error);
    return NextResponse.json(
      { status: 'error', error: '分析视频失败' },
      { status: 500 }
    );
  }
} 