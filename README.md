# EZ MP3 - YouTube到MP3转换器

这是一个基于Next.js构建的YouTube到MP3转换器应用程序，使用RapidAPI提供YouTube视频转MP3服务，并使用OpenRouter API进行视频分析，提供高品质的MP3下载功能。

## 功能特点

- 快速将YouTube视频转换为MP3格式
- 使用AI分析视频内容并提供音频见解
- 支持高质量音频提取（64kbps至320kbps）
- 多语言支持（目前支持英文和中文）
- 响应式设计，适配所有设备
- 使用知名的第三方转换网站作为可靠的下载来源

## 技术栈

- Next.js 15.3.0
- React
- Tailwind CSS
- RapidAPI (YouTube to MP3转换)
- OpenRouter API (GPT-4o视频内容分析)

## 项目开发进度

项目目前已完成以下功能:

1. **核心功能**
   - YouTube链接输入和验证
   - MP3转换和下载功能（支持多种音质选择）
   - 视频分析与内容解析
   - 多语言支持（英文/中文）

2. **技术实现**
   - 使用RapidAPI实现高质量MP3转换
   - 添加视频分析功能（使用OpenRouter API）
   - 实现响应式设计，适配多种设备
   - 集成Google Analytics跟踪

3. **部署状态**
   - 项目已成功部署到Vercel平台
   - 网址: https://ezmp3.vercel.app
   - 源代码托管在GitHub: https://github.com/smallflyk/ezmp3

## 项目目录结构

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/
│   │   │   └── route.ts         # 视频分析API
│   │   └── download/
│   │       └── route.ts         # MP3下载API (RapidAPI)
│   ├── components/
│   │   ├── Footer.tsx           # 页脚组件
│   │   ├── GoogleAnalytics.tsx  # Google分析组件
│   │   ├── Header.tsx           # 页眉组件
│   │   ├── LanguageProvider.tsx # 语言上下文提供器
│   │   ├── LanguageSwitcher.tsx # 语言切换器
│   │   ├── VideoAnalysis.tsx    # 视频分析组件
│   │   └── YoutubeConverter.tsx # YouTube转换器主组件
│   ├── hooks/
│   │   └── useLanguage.tsx      # 语言Hook
│   ├── locales/
│   │   ├── en.json              # 英文翻译文件
│   │   └── zh.json              # 中文翻译文件
│   ├── globals.css              # 全局样式
│   ├── layout.tsx               # 应用布局
│   └── page.tsx                 # 主页
└── ...
```

## 后续开发计划

1. 优化下载功能性能
2. 添加更多语言支持
3. 实现批量转换功能
4. 优化移动端体验
5. 添加高级音频编辑功能

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
# OpenRouter API密钥（用于视频分析）
OPENROUTER_API_KEY=你的OpenRouter_API_KEY

# RapidAPI密钥（用于MP3转换）
RAPIDAPI_KEY=你的RapidAPI_KEY

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
- 用于访问YouTube的有效网络连接
- RapidAPI密钥（用于MP3转换）
- OpenRouter API密钥（用于视频分析）

## 下载功能实现方式

该应用通过整合多个知名的在线转换服务，实现了YouTube视频到MP3的高质量转换。当用户点击下载按钮时，系统会自动打开一个可靠的第三方转换网站（如Y2mate, onlinevideoconverter等），用户可以在那里直接下载音频文件。这种方式确保了下载的稳定性和可靠性，避免了可能出现的服务限制问题。

此应用作为一个"智能导航器"，自动为用户选择最佳的转换服务，无需用户手动搜索和选择合适的转换网站。

## 许可证

MIT

## 致谢

- RapidAPI提供YouTube到MP3转换服务
- OpenRouter提供AI服务支持
- 第三方服务提供音频转换功能备用
