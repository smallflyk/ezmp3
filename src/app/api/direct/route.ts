import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get('id');
  
  if (!videoId) {
    return new Response(JSON.stringify({ error: '缺少视频ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  console.log(`直接下载API处理视频ID: ${videoId}`);
  
  // 多种直接下载链接选项
  const downloadOptions = [
    `https://convert2mp3s.com/api/single/mp3/${videoId}`,
    `https://api.vevioz.com/api/button/mp3/${videoId}`,
    `https://mp3download.to/download/${videoId}`
  ];
  
  // 默认使用第一个选项
  const downloadLink = downloadOptions[0];
  
  console.log(`重定向到: ${downloadLink}`);
  
  // 重定向到直接下载链接
  return Response.redirect(downloadLink);
}