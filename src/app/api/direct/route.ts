import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get('id');
  const option = request.nextUrl.searchParams.get('option') || '0';
  
  if (!videoId) {
    return new Response(JSON.stringify({ error: '缺少视频ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  console.log(`直接下载API处理视频ID: ${videoId}`);
  
  // 多种直接下载链接选项
  const downloadOptions = [
    // Convert2mp3s - 通常最可靠
    `https://convert2mp3s.com/api/single/mp3/${videoId}?t=${Date.now()}`,
    // Vevioz - 备选
    `https://api.vevioz.com/api/button/mp3/${videoId}?t=${Date.now()}`,
    // mp3download.to - 第三选择
    `https://mp3download.to/download/${videoId}?t=${Date.now()}`
  ];
  
  // 根据option参数选择或默认使用第一个选项
  const optionIndex = parseInt(option);
  const downloadLink = downloadOptions[
    !isNaN(optionIndex) && optionIndex >= 0 && optionIndex < downloadOptions.length 
      ? optionIndex 
      : 0
  ];
  
  console.log(`重定向到: ${downloadLink}`);
  
  // 检查是否请求直接处理而非重定向
  const directProcess = request.nextUrl.searchParams.get('direct') === 'true';
  
  if (directProcess) {
    try {
      // 直接获取并处理文件，而不是重定向
      console.log('直接处理模式，尝试获取MP3内容...');
      
      const response = await fetch(downloadLink, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'audio/mpeg,audio/*;q=0.9,*/*;q=0.8',
          'Referer': 'https://convert2mp3s.com/'
        }
      });
      
      if (!response.ok) {
        throw new Error(`获取MP3失败: ${response.status}`);
      }
      
      const contentType = response.headers.get('Content-Type');
      console.log(`接收到内容类型: ${contentType}`);
      
      // 获取内容并检查
      const arrayBuffer = await response.arrayBuffer();
      
      // 创建一个标准的文件名
      const filename = `youtube-${videoId}.mp3`;
      
      // 返回代理的MP3流
      return new Response(arrayBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    } catch (error) {
      console.error('直接处理失败:', error);
      // 失败时回退到重定向
    }
  }
  
  // 重定向到直接下载链接
  return Response.redirect(downloadLink);
}