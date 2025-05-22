import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LanguageProvider from "./hooks/useLanguage";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EZ MP3 - Best YouTube to MP3 Converter | Download YouTube Videos as MP3",
  description: "Convert YouTube videos to MP3 format easily with EZ MP3. Fast, free, and high-quality YouTube to MP3 converter. No registration required.",
  keywords: "youtube converter mp3, youtube to mp3, convert youtube to mp3, youtube mp3 downloader, mp3 converter, youtube audio downloader",
  authors: [{ name: "EZ MP3 Team" }],
  openGraph: {
    title: "EZ MP3 - Best YouTube to MP3 Converter",
    description: "Convert YouTube videos to MP3 format easily. Fast, free, and high-quality YouTube to MP3 converter. No registration required.",
    url: "https://www.ezmp3.art",
    siteName: "EZ MP3",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EZ MP3 - Best YouTube to MP3 Converter",
    description: "Convert YouTube videos to MP3 format easily. Fast, free, and high-quality YouTube to MP3 converter.",
  },
  alternates: {
    canonical: "https://www.ezmp3.art",
  },
  metadataBase: new URL("https://www.ezmp3.art"),
};

// 添加Google Analytics标签
export const GA_TRACKING_ID = 'G-L0FHTB5RRW';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* 在head中手动添加额外内容 */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
