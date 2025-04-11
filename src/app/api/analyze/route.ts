import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { exec } from 'youtube-dl-exec';
import { spawn } from 'child_process';
import { join } from 'path';
import { writeFile } from 'fs/promises';

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
      // Use yt-dlp directly instead of youtube-dl-exec
      const pythonScript = `
import sys
import json
import yt_dlp

def get_video_info(url):
    try:
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'skip_download': True,
            'dump_single_json': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            print(json.dumps(info))
            
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python script.py <url>", file=sys.stderr)
        sys.exit(1)
    get_video_info(sys.argv[1])
`;

      const scriptPath = join(process.cwd(), 'tmp', `analyze-${videoId}.py`);
      await writeFile(scriptPath, pythonScript);

      // Execute Python script
      const python = spawn('python3', [scriptPath, url], {
        env: {
          ...process.env,
          PYTHONPATH: join(process.cwd(), 'venv', 'lib', 'python3.13', 'site-packages'),
          PATH: process.env.PATH
        }
      });

      // Collect stdout and stderr output
      let stdout = '';
      let stderr = '';
      python.stdout.on('data', (data) => {
        stdout += data.toString();
        console.log('Python stdout:', data.toString());
      });
      python.stderr.on('data', (data) => {
        stderr += data.toString();
        console.error('Python stderr:', data.toString());
      });

      // Wait for the process to complete
      const videoInfo = await new Promise((resolve, reject) => {
        python.on('close', (code) => {
          if (code === 0) {
            try {
              resolve(JSON.parse(stdout));
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              reject(new Error(`Failed to parse video info: ${errorMessage}`));
            }
          } else {
            reject(new Error(`Python script exited with code ${code}\nStdout: ${stdout}\nStderr: ${stderr}`));
          }
        });
        python.on('error', (err: Error) => {
          reject(new Error(`Failed to start Python script: ${err.message}\nStdout: ${stdout}\nStderr: ${stderr}`));
        });
      });

      // Extract video metadata
      const { title = '', description = '', tags = [], upload_date = '', duration = 0, categories = [] } = videoInfo as any;

      // Use OpenRouter API to analyze video content
      const content = `
Video Title: ${title}
Video Description: ${description}
Video Tags: ${Array.isArray(tags) ? tags.join(', ') : ''}
Video Duration: ${duration} seconds
Video Categories: ${Array.isArray(categories) ? categories.join(', ') : ''}
Upload Date: ${upload_date}
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
        analysis = `Video Title: ${title}\nDuration: ${duration} seconds\nUpload Date: ${upload_date}`;
      }

      // Return analysis results
      return NextResponse.json({
        videoId,
        title,
        analysis,
        metadata: {
          duration,
          uploadDate: upload_date,
          categories: Array.isArray(categories) ? categories : [],
          tags: Array.isArray(tags) ? tags : []
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