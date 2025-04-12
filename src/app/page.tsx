'use client';

import React from 'react';
import { useLanguage } from './hooks/useLanguage';
import Header from './components/Header';
import Footer from './components/Footer';
import YoutubeConverter from './components/YoutubeConverter';

export default function Home() {
  const { language, translations } = useLanguage();
  const { hero, features, howto, converter, faq } = translations;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-10 md:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                {hero.title}
              </h1>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                {hero.subtitle}
              </p>
            </div>
          </div>
        </section>
        
        {/* Converter Section */}
        <section id="converter" className="py-8 bg-white dark:bg-gray-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center">
              <YoutubeConverter translations={converter} />
            </div>
          </div>
        </section>
        
        {/* How to Use Section - 简化版 */}
        <section id="how-to" className="py-12 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {howto.title}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 text-center">
                <div className="inline-block mb-3 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {howto.step1.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {howto.step1.description}
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 text-center">
                <div className="inline-block mb-3 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {howto.step2.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {howto.step2.description}
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 text-center">
                <div className="inline-block mb-3 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  3
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {howto.step3.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {howto.step3.description}
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* FAQ Section - 简化版 */}
        <section id="faq" className="py-12 bg-white dark:bg-gray-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {faq.title}
              </h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {faq.q1}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {faq.a1}
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {faq.q3}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {faq.a3}
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {faq.q4}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {faq.a4}
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Buy Coffee Section */}
        <section className="py-8 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {language === 'zh' 
                ? '请将ezmp3.cc加入书签，如果您喜欢我们的服务，可以请我喝杯咖啡来帮助保持网站的无广告运行。' 
                : 'Please bookmark ezmp3.cc and Buy me a Coffee to help me keep this website ad-free.'}
            </p>
            <a 
              href="https://www.buymeacoffee.com" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition duration-300"
            >
              {language === 'zh' ? '请我喝咖啡' : 'Buy me a Coffee'}
            </a>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
