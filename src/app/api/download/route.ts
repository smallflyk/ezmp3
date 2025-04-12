import { NextRequest, NextResponse } from 'next/server';

// YouTube URL validation regex
const youtubeUrlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[\?&].+)?$/;

// 获取视频信息的函数
async function getVideoInfo(url: string): Promise<{ title: string, videoId: string }> {
  const videoIdMatch = url.match(youtubeUrlRegex);
  const videoId = videoIdMatch?.[4] || '';
  
  try {
    const infoResponse = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
    if (infoResponse.ok) {
      const info = await infoResponse.json();
      return { 
        title: info.title || videoId,
        videoId 
      };
    }
  } catch (e) {
    console.error('获取视频信息失败:', e);
  }
  
  return { title: videoId, videoId };
}

// 获取Y2Mate下载链接
async function getY2MateLinks(videoId: string): Promise<string> {
  // 第一步：发起请求获取下载选项
  const searchParams = new URLSearchParams({
    k_query: `https://www.youtube.com/watch?v=${videoId}`,
    k_page: 'home',
    hl: 'en',
    q_auto: '1'
  });
  
  const response = await fetch(`https://www.y2mate.com/mates/analyzeV2/ajax`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    },
    body: searchParams.toString()
  });
  
  if (!response.ok) {
    throw new Error('Y2Mate分析请求失败');
  }
  
  const data = await response.json();
  
  // 第二步：解析结果，找到MP3下载选项
  if (data && data.links && data.links.mp3) {
    // 找到最高质量的MP3
    const mp3Options = data.links.mp3;
    let bestOption = mp3Options[0];
    
    for (const option of mp3Options) {
      if (option.size < '30 MB' && option.q > bestOption.q) {
        bestOption = option;
      }
    }
    
    // 第三步：获取实际下载链接
    const convertParams = new URLSearchParams({
      vid: videoId,
      k: bestOption.k
    });
    
    const convertResponse = await fetch(`https://www.y2mate.com/mates/convertV2/index`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      body: convertParams.toString()
    });
    
    if (!convertResponse.ok) {
      throw new Error('Y2Mate转换请求失败');
    }
    
    const convertData = await convertResponse.json();
    if (convertData.status === 'ok' && convertData.dlink) {
      return convertData.dlink;
    }
  }
  
  throw new Error('无法获取下载链接');
}

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');
    
    if (!url) {
      return NextResponse.json(
        { error: 'YouTube URL is required' },
        { status: 400 }
      );
    }

    // Validate YouTube URL format
    if (!youtubeUrlRegex.test(url)) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL format' },
        { status: 400 }
      );
    }

    try {
      // 1. 获取视频基本信息
      const { title, videoId } = await getVideoInfo(url);
      const sanitizedTitle = title.replace(/[^\w\s]/gi, ''); // 移除特殊字符
      
      // 2. 获取Y2Mate下载链接
      const downloadUrl = await getY2MateLinks(videoId);
      
      // 3. 获取音频文件
      const audioResponse = await fetch(downloadUrl);
      
      if (!audioResponse.ok) {
        throw new Error(`下载文件失败: ${audioResponse.status}`);
      }
      
      const audioBuffer = await audioResponse.arrayBuffer();
      
      // 4. 返回音频文件给用户
      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': `attachment; filename="${sanitizedTitle}.mp3"`,
          'Content-Length': audioBuffer.byteLength.toString(),
        }
      });
    } catch (err) {
      console.error('处理下载失败:', err);
      
      // 获取视频ID
      const videoId = url.match(youtubeUrlRegex)?.[4] || '';
      
      // 尝试使用备选API
      try {
        // 尝试使用API OPEN获取直接下载链接
        const apiOpenUrl = `https://api-open.yt1s.com/api/mp3/${videoId}`;
        const apiResponse = await fetch(apiOpenUrl);
        
        if (apiResponse.ok) {
          const apiData = await apiResponse.json();
          if (apiData.d_link) {
            // 获取音频文件
            const audioBuffer = await fetch(apiData.d_link).then(res => {
              if (!res.ok) throw new Error('获取音频失败');
              return res.arrayBuffer();
            });
            
            // 返回音频文件给用户
            return new NextResponse(audioBuffer, {
              headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Disposition': `attachment; filename="${videoId}.mp3"`,
                'Content-Length': audioBuffer.byteLength.toString(),
              }
            });
          }
        }
      } catch (backupError) {
        console.error('备用下载方法失败:', backupError);
      }
      
      // 如果所有方法都失败，作为最后手段使用redirect
      return NextResponse.json(
        { error: '下载失败，请稍后再试' },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('视频下载出现错误:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to download YouTube video: ${errorMessage}` },
      { status: 500 }
    );
  }
} 