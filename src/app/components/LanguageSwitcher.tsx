'use client';

import Image from 'next/image';

export default function LanguageSwitcher() {
  return (
    <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">
      <span className="w-5 h-5 relative">
        <Image 
          src="/images/flags/us.svg" 
          alt="English" 
          fill 
          className="object-contain"
        />
      </span>
      <span className="font-medium">English</span>
    </div>
  );
} 