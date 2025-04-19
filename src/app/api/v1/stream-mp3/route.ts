import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// YouTube URL validation regex
const youtubeUrlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[\?&].+)?$/;

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');
    const bitrate = request.nextUrl.searchParams.get('bitrate') || '128';
    
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
    
    // 检查RapidAPI密钥
    let rapidApiKey = process.env.RAPIDAPI_KEY;
    // 如果环境变量中没有配置，使用提供的备选密钥
    if (!rapidApiKey) {
      console.warn('环境变量中未找到RapidAPI密钥，使用备用密钥');
      rapidApiKey = '511c5bcf88msh9c41cd1a0f30623p10a3d0jsn95e8806e2d45';
    }
    
    // 首先尝试使用新的youtube-to-mp315 API
    try {
      // 设置API请求选项
      const options = {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'youtube-to-mp315.p.rapidapi.com'
        }
      };
      
      // 首先获取转换状态
      const statusApiUrl = `https://youtube-to-mp315.p.rapidapi.com/status/${videoId}`;
      
      console.log('Checking conversion status...');
      const statusResponse = await fetch(statusApiUrl, options);
      let statusData = await statusResponse.json();
      
      console.log('Status response:', statusData);
      
      if (statusData.status === 'running' || statusData.status === 'pending') {
        // 转换正在进行中，需要等待一段时间
        console.log('Conversion in progress, waiting...');
        
        // 等待最多30秒
        let retries = 0;
        let conversionComplete = false;
        let finalStatusData = null;
        
        while (!conversionComplete && retries < 6) {
          // 暂停5秒
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // 再次检查状态
          const retryResponse = await fetch(statusApiUrl, options);
          finalStatusData = await retryResponse.json();
          
          if (finalStatusData.status === 'completed') {
            conversionComplete = true;
          }
          
          retries++;
        }
        
        if (!conversionComplete) {
          throw new Error('转换超时，请稍后再试');
        }
        
        statusData = finalStatusData;
      }
      
      // 转换已完成，获取下载链接
      if (statusData.status === 'completed' && statusData.url) {
        // 设置文件名
        const filename = statusData.title ? 
          `${statusData.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')}.mp3` : 
          `youtube-${videoId}.mp3`;
        
        // 获取MP3文件
        console.log('Downloading MP3 from:', statusData.url);
        
        try {
          // 添加验证步骤，确保我们获取的是有效的MP3数据
          const headResponse = await fetch(statusData.url, { method: 'HEAD' });
          
          // 检查内容类型，确保是音频
          const contentType = headResponse.headers.get('Content-Type');
          console.log('Content type:', contentType);
          
          // 如果不是音频类型，尝试直接访问URL看看是否重定向
          if (!contentType || !(contentType.includes('audio') || contentType.includes('octet-stream'))) {
            console.warn('警告: 目标资源可能不是直接的音频文件');
          }
          
          // 设置适当的请求选项以绕过可能的问题
          const mp3Response = await fetch(statusData.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': '*/*',
              'Accept-Encoding': 'identity;q=1, *;q=0',  // 请求未压缩的响应
              'Range': 'bytes=0-'  // 请求完整文件
            }
          });
          
          if (!mp3Response.ok) {
            throw new Error(`MP3下载失败，状态码: ${mp3Response.status}`);
          }
          
          // 获取MP3流
          const mp3Stream = mp3Response.body;
          if (!mp3Stream) {
            throw new Error('无法获取MP3流');
          }
          
          // 验证是否有数据流动
          const reader = mp3Stream.getReader();
          const { value, done } = await reader.read();
          
          if (done || !value || value.length === 0) {
            throw new Error('MP3流没有数据');
          }
          
          // 检查前几个字节是否为MP3头（MP3文件通常以ID3或MPEG同步头开始）
          if (value.length >= 3) {
            // ID3标签以"ID3"开始
            const isID3 = value[0] === 73 && value[1] === 68 && value[2] === 51;
            // MPEG同步头通常以0xFF开始
            const isMPEG = value[0] === 0xFF && (value[1] & 0xE0) === 0xE0;
            
            if (!isID3 && !isMPEG) {
              console.warn('警告: 文件开头不是标准MP3头，可能不是有效的MP3文件');
            }
          }
          
          // 准备新的流，包含已读取的数据和剩余的数据
          const combinedStream = new ReadableStream({
            async start(controller) {
              // 首先加入我们已经读取的部分
              controller.enqueue(value);
              
              // 然后读取并传递剩余的流
              while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                controller.enqueue(value);
              }
              
              controller.close();
            }
          });
          
          // 直接返回MP3流，设置正确的头信息
          return new Response(combinedStream, {
            status: 200,
            headers: {
              'Content-Type': 'audio/mpeg',
              'Content-Disposition': `attachment; filename="${filename}"`,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
        } catch (streamError) {
          console.error('处理MP3流时出错:', streamError);
          
          // 如果获取流失败，尝试直接使用ytdl-core获取YouTube音频 
          return await handleFreeDownload(videoId);
        }
      }
      
      // 如果没有找到URL，则尝试启动转换过程
      if (statusData.status !== 'completed' || !statusData.url) {
        // 调用转换API启动转换
        const convertApiUrl = `https://youtube-to-mp315.p.rapidapi.com/convert/${videoId}`;
        console.log('Starting conversion via API...');
        
        const convertResponse = await fetch(convertApiUrl, options);
        const convertData = await convertResponse.json();
        
        if (convertData.status === 'running' || convertData.status === 'pending') {
          throw new Error('转换已启动，请稍后再试');
        }
        
        if (convertData.status === 'completed' && convertData.url) {
          // 设置文件名
          const filename = convertData.title ? 
            `${convertData.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')}.mp3` : 
            `youtube-${videoId}.mp3`;
          
          // 获取MP3文件
          console.log('Downloading MP3 from:', convertData.url);
          const mp3Response = await fetch(convertData.url);
          
          if (!mp3Response.ok) {
            throw new Error(`MP3下载失败，状态码: ${mp3Response.status}`);
          }
          
          // 获取MP3流
          const mp3Stream = mp3Response.body;
          if (!mp3Stream) {
            throw new Error('无法获取MP3流');
          }
          
          // 直接返回MP3流，设置正确的头信息
          return new Response(mp3Stream, {
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
        
        throw new Error('无法获取下载链接');
      }
    } 
    catch (error) {
      console.error('API调用失败，尝试备用服务:', error);
      
      // 尝试备选下载服务
      return await handleFreeDownload(videoId);
    }
  } catch (error: any) {
    console.error('Download error:', error);
    const errorMessage = error.message || 'Unknown error';
    return new Response(JSON.stringify({ error: `Download failed: ${errorMessage}` }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 添加一个新的处理函数，用于处理不需要API密钥的下载
async function handleFreeDownload(videoId: string) {
  try {
    console.log('Using free download service for video ID:', videoId);
    
    // 尝试直接使用可靠的公共API
    // 1. Y2Mate API或类似服务
    try {
      // 注意：这是一个示例URL，实际URL可能需要根据Y2Mate的最新API调整
      const apiUrl = `https://www.y2mate.com/mates/analyzeV2/ajax`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json'
        },
        body: `k_query=https://www.youtube.com/watch?v=${videoId}&k_page=home&hl=en&q_auto=1`
      });
      
      const data = await response.json();
      // 解析以获取可下载的MP3链接
      
      if (data && data.links && data.links.mp3) {
        const mp3Info = data.links.mp3;
        const bestQuality = Object.keys(mp3Info).sort((a, b) => parseInt(b) - parseInt(a))[0];
        const downloadLink = mp3Info[bestQuality].url;
        
        // 使用获取到的下载链接
        if (downloadLink) {
          const mp3Response = await fetch(downloadLink, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': '*/*',
              'Referer': 'https://www.y2mate.com/'
            }
          });
          
          if (mp3Response.ok) {
            const mp3Stream = mp3Response.body;
            if (!mp3Stream) {
              throw new Error('无法获取Y2Mate MP3流');
            }
            
            const filename = data.title ? 
              `${data.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')}.mp3` : 
              `youtube-${videoId}.mp3`;
            
            return new Response(mp3Stream, {
              status: 200,
              headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Cache-Control': 'no-cache, no-store, must-revalidate'
              }
            });
          }
        }
      }
    } catch (y2mateError) {
      console.error('Y2Mate API failed:', y2mateError);
    }
    
    // 2. 尝试替代API - Free MP3 Download API
    try {
      const apiUrl = `https://convert2mp3s.com/api/widget?url=https://www.youtube.com/watch?v=${videoId}`;
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': '*/*'
        }
      });
      
      const htmlContent = await response.text();
      // 从HTML中提取下载链接
      const downloadLinkMatch = htmlContent.match(/href="(https:\/\/convert2mp3s\.com\/api\/widgetv2\/get\/mp3\/[^"]+)"/);
      
      if (downloadLinkMatch && downloadLinkMatch[1]) {
        const downloadLink = downloadLinkMatch[1];
        const mp3Response = await fetch(downloadLink, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': '*/*',
            'Referer': 'https://convert2mp3s.com/'
          }
        });
        
        if (mp3Response.ok) {
          const mp3Stream = mp3Response.body;
          if (!mp3Stream) {
            throw new Error('无法获取Convert2MP3s MP3流');
          }
          
          // 尝试从HTML中提取标题
          const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/);
          const filename = titleMatch ? 
            `${titleMatch[1].replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')}.mp3` : 
            `youtube-${videoId}.mp3`;
          
          return new Response(mp3Stream, {
            status: 200,
            headers: {
              'Content-Type': 'audio/mpeg',
              'Content-Disposition': `attachment; filename="${filename}"`,
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
          });
        }
      }
    } catch (convert2mp3Error) {
      console.error('Convert2MP3s API failed:', convert2mp3Error);
    }
    
    // 3. 尝试 vevioz API (无需密钥的公共接口)
    try {
      const downloadUrl = `https://api.vevioz.com/api/button/mp3/${videoId}`;
      
      console.log('Attempting download from free service:', downloadUrl);
      const response = await fetch(downloadUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (response.ok) {
        const filename = `youtube-${videoId}.mp3`;
        const stream = response.body;
        
        if (!stream) {
          throw new Error('无法获取MP3流');
        }
        
        return new Response(stream, {
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
    } catch (error) {
      console.error('First free service failed:', error);
    }
    
    // 4. 如果以上都失败，使用ytmp3.cc的重定向下载
    try {
      // 提供使用ytmp3.cc的下载链接作为最后的备选
      const downloadUrl = `https://ytmp3download.cc/download/${videoId}`;
      
      // 这最后一个服务总是有效的，但是会使用重定向
      // 作为最后的备选方案，比没有下载要好
      console.log('All direct downloads failed, falling back to redirect service');
      return Response.redirect(downloadUrl, 307);
    } catch (finalError) {
      console.error('All free services failed:', finalError);
      throw new Error('所有无密钥下载方法均失败');
    }
  } catch (error: any) {
    console.error('Free download handler error:', error);
    const errorMessage = error.message || 'Unknown error';
    return new Response(JSON.stringify({ error: `Free download failed: ${errorMessage}` }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 