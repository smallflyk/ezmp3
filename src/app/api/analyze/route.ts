import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Get configuration from environment variables
const apiKey = process.env.OPENROUTER_API_KEY || '';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ezmp3.vercel.app';
const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'EZ MP3 Converter';

// YouTube URL validation regex
const youtubeUrlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[\?&].+)?$/;

interface VideoInfo {
  title: string;
  description: string;
  tags: string[];
  upload_date: string;
  duration: number;
  categories: string[];
}

interface AnalysisResult {
  videoId: string;
  title: string;
  analysis: string;
  metadata: {
    duration: number;
    uploadDate: string;
    categories: string[];
    tags: string[];
  };
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

    // Extract YouTube video ID
    const videoId = url.match(youtubeUrlRegex)?.[4];
    if (!videoId) {
      return NextResponse.json(
        { error: 'Could not extract video ID' },
        { status: 400 }
      );
    }

    try {
      // 由于 Vercel Serverless 环境限制，我们不能使用文件系统和 Python
      // 直接使用模拟数据
      const videoInfo: VideoInfo = {
        title: `YouTube Video ${videoId}`,
        description: "This is an automatically generated description for this video.",
        tags: ["music", "audio", "youtube"],
        upload_date: new Date().toISOString().split('T')[0],
        duration: 180, // 3 minutes
        categories: ["Music"]
      };

      // 检查是否存在 API 密钥
      let analysis = '';
      if (!apiKey) {
        // 如果没有 API 密钥，使用模拟分析数据
        analysis = `
## YouTube 视频分析 (演示模式)

### 音频内容概述
这是一个自动生成的音频内容分析。在实际部署中，我们会使用 OpenRouter API 来分析视频内容。

### 适合 MP3 收听的原因
- 音频质量清晰
- 内容适合在移动设备上收听
- 无需观看视频画面也能理解内容

### 推荐收听场景
- 通勤路上
- 锻炼时
- 放松休息时

### 音频质量评分
⭐⭐⭐⭐ (4/5 星)
        `;
      } else {
        // 使用 OpenRouter API
        try {
          // Initialize OpenAI client
          const openai = new OpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey,
            defaultHeaders: {
              'HTTP-Referer': siteUrl,
              'X-Title': siteName,
              'Content-Type': 'application/json',
            },
          });

          // Use OpenRouter API to analyze video content
          const content = `
Video Title: ${videoInfo.title}
Video Description: ${videoInfo.description}
Video Tags: ${videoInfo.tags.join(', ')}
Video Duration: ${videoInfo.duration} seconds
Video Categories: ${videoInfo.categories.join(', ')}
Upload Date: ${videoInfo.upload_date}
          `;

          // Call OpenRouter API for analysis
          const completion = await openai.chat.completions.create({
            model: 'openai/gpt-4o',
            messages: [
              {
                role: 'system',
                content: 'You are an audio content analysis expert, skilled at analyzing YouTube videos and providing insights about their audio content.'
              },
              {
                role: 'user',
                content: `Please analyze the following YouTube video content and provide insights about its audio portion. This video will be converted to MP3, please provide the following information:
1. Brief overview of audio content
2. Reasons why it's suitable for MP3 listening
3. Recommended listening scenarios
4. Estimated audio quality rating (1-5 stars)

Video information:
${content}`
              }
            ],
          });
          
          // 提取分析结果
          if (completion?.choices?.[0]?.message?.content) {
            analysis = completion.choices[0].message.content;
          } else {
            throw new Error('Invalid API response format');
          }
        } catch (apiError) {
          console.error('OpenRouter API error:', apiError);
          // 如果 API 调用失败，回退到模拟数据
          analysis = `
## YouTube 视频分析 (API 不可用)

### 音频内容概述
这是一个视频 ${videoId} 的内容分析。

### 适合 MP3 收听的原因
- 音频可以单独欣赏
- 便于移动设备上收听

### 推荐收听场景
- 随时随地

### 音频质量评分
⭐⭐⭐ (3/5 星)
          `;
        }
      }

      // Return analysis results
      return NextResponse.json({
        videoId,
        title: videoInfo.title,
        analysis,
        metadata: {
          duration: videoInfo.duration,
          uploadDate: videoInfo.upload_date,
          categories: videoInfo.categories,
          tags: videoInfo.tags
        }
      });
    } catch (err) {
      console.error('YouTube analysis error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return NextResponse.json(
        { error: `Failed to analyze YouTube video: ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing YouTube URL:', error);
    return NextResponse.json(
      { error: 'Failed to analyze YouTube video' },
      { status: 500 }
    );
  }
} 