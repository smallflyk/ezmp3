package com.ezmp3.controller;

import com.ezmp3.dto.Mp3ConversionRequestDto;
import com.ezmp3.dto.Mp3ConversionResponseDto;
import com.ezmp3.dto.VideoAnalysisResponseDto;
import com.ezmp3.dto.VideoInfoDto;
import com.ezmp3.service.Mp3ConversionService;
import com.ezmp3.service.VideoAnalysisService;
import com.ezmp3.service.YouTubeService;
import com.ezmp3.util.YouTubeUrlUtil;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

/**
 * MP3转换控制器
 */
@Slf4j
@RestController
@RequestMapping("/v1")
@RequiredArgsConstructor
public class Mp3ConverterController {
    
    private final Mp3ConversionService mp3ConversionService;
    private final YouTubeService youTubeService;
    private final VideoAnalysisService videoAnalysisService;
    
    /**
     * 获取MP3转换下载选项
     * 
     * @param url YouTube URL
     * @param bitrate 比特率
     * @return MP3转换响应
     */
    @GetMapping("/download")
    public ResponseEntity<Mp3ConversionResponseDto> getDownloadOptions(
            @RequestParam String url,
            @RequestParam(required = false, defaultValue = "128") String bitrate) {
        
        log.info("接收到下载请求: url={}, bitrate={}", url, bitrate);
        
        // 验证URL和比特率
        if (!YouTubeUrlUtil.isValidYouTubeUrl(url)) {
            return ResponseEntity.badRequest().body(Mp3ConversionResponseDto.error("无效的YouTube URL格式"));
        }
        
        if (!bitrate.matches("^(64|128|192|256|320)$")) {
            return ResponseEntity.badRequest().body(Mp3ConversionResponseDto.error("比特率必须是64、128、192、256或320"));
        }
        
        // 创建请求DTO
        Mp3ConversionRequestDto request = new Mp3ConversionRequestDto();
        request.setUrl(url);
        request.setBitrate(bitrate);
        
        // 获取转换选项
        Mp3ConversionResponseDto response = mp3ConversionService.getConversionOptions(request);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 直接下载MP3文件
     * 
     * @param url YouTube URL
     * @param bitrate 比特率
     * @param response HTTP响应
     */
    @GetMapping("/direct-download")
    public ResponseEntity<?> directDownloadMp3(
            @RequestParam String url,
            @RequestParam(required = false, defaultValue = "128") String bitrate,
            HttpServletResponse response) {
        
        log.info("接收到直接下载请求: url={}, bitrate={}", url, bitrate);
        
        // 验证URL和比特率
        if (!YouTubeUrlUtil.isValidYouTubeUrl(url)) {
            return ResponseEntity.badRequest().body(Mp3ConversionResponseDto.error("无效的YouTube URL格式"));
        }
        
        if (!bitrate.matches("^(64|128|192|256|320)$")) {
            return ResponseEntity.badRequest().body(Mp3ConversionResponseDto.error("比特率必须是64、128、192、256或320"));
        }
        
        try {
            // 提取视频ID和获取视频信息
            String videoId = YouTubeUrlUtil.extractVideoId(url);
            if (videoId == null) {
                return ResponseEntity.badRequest().body(Mp3ConversionResponseDto.error("无法提取视频ID"));
            }
            
            VideoInfoDto videoInfo = youTubeService.getVideoInfo(videoId);
            if (videoInfo == null) {
                return ResponseEntity.notFound().build();
            }
            
            // 调用服务下载并转换MP3
            Resource mp3Resource = mp3ConversionService.downloadAndConvertToMp3(url, bitrate);
            
            // 设置响应头
            String fileName = videoInfo.getTitle().replaceAll("[^a-zA-Z0-9\\-_\\.]", "_") + ".mp3";
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("audio/mpeg"))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .body(mp3Resource);
            
        } catch (Exception e) {
            log.error("直接下载MP3时出错", e);
            return ResponseEntity.internalServerError().body(Mp3ConversionResponseDto.error("下载失败: " + e.getMessage()));
        }
    }
    
    /**
     * 分析YouTube视频
     * 
     * @param url YouTube URL
     * @return 视频分析响应
     */
    @GetMapping("/analyze")
    public ResponseEntity<VideoAnalysisResponseDto> analyzeVideo(@RequestParam String url) {
        
        log.info("接收到分析请求: url={}", url);
        
        // 验证URL
        if (!YouTubeUrlUtil.isValidYouTubeUrl(url)) {
            return ResponseEntity.badRequest().body(VideoAnalysisResponseDto.error("无效的YouTube URL格式"));
        }
        
        // 提取视频ID
        String videoId = YouTubeUrlUtil.extractVideoId(url);
        if (videoId == null) {
            return ResponseEntity.badRequest().body(VideoAnalysisResponseDto.error("无法提取视频ID"));
        }
        
        try {
            // 获取视频信息
            VideoInfoDto videoInfo = youTubeService.getVideoInfo(videoId);
            if (videoInfo == null) {
                return ResponseEntity.notFound().build();
            }
            
            // 分析视频内容
            String analysis = videoAnalysisService.analyzeVideoContent(videoInfo);
            
            // 构建响应
            VideoAnalysisResponseDto response = VideoAnalysisResponseDto.success(
                    videoId,
                    videoInfo.getTitle(),
                    analysis,
                    videoInfo
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("分析视频时出错", e);
            return ResponseEntity.internalServerError().body(VideoAnalysisResponseDto.error("分析视频时出错: " + e.getMessage()));
        }
    }
} 