# 广元市天气分析系统

一个基于OpenWeatherMap API和Netlify的实时天气数据分析Web应用，专门为广元市提供详细的逐小时天气预报和可视化分析。

## 🌟 功能特性

- 📊 **实时数据**: 基于OpenWeatherMap API的逐小时天气预报
- 📈 **数据可视化**: 温度趋势和降水概率图表
- 🎨 **现代界面**: 苹果风格的毛玻璃UI设计
- 📱 **响应式设计**: 完美适配桌面和移动设备
- ⚡ **高性能**: Netlify Functions提供快速API响应
- 🔒 **安全可靠**: 内置限流和错误处理机制
- 🌍 **全球数据**: 支持全球范围的天气数据获取

## 🔑 API配置

### 获取OpenWeatherMap API密钥

1. 访问 [OpenWeatherMap](https://openweathermap.org/api)
2. 注册免费账户
3. 获取API密钥 (每天1000次免费调用)
4. 在Netlify控制台设置环境变量

### 环境变量配置

在Netlify控制台的 `Site settings > Environment variables` 中添加：

```
OPENWEATHER_API_KEY=your_actual_api_key_here
```

> **注意**: 如果不配置API密钥，系统会自动使用模拟数据作为降级方案。

## 🚀 部署到Netlify

### 方法一：Git连接自动部署（推荐）

1. **推送代码到Git仓库**：
   ```bash
   git init
   git add .
   git commit -m "实时天气API系统"
   git remote add origin <你的仓库地址>
   git push -u origin main
   ```

2. **在Netlify中连接仓库**：
   - 登录 [Netlify](https://app.netlify.com)
   - 点击 "New site from Git"
   - 选择你的Git提供商（GitHub/GitLab/Bitbucket）
   - 选择这个仓库
   - 构建设置会自动从`netlify.toml`读取

3. **配置环境变量**：
   - 进入 Site settings > Environment variables
   - 添加 `OPENWEATHER_API_KEY` 变量
   - 值为你的OpenWeatherMap API密钥

4. **部署完成**：
   - Netlify会自动构建和部署
   - 获得形如 `https://your-site-name.netlify.app` 的URL

### 方法二：Netlify CLI手动部署

1. **安装依赖**：
   ```bash
   npm install
   ```

2. **登录Netlify**：
   ```bash
   netlify login
   ```

3. **设置环境变量** (本地开发)：
   ```bash
   # 创建 .env 文件
   echo "OPENWEATHER_API_KEY=your_api_key_here" > .env
   ```

4. **构建项目**：
   ```bash
   npm run build
   ```

5. **部署到生产环境**：
   ```bash
   npm run deploy
   ```

## 🛠️ 本地开发

### 环境要求
- Node.js 18+
- npm 9+
- OpenWeatherMap API密钥 (可选)

### 本地开发服务器
```bash
# 安装依赖
npm install

# 配置环境变量 (可选)
echo "OPENWEATHER_API_KEY=your_api_key" > .env

# 启动开发服务器
npm run dev

# 访问 http://localhost:888
```

## 📁 项目结构

```
xcx/
├── netlify/
│   └── functions/          # Netlify Functions
│       ├── weather.js      # 天气数据API (OpenWeatherMap)
│       └── status.js       # 系统状态API
├── public/                 # 静态文件发布目录
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   ├── weather_data.json   # 备用数据
│   └── _redirects
├── netlify.toml           # Netlify配置文件
├── package.json           # 项目配置
├── server.js             # Express服务器（本地开发）
└── README.md
```

## 🔧 配置说明

### netlify.toml 配置
- **构建命令**: `npm run build`
- **发布目录**: `public`
- **函数超时**: 30秒
- **函数内存**: 1024MB
- **开发端口**: 888

### API 端点
- `GET /api/weather` - 获取实时天气数据
- `GET /api/status` - 获取系统状态

### 数据源优先级
1. **OpenWeatherMap API** - 实时数据 (需要API密钥)
2. **本地缓存** - 10分钟有效期
3. **模拟数据** - 降级方案 (无API密钥时)

## 📊 技术栈

- **前端**: 原生HTML + CSS + JavaScript
- **后端**: Netlify Functions (Node.js)
- **数据源**: OpenWeatherMap API
- **数据可视化**: Chart.js
- **UI框架**: 苹果风格自定义CSS
- **构建工具**: npm scripts
- **部署平台**: Netlify

## 🌍 数据覆盖

- **城市**: 广元市 (经纬度: 32.4301, 106.0994)
- **数据范围**: 48小时逐小时预报
- **更新频率**: 实时数据，10分钟缓存
- **数据内容**: 
  - 温度、体感温度
  - 降水概率、湿度
  - 风速、风向
  - 云量、能见度
  - 气压、紫外线指数

## 🚨 注意事项

1. **API限制**: OpenWeatherMap免费版每天1000次调用
2. **缓存机制**: 10分钟缓存减少API调用
3. **请求限流**: 每分钟最多10次请求
4. **降级方案**: API不可用时自动切换到模拟数据
5. **环境变量**: 确保在生产环境正确配置API密钥

## 📈 性能优化

- ✅ API响应缓存 (10分钟)
- ✅ CDN静态资源分发
- ✅ 请求频率限制
- ✅ 智能降级机制
- ✅ 零生产依赖

## 🔒 安全特性

- ✅ CORS跨域保护
- ✅ 请求频率限制 (10次/分钟)
- ✅ XSS保护头部
- ✅ API密钥环境变量保护
- ✅ 输入验证和错误处理

## 📞 支持

### 常见问题

**Q: API显示"请配置API密钥"怎么办？**  
A: 在Netlify控制台的环境变量中设置 `OPENWEATHER_API_KEY`

**Q: 数据不是最新的？**  
A: 检查API调用额度是否用完，系统会自动使用缓存数据

**Q: 如何更换城市？**  
A: 修改 `netlify/functions/weather.js` 中的 `GUANGYUAN_COORDS` 坐标

### 技术支持
- 查看Netlify部署日志
- 检查浏览器控制台错误  
- 验证API密钥是否正确
- 联系项目维护团队

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

**快速开始**: 
1. 获取OpenWeatherMap API密钥
2. `npm install` → `npm run build` 
3. 配置环境变量 → `netlify deploy --prod`

🎉 享受您的实时天气分析系统！