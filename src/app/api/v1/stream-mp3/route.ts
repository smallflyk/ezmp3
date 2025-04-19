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
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    if (!rapidApiKey) {
      return new Response(JSON.stringify({ error: 'RapidAPI Key not configured' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 首先尝试使用youtube-mp3-download-basic API
    try {
      // 设置API请求选项
      const options = {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'youtube-mp3-download-basic.p.rapidapi.com'
        }
      };
      
      // 构建API URL
      const apiUrl = `https://youtube-mp3-download-basic.p.rapidapi.com/mp3download?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&quality=${bitrate}`;
      
      // 获取MP3下载链接
      console.log('Fetching MP3 download link...');
      const response = await fetch(apiUrl, options);
      const data = await response.json();
      
      if (!data || !data.link) {
        throw new Error('无法获取下载链接');
      }
      
      // 设置文件名
      const filename = data.title ? `${data.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')}.mp3` : `youtube-${videoId}.mp3`;
      
      // 获取MP3文件
      console.log('Downloading MP3 from:', data.link);
      const mp3Response = await fetch(data.link);
      
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
    catch (error) {
      console.error('第一个API调用失败，尝试备用API:', error);
      
      // 尝试备用API
      try {
        const options = {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': rapidApiKey,
            'X-RapidAPI-Host': 'youtube-to-mp3-download.p.rapidapi.com'
          }
        };
        
        const apiUrl = `https://youtube-to-mp3-download.p.rapidapi.com/mp3download?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&quality=${bitrate}`;
        
        // 获取MP3下载链接
        console.log('Fetching MP3 download link from backup API...');
        const response = await fetch(apiUrl, options);
        const data = await response.json();
        
        if (!data || !data.link) {
          throw new Error('备用API无法获取下载链接');
        }
        
        // 设置文件名
        const filename = data.title ? `${data.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')}.mp3` : `youtube-${videoId}.mp3`;
        
        // 获取MP3文件
        console.log('Downloading MP3 from backup source:', data.link);
        const mp3Response = await fetch(data.link);
        
        if (!mp3Response.ok) {
          throw new Error(`备用MP3下载失败，状态码: ${mp3Response.status}`);
        }
        
        // 获取MP3流
        const mp3Stream = mp3Response.body;
        if (!mp3Stream) {
          throw new Error('无法获取备用MP3流');
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
      catch (backupError) {
        console.error('备用API调用失败:', backupError);
        
        // 如果存在Y2Mate API，尝试Y2Mate作为最后的备选方案
        try {
          // Y2Mate API接口（如果有）
          const getY2MateLink = async () => {
            // 简单实现：使用第三个免费API或服务
            // 这是示例代码，您可能需要根据实际情况实现
            const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
            return { 
              link: `https://api.vevioz.com/api/button/mp3/${videoId}`,
              title: `YouTube Video ${videoId}`
            };
          };
          
          const y2mateData = await getY2MateLink();
          
          if (!y2mateData || !y2mateData.link) {
            throw new Error('所有API都无法获取下载链接');
          }
          
          // 设置文件名
          const filename = y2mateData.title ? `${y2mateData.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')}.mp3` : `youtube-${videoId}.mp3`;
          
          // 获取MP3文件（考虑到某些API可能需要额外处理）
          const mp3Response = await fetch(y2mateData.link);
          
          if (!mp3Response.ok) {
            throw new Error(`第三备选MP3下载失败，状态码: ${mp3Response.status}`);
          }
          
          // 获取MP3流
          const mp3Stream = mp3Response.body;
          if (!mp3Stream) {
            throw new Error('无法获取第三备选MP3流');
          }
          
          // 直接返回MP3流
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
        catch (finalError) {
          console.error('所有API调用都失败:', finalError);
          throw new Error('所有下载方法均失败，请尝试使用第三方网站下载');
        }
      }
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