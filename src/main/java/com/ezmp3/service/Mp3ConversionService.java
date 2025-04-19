package com.ezmp3.service;

import com.ezmp3.dto.Mp3ConversionRequestDto;
import com.ezmp3.dto.Mp3ConversionResponseDto;

/**
 * MP3转换服务接口
 */
public interface Mp3ConversionService {
    
    /**
     * 获取YouTube视频的MP3转换下载选项
     * 
     * @param request 包含YouTube URL和比特率选项的请求对象
     * @return MP3转换响应对象，包含下载选项
     */
    Mp3ConversionResponseDto getConversionOptions(Mp3ConversionRequestDto request);
} 