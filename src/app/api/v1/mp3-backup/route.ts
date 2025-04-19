import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  try {
    const videoId = request.nextUrl.searchParams.get('id');
    const bitrate = request.nextUrl.searchParams.get('bitrate') || '128';
    
    if (!videoId) {
      return new Response(JSON.stringify({ error: 'Video ID is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`使用备用方法下载MP3，视频ID: ${videoId}, 比特率: ${bitrate}`);
    
    // 使用CORS代理从YTDL-Online获取MP3
    try {
      // 获取视频信息
      const infoUrl = `https://api.vevioz.com/api/button/info/${videoId}`;
      const infoResponse = await fetch(infoUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!infoResponse.ok) {
        throw new Error(`获取视频信息失败: ${infoResponse.status}`);
      }
      
      let videoTitle;
      try {
        const infoData = await infoResponse.json();
        videoTitle = infoData.title || `YouTube Video ${videoId}`;
        console.log(`获取到视频标题: ${videoTitle}`);
      } catch (e) {
        console.error('解析视频信息失败:', e);
        videoTitle = `YouTube Video ${videoId}`;
      }
      
      // 清理文件名
      const filename = `${videoTitle.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')}.mp3`;
      
      // 直接获取MP3
      const downloadUrl = `https://api.vevioz.com/api/button/mp3/${videoId}`;
      console.log(`使用直接下载链接: ${downloadUrl}`);
      
      const mp3Response = await fetch(downloadUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': '*/*'
        }
      });
      
      if (!mp3Response.ok) {
        throw new Error(`无法下载MP3文件: ${mp3Response.status}`);
      }
      
      // 为确保内容类型正确，获取头信息
      const contentType = mp3Response.headers.get('Content-Type');
      console.log(`下载内容类型: ${contentType}`);
      
      if (contentType && contentType.includes('text/html')) {
        // 如果是HTML内容，可能是一个重定向页面，而不是直接的MP3
        const htmlContent = await mp3Response.text();
        
        // 尝试从HTML中提取直接下载链接
        const directLinkMatch = htmlContent.match(/href="(https:\/\/[^"]+\.mp3[^"]*)"/) || 
                                htmlContent.match(/src="(https:\/\/[^"]+\.mp3[^"]*)"/);
                                
        if (directLinkMatch && directLinkMatch[1]) {
          const directLink = directLinkMatch[1];
          console.log(`从HTML中提取到直接下载链接: ${directLink}`);
          
          // 再次获取MP3内容，这次应该是直接的MP3文件
          const directMp3Response = await fetch(directLink, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': '*/*',
              'Referer': downloadUrl
            }
          });
          
          if (!directMp3Response.ok) {
            throw new Error(`无法从直接链接下载MP3: ${directMp3Response.status}`);
          }
          
          // 返回MP3内容
          return new Response(directMp3Response.body, {
            status: 200,
            headers: {
              'Content-Type': 'audio/mpeg',
              'Content-Disposition': `attachment; filename="${filename}"`,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
        } else {
          throw new Error('无法从HTML中提取MP3下载链接');
        }
      } else {
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
      }
    } catch (error) {
      console.error('备用CORS下载失败:', error);
      
      // 尝试最后的备选服务
      try {
        // 使用ytdl.pro的服务
        const ytdlProUrl = `https://www.ytdl.pro/api/mp3/${videoId}`;
        console.log(`尝试ytdl.pro下载: ${ytdlProUrl}`);
        
        const mp3Response = await fetch(ytdlProUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': '*/*'
          }
        });
        
        if (!mp3Response.ok) {
          throw new Error(`ytdl.pro下载失败: ${mp3Response.status}`);
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
      } catch (finalError) {
        console.error('所有备用下载尝试均失败:', finalError);
        
        // 如果所有方法都失败，返回直接的第三方下载链接
        return new Response(JSON.stringify({ 
          error: '所有下载方法均失败，重定向到外部网站',
          externalLink: `https://www.y2mate.com/youtube-mp3/${videoId}`
        }), { 
          status: 502,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  } catch (error: any) {
    console.error('备用MP3下载错误:', error);
    const errorMessage = error.message || 'Unknown error';
    return new Response(JSON.stringify({ error: `下载失败: ${errorMessage}` }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 