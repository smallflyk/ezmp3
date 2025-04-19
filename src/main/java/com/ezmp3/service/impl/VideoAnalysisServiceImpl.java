package com.ezmp3.service.impl;

import com.ezmp3.dto.VideoInfoDto;
import com.ezmp3.service.VideoAnalysisService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;

/**
 * 视频分析服务实现类
 */
@Slf4j
@Service
public class VideoAnalysisServiceImpl implements VideoAnalysisService {
    
    @Value("${openai.api.key:}")
    private String apiKey;
    
    @Override
    public String analyzeVideoContent(VideoInfoDto videoInfo) {
        // 目前使用模拟数据，后续可以集成OpenAI API来分析视频内容
        return generateMockAnalysis(videoInfo);
    }
    
    /**
     * 生成模拟的视频分析结果
     * 
     * @param videoInfo 视频信息
     * @return 分析结果的Markdown文本
     */
    private String generateMockAnalysis(VideoInfoDto videoInfo) {
        Random random = new Random();
        int rating = 3 + random.nextInt(3); // 3-5星评分
        
        String title = videoInfo.getTitle();
        String description = videoInfo.getDescription();
        List<String> tags = videoInfo.getTags();
        long duration = videoInfo.getDuration();
        
        // 格式化时长
        String formattedDuration = formatDuration(duration);
        
        // 格式化发布日期
        String publishDate = "未知";
        if (videoInfo.getPublishedAt() != null) {
            try {
                publishDate = LocalDate.parse(videoInfo.getPublishedAt().split("T")[0])
                        .format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            } catch (Exception e) {
                log.warn("无法解析发布日期: {}", videoInfo.getPublishedAt());
            }
        }
        
        // 判断音频类型
        String audioType = determineAudioType(tags);
        
        StringBuilder analysis = new StringBuilder();
        analysis.append("## YouTube 视频分析\n\n");
        
        analysis.append("### 音频内容概述\n");
        analysis.append("视频标题: ").append(title).append("\n");
        analysis.append("视频时长: ").append(formattedDuration).append("\n");
        analysis.append("发布日期: ").append(publishDate).append("\n");
        if (audioType != null) {
            analysis.append("类型: ").append(audioType).append("\n");
        }
        analysis.append("\n");
        
        analysis.append("### 适合 MP3 收听的原因\n");
        analysis.append("- ").append(generateReasonForMp3(audioType)).append("\n");
        analysis.append("- 内容适合在移动设备上收听\n");
        if (duration > 600) { // 10分钟以上的视频
            analysis.append("- 时长较长，适合转换后保存\n");
        } else {
            analysis.append("- 简短精炼，便于随时收听\n");
        }
        analysis.append("\n");
        
        analysis.append("### 推荐收听场景\n");
        for (String scenario : generateListeningScenarios(audioType)) {
            analysis.append("- ").append(scenario).append("\n");
        }
        analysis.append("\n");
        
        analysis.append("### 音频质量评分\n");
        analysis.append(generateStarRating(rating)).append(" (").append(rating).append("/5 星)");
        
        return analysis.toString();
    }
    
    /**
     * 确定音频类型
     */
    private String determineAudioType(List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return null;
        }
        
        // 常见的音频类型关键词
        String[] musicKeywords = {"music", "song", "audio", "sound", "track", "album", "concert", "音乐", "歌曲"};
        String[] podcastKeywords = {"podcast", "talk", "interview", "discussion", "conversation", "播客", "访谈"};
        String[] lectureKeywords = {"lecture", "course", "lesson", "教程", "课程", "讲座"};
        
        // 检查标签中是否包含音乐关键词
        for (String tag : tags) {
            for (String keyword : musicKeywords) {
                if (tag.toLowerCase().contains(keyword.toLowerCase())) {
                    return "音乐";
                }
            }
            
            for (String keyword : podcastKeywords) {
                if (tag.toLowerCase().contains(keyword.toLowerCase())) {
                    return "播客";
                }
            }
            
            for (String keyword : lectureKeywords) {
                if (tag.toLowerCase().contains(keyword.toLowerCase())) {
                    return "讲座/教程";
                }
            }
        }
        
        return "一般内容";
    }
    
    /**
     * 生成适合MP3的原因
     */
    private String generateReasonForMp3(String audioType) {
        if ("音乐".equals(audioType)) {
            return "音乐内容非常适合以MP3格式保存和收听";
        } else if ("播客".equals(audioType)) {
            return "播客类内容主要以对话为主，非常适合以音频形式收听";
        } else if ("讲座/教程".equals(audioType)) {
            return "教学内容可以反复收听学习，MP3格式便于存档";
        } else {
            return "内容的音频部分独立完整，适合单独收听";
        }
    }
    
    /**
     * 生成收听场景
     */
    private String[] generateListeningScenarios(String audioType) {
        if ("音乐".equals(audioType)) {
            return new String[]{"休闲放松时", "锻炼时", "驾车时"};
        } else if ("播客".equals(audioType)) {
            return new String[]{"通勤路上", "做家务时", "散步时"};
        } else if ("讲座/教程".equals(audioType)) {
            return new String[]{"学习时", "睡前", "工作休息时"};
        } else {
            return new String[]{"通勤路上", "锻炼时", "放松休息时"};
        }
    }
    
    /**
     * 格式化时长
     */
    private String formatDuration(long seconds) {
        Duration duration = Duration.ofSeconds(seconds);
        long hours = duration.toHours();
        int minutes = duration.toMinutesPart();
        int secs = duration.toSecondsPart();
        
        if (hours > 0) {
            return String.format("%d小时%d分钟%d秒", hours, minutes, secs);
        } else if (minutes > 0) {
            return String.format("%d分钟%d秒", minutes, secs);
        } else {
            return String.format("%d秒", secs);
        }
    }
    
    /**
     * 生成星级评分
     */
    private String generateStarRating(int rating) {
        StringBuilder stars = new StringBuilder();
        for (int i = 0; i < rating; i++) {
            stars.append("⭐");
        }
        return stars.toString();
    }
} 