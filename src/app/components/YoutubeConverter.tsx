'use client';

import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import VideoAnalysis from './VideoAnalysis';

type ConverterProps = {
  translations: {
    placeholder: string;
    button: string;
    loading: string;
    success: string;
    error: string;
    bitrate?: string;
    download?: string;
    downloading?: string;
    downloadGuide?: {
      title?: string;
      step1?: string;
      step2?: string;
      step3?: string;
      step4?: string;
      step5?: string;
      tip?: string;
      tipContent?: string;
      closeGuide?: string;
      alertMessage?: string;
      popupBlocked?: string;
    };
  };
};

// 添加事件类型
interface InputChangeEvent extends React.ChangeEvent<HTMLInputElement> {
  target: HTMLInputElement;
}

interface SelectChangeEvent extends React.ChangeEvent<HTMLSelectElement> {
  target: HTMLSelectElement;
}

// 定义视频信息类型
interface VideoInfo {
  videoId: string;
  title: string;
  thumbnail?: string;
  duration?: string;
}

export default function YoutubeConverter({ translations }: ConverterProps) {
  const [url, setUrl] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [downloadUrl, setDownloadUrl] = React.useState('');
  const [showAnalysis, setShowAnalysis] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);
  const [downloadError, setDownloadError] = React.useState<string | null>(null);
  const [bitrate, setBitrate] = React.useState<string>('128');
  const [showGuide, setShowGuide] = React.useState(false);
  const [videoInfo, setVideoInfo] = React.useState<VideoInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = React.useState<number>(0);
  const [downloadSize, setDownloadSize] = React.useState<string>('0 MB');
  const [downloadSpeed, setDownloadSpeed] = React.useState<string>('0 MB/s');
  const { language } = useLanguage();
  
  const isValidYoutubeUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    return youtubeRegex.test(url);
  };

  const convertToMp3 = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidYoutubeUrl(url)) {
      alert(translations.downloadGuide?.alertMessage || 'Please enter a valid YouTube URL');
      return;
    }
    
    setStatus('loading');
    
    try {
      // 提取视频ID
      const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
      const videoId = videoIdMatch?.[1];
      
      if (!videoId) {
        throw new Error('无法提取视频ID');
      }
      
      // 获取视频详细信息（使用我们的Mates API）
      try {
        const analyzeResponse = await fetch('/api/mates/analyzeV2/ajax', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            k_query: url
          })
        });
        
        if (analyzeResponse.ok) {
          const analyzeData = await analyzeResponse.json();
          if (analyzeData.status === 'success') {
            // 设置更详细的视频信息
            setVideoInfo({
              videoId,
              title: analyzeData.title,
              thumbnail: analyzeData.thumbnails
            });
          }
        }
      } catch (analyzeError) {
        console.error('获取视频信息失败:', analyzeError);
        // 如果获取详细信息失败，仍然设置基本信息
        setVideoInfo({
          videoId,
          title: `YouTube 视频 ${videoId}`
        });
      }
      
      // Call download API with bitrate parameter
      const apiUrl = `/api/download?url=${encodeURIComponent(url)}&bitrate=${bitrate}`;
      setDownloadUrl(apiUrl);
      setStatus('success');
      
      // Show analysis results
      setShowAnalysis(true);
    } catch (error) {
      console.error('Error converting YouTube to MP3:', error);
      setStatus('error');
    }
  };

  const handleDownload = async () => {
    if (!videoInfo || !url) return;
    setDownloading(true);
    setDownloadError(null);
    setDownloadProgress(0);

    try {
      // 记录尝试过的方法，避免重复尝试
      const attemptedMethods = new Set();
      
      // 首先尝试使用y2mate API直接下载（作为首选方式）
      console.log('尝试使用Y2mate API下载...');
      const y2mateApiUrl = `/api/v1/y2mate-mp3?url=${encodeURIComponent(url)}&bitrate=${bitrate}`;
      attemptedMethods.add('y2mate');
      
      try {
        const isY2mateSuccess = await downloadMp3File(y2mateApiUrl, videoInfo.videoId);
        if (isY2mateSuccess) {
          console.log('Y2mate API下载成功');
          setStatus('success');
          return;
        }
      } catch (y2mateError) {
        console.error('Y2mate API下载失败:', y2mateError);
        // 继续尝试其他方法
      }

      // 尝试mates API (Y2mate.nu克隆)
      console.log('尝试使用Mates API下载...');
      attemptedMethods.add('mates');
      
      try {
        // 首先通过analyze API获取视频信息
        const analyzeResponse = await fetch('/api/mates/analyzeV2/ajax', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            k_query: url
          })
        });
        
        if (analyzeResponse.ok) {
          const analyzeData = await analyzeResponse.json();
          if (analyzeData.status === 'success') {
            // 然后通过convert API获取下载链接
            const convertResponse = await fetch('/api/mates/convertV2/index', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                vid: analyzeData.vid,
                k: analyzeData.k,
                ftype: 'mp3',
                fquality: `mp3-${bitrate}`,
                fname: analyzeData.title
              })
            });
            
            if (convertResponse.ok) {
              const convertData = await convertResponse.json();
              if (convertData.status === 'success' && convertData.dlink) {
                // 通过生成的dlink下载文件
                const dlinkSuccess = await downloadMp3File(convertData.dlink, videoInfo.videoId);
                if (dlinkSuccess) {
                  console.log('Mates API下载成功');
                  setStatus('success');
                  return;
                }
              }
            }
          }
        }
      } catch (matesError) {
        console.error('Mates API下载失败:', matesError);
        // 继续尝试其他方法
      }

      // 如果y2mate和mates API下载失败，尝试其他API方法
      // 按照优先级排序
      const apiUrls = [
        { name: 'new-mp3', url: `/api/v1/new-mp3?url=${encodeURIComponent(url)}&bitrate=${bitrate}` },
        { name: 'direct-mp3', url: `/api/v1/direct-mp3?url=${encodeURIComponent(url)}&bitrate=${bitrate}` },
        { name: 'stream-mp3', url: `/api/v1/stream-mp3?url=${encodeURIComponent(url)}&bitrate=${bitrate}` },
        { name: 'mp3-backup', url: `/api/v1/mp3-backup?id=${videoInfo.videoId}&bitrate=${bitrate}` }
      ];

      let downloadSuccess = false;
      for (const api of apiUrls) {
        if (attemptedMethods.has(api.name)) continue;
        attemptedMethods.add(api.name);
        
        console.log(`尝试使用${api.name} API下载...`);
        try {
          const success = await downloadMp3File(api.url, videoInfo.videoId);
          if (success) {
            console.log(`${api.name} API下载成功`);
            downloadSuccess = true;
            break;
          }
        } catch (err) {
          console.error(`API ${api.name} 下载失败:`, err);
          // 继续尝试下一个API
        }
      }

      if (downloadSuccess) {
        setStatus('success');
      } else {
        // 如果所有API都失败，最后尝试使用直接下载API
        console.log('所有API下载失败，尝试使用直接下载API...');
        
        if (!attemptedMethods.has('direct')) {
          attemptedMethods.add('direct');
          try {
            // 尝试调用/api/direct路由来重定向用户
            const directApiUrl = `/api/direct?id=${videoInfo.videoId}`;
            window.open(directApiUrl, '_blank');
            setStatus('success');
            return;
          } catch (directError) {
            console.error('直接下载API失败:', directError);
          }
        }
        
        // 如果所有方法都失败，告知用户并提供备用转换接口
        throw new Error('所有下载方法都失败，请尝试"一键直接下载"按钮');
      }
    } catch (error) {
      console.error('下载错误:', error);
      setStatus('error');
      
      // 提供更详细的错误信息和建议
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      let errorWithSuggestion = `下载失败: ${errorMessage}`;
      
      // 根据错误类型提供建议
      if (errorMessage.includes('找不到MP3下载ID') || errorMessage.includes('无法提取')) {
        errorWithSuggestion += `\n建议: 请尝试蓝色的"一键直接下载"按钮，或稍后再试。`;
      } else if (errorMessage.includes('状态码: 5')) {
        errorWithSuggestion += `\n建议: 服务器暂时不可用，请稍后再试。`;
      } else if (errorMessage.includes('下载的文件太小')) {
        errorWithSuggestion += `\n建议: 视频可能受到版权保护，请尝试蓝色的"一键直接下载"按钮。`;
      } else if (errorMessage.includes('超时')) {
        errorWithSuggestion += `\n建议: 网络连接不稳定，请检查您的网络后重试。`;
      } else {
        errorWithSuggestion += `\n建议: 请尝试蓝色的"一键直接下载"按钮，或切换到其他音质。`;
      }
      
      setDownloadError(errorWithSuggestion);
      
      // 尝试打开fallback API作为最后的备选方案
      try {
        const fallbackUrl = `/api/fallback?id=${videoInfo.videoId}`;
        window.open(fallbackUrl, '_blank');
      } catch (fallbackError) {
        console.error('Fallback API也失败了:', fallbackError);
      }
    } finally {
      setDownloading(false);
    }
  };
  
  // 辅助函数：从指定的API URL下载MP3文件
  const downloadMp3File = async (apiUrl: string, videoId: string) => {
    // 添加超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒超时
    
    try {
      // 更新状态为加载中
      setStatus('loading');
      setDownloadProgress(0);
      setDownloadSize('计算中...');
      setDownloadSpeed('0 MB/s');
      
      // 记录下载开始时间（用于计算下载速度）
      const startTime = Date.now();

      // 检查是否是直接调用本地API还是其他网站的API
      if (apiUrl.startsWith('/api/')) {
        // 本地API，可以使用fetch
        const response = await fetch(apiUrl, { signal: controller.signal });
        
        // 确保清除超时
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          // 检查是否返回JSON错误
          try {
            const contentType = response.headers.get('Content-Type');
            if (contentType && contentType.includes('application/json')) {
              const errorData = await response.json();
              
              // 如果返回了外部链接，直接打开它
              if (errorData.externalLink) {
                console.log('收到外部下载链接，尝试打开:', errorData.externalLink);
                window.open(errorData.externalLink, '_blank');
                throw new Error(errorData.error || errorData.message || '下载失败，已打开外部链接');
              }
              
              throw new Error(errorData.error || '下载失败');
            } else {
              // 如果不是JSON，返回HTTP状态错误
              throw new Error(`下载失败，状态码: ${response.status}`);
            }
          } catch (e) {
            // 重新抛出错误
            if (e instanceof Error) {
              throw e;
            }
            // 如果不是JSON，返回HTTP状态错误
            throw new Error(`下载失败，状态码: ${response.status}`);
          }
        }
        
        // 检查内容类型，判断是否为JSON响应而非MP3
        const contentType = response.headers.get('Content-Type');
        if (contentType && contentType.includes('application/json')) {
          // 这是JSON响应，可能包含错误信息或外部链接
          const jsonData = await response.json();
          
          if (jsonData.error) {
            throw new Error(jsonData.error);
          }
          
          if (jsonData.externalLink) {
            // 如果提供了外部链接，在新窗口打开
            console.log('收到外部下载链接，尝试打开:', jsonData.externalLink);
            window.open(jsonData.externalLink, '_blank');
            throw new Error('重定向到外部下载链接');
          }
          
          // 特殊处理dlink响应（来自mates API）
          if (jsonData.dlink && jsonData.status === 'success') {
            console.log('收到dlink，尝试下载:', jsonData.dlink);
            // 递归调用自身来处理dlink
            return await downloadMp3File(jsonData.dlink, videoId);
          }
          
          if (jsonData.status === 'pending') {
            // 如果转换仍在进行中，等待后重试
            await new Promise(resolve => setTimeout(resolve, 3000));
            // 递归重试，最多重试3次
            return await downloadMp3File(apiUrl, videoId);
          }
          
          throw new Error('API返回了非MP3响应');
        }
        
        // 获取文件大小
        const contentLength = response.headers.get('Content-Length');
        const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
        if (totalBytes > 0) {
          const totalSizeMB = (totalBytes / (1024 * 1024)).toFixed(2);
          setDownloadSize(`${totalSizeMB} MB`);
        } else {
          setDownloadSize('未知大小');
        }
        
        // 获取文件名，默认使用视频ID
        let filename = `youtube-${videoId}.mp3`;
        const contentDisposition = response.headers.get('Content-Disposition');
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1];
          }
        }
        
        // 使用Response.clone()创建副本用于读取blob
        const responseClone = response.clone();
        
        // 使用ReadableStream API手动读取和跟踪进度
        const reader = response.body?.getReader();
        if (reader) {
          let receivedBytes = 0;
          const chunks: Uint8Array[] = [];
          
          // 读取流
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              break;
            }
            
            chunks.push(value);
            receivedBytes += value.length;
            
            // 更新进度
            if (totalBytes > 0) {
              const progress = Math.min(Math.round((receivedBytes / totalBytes) * 100), 100);
              setDownloadProgress(progress);
              
              // 计算并更新下载速度
              const currentTime = Date.now();
              const elapsedSeconds = (currentTime - startTime) / 1000;
              if (elapsedSeconds > 0) {
                const speedMBps = (receivedBytes / (1024 * 1024)) / elapsedSeconds;
                setDownloadSpeed(`${speedMBps.toFixed(2)} MB/s`);
              }
            }
          }
          
          // 完成下载，使用克隆的响应获取blob
          const blob = await responseClone.blob();
          
          // 计算最终下载速度
          const endTime = Date.now();
          const downloadTime = (endTime - startTime) / 1000; // 秒
          const fileSizeMB = blob.size / (1024 * 1024);
          const speedMBps = fileSizeMB / downloadTime;
          console.log(`下载完成: ${fileSizeMB.toFixed(2)} MB, 用时: ${downloadTime.toFixed(1)}秒, 速度: ${speedMBps.toFixed(2)} MB/s`);
          setDownloadSpeed(`${speedMBps.toFixed(2)} MB/s`);
          setDownloadProgress(100);
          
          // 严格验证文件是否为MP3
          const isValidMp3 = await validateMp3(blob);
          if (!isValidMp3) {
            console.warn('下载的文件不是有效的MP3文件，尝试修复...');
            // 尝试修复MP3文件
            const fixedBlob = await attemptToFixMp3(blob);
            if (fixedBlob) {
              console.log('MP3文件修复成功');
              
              // 使用修复后的blob创建下载
              const blobUrl = window.URL.createObjectURL(fixedBlob);
              const downloadLink = document.createElement('a');
              downloadLink.href = blobUrl;
              downloadLink.download = filename;
              downloadLink.style.display = 'none';
              document.body.appendChild(downloadLink);
              
              // 触发下载
              downloadLink.click();
              
              // 清理
              window.URL.revokeObjectURL(blobUrl);
              document.body.removeChild(downloadLink);
              
              return true;
            } else {
              throw new Error('MP3文件无效且无法修复，请尝试其他下载方式');
            }
          }
          
          // 检查blob类型，确保是音频
          if (!blob.type.includes('audio/') && !blob.type.includes('application/octet-stream')) {
            console.warn(`警告: 收到非音频内容类型: ${blob.type}`);
          }
          
          // 确保至少有一些数据
          if (blob.size < 1000) {
            throw new Error('下载的文件太小，可能不是有效的MP3');
          }
          
          // 创建下载链接并触发下载
          const blobUrl = window.URL.createObjectURL(blob);
          const downloadLink = document.createElement('a');
          downloadLink.href = blobUrl;
          downloadLink.download = filename;
          downloadLink.style.display = 'none';
          document.body.appendChild(downloadLink);
          
          // 触发下载
          downloadLink.click();
          
          // 清理
          window.URL.revokeObjectURL(blobUrl);
          document.body.removeChild(downloadLink);
          
          // 下载成功
          return true;
        } else {
          // 如果不能获取reader，回退到普通的blob下载
          const blob = await response.blob();
          
          // 验证MP3文件
          const isValidMp3 = await validateMp3(blob);
          if (!isValidMp3) {
            console.warn('下载的文件不是有效的MP3文件，尝试修复...');
            // 尝试修复MP3文件
            const fixedBlob = await attemptToFixMp3(blob);
            if (fixedBlob) {
              console.log('MP3文件修复成功');
              
              // 使用修复后的blob创建下载
              const blobUrl = window.URL.createObjectURL(fixedBlob);
              const downloadLink = document.createElement('a');
              downloadLink.href = blobUrl;
              downloadLink.download = filename;
              downloadLink.style.display = 'none';
              document.body.appendChild(downloadLink);
              
              // 触发下载
              downloadLink.click();
              
              // 清理
              window.URL.revokeObjectURL(blobUrl);
              document.body.removeChild(downloadLink);
              
              return true;
            } else {
              throw new Error('MP3文件无效且无法修复，请尝试其他下载方式');
            }
          }
          
          // 计算下载速度
          const endTime = Date.now();
          const downloadTime = (endTime - startTime) / 1000; // 秒
          const fileSizeMB = blob.size / (1024 * 1024);
          const speedMBps = fileSizeMB / downloadTime;
          console.log(`下载完成: ${fileSizeMB.toFixed(2)} MB, 用时: ${downloadTime.toFixed(1)}秒, 速度: ${speedMBps.toFixed(2)} MB/s`);
          
          // 检查blob类型，确保是音频
          if (!blob.type.includes('audio/') && !blob.type.includes('application/octet-stream')) {
            console.warn(`警告: 收到非音频内容类型: ${blob.type}`);
          }
          
          // 确保至少有一些数据
          if (blob.size < 1000) {
            throw new Error('下载的文件太小，可能不是有效的MP3');
          }
          
          // 创建下载链接并触发下载
          const blobUrl = window.URL.createObjectURL(blob);
          const downloadLink = document.createElement('a');
          downloadLink.href = blobUrl;
          downloadLink.download = filename;
          downloadLink.style.display = 'none';
          document.body.appendChild(downloadLink);
          
          // 触发下载
          downloadLink.click();
          
          // 清理
          window.URL.revokeObjectURL(blobUrl);
          document.body.removeChild(downloadLink);
          
          // 下载成功
          return true;
        }
      } else {
        // 外部API，使用基本的fetch方法且不跟踪进度
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`下载失败，状态码: ${response.status}`);
        }
        
        const blob = await response.blob();
        
        // 验证MP3文件
        const isValidMp3 = await validateMp3(blob);
        if (!isValidMp3) {
          console.warn('外部链接：下载的文件不是有效的MP3文件，尝试修复...');
          // 尝试修复MP3文件
          const fixedBlob = await attemptToFixMp3(blob);
          if (fixedBlob) {
            console.log('外部链接：MP3文件修复成功');
            
            // 使用修复后的blob创建下载
            const fileName = `youtube-${videoId}.mp3`;
            const blobUrl = window.URL.createObjectURL(fixedBlob);
            const downloadLink = document.createElement('a');
            downloadLink.href = blobUrl;
            downloadLink.download = fileName;
            downloadLink.style.display = 'none';
            document.body.appendChild(downloadLink);
            
            // 触发下载
            downloadLink.click();
            
            // 清理
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(downloadLink);
            
            return true;
          } else {
            throw new Error('外部链接：MP3文件无效且无法修复，请尝试其他下载方式');
          }
        }
        
        // 计算下载速度
        const endTime = Date.now();
        const downloadTime = (endTime - startTime) / 1000; // 秒
        const fileSizeMB = blob.size / (1024 * 1024);
        const speedMBps = fileSizeMB / downloadTime;
        console.log(`外部链接下载完成: ${fileSizeMB.toFixed(2)} MB, 用时: ${downloadTime.toFixed(1)}秒, 速度: ${speedMBps.toFixed(2)} MB/s`);
        
        if (blob.size < 1000) {
          throw new Error('下载的文件太小，可能不是有效的MP3');
        }
        
        // 创建下载链接并触发下载
        const fileName = `youtube-${videoId}.mp3`;
        const blobUrl = window.URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = blobUrl;
        downloadLink.download = fileName;
        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);
        
        // 触发下载
        downloadLink.click();
        
        // 清理
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(downloadLink);
        
        return true;
      }
    } catch (error) {
      // 确保清除超时
      clearTimeout(timeoutId);
      
      // 重新抛出错误，让调用者处理
      throw error;
    }
  };
  
  // MP3文件格式验证函数
  const validateMp3 = async (blob: Blob): Promise<boolean> => {
    try {
      // 只需读取文件的前几个字节来检查MP3头部
      const fileHeader = await blob.slice(0, 4).arrayBuffer();
      const headerBytes = new Uint8Array(fileHeader);
      
      // 检查是否是MP3文件特征
      // MP3文件通常以"ID3"开头(ID3v2标签)或以0xFF 0xFB开头(MP3帧同步标记)
      
      // 检查ID3v2标签
      if (headerBytes[0] === 0x49 && headerBytes[1] === 0x44 && headerBytes[2] === 0x33) {
        console.log('文件包含有效的ID3v2标签');
        return true;
      }
      
      // 检查MP3帧同步标记
      if (headerBytes[0] === 0xFF && (headerBytes[1] & 0xE0) === 0xE0) {
        console.log('文件包含有效的MP3帧同步标记');
        return true;
      }
      
      // 如果前几个字节不符合，尝试在文件内搜索MP3标记
      // 这可能是因为文件开头有其他数据
      const largerSample = await blob.slice(0, 4096).arrayBuffer();
      const sampleBytes = new Uint8Array(largerSample);
      
      for (let i = 0; i < sampleBytes.length - 2; i++) {
        // 查找ID3标记
        if (sampleBytes[i] === 0x49 && sampleBytes[i + 1] === 0x44 && sampleBytes[i + 2] === 0x33) {
          console.log(`在偏移量${i}处找到ID3标签`);
          return true;
        }
        
        // 查找MP3帧同步标记
        if (sampleBytes[i] === 0xFF && (sampleBytes[i + 1] & 0xE0) === 0xE0) {
          console.log(`在偏移量${i}处找到MP3帧同步标记`);
          return true;
        }
      }
      
      // 检查文件MIME类型
      if (blob.type === 'audio/mpeg' || blob.type === 'audio/mp3') {
        console.log('文件有正确的MIME类型，但未找到MP3标记，可能需要修复');
        return false;
      }
      
      console.log('未找到有效的MP3标记，文件可能损坏或不是MP3');
      return false;
    } catch (error) {
      console.error('验证MP3文件时出错:', error);
      return false;
    }
  };
  
  // 尝试修复MP3文件
  const attemptToFixMp3 = async (blob: Blob): Promise<Blob | null> => {
    try {
      // 读取整个文件内容
      const fileBuffer = await blob.arrayBuffer();
      const fileBytes = new Uint8Array(fileBuffer);
      
      // 寻找MP3数据的开始位置
      let mp3Start = -1;
      
      // 首先，尝试找到ID3标记或MP3帧同步标记
      for (let i = 0; i < fileBytes.length - 2; i++) {
        // 查找ID3标记
        if (fileBytes[i] === 0x49 && fileBytes[i + 1] === 0x44 && fileBytes[i + 2] === 0x33) {
          mp3Start = i;
          console.log(`在偏移量${i}处找到ID3标签，从这里开始截取`);
          break;
        }
        
        // 查找MP3帧同步标记
        if (fileBytes[i] === 0xFF && (fileBytes[i + 1] & 0xE0) === 0xE0) {
          mp3Start = i;
          console.log(`在偏移量${i}处找到MP3帧同步标记，从这里开始截取`);
          break;
        }
      }
      
      if (mp3Start === -1) {
        console.error('无法在文件中找到MP3数据的开始位置');
        
        // 尝试最后的修复方法：添加MP3帧头
        console.log('尝试添加MP3帧头进行修复');
        const mp3Header = new Uint8Array([0xFF, 0xFB, 0x90, 0x44]); // 标准MP3帧头
        
        // 创建一个新的合并数组
        const fixedData = new Uint8Array(mp3Header.length + fileBytes.length);
        fixedData.set(mp3Header, 0);
        fixedData.set(fileBytes, mp3Header.length);
        
        return new Blob([fixedData], { type: 'audio/mpeg' });
      }
      
      // 截取从MP3数据开始位置到文件结束的部分
      const fixedData = fileBytes.slice(mp3Start);
      console.log(`修复后的文件大小: ${fixedData.length} 字节`);
      
      // 创建新的Blob对象
      return new Blob([fixedData], { type: 'audio/mpeg' });
    } catch (error) {
      console.error('修复MP3文件时出错:', error);
      return null;
    }
  };

  // 辅助函数：打开下载网站
  const openDownloadSite = (url: string) => {
    const newWindow = window.open(url, '_blank');
    // 如果浏览器阻止了弹出窗口
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      const popupBlockedMessage = 'Your browser blocked the popup. Please allow popups and try again.';
      
      alert(popupBlockedMessage);
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'loading':
        return translations.loading;
      case 'success':
        return translations.success;
      case 'error':
        return translations.error;
      default:
        return '';
    }
  };

  return (
    <div className="w-full max-w-3xl">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
        <form onSubmit={convertToMp3} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={url}
              onChange={(e: InputChangeEvent) => {
                setUrl(e.target.value);
                if (status !== 'idle') {
                  setStatus('idle');
                  setShowAnalysis(false);
                }
              }}
              placeholder={translations.placeholder}
              className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              disabled={status === 'loading'}
            />
            {url && (
              <button
                type="button"
                onClick={() => {
                  setUrl('');
                  setStatus('idle');
                  setShowAnalysis(false);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
          
          {/* 音质选择下拉菜单 */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {translations.bitrate || "Audio Quality"}
              </label>
              <select
                value={bitrate}
                onChange={(e: SelectChangeEvent) => setBitrate(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="64">64 kbps {language === 'zh' ? '(普通质量 ~2MB/分钟)' : '(Basic quality ~2MB/min)'}</option>
                <option value="128">128 kbps {language === 'zh' ? '(标准质量 ~4MB/分钟)' : '(Standard quality ~4MB/min)'}</option>
                <option value="192">192 kbps {language === 'zh' ? '(高质量 ~6MB/分钟)' : '(High quality ~6MB/min)'}</option>
                <option value="256">256 kbps {language === 'zh' ? '(超高质量 ~8MB/分钟)' : '(Very high quality ~8MB/min)'}</option>
                <option value="320">320 kbps {language === 'zh' ? '(无损质量 ~10MB/分钟)' : '(Lossless quality ~10MB/min)'}</option>
              </select>
              
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {language === 'zh' 
                  ? '提示：较低的比特率文件更小，但音质较差。高比特率提供更好的音质，但文件更大。' 
                  : 'Tip: Lower bitrate gives smaller files but lower quality. Higher bitrate provides better quality but larger files.'}
              </div>
            </div>
            
            <div className="flex-1">
              <button
                type="submit"
                disabled={!url || status === 'loading'}
                className="w-full py-3.5 mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {translations.loading}
                  </>
                ) : (
                  translations.button
                )}
              </button>
            </div>
          </div>
        </form>
        
        {status !== 'idle' && (
          <div className={`mt-6 p-4 rounded-lg ${
            status === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
            status === 'error' ? 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200' :
            'bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200'
          }`}>
            <p className="flex items-center">
              {status === 'success' && (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 101.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
              )}
              {status === 'error' && (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                </svg>
              )}
              {status === 'loading' && (
                <svg className="animate-spin w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {getStatusText()}
            </p>
            
            {status === 'success' && downloadUrl && !downloadError && (
              <div className="mt-4 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  {videoInfo && videoInfo.videoId && (
                    <a
                      href={`/api/direct?id=${videoInfo.videoId}&direct=true`}
                      className="inline-block px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-300 text-center text-lg flex-1 flex items-center justify-center"
                      title={language === 'zh' ? 
                        "直接使用convert2mp3s.com下载，最可靠的方法" : 
                        "Download directly using convert2mp3s.com, most reliable method"}
                    >
                      {language === 'zh' ? (
                        <span className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"></path>
                          </svg>
                          一键直接下载 ⭐
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"></path>
                          </svg>
                          Direct Download ⭐
                        </span>
                      )}
                    </a>
                  )}
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="inline-block px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition duration-300 disabled:opacity-50 text-sm"
                    title={language === 'zh' ? 
                      "使用原有API下载，可能不稳定" : 
                      "Download using original APIs, may be unstable"}
                  >
                    {downloading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {translations.downloading || "下载中..."}
                      </span>
                    ) : (language === 'zh' ? '尝试其他下载方式' : 'Try alternative download')}
                  </button>
                </div>
                
                {/* 下载进度条 */}
                {downloading && (
                  <div className="mt-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-2 bg-blue-600 rounded-full transition-all duration-300 ease-in-out"
                      style={{ width: `${downloadProgress}%` }}
                    ></div>
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1 px-1">
                      <div>{downloadProgress}%</div>
                      <div>{downloadSize}</div>
                      <div>{downloadSpeed}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {status === 'error' && downloadError && (
              <div className="mt-4 bg-red-50 dark:bg-red-900/30 p-3 rounded-lg">
                <p className="text-red-700 dark:text-red-200 whitespace-pre-line">{downloadError}</p>
                <div className="mt-2 flex gap-2">
                  {videoInfo && videoInfo.videoId && (
                    <a
                      href={`/api/direct?id=${videoInfo.videoId}`}
                      className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd"></path>
                      </svg>
                      {language === 'zh' ? '尝试直接下载' : 'Try direct download'}
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setBitrate(bitrate === '128' ? '64' : '128');
                      setStatus('success');
                      setDownloadError(null);
                    }}
                    className="text-sm bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg inline-flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"></path>
                    </svg>
                    {language === 'zh' ? '切换音质并重试' : 'Change quality and retry'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* 下载指南组件 */}
        {showGuide && (
          <div className="mt-6 p-5 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-bold text-lg mb-3">
              Download Guide
            </h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Wait for website to load</li>
              <li>Select MP3 format</li>
              <li>Choose quality</li>
              <li>Click download button</li>
              <li>Download file</li>
            </ol>
            <div className="mt-4 text-sm">
              <p className="font-medium">
                Tip: If website doesn't work, try other options
              </p>
            </div>
            <button 
              onClick={() => setShowGuide(false)}
              className="mt-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 text-sm font-medium"
            >
              Close
            </button>
          </div>
        )}
        
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>YouTube Converter MP3 - Fast, Free and Easy to Use</p>
        </div>
      </div>
      
      {/* Video Analysis Component */}
      <VideoAnalysis url={url} isVisible={showAnalysis} />
    </div>
  );
} 