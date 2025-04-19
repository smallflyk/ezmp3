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
    
    console.log(`开始为视频ID ${videoId} 转换MP3，比特率: ${bitrate}`);
    
    // 尝试使用mp3juices.cc - 一个相对可靠的服务
    try {
      // 第一步：检查是否可以获取MP3
      const scrapeUrl = `https://mp3juices.cc/search/${videoId}`;
      const scrapeResponse = await fetch(scrapeUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        }
      });
      
      if (!scrapeResponse.ok) {
        throw new Error(`无法访问MP3转换服务: ${scrapeResponse.status}`);
      }
      
      const htmlContent = await scrapeResponse.text();
      
      // 解析出下载链接 - 这里需要根据实际网页结构调整
      const downloadLinkMatch = htmlContent.match(/href="(\/download\/[^"]+)"/);
      if (!downloadLinkMatch || !downloadLinkMatch[1]) {
        throw new Error('无法在网页中找到MP3下载链接');
      }
      
      // 构建完整下载链接
      const downloadPath = downloadLinkMatch[1];
      const fullDownloadUrl = `https://mp3juices.cc${downloadPath}`;
      
      console.log(`找到MP3下载链接: ${fullDownloadUrl}`);
      
      // 获取MP3文件
      const mp3Response = await fetch(fullDownloadUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': '*/*',
          'Referer': scrapeUrl
        }
      });
      
      if (!mp3Response.ok) {
        throw new Error(`无法下载MP3文件: ${mp3Response.status}`);
      }
      
      // 尝试从网页中提取标题
      const titleMatch = htmlContent.match(/<h1[^>]*>([^<]+)<\/h1>/);
      const filename = titleMatch ? 
        `${titleMatch[1].trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')}.mp3` : 
        `youtube-${videoId}.mp3`;
      
      console.log(`开始下载MP3文件，命名为: ${filename}`);
      
      // 直接返回MP3流
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
    } catch (mp3juicesError) {
      console.error('MP3Juices下载失败:', mp3juicesError);
      
      // 尝试备用服务 - Y2Mate
      try {
        console.log('尝试备用MP3下载服务 - Y2Mate');
        
        // Y2Mate API请求
        const apiUrl = 'https://www.y2mate.com/mates/analyze/ajax';
        const formData = new FormData();
        formData.append('url', `https://www.youtube.com/watch?v=${videoId}`);
        formData.append('q_auto', '1');
        
        const analyzeResponse = await fetch(apiUrl, {
          method: 'POST',
          body: formData,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': '*/*',
            'Origin': 'https://www.y2mate.com',
            'Referer': 'https://www.y2mate.com/'
          }
        });
        
        if (!analyzeResponse.ok) {
          throw new Error(`Y2Mate分析失败: ${analyzeResponse.status}`);
        }
        
        const analyzeData = await analyzeResponse.json();
        console.log('Y2Mate分析结果:', analyzeData);
        
        if (!analyzeData.result) {
          throw new Error('Y2Mate返回空结果');
        }
        
        // 从结果中提取转换ID和标题
        const conversionIdMatch = analyzeData.result.match(/k__id\s*=\s*["']([^"']+)["']/);
        const titleMatch = analyzeData.result.match(/<b>([^<]+)<\/b>/);
        
        if (!conversionIdMatch || !conversionIdMatch[1]) {
          throw new Error('无法提取Y2Mate转换ID');
        }
        
        const conversionId = conversionIdMatch[1];
        const title = titleMatch ? titleMatch[1].trim() : `YouTube Video ${videoId}`;
        const filename = `${title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')}.mp3`;
        
        console.log(`获取到Y2Mate转换ID: ${conversionId}, 标题: ${title}`);
        
        // 请求转换为MP3
        const convertUrl = 'https://www.y2mate.com/mates/convert';
        const convertFormData = new FormData();
        convertFormData.append('type', 'youtube');
        convertFormData.append('_id', conversionId);
        convertFormData.append('v_id', videoId);
        convertFormData.append('ajax', '1');
        convertFormData.append('ftype', 'mp3');
        convertFormData.append('fquality', bitrate);
        
        const convertResponse = await fetch(convertUrl, {
          method: 'POST',
          body: convertFormData,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': '*/*',
            'Origin': 'https://www.y2mate.com',
            'Referer': 'https://www.y2mate.com/'
          }
        });
        
        if (!convertResponse.ok) {
          throw new Error(`Y2Mate转换失败: ${convertResponse.status}`);
        }
        
        const convertData = await convertResponse.json();
        console.log('Y2Mate转换结果:', convertData);
        
        if (!convertData.result) {
          throw new Error('Y2Mate返回空转换结果');
        }
        
        // 从转换结果中提取下载链接
        const downloadLinkMatch = convertData.result.match(/href="([^"]+)"/);
        if (!downloadLinkMatch || !downloadLinkMatch[1]) {
          throw new Error('无法提取Y2Mate下载链接');
        }
        
        const downloadLink = downloadLinkMatch[1];
        console.log(`获取到Y2Mate下载链接: ${downloadLink}`);
        
        // 获取MP3文件
        const mp3Response = await fetch(downloadLink, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': '*/*',
            'Referer': 'https://www.y2mate.com/'
          }
        });
        
        if (!mp3Response.ok) {
          throw new Error(`无法从Y2Mate下载MP3文件: ${mp3Response.status}`);
        }
        
        // 直接返回MP3流
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
      } catch (y2mateError) {
        console.error('Y2Mate下载失败:', y2mateError);
        
        // 如果所有方法都失败，返回第三方下载链接
        return new Response(JSON.stringify({ 
          error: '直接下载失败，请尝试使用第三方网站',
          externalLink: `https://www.y2mate.com/youtube-mp3/${videoId}`
        }), { 
          status: 502,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  } catch (error: any) {
    console.error('直接MP3下载错误:', error);
    const errorMessage = error.message || 'Unknown error';
    return new Response(JSON.stringify({ error: `下载失败: ${errorMessage}` }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 