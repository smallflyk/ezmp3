'use client';

import { useLanguage } from '../hooks/useLanguage';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
      className="px-2 py-1 border rounded-md"
    >
      <option value="zh">中文</option>
      <option value="en">English</option>
    </select>
  );
} 