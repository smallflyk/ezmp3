import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
// 增加超时时间
export const maxDuration = 60; // 60秒超时

// 辅助函数：获取第三方API内容，带重试功能
async function fetchWithRetry(url: string, options: any, maxRetries = 3) {
  let retries = 0;
  let lastError;
  
  while (retries < maxRetries) {
    try {
      const response = await fetch(url, options);
      
      // 如果成功，直接返回响应
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

    console.log(`使用y2mate.cc下载视频 ${videoId}`);

    // 尝试多个Y2mate服务
    const y2mateServices = [
      { name: 'y2mate.cc', analyzeURL: 'https://y2mate.cc/mates/en/analyze/ajax', convertURL: 'https://y2mate.cc/mates/convert' },
      { name: 'y2mate.tools', analyzeURL: 'https://www.y2mate.tools/mates/en/analyze/ajax', convertURL: 'https://www.y2mate.tools/mates/convert' },
      { name: 'y2mate.guru', analyzeURL: 'https://y2mate.guru/mates/en/analyze/ajax', convertURL: 'https://y2mate.guru/mates/convert' }
    ];
    
    // 找到可用的服务
    let service = null;
    let analyzeResult = null;
    
    for (const srv of y2mateServices) {
      try {
        console.log(`尝试使用 ${srv.name} 服务...`);
        
        // 第一步：分析视频
        const analyzeData = {
          url: `https://www.youtube.com/watch?v=${videoId}`,
          q_auto: '1',
          ajax: '1'
        };
        
        const analyzeResponse = await fetchWithRetry(srv.analyzeURL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Origin': `https://${srv.name}`,
            'Referer': `https://${srv.name}/`
          },
          body: new URLSearchParams(analyzeData)
        }, 2);

        if (!analyzeResponse.ok) {
          console.log(`${srv.name} 分析失败: ${analyzeResponse.status}`);
          continue;
        }

        try {
          analyzeResult = await analyzeResponse.json();
          
          if (analyzeResult.result) {
            service = srv;
            console.log(`使用 ${srv.name} 服务成功`);
            break;
          }
        } catch (parseError) {
          console.error(`${srv.name} 解析分析结果失败:`, parseError);
        }
      } catch (serviceError) {
        console.error(`${srv.name} 服务尝试失败:`, serviceError);
      }
    }
    
    if (!service || !analyzeResult) {
      throw new Error('所有Y2mate服务都不可用');
    }
    
    // 从分析结果中提取MP3下载ID和标题
    // 从HTML中提取标题
    const titleMatch = analyzeResult.result.match(/<div class="caption text-left">([^<]+)<\/div>/);
    const title = titleMatch ? titleMatch[1].trim() : `YouTube 视频 ${videoId}`;
    
    // 在结果中查找MP3下载选项和ID
    // 尝试多种正则表达式模式来适应可能的页面结构变化
    let downloadId = null;
    const mp3QualityValue = bitrate === '320' ? 'mp3128' : 'mp3128'; // y2mate 通常只提供128kbps
    
    // 模式1: 标准模式
    const pattern1 = new RegExp(`data-id="([^"]+)"[^>]*data-type="${mp3QualityValue}"`);
    const match1 = analyzeResult.result.match(pattern1);
    if (match1 && match1[1]) {
      downloadId = match1[1];
    }
    
    // 模式2: 简化模式
    if (!downloadId) {
      const pattern2 = /data-id="([^"]+)"/;
      const match2 = analyzeResult.result.match(pattern2);
      if (match2 && match2[1]) {
        downloadId = match2[1];
      }
    }
    
    // 模式3: 属性顺序可能改变
    if (!downloadId) {
      const pattern3 = new RegExp(`data-type="${mp3QualityValue}"[^>]*data-id="([^"]+)"`);
      const match3 = analyzeResult.result.match(pattern3);
      if (match3 && match3[1]) {
        downloadId = match3[1];
      }
    }
    
    // 模式4: 查找任何MP3类型
    if (!downloadId) {
      const pattern4 = /data-id="([^"]+)"[^>]*data-type="(mp3[^"]*)"/;
      const match4 = analyzeResult.result.match(pattern4);
      if (match4 && match4[1]) {
        downloadId = match4[1];
      }
    }
    
    // 模式5: 新增 - 查找基于类名的模式
    if (!downloadId) {
      const pattern5 = /class="btn btn-success"[^>]*data-id="([^"]+)"/;
      const match5 = analyzeResult.result.match(pattern5);
      if (match5 && match5[1]) {
        downloadId = match5[1];
      }
    }
    
    // 模式6: 新增 - 基于特定MP3容器的模式
    if (!downloadId) {
      const pattern6 = /<div[^>]*class="[^"]*mp3[^"]*"[^>]*>[^<]*<button[^>]*data-id="([^"]+)"/;
      const match6 = analyzeResult.result.match(pattern6);
      if (match6 && match6[1]) {
        downloadId = match6[1];
      }
    }
    
    // 模式7: 新增 - 搜索任何包含mp3的按钮
    if (!downloadId) {
      const pattern7 = /<button[^>]*data-id="([^"]+)"[^>]*>[^<]*mp3/i;
      const match7 = analyzeResult.result.match(pattern7);
      if (match7 && match7[1]) {
        downloadId = match7[1];
      }
    }
    
    // 模式8: 新增 - 提取data-id后的任何值
    if (!downloadId) {
      const pattern8 = /data-id="([a-zA-Z0-9_-]+)"/;
      const match8 = analyzeResult.result.match(pattern8);
      if (match8 && match8[1]) {
        downloadId = match8[1];
      }
    }
    
    if (!downloadId) {
      console.error('无法找到MP3下载ID，HTML结构可能已变化:', analyzeResult.result);
      throw new Error('无法找到MP3下载ID');
    }
    
    console.log(`找到MP3下载ID: ${downloadId}, 标题: ${title}`);
    
    // 第二步：获取转换链接
    const convertData = {
      type: 'youtube',
      _id: downloadId,
      v_id: videoId,
      ajax: '1',
      token: '',
      ftype: 'mp3',
      fquality: '128'
    };
    
    const convertResponse = await fetchWithRetry(service.convertURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Origin': `https://${service.name}`,
        'Referer': `https://${service.name}/`
      },
      body: new URLSearchParams(convertData)
    }, 3);

    if (!convertResponse.ok) {
      console.error(`获取转换链接失败: ${convertResponse.status}`);
      throw new Error(`获取转换链接失败: ${convertResponse.status}`);
    }

    let convertResult;
    try {
      convertResult = await convertResponse.json();
      console.log('转换结果:', convertResult);
    } catch (error) {
      console.error('解析转换结果失败:', error);
      throw new Error('解析转换结果失败');
    }

    if (!convertResult.result) {
      throw new Error('获取转换链接返回无效数据');
    }
    
    // 从HTML中提取下载链接
    const downloadLinkMatch = convertResult.result.match(/href="([^"]+)"/);
    if (!downloadLinkMatch || !downloadLinkMatch[1]) {
      throw new Error('无法提取下载链接');
    }
    
    const downloadLink = downloadLinkMatch[1];
    console.log(`提取到的下载链接: ${downloadLink}`);
    
    // 如果是重定向到第三方网站，返回错误
    if (downloadLink.includes('redirect') || !downloadLink.includes('.mp3')) {
      return new Response(JSON.stringify({ 
        error: '仅获取到重定向链接，无法直接下载',
        externalLink: downloadLink 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 尝试下载MP3文件
    console.log(`尝试下载MP3: ${downloadLink}`);
    try {
      const mp3Response = await fetchWithRetry(downloadLink, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': `https://${service.name}/`
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
        externalLink: downloadLink 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Y2Mate下载失败:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    
    // 确保videoId在此作用域可用
    const extractedVideoId = url ? 
      url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/)?.[1] : 
      null;
    
    // 只有在有效的videoId时才尝试后备方法
    if (extractedVideoId) {
      // 尝试yt-download.cc作为后备
      try {
        const backupURL = `https://yt-download.cc/api/button/mp3/${extractedVideoId}`;
        
        const backupResponse = await fetchWithRetry(backupURL, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        }, 2);
        
        if (backupResponse.ok) {
          const backupData = await backupResponse.text();
          const directLinkMatch = backupData.match(/href="(https:\/\/[^"]+\.mp3[^"]*)"/);
          
          if (directLinkMatch && directLinkMatch[1]) {
            const directLink = directLinkMatch[1];
            
            return new Response(JSON.stringify({ 
              message: 'Y2Mate失败，提供备用下载链接',
              externalLink: directLink 
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
      } catch (backupError) {
        console.error('备用下载方法也失败:', backupError);
      }
      
      return new Response(JSON.stringify({ 
        error: `下载失败: ${errorMessage}`,
        externalLink: `https://www.y2mate.com/youtube-mp3/${extractedVideoId}`
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // 没有有效的videoId
      return new Response(JSON.stringify({ 
        error: `下载失败: ${errorMessage}` 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
} 