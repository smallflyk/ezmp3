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

export default function YoutubeConverter({ translations }: ConverterProps) {
  const [url, setUrl] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [downloadUrl, setDownloadUrl] = React.useState('');
  const [showAnalysis, setShowAnalysis] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);
  const [downloadError, setDownloadError] = React.useState<string | null>(null);
  const [bitrate, setBitrate] = React.useState<string>('128');
  const [showGuide, setShowGuide] = React.useState(false);
  const { language } = useLanguage();
  
  const isValidYoutubeUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    return youtubeRegex.test(url);
  };

  const convertToMp3 = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidYoutubeUrl(url)) {
      alert('Please enter a valid YouTube URL');
      return;
    }
    
    setStatus('loading');
    
    try {
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
    if (!url || downloading) return;
    
    try {
      setDownloading(true);
      setStatus('loading');
      setDownloadError(null);
      
      const extractedVideoId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/)?.[1];
      if (!extractedVideoId) {
        throw new Error('Could not extract video ID');
      }
      
      // Get download options
      const response = await fetch(`/api/download?url=${encodeURIComponent(url)}&bitrate=${bitrate}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Download failed');
      }
      
      if (data.success) {
        setStatus('loading');
        
        // Open Y2mate in a new tab for reliable conversion and download
        const downloadApiUrl = `/api/v1/stream-mp3?url=${encodeURIComponent(url)}`;
        window.open(downloadApiUrl, '_blank');
        
        // Show download guide
        setShowGuide(true);
        
        // Notify user with clear instructions
        alert('We have opened Y2mate in a new tab to process your download. Please follow the instructions in the new tab to download a properly formatted MP3 file.');
        
        setStatus('success');
      } else {
        throw new Error('Conversion failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      setStatus('error');
      setDownloadError(
        `Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setDownloading(false);
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
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="mt-4 inline-block px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition duration-300 disabled:opacity-50"
              >
                {downloading ? (translations.downloading || "Downloading...") : (translations.download || "Download MP3")}
              </button>
            )}
            
            {downloadError && (
              <p className="mt-2 text-red-500">{downloadError}</p>
            )}
          </div>
        )}
        
        {/* Download Guide Component */}
        {showGuide && (
          <div className="mt-6 p-5 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-bold text-lg mb-3">
              Y2mate Download Guide
            </h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Wait for Y2mate to load in the new tab</li>
              <li>Y2mate will automatically detect the YouTube video</li>
              <li>Select <strong>Audio (MP3)</strong> format from the options</li>
              <li>Choose your preferred quality (128kbps is recommended)</li>
              <li>Click the <strong>Download</strong> button</li>
              <li>Wait for the conversion to complete</li>
              <li>Your MP3 file will download automatically</li>
            </ol>
            <div className="mt-4 text-sm bg-yellow-50 p-3 rounded-md border border-yellow-200">
              <p className="font-medium mb-1">
                Important Notes:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Y2mate provides properly formatted MP3 files that work with all media players</li>
                <li>If you see ads or popups, you can safely close them</li>
                <li>Some browsers may block popups - please allow popups for the download site</li>
                <li>The download process takes about 30-60 seconds depending on the video length</li>
              </ul>
            </div>
            <button 
              onClick={() => setShowGuide(false)}
              className="mt-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 text-sm font-medium"
            >
              Close Guide
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