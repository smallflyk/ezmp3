package com.ezmp3.util;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * YouTube URL 工具类
 */
public class YouTubeUrlUtil {
    
    private static final Pattern VIDEO_ID_PATTERN = Pattern.compile(
            "^(https?:\\/\\/)?(www\\.)?(youtube\\.com\\/watch\\?v=|youtu\\.be\\/)([a-zA-Z0-9_-]{11})(?:[\\?&].+)?$"
    );
    
    /**
     * 从YouTube URL中提取视频ID
     * @param url YouTube URL
     * @return 视频ID，如果无法提取则返回null
     */
    public static String extractVideoId(String url) {
        if (url == null || url.isEmpty()) {
            return null;
        }
        
        Matcher matcher = VIDEO_ID_PATTERN.matcher(url);
        if (matcher.matches()) {
            return matcher.group(4);
        }
        
        return null;
    }
    
    /**
     * 检查URL是否为有效的YouTube URL
     * @param url 待检查的URL
     * @return 如果是有效的YouTube URL则返回true，否则返回false
     */
    public static boolean isValidYouTubeUrl(String url) {
        return url != null && VIDEO_ID_PATTERN.matcher(url).matches();
    }
    
    /**
     * 根据视频ID构建YouTube视频URL
     * @param videoId YouTube视频ID
     * @return YouTube视频URL
     */
    public static String buildYouTubeUrl(String videoId) {
        return "https://www.youtube.com/watch?v=" + videoId;
    }
} 