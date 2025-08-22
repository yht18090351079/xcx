# 广元市天气分析系统

一个基于Node.js和Netlify的实时天气数据分析Web应用，专门为广元市提供详细的逐小时天气预报和可视化分析。

## 🌟 功能特性

- 📊 **实时数据**: 逐小时天气预报数据
- 📈 **数据可视化**: 温度趋势和降水概率图表
- 🎨 **现代界面**: 苹果风格的毛玻璃UI设计
- 📱 **响应式设计**: 完美适配桌面和移动设备
- ⚡ **高性能**: Netlify Functions提供快速API响应
- 🔒 **安全可靠**: 内置限流和错误处理机制

## 🚀 部署到Netlify

### 方法一：Git连接自动部署（推荐）

1. **推送代码到Git仓库**：
   ```bash
   git init
   git add .
   git commit -m "初始化广元市天气分析项目"
   git remote add origin <你的仓库地址>
   git push -u origin main
   ```

2. **在Netlify中连接仓库**：
   - 登录 [Netlify](https://app.netlify.com)
   - 点击 "New site from Git"
   - 选择你的Git提供商（GitHub/GitLab/Bitbucket）
   - 选择这个仓库
   - 构建设置会自动从`netlify.toml`读取：
     - Build command: `npm run build`
     - Publish directory: `public`
     - Functions directory: `netlify/functions`

3. **部署完成**：
   - Netlify会自动构建和部署
   - 获得形如 `https://your-site-name.netlify.app` 的URL

### 方法二：Netlify CLI手动部署

1. **安装Netlify CLI**：
   ```bash
   npm install -g netlify-cli
   # 或者使用项目中已包含的版本
   npm install
   ```

2. **登录Netlify**：
   ```bash
   netlify login
   ```

3. **初始化项目**：
   ```bash
   netlify init
   ```

4. **构建项目**：
   ```bash
   npm run build
   ```

5. **部署到生产环境**：
   ```bash
   npm run deploy
   # 或者
   netlify deploy --prod
   ```

## 🛠️ 本地开发

### 环境要求
- Node.js 18+
- npm 9+

### 安装依赖
```bash
npm install
```

### 本地开发服务器
```bash
# 使用Netlify Dev（推荐）
npm run dev

# 访问 http://localhost:888
```

### 传统Express服务器
```bash
# 如果需要使用原始Express服务器
npm start

# 访问 http://localhost:3000
```

## 📁 项目结构

```
xcx/
├── netlify/
│   └── functions/          # Netlify Functions
│       ├── weather.js      # 天气数据API
│       └── status.js       # 系统状态API
├── public/                 # 静态文件发布目录
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   ├── weather_data.json
│   └── _redirects
├── netlify.toml           # Netlify配置文件
├── package.json           # 项目配置
├── server.js             # Express服务器（本地开发）
├── scraper.js            # 数据爬虫（可选）
└── README.md
```

## 🔧 配置说明

### netlify.toml 配置
- **构建命令**: `npm run build`
- **发布目录**: `public`
- **函数超时**: 60秒
- **函数内存**: 2048MB
- **开发端口**: 888

### API 端点
- `GET /api/weather` - 获取天气数据
- `GET /api/status` - 获取系统状态

### 环境变量（可选）
在Netlify控制台的 Site settings > Environment variables 中设置：
- `NODE_ENV=production`
- 其他自定义配置...

## 📊 数据源

项目从以下来源获取天气数据：
- **主要数据源**: 内置的天气数据文件
- **备用方案**: 自动生成的模拟数据
- **未来扩展**: 支持实时API数据源

## 🎨 技术栈

- **前端**: 原生HTML + CSS + JavaScript
- **后端**: Netlify Functions (Node.js)
- **数据可视化**: Chart.js
- **UI框架**: 苹果风格自定义CSS
- **构建工具**: npm scripts
- **部署平台**: Netlify

## 🚨 注意事项

1. **函数限制**: Netlify Functions有执行时间和内存限制
2. **数据缓存**: 实现了10分钟缓存减少API调用
3. **请求限流**: 每分钟最多5次请求防止滥用
4. **错误处理**: 完善的错误处理和降级方案

## 📈 性能优化

- ✅ 数据缓存机制
- ✅ CDN静态资源分发
- ✅ 图片和资源优化
- ✅ 响应式设计
- ✅ 懒加载和按需加载

## 🔒 安全特性

- ✅ CORS跨域保护
- ✅ 请求频率限制
- ✅ XSS保护头部
- ✅ 内容安全策略
- ✅ 错误信息过滤

## 📞 支持

如有问题或建议，请：
1. 查看Netlify部署日志
2. 检查浏览器控制台错误
3. 验证API端点响应
4. 联系项目维护团队

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

**快速开始**: `npm install` → `npm run build` → `netlify deploy --prod`

🎉 享受您的广元市天气分析系统！
