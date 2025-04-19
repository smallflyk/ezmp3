package com.ezmp3.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class Mp3ConversionRequestDto {
    
    @NotBlank(message = "YouTube URL不能为空")
    @Pattern(
        regexp = "^(https?:\\/\\/)?(www\\.)?(youtube\\.com\\/watch\\?v=|youtu\\.be\\/)([a-zA-Z0-9_-]{11})(?:[\\?&].+)?$", 
        message = "无效的YouTube URL格式"
    )
    private String url;
    
    @Pattern(regexp = "^(64|128|192|256|320)$", message = "比特率必须是64、128、192、256或320")
    private String bitrate = "128"; // 默认比特率为128kbps
} 