# EZ MP3 - YouTube到MP3转换器

这是一个基于Next.js构建的YouTube到MP3转换器应用程序，使用RapidAPI提供YouTube视频转MP3服务，并使用OpenRouter API进行视频分析，提供高品质的MP3下载功能。

## 功能特点

- 快速将YouTube视频转换为MP3格式
- 直接下载MP3文件，无需跳转到第三方网站
- 使用AI分析视频内容并提供音频见解
- 支持高质量音频提取（64kbps至320kbps）
- 多语言支持（目前支持英文和中文）
- 响应式设计，适配所有设备
- 可选择使用知名的第三方转换网站作为备选下载来源

## 技术栈

- Next.js 15.3.0
- React
- Tailwind CSS
- Y2mate.cc API (无需API密钥)
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
   - 集成Y2mate.cc无密钥API实现可靠的MP3转换 (最新)
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
│   │   ├── download/
│   │   │   └── route.ts         # 下载选项管理API
│   │   └── v1/
│   │       ├── stream-mp3/      # 主要MP3下载API (RapidAPI)
│   │       ├── direct-mp3/      # 备选MP3下载API
│   │       ├── mp3-backup/      # 备用MP3下载API 
│   │       └── y2mate-mp3/      # Y2mate.cc API集成 (新增)
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
RAPID_API_KEY=你的RapidAPI_KEY

# 网站信息
NEXT_PUBLIC_SITE_URL=你的网站URL
NEXT_PUBLIC_SITE_NAME=EZ MP3 Converter
```

注意：即使不提供RapidAPI密钥，应用程序也能通过Y2mate.cc API正常运行。

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
- RapidAPI密钥（可选，用于高质量MP3转换）
- OpenRouter API密钥（可选，用于视频分析）

## 最近更新

- **2023-12-10**: 重大功能增强：增加新的convert2mp3s API转换功能，改进下载成功率
- **2023-12-10**: 增强Y2mate API正则表达式匹配能力，支持多种页面结构变化
- **2023-12-10**: 优化下载逻辑，添加智能尝试机制和更详细的错误处理
- **2023-12-10**: 改进用户界面，美化直接下载按钮，提供更清晰的操作指引
- **2023-11-26**: 重大更新：优化下载功能，实现直接MP3下载而非跳转到第三方网站
- **2023-11-26**: 添加多Y2mate服务支持，包括y2mate.cc、y2mate.tools和y2mate.guru，提高可用性
- **2023-11-26**: 增强错误处理和自动重试功能，解决502错误问题
- **2023-11-26**: 优化用户体验，提供下载进度和速度信息
- **2023-11-26**: 实现自定义Mates API，复制Y2mate.nu的analyzeV2和convertV2功能
- **2023-11-XX**: 集成Y2mate.cc API，大幅提高下载可靠性，无需API密钥
- **2023-11-XX**: 优化错误处理，添加自动重试和备选下载机制
- **2023-11-XX**: 改进用户体验，提供更友好的下载反馈

## 下载功能实现方式

该应用提供直接MP3下载功能，通过多种方式确保高成功率：

1. **多层下载机制**
   - **自定义Mates API**（最新）：复制并实现Y2mate.nu的核心API
   - **多Y2mate服务**（新增）：尝试多个Y2mate服务（cc、tools、guru等）
   - **Y2mate.cc API**：通过analyze和convert两个端点实现无密钥转换
   - **RapidAPI**（需密钥）：提供高质量转换
   - **备选和备用API**：确保至少一种方法可用
   - **第三方网站跳转**：作为最后的备选方案

2. **主要特点**：
   - 无需用户离开当前页面
   - 高质量（最高320kbps）的MP3格式
   - 直接下载到用户设备，无需额外步骤
   - 智能重试机制，应对服务器错误（如502错误）
   - 可播放性保证，确保文件格式正确

3. **技术实现**：
   - 优先级下载：尝试多种方法，直到成功
   - 自适应服务选择：自动选择可用的Y2mate服务
   - 指数退避重试：遇到临时错误时智能等待并重试
   - 文件验证确保下载内容是有效MP3
   - 下载进度和速度统计

## 自定义Mates API功能

我们实现了与Y2mate.nu兼容的API端点：

1. **`/api/mates/analyzeV2/ajax`**
   - 接收YouTube URL并分析视频信息
   - 返回视频标题、ID、缩略图和可用格式

2. **`/api/mates/convertV2/index`**
   - 接收视频ID、格式类型和质量
   - 返回直接下载链接，无需跳转

3. **优势**：
   - 完全在我们的服务器上处理，减少对外部服务的依赖
   - 更高的可靠性和稳定性
   - 可自定义错误处理和重试逻辑
   - 使用Y2mate服务作为后端，但提供更好的用户体验

## 许可证

MIT

## 致谢

- Y2mate.cc提供无密钥MP3转换服务
- RapidAPI提供YouTube到MP3转换服务
- OpenRouter提供AI服务支持
- 第三方服务提供音频转换功能备用
