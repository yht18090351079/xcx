const express = require('express');
const path = require('path');
const cors = require('cors');
const MSNWeatherScraper = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件设置
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// 缓存和限流配置
let weatherDataCache = {
    data: null,
    timestamp: null,
    expireTime: 10 * 60 * 1000 // 10分钟缓存
};

const requestLimiter = new Map();
const REQUEST_LIMIT = 5; // 每分钟最多5次请求
const LIMIT_WINDOW = 60 * 1000; // 1分钟

// 限流中间件
function rateLimiter(req, res, next) {
    const clientIP = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requestLimiter.has(clientIP)) {
        requestLimiter.set(clientIP, { count: 1, firstRequest: now });
        next();
        return;
    }
    
    const clientData = requestLimiter.get(clientIP);
    
    // 重置计数器（如果时间窗口已过）
    if (now - clientData.firstRequest > LIMIT_WINDOW) {
        requestLimiter.set(clientIP, { count: 1, firstRequest: now });
        next();
        return;
    }
    
    // 检查是否超过限制
    if (clientData.count >= REQUEST_LIMIT) {
        res.status(429).json({
            success: false,
            message: '请求过于频繁，请稍后重试',
            retryAfter: Math.ceil((LIMIT_WINDOW - (now - clientData.firstRequest)) / 1000)
        });
        return;
    }
    
    clientData.count++;
    next();
}

// 清理过期的限流记录
setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of requestLimiter.entries()) {
        if (now - data.firstRequest > LIMIT_WINDOW) {
            requestLimiter.delete(ip);
        }
    }
}, LIMIT_WINDOW);

// 工具函数：检查缓存是否有效
function isCacheValid() {
    return weatherDataCache.data && 
           weatherDataCache.timestamp && 
           (Date.now() - weatherDataCache.timestamp) < weatherDataCache.expireTime;
}

// 工具函数：更新缓存
function updateCache(data) {
    weatherDataCache.data = data;
    weatherDataCache.timestamp = Date.now();
}

// 路由：首页
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 路由：获取天气数据API
app.get('/api/weather', rateLimiter, async (req, res) => {
    try {
        // 检查缓存
        if (isCacheValid()) {
            console.log('📋 返回缓存数据');
            return res.json({
                success: true,
                data: weatherDataCache.data,
                cached: true,
                timestamp: new Date(weatherDataCache.timestamp).toISOString()
            });
        }

        console.log('🔄 开始抓取新的天气数据...');
        
        // 创建爬虫实例并抓取数据
        const scraper = new MSNWeatherScraper();
        const weatherData = await scraper.scrape();
        
        if (!weatherData || weatherData.length === 0) {
            throw new Error('未获取到有效的天气数据');
        }
        
        // 数据验证和清理
        const cleanedData = weatherData
            .filter(item => item && (item.time || item.temperature || item.weather))
            .map(item => ({
                date: item.date || '',
                time: item.time || '',
                weather: item.weather || '',
                temperature: item.temperature || '',
                precipitation: item.precipitation || '',
                uvIndex: item.uvIndex || '',
                windSpeed: item.windSpeed || '',
                details: item.details || {}
            }));
        
        if (cleanedData.length === 0) {
            throw new Error('数据处理后为空');
        }
        
        // 更新缓存
        updateCache(cleanedData);
        
        console.log(`✅ 成功获取 ${cleanedData.length} 条天气数据`);
        
        res.json({
            success: true,
            data: cleanedData,
            cached: false,
            timestamp: new Date().toISOString(),
            count: cleanedData.length
        });
        
    } catch (error) {
        console.error('❌ 天气数据获取失败:', error.message);
        
        // 如果有缓存数据，即使过期也返回（带警告）
        if (weatherDataCache.data) {
            console.log('⚠️ 返回过期缓存数据');
            return res.json({
                success: true,
                data: weatherDataCache.data,
                cached: true,
                expired: true,
                warning: '数据可能不是最新的',
                timestamp: new Date(weatherDataCache.timestamp).toISOString(),
                error: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: error.message || '服务器内部错误',
            timestamp: new Date().toISOString()
        });
    }
});

// 路由：获取系统状态
app.get('/api/status', (req, res) => {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    res.json({
        success: true,
        status: 'running',
        uptime: {
            seconds: Math.floor(uptime),
            human: formatUptime(uptime)
        },
        memory: {
            used: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
            total: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
            external: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100
        },
        cache: {
            hasData: !!weatherDataCache.data,
            age: weatherDataCache.timestamp ? 
                Math.floor((Date.now() - weatherDataCache.timestamp) / 1000) : null,
            isValid: isCacheValid()
        },
        rateLimiting: {
            activeClients: requestLimiter.size,
            limit: REQUEST_LIMIT,
            windowSeconds: LIMIT_WINDOW / 1000
        },
        timestamp: new Date().toISOString()
    });
});

// 路由：清除缓存（管理接口）
app.post('/api/cache/clear', (req, res) => {
    weatherDataCache.data = null;
    weatherDataCache.timestamp = null;
    
    console.log('🗑️ 缓存已清除');
    
    res.json({
        success: true,
        message: '缓存已清除',
        timestamp: new Date().toISOString()
    });
});

// 工具函数：格式化运行时间
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (days > 0) {
        return `${days}天 ${hours}小时 ${minutes}分钟`;
    } else if (hours > 0) {
        return `${hours}小时 ${minutes}分钟`;
    } else if (minutes > 0) {
        return `${minutes}分钟 ${secs}秒`;
    } else {
        return `${secs}秒`;
    }
}

// 错误处理中间件
app.use((error, req, res, next) => {
    console.error('服务器错误:', error);
    
    res.status(500).json({
        success: false,
        message: '服务器内部错误',
        timestamp: new Date().toISOString()
    });
});

// 404处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: '请求的资源不存在',
        path: req.path,
        timestamp: new Date().toISOString()
    });
});

// 优雅关闭处理
process.on('SIGTERM', () => {
    console.log('📴 收到 SIGTERM 信号，正在优雅关闭...');
    server.close(() => {
        console.log('✅ HTTP 服务器已关闭');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('📴 收到 SIGINT 信号，正在优雅关闭...');
    server.close(() => {
        console.log('✅ HTTP 服务器已关闭');
        process.exit(0);
    });
});

// 启动服务器
const server = app.listen(PORT, () => {
    console.log('🚀 ===== 广元市天气分析服务启动 =====');
    console.log(`📍 服务地址: http://localhost:${PORT}`);
    console.log(`📊 API 接口: http://localhost:${PORT}/api/weather`);
    console.log(`💻 管理面板: http://localhost:${PORT}/api/status`);
    console.log(`⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}`);
    console.log('========================================');
});

// 导出供测试使用
module.exports = app;