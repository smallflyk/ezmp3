import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// 帮助信息
const SERVICES = [
  { name: 'Convert2mp3s', url: 'https://convert2mp3s.com/youtube/mp3?url=https://www.youtube.com/watch?v=' },
  { name: 'Y2mate', url: 'https://www.y2mate.com/youtube-mp3/' },
  { name: 'Vevioz', url: 'https://vevioz.com/watch?v=' },
  { name: 'Yt5s.io', url: 'https://yt5s.io/zh-cn/youtube-to-mp3?q=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D' },
  { name: 'MP3Download', url: 'https://mp3download.to/watch?v=' }
];

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get('id');
  const serviceName = request.nextUrl.searchParams.get('service') || 'convert2mp3s';
  
  if (!videoId) {
    return new Response(JSON.stringify({ 
      error: '缺少视频ID',
      services: SERVICES.map(s => s.name) 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // 找到匹配的服务
  const service = SERVICES.find(s => s.name.toLowerCase() === serviceName.toLowerCase()) || SERVICES[0];
  
  // 构建重定向链接
  const redirectUrl = `${service.url}${videoId}`;
  
  console.log(`备用下载API重定向到: ${redirectUrl}`);
  
  // 重定向到选定的服务
  return Response.redirect(redirectUrl);
} 