import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const maxDuration = 60; // 60秒超时

// 辅助函数：带重试功能的fetch
async function fetchWithRetry(url: string, options: any, maxRetries = 3) {
  let retries = 0;
  let lastError;
  
  while (retries < maxRetries) {
    try {
      const response = await fetch(url, options);
      
      if (response.ok) {
        return response;
      }
      
      // 处理错误状态码
      if (response.status === 429) {
        // 遇到限流，等待更长时间
        const waitTime = Math.pow(2, retries) * 1000 + Math.random() * 1000;
        console.log(`遇到限流，等待 ${waitTime}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else if (response.status >= 500) {
        // 服务器错误，等待后重试
        const waitTime = Math.pow(2, retries) * 1000;
        console.log(`服务器错误 ${response.status}，等待 ${waitTime}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        // 其他错误，直接返回
        return response;
      }
    } catch (error) {
      lastError = error;
      console.error(`请求失败 (尝试 ${retries + 1}/${maxRetries}):`, error);
      
      // 等待后重试
      const waitTime = Math.pow(2, retries) * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    retries++;
  }
  
  // 所有重试都失败
  throw lastError || new Error(`请求失败，已重试 ${maxRetries} 次`);
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  const bitrate = request.nextUrl.searchParams.get('bitrate') || '128';

  try {
    if (!url) {
      return new Response(JSON.stringify({ error: 'YouTube URL is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 提取视频ID
    const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    const videoId = videoIdMatch?.[1];
    
    if (!videoId) {
      return new Response(JSON.stringify({ error: '无法提取视频ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`使用convert2mp3s.com API下载视频 ${videoId}`);

    // 尝试多个可用的转换服务
    const conversionServices = [
      { name: 'convert2mp3s.com', apiUrl: `https://convert2mp3s.com/api/widget?url=https://www.youtube.com/watch?v=${videoId}` },
      { name: 'mp3download.to', apiUrl: `https://mp3download.to/api/widget/mp3/${videoId}` },
      { name: 'api.vevioz.com', apiUrl: `https://api.vevioz.com/api/widget/mp3/${videoId}` }
    ];
    
    // 找到可用的服务
    let service = null;
    let directLink = null;
    
    for (const srv of conversionServices) {
      try {
        console.log(`尝试使用 ${srv.name} 服务...`);
        
        const response = await fetchWithRetry(srv.apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml'
          }
        }, 2);

        if (!response.ok) {
          console.log(`${srv.name} 请求失败: ${response.status}`);
          continue;
        }

        const htmlContent = await response.text();
        
        // 从HTML中提取直接下载链接
        const directLinkMatch = htmlContent.match(/href="(https:\/\/[^"]+\.mp3[^"]*)"/);
        if (directLinkMatch && directLinkMatch[1]) {
          directLink = directLinkMatch[1];
          service = srv;
          console.log(`使用 ${srv.name} 服务找到下载链接`);
          break;
        }
      } catch (serviceError) {
        console.error(`${srv.name} 服务尝试失败:`, serviceError);
      }
    }
    
    if (!service || !directLink) {
      throw new Error('无法找到合适的转换服务');
    }
    
    // 从HTML中提取标题或使用默认标题
    const title = `YouTube 视频 ${videoId}`;
    
    // 尝试直接下载MP3文件
    console.log(`尝试下载MP3: ${directLink}`);
    try {
      const mp3Response = await fetchWithRetry(directLink, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': service.apiUrl
        }
      }, 3);

      if (!mp3Response.ok) {
        throw new Error(`下载MP3失败: ${mp3Response.status}`);
      }
      
      // 检查内容类型
      const contentType = mp3Response.headers.get('Content-Type');
      if (contentType && !contentType.includes('audio/') && !contentType.includes('application/octet-stream')) {
        console.warn(`警告: 收到非音频内容类型: ${contentType}`);
      }
      
      // 获取响应体
      const responseData = await mp3Response.arrayBuffer();
      if (responseData.byteLength < 1000) {
        throw new Error('下载的文件太小，可能不是有效的MP3');
      }

      // 清理文件名，去除不合法字符
      const safeTitle = title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
      const filename = `${safeTitle}.mp3`;

      // 返回MP3流
      return new Response(responseData, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    } catch (downloadError) {
      console.error('下载MP3失败:', downloadError);
      
      // 如果直接下载失败，返回外部链接
      return new Response(JSON.stringify({ 
        error: '直接下载失败，请使用外部链接',
        externalLink: directLink 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Convert2MP3S下载失败:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    
    // 确保videoId在此作用域可用
    const extractedVideoId = url ? 
      url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/)?.[1] : 
      null;
    
    // 返回错误
    return new Response(JSON.stringify({ 
      error: `下载失败: ${errorMessage}`,
      externalLink: extractedVideoId ? 
        `https://convert2mp3s.com/api/single/mp3/${extractedVideoId}` : 
        `https://convert2mp3s.com`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 