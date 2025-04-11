'use client';

import { useLanguage } from './components/LanguageProvider';
import Header from './components/Header';
import Footer from './components/Footer';
import YoutubeConverter from './components/YoutubeConverter';
import Image from 'next/image';

export default function Home() {
  const { translations } = useLanguage();
  const { hero, features, howto, converter, faq } = translations;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
              <div className="w-full md:w-1/2">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight">
                  {hero.title}
                </h1>
                <p className="mt-4 text-lg md:text-xl text-gray-600 dark:text-gray-300">
                  {hero.subtitle}
                </p>
                <div className="mt-8">
                  <a href="#converter" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300">
                    {hero.cta}
                  </a>
                </div>
              </div>
              <div className="w-full md:w-1/2 mt-8 md:mt-0">
                <div className="relative h-64 md:h-80 lg:h-96 w-full">
                  <Image
                    src="/images/youtube-mp3-hero.svg" 
                    alt="YouTube to MP3 Converter" 
                    className="object-contain"
                    fill
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Converter Section */}
        <section id="converter" className="py-16 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                YouTube Converter MP3
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Convert any YouTube video to high-quality MP3 format in just a few seconds. Simply paste the YouTube URL below and click convert.
              </p>
            </div>
            
            <div className="flex justify-center">
              <YoutubeConverter translations={converter} />
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section id="features" className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                {features.title}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition duration-300 hover:shadow-lg">
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {features.feature1.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {features.feature1.description}
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition duration-300 hover:shadow-lg">
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {features.feature2.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {features.feature2.description}
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition duration-300 hover:shadow-lg">
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {features.feature3.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {features.feature3.description}
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition duration-300 hover:shadow-lg">
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {features.feature4.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {features.feature4.description}
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition duration-300 hover:shadow-lg">
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {features.feature5.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {features.feature5.description}
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition duration-300 hover:shadow-lg">
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {features.feature6.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {features.feature6.description}
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* How to Use Section */}
        <section id="how-to" className="py-16 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                {howto.title}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl">
                  1
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 pt-16 transition duration-300 hover:shadow-lg text-center">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {howto.step1.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {howto.step1.description}
                  </p>
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl">
                  2
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 pt-16 transition duration-300 hover:shadow-lg text-center">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {howto.step2.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {howto.step2.description}
                  </p>
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl">
                  3
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 pt-16 transition duration-300 hover:shadow-lg text-center">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {howto.step3.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {howto.step3.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* FAQ Section */}
        <section id="faq" className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                {faq.title}
              </h2>
            </div>
            
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {faq.q1}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {faq.a1}
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {faq.q2}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {faq.a2}
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {faq.q3}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {faq.a3}
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {faq.q4}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {faq.a4}
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {faq.q5}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {faq.a5}
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {faq.q6}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {faq.a6}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
