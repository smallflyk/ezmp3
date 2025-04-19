package com.ezmp3.service.impl;

import com.ezmp3.dto.VideoInfoDto;
import com.ezmp3.service.YouTubeService;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.youtube.YouTube;
import com.google.api.services.youtube.model.Video;
import com.google.api.services.youtube.model.VideoListResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * YouTube服务实现类
 */
@Slf4j
@Service
public class YouTubeServiceImpl implements YouTubeService {
    
    @Value("${youtube.api.key}")
    private String apiKey;
    
    private YouTube youtubeService;
    
    /**
     * 初始化YouTube API客户端
     */
    private synchronized YouTube getYouTubeService() {
        if (youtubeService == null) {
            try {
                youtubeService = new YouTube.Builder(
                        GoogleNetHttpTransport.newTrustedTransport(), 
                        GsonFactory.getDefaultInstance(), 
                        null)
                        .setApplicationName("ezmp3-backend")
                        .build();
            } catch (GeneralSecurityException | IOException e) {
                log.error("初始化YouTube API客户端失败", e);
                throw new RuntimeException("无法初始化YouTube服务", e);
            }
        }
        return youtubeService;
    }
    
    @Override
    public VideoInfoDto getVideoInfo(String videoId) {
        try {
            YouTube.Videos.List request = getYouTubeService().videos().list(Collections.singletonList("snippet,contentDetails"));
            request.setId(Collections.singletonList(videoId));
            request.setKey(apiKey);
            
            VideoListResponse response = request.execute();
            if (response.getItems() == null || response.getItems().isEmpty()) {
                log.warn("未找到视频ID为{}的视频信息", videoId);
                return null;
            }
            
            Video video = response.getItems().get(0);
            
            // 解析视频时长
            String durationStr = video.getContentDetails().getDuration();
            long seconds = Duration.parse(durationStr).getSeconds();
            
            List<String> tags = video.getSnippet().getTags();
            if (tags == null) {
                tags = new ArrayList<>();
            }
            
            return VideoInfoDto.builder()
                    .videoId(videoId)
                    .title(video.getSnippet().getTitle())
                    .description(video.getSnippet().getDescription())
                    .thumbnailUrl(video.getSnippet().getThumbnails().getHigh().getUrl())
                    .channelTitle(video.getSnippet().getChannelTitle())
                    .publishedAt(video.getSnippet().getPublishedAt().toString())
                    .duration(seconds)
                    .tags(tags)
                    .categories(Collections.singletonList(video.getSnippet().getCategoryId()))
                    .build();
            
        } catch (IOException e) {
            log.error("获取YouTube视频信息失败", e);
            throw new RuntimeException("无法获取视频信息", e);
        }
    }
    
    @Override
    public boolean validateVideo(String videoId) {
        try {
            YouTube.Videos.List request = getYouTubeService().videos().list(Collections.singletonList("id"));
            request.setId(Collections.singletonList(videoId));
            request.setKey(apiKey);
            
            VideoListResponse response = request.execute();
            return response.getItems() != null && !response.getItems().isEmpty();
        } catch (IOException e) {
            log.error("验证YouTube视频失败", e);
            return false;
        }
    }
} 