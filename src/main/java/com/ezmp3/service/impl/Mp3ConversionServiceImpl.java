package com.ezmp3.service.impl;

import com.ezmp3.dto.Mp3ConversionRequestDto;
import com.ezmp3.dto.Mp3ConversionResponseDto;
import com.ezmp3.dto.VideoInfoDto;
import com.ezmp3.service.Mp3ConversionService;
import com.ezmp3.service.YouTubeService;
import com.ezmp3.util.YouTubeUrlUtil;
import com.github.kiulian.downloader.YoutubeDownloader;
import com.github.kiulian.downloader.YoutubeException;
import com.github.kiulian.downloader.downloader.YoutubeCallback;
import com.github.kiulian.downloader.downloader.YoutubeProgressCallback;
import com.github.kiulian.downloader.downloader.request.RequestVideoFileDownload;
import com.github.kiulian.downloader.downloader.request.RequestVideoInfo;
import com.github.kiulian.downloader.downloader.response.Response;
import com.github.kiulian.downloader.model.videos.VideoInfo;
import com.github.kiulian.downloader.model.videos.formats.AudioFormat;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FileUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import ws.schild.jave.Encoder;
import ws.schild.jave.MultimediaObject;
import ws.schild.jave.encode.AudioAttributes;
import ws.schild.jave.encode.EncodingAttributes;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * MP3转换服务实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class Mp3ConversionServiceImpl implements Mp3ConversionService {
    
    private final YouTubeService youTubeService;
    
    @Value("${app.download.directory:${java.io.tmpdir}/ezmp3-downloads}")
    private String downloadDirectory;
    
    @Value("${app.conversion.timeout:300000}")
    private long conversionTimeout;
    
    @Override
    public Mp3ConversionResponseDto getConversionOptions(Mp3ConversionRequestDto request) {
        try {
            String url = request.getUrl();
            String bitrate = request.getBitrate();
            
            // 提取视频ID
            String videoId = YouTubeUrlUtil.extractVideoId(url);
            if (videoId == null) {
                return Mp3ConversionResponseDto.error("无法提取视频ID");
            }
            
            // 验证视频是否存在
            if (!youTubeService.validateVideo(videoId)) {
                return Mp3ConversionResponseDto.error("视频不存在或无法访问");
            }
            
            // 获取视频信息
            VideoInfoDto videoInfo = youTubeService.getVideoInfo(videoId);
            String title = videoInfo != null ? videoInfo.getTitle() : "YouTube Video " + videoId;
            
            // 构建下载选项
            Map<String, String> downloadOptions = buildDownloadOptions(videoId);
            
            // 返回成功响应
            return Mp3ConversionResponseDto.success(
                    videoId,
                    title,
                    bitrate,
                    downloadOptions
            );
            
        } catch (Exception e) {
            log.error("转换YouTube视频到MP3出错", e);
            return Mp3ConversionResponseDto.error("转换失败: " + e.getMessage());
        }
    }
    
    @Override
    public Resource downloadAndConvertToMp3(String url, String bitrate) throws Exception {
        // 提取视频ID
        String videoId = YouTubeUrlUtil.extractVideoId(url);
        if (videoId == null) {
            throw new IllegalArgumentException("无法提取视频ID");
        }
        
        // 创建下载目录
        File downloadDir = new File(downloadDirectory);
        if (!downloadDir.exists()) {
            if (!downloadDir.mkdirs()) {
                throw new RuntimeException("无法创建下载目录: " + downloadDirectory);
            }
        }
        
        // 生成唯一的文件名
        String uniqueId = UUID.randomUUID().toString();
        File audioFile = new File(downloadDir, videoId + "_" + uniqueId + ".mp3");
        
        try {
            // 初始化YouTube下载器
            YoutubeDownloader downloader = new YoutubeDownloader();
            
            // 获取视频信息
            RequestVideoInfo requestVideoInfo = new RequestVideoInfo(videoId);
            Response<VideoInfo> responseInfo = downloader.getVideoInfo(requestVideoInfo);
            VideoInfo videoInfo = responseInfo.data();
            
            // 查找最佳音频格式
            AudioFormat bestAudioFormat = videoInfo.audioFormats()
                    .stream()
                    .max(Comparator.comparingInt(AudioFormat::audioQuality))
                    .orElseThrow(() -> new RuntimeException("没有可用的音频格式"));
            
            // 下载音频
            log.info("开始下载视频 {} 的音频", videoId);
            File tempAudioFile = new File(downloadDir, videoId + "_" + uniqueId + "_temp." + bestAudioFormat.extension().value());
            RequestVideoFileDownload requestVideoFileDownload = new RequestVideoFileDownload(bestAudioFormat)
                    .saveTo(tempAudioFile)
                    .callback(new YoutubeProgressCallback<File>() {
                        @Override
                        public void onDownloading(int progress) {
                            log.debug("下载进度: {}%", progress);
                        }
                        
                        @Override
                        public void onFinished(File file) {
                            log.info("音频下载完成: {}", file.getAbsolutePath());
                        }
                        
                        @Override
                        public void onError(Throwable throwable) {
                            log.error("音频下载失败", throwable);
                        }
                    })
                    .async();
            
            Response<File> responseFile = downloader.downloadVideoFile(requestVideoFileDownload);
            
            // 等待下载完成
            File downloadedFile = responseFile.data();
            
            // 转换为MP3
            log.info("开始将 {} 转换为MP3", downloadedFile.getName());
            int bitrateValue = Integer.parseInt(bitrate);
            
            // 设置音频属性
            AudioAttributes audioAttributes = new AudioAttributes();
            audioAttributes.setCodec("libmp3lame");
            audioAttributes.setBitRate(bitrateValue * 1000); // 转为比特/秒
            audioAttributes.setChannels(2);
            audioAttributes.setSamplingRate(44100);
            
            // 设置编码属性
            EncodingAttributes encodingAttributes = new EncodingAttributes();
            encodingAttributes.setOutputFormat("mp3");
            encodingAttributes.setAudioAttributes(audioAttributes);
            
            // 编码文件
            Encoder encoder = new Encoder();
            encoder.encode(new MultimediaObject(downloadedFile), audioFile, encodingAttributes);
            
            log.info("MP3转换完成: {}", audioFile.getAbsolutePath());
            
            // 删除临时文件
            if (downloadedFile.exists()) {
                downloadedFile.delete();
            }
            
            // 返回MP3文件资源
            return new FileSystemResource(audioFile);
            
        } catch (Exception e) {
            log.error("下载和转换MP3时出错", e);
            // 清理可能生成的文件
            if (audioFile.exists()) {
                audioFile.delete();
            }
            throw e;
        }
    }
    
    /**
     * 构建下载选项
     * 
     * @param videoId YouTube视频ID
     * @return 下载选项映射
     */
    private Map<String, String> buildDownloadOptions(String videoId) {
        String youtubeUrl = "https://www.youtube.com/watch?v=" + videoId;
        String encodedUrl = "https://www.youtube.com/watch?v=" + videoId;
        
        Map<String, String> options = new HashMap<>();
        options.put("ssyoutube", "https://ssyoutube.com/youtube/6?url=" + encodedUrl);
        options.put("yt1s", "https://yt1s.com/youtube-to-mp3/youtube-to-mp3?url=" + encodedUrl);
        options.put("savefrom", "https://en.savefrom.net/391/youtube-mp3?url=" + encodedUrl);
        options.put("y2mate", "https://www.y2mate.com/youtube-mp3/" + videoId);
        options.put("flvto", "https://flvto.pro/youtube-to-mp3?url=" + encodedUrl);
        options.put("converterbear", "https://converterbear.org/youtube-to-mp3?url=" + encodedUrl);
        options.put("onlinevideoconverter", "https://onlinevideoconverter.pro/youtube-converter/youtube-to-mp3?url=" + encodedUrl);
        options.put("ytmp3download", "https://ytmp3download.cc/yt-to-mp3/?url=" + encodedUrl);
        
        return options;
    }
} 