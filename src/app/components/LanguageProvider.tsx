'use client';

import React from 'react';
import enTranslations from '../locales/en.json';
import zhTranslations from '../locales/zh.json';

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
  translations: zhTranslations,
};

const LanguageContext = React.createContext<LanguageContextType>(defaultLanguageContext);

function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = React.useState<string>('zh');
  const [translations, setTranslations] = React.useState<Translation>(zhTranslations);

  React.useEffect(() => {
    if (language === 'en') {
      setTranslations(enTranslations);
    } else {
      setTranslations(zhTranslations);
    }
  }, [language]);

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