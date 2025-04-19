package com.ezmp3.service.impl;

import com.ezmp3.dto.Mp3ConversionRequestDto;
import com.ezmp3.dto.Mp3ConversionResponseDto;
import com.ezmp3.dto.VideoInfoDto;
import com.ezmp3.service.Mp3ConversionService;
import com.ezmp3.service.YouTubeService;
import com.ezmp3.util.YouTubeUrlUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * MP3转换服务实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class Mp3ConversionServiceImpl implements Mp3ConversionService {
    
    private final YouTubeService youTubeService;
    
    @Override
    public Mp3ConversionResponseDto getConversionOptions(Mp3ConversionRequestDto request) {
        try {
            String url = request.getUrl();
            String bitrate = request.getBitrate();
            
            // 提取视频ID
            String videoId = YouTubeUrlUtil.extractVideoId(url);
            if (videoId == null) {
                return Mp3ConversionResponseDto.error("无法提取视频ID");
            }
            
            // 验证视频是否存在
            if (!youTubeService.validateVideo(videoId)) {
                return Mp3ConversionResponseDto.error("视频不存在或无法访问");
            }
            
            // 获取视频信息
            VideoInfoDto videoInfo = youTubeService.getVideoInfo(videoId);
            String title = videoInfo != null ? videoInfo.getTitle() : "YouTube Video " + videoId;
            
            // 构建下载选项
            Map<String, String> downloadOptions = buildDownloadOptions(videoId);
            
            // 返回成功响应
            return Mp3ConversionResponseDto.success(
                    videoId,
                    title,
                    bitrate,
                    downloadOptions
            );
            
        } catch (Exception e) {
            log.error("转换YouTube视频到MP3出错", e);
            return Mp3ConversionResponseDto.error("转换失败: " + e.getMessage());
        }
    }
    
    /**
     * 构建下载选项
     * 
     * @param videoId YouTube视频ID
     * @return 下载选项映射
     */
    private Map<String, String> buildDownloadOptions(String videoId) {
        String youtubeUrl = "https://www.youtube.com/watch?v=" + videoId;
        String encodedUrl = "https://www.youtube.com/watch?v=" + videoId;
        
        Map<String, String> options = new HashMap<>();
        options.put("ssyoutube", "https://ssyoutube.com/youtube/6?url=" + encodedUrl);
        options.put("yt1s", "https://yt1s.com/youtube-to-mp3/youtube-to-mp3?url=" + encodedUrl);
        options.put("savefrom", "https://en.savefrom.net/391/youtube-mp3?url=" + encodedUrl);
        options.put("y2mate", "https://www.y2mate.com/youtube-mp3/" + videoId);
        options.put("flvto", "https://flvto.pro/youtube-to-mp3?url=" + encodedUrl);
        options.put("converterbear", "https://converterbear.org/youtube-to-mp3?url=" + encodedUrl);
        options.put("onlinevideoconverter", "https://onlinevideoconverter.pro/youtube-converter/youtube-to-mp3?url=" + encodedUrl);
        options.put("ytmp3download", "https://ytmp3download.cc/yt-to-mp3/?url=" + encodedUrl);
        
        return options;
    }
} 