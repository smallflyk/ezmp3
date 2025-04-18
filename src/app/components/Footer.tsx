'use client';

import Link from 'next/link';
import { useLanguage } from '../hooks/useLanguage';

export default function Footer() {
  const { language } = useLanguage();
  
  return (
    <footer className="bg-gray-100 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link href="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">
              EZ MP3
            </Link>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {language === 'zh' 
                ? '© 2024 EZ MP3 转换器。保留所有权利。' 
                : '© 2024 EZ MP3 Converter. All rights reserved.'}
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            <Link href="/terms" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm">
              {language === 'zh' ? '服务条款' : 'Terms of Service'}
            </Link>
            <Link href="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm">
              {language === 'zh' ? '隐私政策' : 'Privacy Policy'}
            </Link>
            <Link href="/contact" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm">
              {language === 'zh' ? '联系我们' : 'Contact Us'}
            </Link>
          </div>
        </div>
        
        <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-8">
          <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
            <p>YouTube Converter MP3 | YouTube to MP3 | MP3 Converter | YouTube Audio Downloader</p>
            <p className="mt-2">
              {language === 'zh' 
                ? '快速、免费且易于使用的YouTube到MP3转换器，满足您所有的音频需求。' 
                : 'Fast, free and easy to use YouTube to MP3 converter for all your audio needs.'}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
} 