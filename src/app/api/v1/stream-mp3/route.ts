import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// YouTube URL validation regex
const youtubeUrlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[\?&].+)?$/;

// RapidAPI配置
const RAPID_API_KEY = process.env.RAPID_API_KEY || '511c5bcf88msh9c41cd1a0f30623p10a3d0jsn95e8806e2d45';
const RAPID_API_HOST = 'youtube-to-mp315.p.rapidapi.com';

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

    // Validate YouTube URL format
    if (!youtubeUrlRegex.test(url)) {
      return new Response(JSON.stringify({ error: 'Invalid YouTube URL format' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Extract video ID
    const videoId = url.match(youtubeUrlRegex)?.[4];
    if (!videoId) {
      return new Response(JSON.stringify({ error: 'Could not extract video ID' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`使用youtube-to-mp315 API下载视频ID: ${videoId}`);
    
    if (!RAPID_API_KEY) {
      console.error('RapidAPI密钥未配置，尝试使用备用下载方法');
      return await handleBackupDownload(videoId);
    }
    
    // 1. 首先检查视频转换状态
    const statusUrl = `https://${RAPID_API_HOST}/status/${videoId}`;
    
    const statusResponse = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': RAPID_API_HOST,
        'x-rapidapi-key': RAPID_API_KEY
      }
    });
    
    if (!statusResponse.ok) {
      const statusCode = statusResponse.status;
      console.error(`状态检查失败: ${statusCode}`);
      
      // 检查具体错误类型以提供更好的错误信息
      if (statusCode === 401 || statusCode === 403) {
        console.error('RapidAPI认证失败，密钥可能无效');
        throw new Error('RapidAPI认证失败，请检查API密钥配置');
      } else if (statusCode === 429) {
        console.error('RapidAPI请求超限');
        throw new Error('API请求超过限制，请稍后再试');
      } else {
        throw new Error(`RapidAPI状态检查失败: ${statusCode}`);
      }
    }
    
    const statusData = await statusResponse.json();
    console.log('视频状态:', statusData);
    
    // 2. 根据状态处理
    if (statusData.status === 'completed' && statusData.url) {
      // 已转换完成，直接下载
      console.log(`视频已转换完成，下载URL: ${statusData.url}`);
      
      // 设置文件名
      const filename = statusData.title ? 
        `${statusData.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')}.mp3` : 
        `youtube-${videoId}.mp3`;
      
      try {
        // 获取MP3文件
        const mp3Response = await fetch(statusData.url);
        
        if (!mp3Response.ok) {
          throw new Error(`无法下载MP3文件: ${mp3Response.status}`);
        }
        
        // 检查内容类型
        const contentType = mp3Response.headers.get('Content-Type');
        if (contentType && !contentType.includes('audio/') && !contentType.includes('application/octet-stream')) {
          console.warn(`警告: 收到非音频内容类型: ${contentType}`);
        }
        
        // 返回MP3流
        return new Response(mp3Response.body, {
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
        console.error('从RapidAPI下载文件失败:', downloadError);
        throw new Error('下载MP3文件时出错');
      }
    } 
    else if (statusData.status === 'running' || statusData.status === 'pending') {
      // 转换正在进行中，等待一段时间并重试
      console.log('视频转换中，等待...');
      
      // 等待并重试几次
      let retries = 0;
      const maxRetries = 5;
      
      while (retries < maxRetries) {
        // 等待6秒
        await new Promise(resolve => setTimeout(resolve, 6000));
        retries++;
        
        console.log(`重试获取状态 (${retries}/${maxRetries})...`);
        
        // 重新检查状态
        const retryResponse = await fetch(statusUrl, {
          method: 'GET',
          headers: {
            'x-rapidapi-host': RAPID_API_HOST,
            'x-rapidapi-key': RAPID_API_KEY
          }
        });
        
        if (!retryResponse.ok) {
          console.warn(`重试状态检查失败: ${retryResponse.status}`);
          continue;
        }
        
        const retryData = await retryResponse.json();
        console.log(`重试状态: ${retryData.status}`);
        
        if (retryData.status === 'completed' && retryData.url) {
          // 转换已完成，下载
          console.log(`视频已转换完成，下载URL: ${retryData.url}`);
          
          // 设置文件名
          const filename = retryData.title ? 
            `${retryData.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')}.mp3` : 
            `youtube-${videoId}.mp3`;
          
          // 获取MP3文件
          const mp3Response = await fetch(retryData.url);
          
          if (!mp3Response.ok) {
            throw new Error(`无法下载MP3文件: ${mp3Response.status}`);
          }
          
          // 返回MP3流
          return new Response(mp3Response.body, {
            status: 200,
            headers: {
              'Content-Type': 'audio/mpeg',
              'Content-Disposition': `attachment; filename="${filename}"`,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
        }
      }
      
      // 如果达到最大重试次数仍未完成，尝试启动新的转换
      console.log('等待超时，尝试启动新的转换...');
    }
    
    // 3. 如果视频未转换或重试超时，启动新的转换
    console.log('开始视频转换...');
    
    const convertUrl = `https://${RAPID_API_HOST}/convert/${videoId}`;
    const convertResponse = await fetch(convertUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': RAPID_API_HOST,
        'x-rapidapi-key': RAPID_API_KEY
      }
    });
    
    if (!convertResponse.ok) {
      const convertStatusCode = convertResponse.status;
      console.error(`转换请求失败: ${convertStatusCode}`);
      
      if (convertStatusCode === 401 || convertStatusCode === 403) {
        console.error('RapidAPI认证失败');
        throw new Error('API认证失败，请检查密钥配置');
      } else if (convertStatusCode === 429) {
        console.error('RapidAPI请求超限');
        throw new Error('API请求超过限制，请稍后再试');
      } else {
        throw new Error(`转换请求失败: ${convertStatusCode}`);
      }
    }
    
    const convertData = await convertResponse.json();
    console.log('转换响应:', convertData);
    
    // 4. 如果转换立即完成
    if (convertData.status === 'completed' && convertData.url) {
      console.log(`转换立即完成，下载URL: ${convertData.url}`);
      
      // 设置文件名
      const filename = convertData.title ? 
        `${convertData.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')}.mp3` : 
        `youtube-${videoId}.mp3`;
      
      // 获取MP3文件
      const mp3Response = await fetch(convertData.url);
      
      if (!mp3Response.ok) {
        throw new Error(`无法下载MP3文件: ${mp3Response.status}`);
      }
      
      // 检查文件大小和类型
      const contentLength = mp3Response.headers.get('Content-Length');
      const contentType = mp3Response.headers.get('Content-Type');
      
      console.log(`下载文件大小: ${contentLength} 字节, 类型: ${contentType}`);
      
      // 返回MP3流
      return new Response(mp3Response.body, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }
    
    // 5. 如果转换请求已接受但仍在进行中
    if (convertData.status === 'running' || convertData.status === 'pending') {
      // 尝试短暂等待后再次检查
      console.log('转换正在进行中，短暂等待...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 再次检查状态
      const finalStatusResponse = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': RAPID_API_HOST,
          'x-rapidapi-key': RAPID_API_KEY
        }
      });
      
      if (finalStatusResponse.ok) {
        const finalStatus = await finalStatusResponse.json();
        
        if (finalStatus.status === 'completed' && finalStatus.url) {
          console.log(`最终检查：转换已完成，下载URL: ${finalStatus.url}`);
          
          // 设置文件名
          const filename = finalStatus.title ? 
            `${finalStatus.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')}.mp3` : 
            `youtube-${videoId}.mp3`;
          
          // 获取MP3文件
          const mp3Response = await fetch(finalStatus.url);
          
          if (mp3Response.ok) {
            // 返回MP3流
            return new Response(mp3Response.body, {
              status: 200,
              headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
              }
            });
          }
        }
      }
      
      // 如果最终检查还未完成，返回进行中的状态
      return new Response(JSON.stringify({
        status: 'pending',
        message: '视频转换已开始，请稍后重试下载',
        videoId: videoId
      }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 6. 如果API出现问题，尝试备用下载方法
    console.log('RapidAPI未能提供下载，尝试备用服务...');
    return await handleBackupDownload(videoId);
    
  } catch (error) {
    console.error('主要下载方法失败:', error);
    
    try {
      // 提取视频ID（如果可能）
      let videoId = null;
      if (url) {
        const match = url.match(youtubeUrlRegex);
        if (match && match[4]) {
          videoId = match[4];
        }
      }
      
      if (videoId) {
        // 尝试备用下载方法
        return await handleBackupDownload(videoId);
      } else {
        throw new Error('无法提取视频ID');
      }
    } catch (backupError) {
      console.error('备用下载也失败:', backupError);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return new Response(JSON.stringify({ error: `下载失败: ${errorMessage}` }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}

// 备用下载处理函数
async function handleBackupDownload(videoId: string) {
  console.log(`使用备用方法下载视频ID: ${videoId}`);
  
  try {
    // 使用vevioz服务
    const downloadUrl = `https://api.vevioz.com/api/button/mp3/${videoId}`;
    
    console.log(`尝试从备用服务下载: ${downloadUrl}`);
    const response = await fetch(downloadUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`备用服务下载失败: ${response.status}`);
    }
    
    // 检查是否为HTML而非MP3
    const contentType = response.headers.get('Content-Type');
    if (contentType && contentType.includes('text/html')) {
      // 解析HTML获取真实下载链接
      const htmlContent = await response.text();
      const directLinkMatch = htmlContent.match(/href="(https:\/\/[^"]+\.mp3[^"]*)"/) || 
                           htmlContent.match(/src="(https:\/\/[^"]+\.mp3[^"]*)"/);
      
      if (directLinkMatch && directLinkMatch[1]) {
        const directLink = directLinkMatch[1];
        console.log(`从HTML中提取到直接下载链接: ${directLink}`);
        
        // 获取MP3文件
        const mp3Response = await fetch(directLink);
        
        if (!mp3Response.ok) {
          throw new Error(`从提取的链接下载失败: ${mp3Response.status}`);
        }
        
        // 检查文件大小
        const contentLength = mp3Response.headers.get('Content-Length');
        if (contentLength && parseInt(contentLength) < 1000) {
          throw new Error('下载的文件太小，可能不是有效的MP3');
        }
        
        // 返回MP3流
        return new Response(mp3Response.body, {
          status: 200,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Disposition': `attachment; filename="youtube-${videoId}.mp3"`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
      } else {
        throw new Error('无法从HTML中提取下载链接');
      }
    } else {
      // 检查文件大小
      const contentLength = response.headers.get('Content-Length');
      if (contentLength && parseInt(contentLength) < 1000) {
        throw new Error('下载的文件太小，可能不是有效的MP3');
      }
      
      // 直接返回MP3流
      return new Response(response.body, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': `attachment; filename="youtube-${videoId}.mp3"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }
  } catch (error) {
    console.error('所有下载方法均失败:', error);
    
    // 返回错误或重定向到外部服务
    return new Response(JSON.stringify({ 
      error: '所有下载方法均失败，请尝试使用第三方网站',
      externalLink: `https://www.y2mate.com/youtube-mp3/${videoId}`
    }), { 
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 