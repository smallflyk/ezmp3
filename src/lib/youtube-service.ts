import axios from 'axios';
import fs from 'fs';
import { generateSafeFilename, getTempFilePath, estimateFileSize } from './youtube';
import { exec } from 'child_process';
import { promisify } from 'util';

// 定义类型
interface VideoInfo {
  title: string;
  thumbnailUrl: string;
  duration: number;
  formats: Array<{
    type: string;
    quality: string;
    size: string;
  }>;
}

// 转换为promise的exec
const execPromise = promisify(exec);

// YouTube服务类
export const YouTubeService = {
  // 获取视频信息
  async getVideoInfo(videoId: string): Promise<VideoInfo> {
    try {
      // 使用YouTube oEmbed API获取基本信息，增加超时设置
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      
      // 使用默认标题和缩略图，防止API超时导致整个流程失败
      let title = `YouTube Video ${videoId}`;
      let thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      
      try {
        // 设置5秒超时，避免长时间等待
        const oembedResponse = await axios.get(oembedUrl, { timeout: 5000 });
        title = oembedResponse.data.title || title;
      } catch (error) {
        console.warn('获取oEmbed信息失败，使用默认标题:', error);
        // 继续使用默认标题
      }
      
      // 模拟视频时长，实际中应从API获取
      const duration = 240; // 假设4分钟
      
      // 创建不同质量选项
      const formats = [
        { 
          type: 'mp3-64', 
          quality: '64', 
          size: estimateFileSize(duration, 64) 
        },
        { 
          type: 'mp3-128', 
          quality: '128', 
          size: estimateFileSize(duration, 128) 
        },
        { 
          type: 'mp3-256', 
          quality: '256', 
          size: estimateFileSize(duration, 256) 
        },
        { 
          type: 'mp3-320', 
          quality: '320', 
          size: estimateFileSize(duration, 320) 
        }
      ];
      
      return {
        title,
        thumbnailUrl,
        duration,
        formats
      };
    } catch (error) {
      console.error('获取视频信息失败:', error);
      throw new Error('获取视频信息失败');
    }
  },
  
  // 转换为MP3
  async convertToMp3(videoId: string, quality: string): Promise<string> {
    try {
      // 获取视频信息
      const info = await this.getVideoInfo(videoId);
      
      // 创建安全的文件名
      const filename = generateSafeFilename(info.title, videoId);
      
      // 获取临时文件路径
      const outputPath = getTempFilePath(filename);
      
      // 使用命令行工具下载并转换（实际中可以使用ytdl-core和ffmpeg）
      // 这里使用yt-dlp作为示例（需先安装yt-dlp）
      const command = [
        'yt-dlp',
        '--extract-audio',
        '--audio-format mp3',
        `--audio-quality ${quality}k`,
        `https://www.youtube.com/watch?v=${videoId}`,
        `-o "${outputPath}"`
      ].join(' ');
      
      // 执行命令
      await execPromise(command);
      
      // 验证文件是否存在
      if (!fs.existsSync(outputPath)) {
        throw new Error('MP3转换失败');
      }
      
      return outputPath;
    } catch (error) {
      console.error('MP3转换失败:', error);
      throw new Error('MP3转换失败');
    }
  },
  
  // 生成直接下载链接（实际环境中应考虑安全性和授权）
  generateDirectLink(req: Request, filename: string): string {
    const headers = new Headers(req.headers);
    const host = headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    
    // 生成一个临时唯一标识符
    const uniqueId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    
    // 返回动态生成的下载链接
    return `${protocol}://${host}/api/direct?id=${filename.replace('.mp3', '')}`;
  }
}; 