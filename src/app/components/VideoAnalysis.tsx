'use client';

import { useState, useEffect } from 'react';

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

  useEffect(() => {
    if (isVisible && url) {
      fetchAnalysis();
    }
  }, [isVisible, url]);

  const fetchAnalysis = async () => {
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
  };

  if (!isVisible) return null;
  
  return (
    <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all duration-300">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Video Analysis
      </h3>
      
      {loading && (
        <div className="flex items-center justify-center p-6">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-3 text-gray-600 dark:text-gray-300">Analyzing, please wait...</span>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-4 rounded-lg">
          <p className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </p>
          <p className="mt-2 text-sm">请稍后重试或检查网络连接。如果问题持续存在，请联系支持。</p>
        </div>
      )}
      
      {analysis && !loading && !error && (
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
      )}
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