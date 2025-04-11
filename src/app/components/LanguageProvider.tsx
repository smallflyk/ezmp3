'use client';

import { createContext, useContext, ReactNode } from 'react';
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

type LanguageContextType = {
  translations: Translation;
};

const defaultLanguageContext: LanguageContextType = {
  translations: enTranslations,
};

const LanguageContext = createContext<LanguageContextType>(defaultLanguageContext);

export const useLanguage = () => useContext(LanguageContext);

type LanguageProviderProps = {
  children: ReactNode;
};

export default function LanguageProvider({ children }: LanguageProviderProps) {
  // 只使用英文翻译
  const translations = enTranslations;

  return (
    <LanguageContext.Provider
      value={{
        translations,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
} 