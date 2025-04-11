'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import enTranslations from '../locales/en.json';

type LanguageContextType = {
  translations: any;
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