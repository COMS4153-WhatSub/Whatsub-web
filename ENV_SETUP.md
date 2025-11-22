# 环境变量配置说明

## 本地开发环境配置

由于后端服务部署在 Cloud Run 上，而前端在本地开发（localhost:3000），需要配置正确的 API URL。

### 步骤 1: 创建 `.env.local` 文件

在 `Whatsub-web` 目录下创建 `.env.local` 文件：

```bash
cd Whatsub-web
touch .env.local
```

### 步骤 2: 配置环境变量

在 `.env.local` 文件中添加以下内容：

```env
# API Configuration - 替换为你的 Cloud Run Composite Service URL
NEXT_PUBLIC_API_URL=https://your-composite-service-url.run.app

# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

# Payload Signature (可选 - 仅当后端启用了 payload signature verification 时需要)
# NEXT_PUBLIC_PAYLOAD_SIGNATURE_SECRET=your-payload-signature-secret
```

### 步骤 3: 获取 Cloud Run URL

1. 登录 Google Cloud Console
2. 进入 Cloud Run 服务页面
3. 找到你的 Composite Service
4. 复制服务 URL（格式类似：`https://whatsub-composite-xxxxx.run.app`）

### 步骤 4: 重启开发服务器

配置完成后，需要重启 Next.js 开发服务器：

```bash
# 停止当前服务器 (Ctrl+C)
# 然后重新启动
npm run dev
```

## 验证配置

在浏览器控制台运行以下代码验证配置：

```javascript
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080');
```

或者检查网络请求，确认请求发送到正确的 Cloud Run URL。

## 注意事项

1. `.env.local` 文件不会被提交到 Git（已在 `.gitignore` 中）
2. 环境变量必须以 `NEXT_PUBLIC_` 开头才能在浏览器中使用
3. 修改环境变量后必须重启开发服务器才能生效
4. 生产环境的环境变量在 GitHub Actions 中配置（`.github/workflows/firebase-hosting-merge.yml`）

## 常见问题

### Q: 如何确认 Cloud Run URL 是否正确？
A: 在浏览器中访问 `https://your-composite-service-url.run.app/health`，应该返回健康检查信息。

### Q: 仍然出现 404 错误？
A: 检查以下几点：
1. Cloud Run URL 是否正确（包含 `https://` 协议）
2. 是否重启了开发服务器
3. Cloud Run 服务是否正常运行
4. 浏览器控制台中的实际请求 URL 是什么

### Q: CORS 错误？
A: 确保 Cloud Run 服务的 CORS 配置包含了 `http://localhost:3000`。检查 Composite Service 的环境变量 `CORS_ORIGINS`。

