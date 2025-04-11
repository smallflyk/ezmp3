import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { spawn } from 'child_process';
import { writeFile, mkdir, readFile, rename, stat, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';
import { createReadStream } from 'fs';
import { ReadableStream } from 'stream/web';

// Get configuration from environment variables
const apiKey = process.env.OPENROUTER_API_KEY || '';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ezmp3.vercel.app';
const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'EZ MP3 Converter';

// Initialize OpenAI client
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey, // Use environment variable
  defaultHeaders: {
    'HTTP-Referer': siteUrl, // Use environment variable
    'X-Title': siteName, // Use environment variable
  },
});

// YouTube URL validation regex
const youtubeUrlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[\?&].+)?$/;

// Temporary directory for files
const TEMP_DIR = join(process.cwd(), 'tmp');

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

    // Ensure temp directory exists
    if (!existsSync(TEMP_DIR)) {
      await mkdir(TEMP_DIR, { recursive: true });
    }

    // Generate unique filename
    const uuid = randomUUID();
    const outputFilePath = join(TEMP_DIR, `${videoId}-${uuid}.mp3`);

    // Create Python script
    const pythonScript = `
import sys
import os
import traceback
import yt_dlp
import shutil

def download_audio(url, output_path):
    try:
        print(f"Starting download for URL: {url}")
        print(f"Output path: {output_path}")
        
        # Remove .mp3 extension as yt-dlp will add it again
        base_output_path = os.path.splitext(output_path)[0]
        
        ydl_opts = {
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'outtmpl': base_output_path,
            'no_warnings': True,
            'quiet': False,
            'verbose': True,
            'socket_timeout': 30,
            'retries': 10,
            'fragment_retries': 10,
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        }
        
        print("Initializing yt-dlp...")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            print("Starting download...")
            ydl.download([url])
            
        # Check for the output file with .mp3 extension
        expected_output = f"{base_output_path}.mp3"
        if not os.path.exists(expected_output):
            raise Exception(f"Output file was not created at {expected_output}")
            
        # Move the file to the desired location if needed
        if expected_output != output_path:
            shutil.move(expected_output, output_path)
            
        print(f"Download completed successfully. File size: {os.path.getsize(output_path)} bytes")
        
    except Exception as e:
        print(f"Error occurred: {str(e)}")
        print("Traceback:")
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: python script.py <url> <output_path>", file=sys.stderr)
        sys.exit(1)
    download_audio(sys.argv[1], sys.argv[2])
`;

    const scriptPath = join(TEMP_DIR, `download-${uuid}.py`);
    await writeFile(scriptPath, pythonScript);

    // Execute Python script for downloading
    const python = spawn('python3', [scriptPath, url, outputFilePath], {
      env: {
        ...process.env,
        PYTHONPATH: join(process.cwd(), 'venv', 'lib', 'python3.13', 'site-packages'),
        PATH: process.env.PATH
      }
    });

    // Wait for the process to complete
    await new Promise((resolve, reject) => {
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

      python.on('close', (code) => {
        if (code === 0 && existsSync(outputFilePath)) {
          resolve(null);
        } else {
          reject(new Error(`Download failed: ${stderr}`));
        }
      });

      python.on('error', (err) => {
        reject(new Error(`Failed to start Python script: ${err.message}`));
      });
    });

    // Check if file exists and has content
    if (!existsSync(outputFilePath)) {
      throw new Error('MP3 file was not created');
    }

    const stats = await stat(outputFilePath);
    if (stats.size === 0) {
      throw new Error('MP3 file is empty');
    }

    // Stream the file
    const fileStream = createReadStream(outputFilePath);
    
    // Create response with appropriate headers
    const response = new NextResponse(fileStream as unknown as ReadableStream, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${videoId}.mp3"`,
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'no-cache',
        'Accept-Ranges': 'bytes',
        'Connection': 'keep-alive',
      },
    });

    // 改用同步方式处理文件删除
    try {
      const fileContent = await readFile(outputFilePath);
      await unlink(outputFilePath);
      return new NextResponse(fileContent, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': `attachment; filename="${videoId}.mp3"`,
          'Content-Length': stats.size.toString(),
          'Cache-Control': 'no-cache',
        },
      });
    } catch (err) {
      console.error('Error reading or deleting file:', err);
      throw new Error('Failed to process MP3 file');
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