import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Get configuration from environment variables
const apiKey = process.env.OPENROUTER_API_KEY || '';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ezmp3.vercel.app';
const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'EZ MP3 Converter';

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

      // 添加错误处理和日志
      console.log('OpenRouter API Response:', JSON.stringify(completion, null, 2));
      
      let analysis = '';
      try {
        if (completion?.choices?.[0]?.message?.content) {
          analysis = completion.choices[0].message.content;
        } else {
          throw new Error('Invalid API response format');
        }
      } catch (err) {
        console.error('Failed to parse OpenRouter API response:', err);
        analysis = `Video Title: ${videoInfo.title}\nDuration: ${videoInfo.duration} seconds\nUpload Date: ${videoInfo.upload_date}`;
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