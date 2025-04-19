package com.ezmp3.service;

import com.ezmp3.dto.Mp3ConversionRequestDto;
import com.ezmp3.dto.Mp3ConversionResponseDto;
import org.springframework.core.io.Resource;

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
    
    /**
     * 下载并转换YouTube视频为MP3
     * 
     * @param url YouTube视频URL
     * @param bitrate MP3比特率
     * @return 包含MP3文件的资源
     * @throws Exception 如果下载或转换过程中出错
     */
    Resource downloadAndConvertToMp3(String url, String bitrate) throws Exception;
} 