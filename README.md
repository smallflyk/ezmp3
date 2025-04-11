# EZ MP3 - YouTube到MP3转换器

这是一个基于Next.js构建的YouTube到MP3转换器应用程序，使用OpenRouter API进行视频分析，并提供高品质的MP3下载功能。

## 功能特点

- 快速将YouTube视频转换为MP3格式
- 使用AI分析视频内容并提供音频见解
- 支持高质量音频提取
- 多语言支持（目前支持英文和中文）
- 响应式设计，适配所有设备

## 技术栈

- Next.js 15.3.0
- React
- Tailwind CSS
- OpenRouter API (GPT-4o)
- youtube-dl-exec

## 安装步骤

1. 克隆仓库
```bash
git clone https://github.com/yourusername/ezmp3.git
cd ezmp3
```

2. 安装依赖
```bash
npm install
```

3. 创建环境变量文件
在项目根目录创建`.env.local`文件，添加以下内容：
```
# OpenRouter API密钥
OPENROUTER_API_KEY=你的OpenRouter_API_KEY

# 网站信息
NEXT_PUBLIC_SITE_URL=你的网站URL
NEXT_PUBLIC_SITE_NAME=EZ MP3 Converter
```

4. 运行开发服务器
```bash
npm run dev
```

5. 在浏览器中访问 http://localhost:3000

## 部署

该项目可以轻松部署到Vercel：

```bash
npm run build
npm run start
```

或者直接使用Vercel CLI：

```bash
vercel
```

## 环境要求

- Node.js 18.0.0或更高版本
- 用于下载YouTube视频的有效网络连接
- OpenRouter API密钥

## 本地开发注意事项

1. 确保已安装所有依赖项
2. 为API端点提供了有效的OpenRouter API密钥
3. 对于视频下载功能，确保系统环境支持youtube-dl-exec

## 许可证

MIT

## 致谢

- OpenRouter提供AI服务支持
- youtube-dl-exec用于视频下载
