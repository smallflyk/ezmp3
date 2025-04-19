package com.ezmp3.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Mp3ConversionResponseDto {
    private boolean success;
    private String videoId;
    private String title;
    private String selectedBitrate;
    private Map<String, String> downloadOptions;
    private String errorMessage;
    
    public static Mp3ConversionResponseDto success(String videoId, String title, String bitrate, Map<String, String> downloadOptions) {
        return Mp3ConversionResponseDto.builder()
                .success(true)
                .videoId(videoId)
                .title(title)
                .selectedBitrate(bitrate)
                .downloadOptions(downloadOptions)
                .build();
    }
    
    public static Mp3ConversionResponseDto error(String errorMessage) {
        return Mp3ConversionResponseDto.builder()
                .success(false)
                .errorMessage(errorMessage)
                .build();
    }
} 