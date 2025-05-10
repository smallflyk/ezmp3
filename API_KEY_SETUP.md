# API密钥设置指南

## RapidAPI密钥配置

EZ MP3 YouTube Converter使用RapidAPI的服务来转换YouTube视频为MP3。为了获得最佳的下载体验，您需要配置RapidAPI密钥。

### 获取RapidAPI密钥

1. 访问 https://rapidapi.com/ytjar/api/youtube-to-mp315
2. 注册或登录RapidAPI账户
3. 订阅API（有免费方案可用）
4. 复制生成的API密钥

### 配置密钥

有两种方式可以配置API密钥：

#### 方法1：使用环境变量（推荐）

创建一个名为`.env.local`的文件（在项目根目录），并添加以下内容：

```
RAPID_API_KEY=你的RapidAPI密钥
```

然后重新启动应用程序。

#### 方法2：在代码中直接设置

如果您无法使用环境变量，可以直接在代码中设置密钥。打开文件：
`src/app/api/v1/stream-mp3/route.ts`

找到并修改这一行：
```typescript
const RAPID_API_KEY = process.env.RAPID_API_KEY || '默认密钥';
```

将'默认密钥'替换为您的实际API密钥。

### 不使用API密钥

如果您不想使用RapidAPI服务，本应用程序仍然提供了备用下载方法，但成功率和质量可能会降低：

1. Y2mate.nu服务 - 通过`y2mate-mp3`端点（新增）
2. MP3Juices服务 - 通过`direct-mp3`端点
3. Vevioz服务 - 通过`mp3-backup`端点
4. 第三方网站跳转 - 如果所有直接下载方法失败

## 故障排除

如果您遇到下载问题，可能是因为：

1. API密钥无效或过期 - 请检查您的RapidAPI账户
2. API调用限制 - 免费方案有调用次数限制
3. 网络问题 - 检查您的网络连接
4. YouTube视频限制 - 某些视频可能无法下载
5. 第三方服务变更 - 如Y2mate.nu等服务可能会更改其API结构

## 高级配置

对于开发者，可以通过编辑以下文件来修改下载服务：

- `src/app/api/v1/stream-mp3/route.ts` - 主要下载API (RapidAPI)
- `src/app/api/v1/direct-mp3/route.ts` - 备选下载API (MP3Juices)
- `src/app/api/v1/mp3-backup/route.ts` - 备用下载API (Vevioz)
- `src/app/api/v1/y2mate-mp3/route.ts` - Y2mate.nu下载API
- `src/app/api/download/route.ts` - 下载选项管理API

配置不同的服务或添加其他的下载方案，可以增强应用程序的可靠性。

## Y2mate.nu服务说明

应用程序现在集成了Y2mate.nu的API，它提供了稳定的MP3下载功能。此服务使用两个API端点：
- `/mates/analyzeV2/ajax` - 分析YouTube视频获取信息
- `/mates/convertV2/index` - 转换并获取MP3下载链接

这些API不需要任何API密钥，但仍然可能受到IP限制或服务变更的影响。如果Y2mate.nu更改其API结构，可能需要更新相应的代码。 