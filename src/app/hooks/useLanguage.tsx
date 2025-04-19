'use client';

import React from 'react';
import enTranslations from '../locales/en.json';

interface Translation {
  hero: {
    title: string;
    subtitle: string;
    cta: string;
  };
  converter: {
    placeholder: string;
    button: string;
    loading: string;
    success: string;
    error: string;
    bitrate?: string;
    download?: string;
    downloading?: string;
  };
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
  footer: {
    copyright: string;
    terms: string;
    privacy: string;
    contact: string;
    language: string;
  };
}

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  translations: Translation;
}

// 设置默认语言为英文
const defaultLanguageContext: LanguageContextType = {
  language: 'en',
  setLanguage: () => {},
  translations: enTranslations,
};

const LanguageContext = React.createContext<LanguageContextType>(defaultLanguageContext);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // 固定使用英文
  const [language] = React.useState<string>('en');
  const [translations] = React.useState<Translation>(enTranslations);

  // 空函数，不做任何更改
  const setLanguage = () => {};

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translations }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = React.useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageProvider; 