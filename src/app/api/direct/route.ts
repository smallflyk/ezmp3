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
  
  // 提供直接下载链接
  const downloadLink = `https://convert2mp3s.com/api/single/mp3/${videoId}`;
  
  // 重定向到直接下载链接
  return Response.redirect(downloadLink);
}