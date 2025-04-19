package com.ezmp3.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoAnalysisResponseDto {
    private String videoId;
    private String title;
    private String analysis;
    private VideoMetadataDto metadata;
    private String errorMessage;
    
    /**
     * 视频元数据DTO
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VideoMetadataDto {
        private Long duration;
        private String uploadDate;
        private List<String> categories;
        private List<String> tags;
    }
    
    /**
     * 构建成功响应
     */
    public static VideoAnalysisResponseDto success(String videoId, String title, String analysis, VideoInfoDto videoInfo) {
        return VideoAnalysisResponseDto.builder()
                .videoId(videoId)
                .title(title)
                .analysis(analysis)
                .metadata(VideoMetadataDto.builder()
                        .duration(videoInfo.getDuration())
                        .uploadDate(videoInfo.getPublishedAt())
                        .categories(videoInfo.getCategories())
                        .tags(videoInfo.getTags())
                        .build())
                .build();
    }
    
    /**
     * 构建错误响应
     */
    public static VideoAnalysisResponseDto error(String errorMessage) {
        return VideoAnalysisResponseDto.builder()
                .errorMessage(errorMessage)
                .build();
    }
}