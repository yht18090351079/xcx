# 🚀 Vercel 部署指南

## 项目概述
广元市天气分析系统 - 使用 Node.js + Express + Puppeteer 实现真实天气数据爬取和可视化

## 📋 部署前检查清单

### ✅ 已完成项目配置
- [x] `vercel.json` 配置文件已创建
- [x] `package.json` 依赖已完整
- [x] `public/` 目录包含所有静态文件
- [x] `server.js` Express 后端已配置
- [x] Git 仓库状态正常

## 🔧 部署步骤

### 1. GitHub 仓库准备
确保您的代码已推送到 GitHub 仓库。如果还没有远程仓库：

```bash
# 如果还没有远程仓库，创建一个新的
git remote add origin https://github.com/YOUR_USERNAME/guangyuan-weather.git
git push -u origin main
```

### 2. Vercel 账户注册
1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub 账户登录
3. 授权 Vercel 访问您的 GitHub 仓库

### 3. 项目部署
1. 在 Vercel 控制台点击 "New Project"
2. 选择您的 GitHub 仓库 `guangyuan-weather`
3. Vercel 会自动检测到 Node.js 项目
4. 保持默认配置（Vercel 会读取 `vercel.json`）
5. 点击 "Deploy"

### 4. 环境变量配置（可选）
在 Vercel 控制台的 Settings → Environment Variables 中添加：

```
NODE_ENV=production
PORT=3001
```

## 📁 项目结构说明

```
xcx/
├── vercel.json          # Vercel 配置文件
├── server.js            # Express 后端服务器
├── package.json         # 项目依赖
├── public/              # 静态文件目录
│   ├── index.html       # 主页面
│   ├── app.js           # 前端 JavaScript
│   ├── styles.css       # 样式文件
│   └── ...              # 其他静态资源
└── scraper.js           # 天气数据爬虫
```

## 🔍 vercel.json 配置解释

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",        // 后端服务器
      "use": "@vercel/node"      // Node.js 运行时
    },
    {
      "src": "public/**",        // 静态文件
      "use": "@vercel/static"    // 静态文件处理
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",        // API 路由
      "dest": "/server.js"       // 转发到后端
    },
    {
      "src": "/(.*)",            // 其他请求
      "dest": "/public/$1"       // 转发到静态文件
    }
  ]
}
```

## 🌐 访问方式

部署成功后，您将获得：
- **生产环境地址**: `https://your-project-name.vercel.app`
- **API 端点**: `https://your-project-name.vercel.app/api/weather`
- **自动 HTTPS**: Vercel 自动提供 SSL 证书

## 🔧 本地开发与部署同步

### 本地运行命令
```bash
# 安装依赖
npm install

# 启动开发服务器
npm start

# 测试爬虫
node test-scraper.js
```

### Vercel CLI 部署（可选）
```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel

# 生产部署
vercel --prod
```

## 🐛 常见问题

### 1. 爬虫数据获取失败
**原因**: Vercel Serverless Functions 有执行时间限制
**解决**: 代码已优化超时处理和错误重试机制

### 2. 静态文件 404
**原因**: 文件路径配置问题
**解决**: 确保所有静态文件都在 `public/` 目录下

### 3. API 路由不工作
**原因**: `vercel.json` 路由配置问题
**解决**: 检查路由规则，确保 API 请求正确转发到 `server.js`

## 📊 性能优化

1. **缓存策略**: 天气数据缓存 5 分钟，避免频繁爬取
2. **错误处理**: 爬虫失败时使用备用数据
3. **超时控制**: 爬虫操作 30 秒超时
4. **资源优化**: 静态资源压缩和缓存

## 🔄 持续部署

每次推送到 GitHub 主分支，Vercel 会自动：
1. 检测代码变更
2. 构建新版本
3. 部署到生产环境
4. 提供部署状态通知

## 📞 技术支持

如遇到部署问题：
1. 检查 Vercel 控制台的部署日志
2. 确认 `package.json` 依赖完整
3. 验证 `vercel.json` 配置正确
4. 测试本地环境是否正常

---

🎉 **部署完成后，您的广元市天气分析系统将支持真实数据爬取，提供精美的苹果风格界面！**