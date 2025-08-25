# 🔑 OpenWeatherMap API 设置指南

## 1. 注册OpenWeatherMap账户

### 步骤1: 访问官网
- 打开 [OpenWeatherMap官网](https://openweathermap.org/)
- 点击右上角 "Sign Up" 按钮

### 步骤2: 创建账户
- 填写邮箱地址
- 设置密码
- 选择用途: "Education" 或 "Personal"
- 完成邮箱验证

## 2. 获取API密钥

### 步骤1: 登录控制台
- 登录后访问 [API Keys页面](https://home.openweathermap.org/api_keys)
- 或点击用户名 → "My API Keys"

### 步骤2: 生成密钥
- 默认会有一个 "Default" 密钥
- 或点击 "Generate" 创建新密钥
- 复制API密钥 (类似: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

> **注意**: 新创建的API密钥需要等待1-2小时才能激活

## 3. 在Netlify中配置环境变量

### 方法1: Netlify控制台配置

1. **进入站点设置**:
   - 登录 [Netlify控制台](https://app.netlify.com)
   - 选择您的站点
   - 点击 "Site settings"

2. **添加环境变量**:
   - 找到 "Environment variables" 部分
   - 点击 "Add variable"
   - Key: `OPENWEATHER_API_KEY`
   - Value: `你的API密钥`
   - 点击 "Save"

3. **重新部署**:
   - 返回站点概览
   - 点击 "Trigger deploy" → "Deploy site"

### 方法2: Netlify CLI配置

```bash
# 使用CLI设置环境变量
netlify env:set OPENWEATHER_API_KEY "你的API密钥"

# 重新部署
netlify deploy --prod
```

## 4. 本地开发配置

### 创建.env文件
```bash
# 在项目根目录创建 .env 文件
echo "OPENWEATHER_API_KEY=你的API密钥" > .env
```

### .env文件示例
```env
# OpenWeatherMap API配置
OPENWEATHER_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

# 其他可选配置
NODE_ENV=development
```

> **重要**: `.env` 文件已在 `.gitignore` 中，不会被提交到Git

## 5. 验证配置

### 检查API响应
部署后访问: `https://your-site.netlify.app/api/weather`

**成功响应示例**:
```json
{
  "success": true,
  "data": [...],
  "source": "openweathermap-api",
  "timestamp": "2024-08-22T12:00:00.000Z"
}
```

**配置错误响应**:
```json
{
  "success": true,
  "data": [...],
  "source": "mock",
  "warning": "使用模拟数据"
}
```

### 检查部署日志
在Netlify控制台查看部署日志:
- ✅ 成功: "成功获取 XX 条实时天气数据"
- ❌ 失败: "API调用失败，使用模拟数据"

## 6. API使用限制

### 免费版限制
- **请求次数**: 1,000次/天
- **请求频率**: 60次/分钟
- **数据延迟**: 10分钟
- **历史数据**: 5天

### 付费版升级
如需更多请求或实时数据:
- **Startup**: $40/月, 100,000次/天
- **Developer**: $180/月, 1,000,000次/天
- **Professional**: $600/月, 3,000,000次/天

## 7. 故障排除

### 常见错误

**错误1: "请配置 OPENWEATHER_API_KEY 环境变量"**
- 检查Netlify环境变量是否正确设置
- 确认变量名拼写正确 (区分大小写)
- 重新部署站点

**错误2: "OpenWeatherMap API error: 401"**
- API密钥无效或已过期
- 检查API密钥是否正确复制
- 确认API密钥已激活 (新密钥需1-2小时)

**错误3: "OpenWeatherMap API error: 429"**
- 超过API调用限制
- 等待限制重置 (每天UTC 00:00重置)
- 考虑升级到付费版

**错误4: 系统使用模拟数据**
- API配置可能有问题
- 检查网络连接
- 查看Netlify函数日志

### 调试步骤

1. **检查环境变量**:
   ```bash
   netlify env:list
   ```

2. **查看函数日志**:
   - Netlify控制台 → Functions → 查看日志

3. **本地测试**:
   ```bash
   # 设置环境变量并测试
   export OPENWEATHER_API_KEY="你的密钥"
   npm run dev
   ```

4. **API直接测试**:
   ```bash
   curl "https://api.openweathermap.org/data/2.5/weather?lat=32.4301&lon=106.0994&appid=你的密钥&units=metric&lang=zh_cn"
   ```

## 8. 优化建议

### 减少API调用
- ✅ 使用10分钟缓存 (已实现)
- ✅ 实现请求限流 (已实现)
- ✅ 错误降级机制 (已实现)

### 监控使用量
- 定期检查 [OpenWeatherMap Dashboard](https://home.openweathermap.org/statistics)
- 设置使用量警报
- 考虑实现使用量监控

### 安全最佳实践
- ✅ 使用环境变量存储密钥
- ✅ 不在代码中硬编码密钥
- ✅ 定期轮换API密钥
- ✅ 监控异常使用

---

## 📞 需要帮助？

- **OpenWeatherMap文档**: https://openweathermap.org/api
- **Netlify环境变量文档**: https://docs.netlify.com/environment-variables/
- **项目问题**: 查看项目README.md文件

🎉 **配置完成后，您的天气系统就能获取真实的广元市天气数据了！**
