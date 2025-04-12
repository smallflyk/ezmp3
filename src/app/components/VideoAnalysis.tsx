'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from './LanguageProvider';

type VideoAnalysisProps = {
  url: string;
  isVisible: boolean;
};

type AnalysisResult = {
  videoId: string;
  title: string;
  analysis: string;
  metadata: {
    duration: number;
    uploadDate: string;
    categories: string[];
    tags: string[];
  };
};

export default function VideoAnalysis({ url, isVisible }: VideoAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const { language } = useLanguage();

  const fetchAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/analyze?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }
      
      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (isVisible && url) {
      fetchAnalysis();
    }
  }, [isVisible, url, fetchAnalysis]);

  if (!isVisible) return null;
  
  if (loading) {
    return <div className="text-center py-4">{language === 'zh' ? '正在分析...' : 'Analyzing...'}</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">{error}</div>;
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all duration-300">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        {language === 'zh' ? '视频分析' : 'Video Analysis'}
      </h3>
      
      <div className="space-y-4">
        <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="font-medium text-lg text-gray-900 dark:text-white">{analysis.title}</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Video ID: {analysis.videoId} • Duration: {formatDuration(analysis.metadata.duration)} • Upload Date: {formatDate(analysis.metadata.uploadDate)}
          </p>
        </div>
        
        <div className="prose dark:prose-invert max-w-none">
          <div className="whitespace-pre-line text-gray-700 dark:text-gray-300">
            {analysis.analysis}
          </div>
        </div>
        
        {analysis.metadata.categories.length > 0 && (
          <div className="pt-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Categories:</p>
            <div className="flex flex-wrap gap-2">
              {analysis.metadata.categories.map((category, index) => (
                <span 
                  key={index} 
                  className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {analysis.metadata.tags.length > 0 && (
          <div className="pt-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags:</p>
            <div className="flex flex-wrap gap-2">
              {analysis.metadata.tags.slice(0, 10).map((tag, index) => (
                <span 
                  key={index} 
                  className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                >
                  {tag}
                </span>
              ))}
              {analysis.metadata.tags.length > 10 && (
                <span className="text-xs text-gray-500 dark:text-gray-400 self-center">
                  +{analysis.metadata.tags.length - 10} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Format video duration
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

// Format date
function formatDate(dateStr: string): string {
  if (!dateStr || dateStr.length !== 8) return dateStr;
  
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  
  return `${year}-${month}-${day}`;
} 