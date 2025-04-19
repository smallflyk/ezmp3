package com.ezmp3.service;

import com.ezmp3.dto.VideoInfoDto;

/**
 * 视频分析服务接口
 */
public interface VideoAnalysisService {
    
    /**
     * 分析视频内容
     * 
     * @param videoInfo 视频信息
     * @return 分析结果的Markdown文本
     */
    String analyzeVideoContent(VideoInfoDto videoInfo);
} 