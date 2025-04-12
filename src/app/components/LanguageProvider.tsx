'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import enTranslations from '../locales/en.json';

interface Translation {
  hero: {
    title: string;
    subtitle: string;
    cta: string;
  };
  features: {
    title: string;
    feature1: {
      title: string;
      description: string;
    };
    feature2: {
      title: string;
      description: string;
    };
    feature3: {
      title: string;
      description: string;
    };
    feature4: {
      title: string;
      description: string;
    };
    feature5: {
      title: string;
      description: string;
    };
    feature6: {
      title: string;
      description: string;
    };
  };
  howto: {
    title: string;
    step1: {
      title: string;
      description: string;
    };
    step2: {
      title: string;
      description: string;
    };
    step3: {
      title: string;
      description: string;
    };
  };
  converter: {
    placeholder: string;
    button: string;
    loading: string;
    success: string;
    error: string;
  };
  faq: {
    title: string;
    q1: string;
    a1: string;
    q2: string;
    a2: string;
    q3: string;
    a3: string;
    q4: string;
    a4: string;
    q5: string;
    a5: string;
    q6: string;
    a6: string;
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

const defaultLanguageContext: LanguageContextType = {
  language: 'zh',
  setLanguage: () => {},
  translations: enTranslations,
};

const LanguageContext = createContext<LanguageContextType>(defaultLanguageContext);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<string>('zh');
  // 使用条件运算符判断语言，但始终返回 enTranslations
  const translations = enTranslations;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translations }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
} 