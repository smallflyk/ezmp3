import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import os from 'os';

// 生成模拟y2mate签名
export function generateSignature(videoId: string): string {
  return crypto.createHash('md5').update(`y2mate-${videoId}-${Date.now()}`).digest('hex').substring(0, 10);
}

// 从YouTube URL中提取视频ID
export function extractVideoId(url: string): string | null {
  const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
  return videoIdMatch?.[1] || null;
}

// 估算MP3文件大小
export function estimateFileSize(durationSeconds: number, bitrate: number): string {
  // 计算大小：(比特率 * 时长 / 8 [转换为字节]) / 1024^2 [转换为MB]
  const sizeMB = (bitrate * 1000 * durationSeconds / 8) / (1024 * 1024);
  return `~${sizeMB.toFixed(1)} MB`;
}

// 生成安全的文件名
export function generateSafeFilename(title: string, videoId: string): string {
  const safeName = title
    .replace(/[^\w\s-]/g, '') // 移除非字母数字字符
    .replace(/\s+/g, '_')     // 空格替换为下划线
    .substring(0, 100);       // 限制长度
  
  return `${safeName}-${videoId}.mp3`;
}

// 创建临时文件路径
export function getTempFilePath(filename: string): string {
  const tempDir = path.join(os.tmpdir(), 'ezmp3');
  
  // 确保临时目录存在
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  return path.join(tempDir, filename);
}

// 构建分析结果HTML响应
export function buildAnalyzeResultHtml(videoId: string, title: string, thumbnailUrl: string, formats: any[]): string {
  let html = `
    <div class="thumbnail"><img src="${thumbnailUrl}" alt="${title}"></div>
    <div class="caption text-left">${title}</div>
    <div class="formats">
  `;
  
  formats.forEach(format => {
    html += `
      <div class="format-option">
        <span class="format-type">${format.type}</span>
        <span class="format-quality">${format.quality} kbps</span>
        <span class="format-size">${format.size}</span>
        <a href="#" data-id="${videoId}" data-type="${format.type}" class="convert-button">下载</a>
      </div>
    `;
  });
  
  html += '</div>';
  return html;
} 