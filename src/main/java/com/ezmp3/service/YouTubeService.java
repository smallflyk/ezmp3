package com.ezmp3.service;

import com.ezmp3.dto.VideoInfoDto;

/**
 * YouTube视频服务接口
 */
public interface YouTubeService {
    
    /**
     * 获取YouTube视频信息
     * @param videoId YouTube视频ID
     * @return 视频信息DTO
     */
    VideoInfoDto getVideoInfo(String videoId);
    
    /**
     * 验证YouTube视频是否存在且可访问
     * @param videoId YouTube视频ID
     * @return 如果视频存在且可访问则返回true，否则返回false
     */
    boolean validateVideo(String videoId);
} 