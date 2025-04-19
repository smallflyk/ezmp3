# EZMP3 - YouTube到MP3转换器后端

这是一个基于Spring Boot开发的YouTube到MP3转换器后端服务，提供YouTube视频信息获取、视频分析和MP3转换下载选项的API接口。

## 功能特点

- YouTube视频信息获取
- 视频内容分析
- MP3转换下载选项
- 支持多种比特率选择（64kbps至320kbps）

## 技术栈

- Java 17
- Spring Boot 3.2.2
- Google YouTube Data API v3
- Lombok
- Jackson (JSON处理)

## API接口

### 1. 获取MP3转换下载选项

```
GET /api/v1/download?url={YouTube_URL}&bitrate={BITRATE}
```

**参数:**
- `url`: YouTube视频URL (必填)
- `bitrate`: MP3比特率, 可选值: 64, 128, 192, 256, 320 (默认: 128)

**响应示例:**
```json
{
  "success": true,
  "videoId": "dQw4w9WgXcQ",
  "title": "Rick Astley - Never Gonna Give You Up",
  "selectedBitrate": "128",
  "downloadOptions": {
    "ssyoutube": "https://ssyoutube.com/youtube/6?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "yt1s": "https://yt1s.com/youtube-to-mp3/youtube-to-mp3?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "y2mate": "https://www.y2mate.com/youtube-mp3/dQw4w9WgXcQ",
    ...
  }
}
```

### 2. 分析YouTube视频

```
GET /api/v1/analyze?url={YouTube_URL}
```

**参数:**
- `url`: YouTube视频URL (必填)

**响应示例:**
```json
{
  "videoId": "dQw4w9WgXcQ",
  "title": "Rick Astley - Never Gonna Give You Up",
  "analysis": "## YouTube 视频分析\n\n### 音频内容概述\n视频标题: Rick Astley - Never Gonna Give You Up\n视频时长: 3分钟32秒\n发布日期: 2009-10-25\n类型: 音乐\n\n### 适合 MP3 收听的原因\n- 音乐内容非常适合以MP3格式保存和收听\n- 内容适合在移动设备上收听\n- 简短精炼，便于随时收听\n\n### 推荐收听场景\n- 休闲放松时\n- 锻炼时\n- 驾车时\n\n### 音频质量评分\n⭐⭐⭐⭐ (4/5 星)",
  "metadata": {
    "duration": 212,
    "uploadDate": "2009-10-25T06:57:33.000Z",
    "categories": ["10"],
    "tags": ["Rick", "Astley", "Never", "Gonna", "Give", "You", "Up", "Music"]
  }
}
```

## 构建与运行

### 前提条件

- JDK 17或更高版本
- Maven 3.6或更高版本
- YouTube Data API密钥

### 配置

在`application.properties`中设置:

```properties
# YouTube API密钥
youtube.api.key=你的YouTube_API_密钥
```

### 构建

```bash
mvn clean package
```

### 运行

```bash
java -jar target/ezmp3-backend-1.0.0.jar
```

或者使用Maven:

```bash
mvn spring-boot:run
```

### 访问

服务启动后，API接口将在以下URL可用:

- http://localhost:8080/api/v1/download
- http://localhost:8080/api/v1/analyze

## 与前端集成

本后端服务设计为与EZMP3前端应用程序配合使用，前端使用Next.js构建，提供友好的用户界面进行YouTube视频搜索、分析和MP3下载。

## 安全注意事项

- 本服务使用YouTube的公共API，请确保遵循YouTube的服务条款。
- 本服务仅提供转换选项，实际下载过程由第三方服务完成，这样设计是为了避免服务器负载和版权问题。

## 许可证

MIT 