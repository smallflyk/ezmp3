# 如何配置RapidAPI密钥

为了使EZ MP3下载功能获得最佳体验，您需要配置RapidAPI密钥。以下是详细步骤：

## 获取RapidAPI密钥

1. 访问[RapidAPI](https://rapidapi.com/)并创建一个账户（如果您还没有账户）
2. 登录后，访问以下API服务并订阅：
   - [YouTube MP3 Download Basic](https://rapidapi.com/ytjar/api/youtube-mp3-download-basic/)
   - [YouTube to MP3 Download](https://rapidapi.com/ytjar/api/youtube-to-mp3-download/)

3. 选择免费套餐（通常提供每月一定数量的免费API调用）
4. 订阅后，在RapidAPI仪表板中找到您的API密钥（通常显示为"X-RapidAPI-Key"）

## 配置应用程序

在本地开发环境中：

1. 在项目根目录创建一个`.env.local`文件
2. 添加以下内容：

```
# RapidAPI密钥（用于MP3转换）
RAPIDAPI_KEY=your_rapidapi_key_here
```

3. 将`your_rapidapi_key_here`替换为您从RapidAPI获取的实际密钥
4. 重新启动开发服务器

## 在Vercel部署中配置

如果您已经将项目部署到Vercel：

1. 登录您的Vercel账户
2. 找到您的项目
3. 进入"Settings" > "Environment Variables"
4. 添加一个新的环境变量：
   - 名称：`RAPIDAPI_KEY`
   - 值：您的RapidAPI密钥
5. 保存更改并重新部署应用程序

## 无密钥模式

如果您没有配置RapidAPI密钥，应用程序将尝试使用一些免费的公共服务。然而，这些服务可能：

- 速度较慢
- 稳定性较差
- 下载质量可能不一致
- 有时会使用重定向作为最后的备选方案

为了获得最佳体验，强烈建议配置RapidAPI密钥。 