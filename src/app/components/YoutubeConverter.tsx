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

    try {
      // 首先尝试使用y2mate API直接下载（作为首选方式）
      const y2mateApiUrl = `/api/v1/y2mate-mp3?url=${encodeURIComponent(url)}&bitrate=${bitrate}`;
      const isY2mateSuccess = await downloadMp3File(y2mateApiUrl, videoInfo.videoId);
      
      if (isY2mateSuccess) {
        setStatus('success');
        return;
      }

      // 如果y2mate下载失败，尝试其他API方法
      // 按照优先级排序
      const apiUrls = [
        `/api/v1/direct-mp3?url=${encodeURIComponent(url)}&bitrate=${bitrate}`,
        `/api/v1/stream-mp3?url=${encodeURIComponent(url)}&bitrate=${bitrate}`,
        `/api/v1/mp3-backup?id=${videoInfo.videoId}&bitrate=${bitrate}`
      ];

      let downloadSuccess = false;
      for (const apiUrl of apiUrls) {
        try {
          const success = await downloadMp3File(apiUrl, videoInfo.videoId);
          if (success) {
            downloadSuccess = true;
            break;
          }
        } catch (err) {
          console.error(`API ${apiUrl} 下载失败:`, err);
          // 继续尝试下一个API
        }
      }

      if (downloadSuccess) {
        setStatus('success');
      } else {
        // 如果所有API都失败，告知用户并提供官方转换接口
        throw new Error('所有直接下载方法都失败，请尝试我们的在线转换器');
      }
    } catch (error) {
      console.error('下载错误:', error);
      setStatus('error');
      setDownloadError(
        `下载失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
      
      // 当直接下载失败时，作为后备方案使用自定义mates API
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
                  setStatus('success');
                  return;
                }
              }
            }
          }
        }
      } catch (matesError) {
        console.error('Mates API错误:', matesError);
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
      
      // 记录下载开始时间（用于计算下载速度）
      const startTime = Date.now();
      
      // 发送下载请求
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
      
      // 获取文件名，默认使用视频ID
      let filename = `youtube-${videoId}.mp3`;
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      // 获取Blob数据
      const blob = await response.blob();
      
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
    } catch (error) {
      // 确保清除超时
      clearTimeout(timeoutId);
      
      // 重新抛出错误，让调用者处理
      throw error;
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
                <option value="64">64 kbps</option>
                <option value="128">128 kbps</option>
                <option value="192">192 kbps</option>
                <option value="256">256 kbps</option>
                <option value="320">320 kbps</option>
              </select>
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
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
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
              <div className="flex flex-col gap-2">
                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition duration-300 disabled:opacity-50"
                    title={language === 'zh' ? 
                      "通过多种API尝试下载MP3文件" : 
                      "Download MP3 using multiple APIs"}
                  >
                    {downloading ? (translations.downloading || "下载中...") : (translations.download || "下载MP3")}
                  </button>
                  
                  {videoInfo && videoInfo.videoId && (
                    <a
                      href={`/api/direct?id=${videoInfo.videoId}`}
                      className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-300 text-center"
                      title={language === 'zh' ? 
                        "直接使用convert2mp3s.com下载，更可靠" : 
                        "Download directly using convert2mp3s.com, more reliable"}
                    >
                      {language === 'zh' ? '一键直接下载 ⭐' : 'Direct Download ⭐'}
                    </a>
                  )}
                </div>
                
                {downloadError && videoInfo && videoInfo.videoId && (
                  <div className="mt-2 flex flex-col sm:flex-row gap-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {language === 'zh' ? '如果上面的按钮不起作用，请尝试以下备用选项：' : 
                        'If the above buttons don\'t work, try these fallback options:'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={`/api/fallback?id=${videoInfo.videoId}&service=convert2mp3s`}
                        className="inline-block px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-lg transition duration-300 text-center"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Convert2mp3s
                      </a>
                      <a
                        href={`/api/fallback?id=${videoInfo.videoId}&service=y2mate`}
                        className="inline-block px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-lg transition duration-300 text-center"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Y2mate
                      </a>
                      <a
                        href={`/api/fallback?id=${videoInfo.videoId}&service=yt5s`}
                        className="inline-block px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-lg transition duration-300 text-center"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        YT5s
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {downloadError && (
              <p className="mt-2 text-red-500">{downloadError}</p>
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