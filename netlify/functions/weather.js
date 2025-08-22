const fs = require('fs');
const path = require('path');

// 缓存配置
let weatherDataCache = {
    data: null,
    timestamp: null,
    expireTime: 10 * 60 * 1000 // 10分钟缓存
};

// 请求限制配置
const requestLimiter = new Map();
const REQUEST_LIMIT = 5; // 每分钟最多5次请求
const LIMIT_WINDOW = 60 * 1000; // 1分钟

// 限流检查函数
function checkRateLimit(clientIP) {
    const now = Date.now();
    
    if (!requestLimiter.has(clientIP)) {
        requestLimiter.set(clientIP, { count: 1, firstRequest: now });
        return { allowed: true };
    }
    
    const clientData = requestLimiter.get(clientIP);
    
    // 重置计数器（如果时间窗口已过）
    if (now - clientData.firstRequest > LIMIT_WINDOW) {
        requestLimiter.set(clientIP, { count: 1, firstRequest: now });
        return { allowed: true };
    }
    
    // 检查是否超过限制
    if (clientData.count >= REQUEST_LIMIT) {
        return { 
            allowed: false, 
            retryAfter: Math.ceil((LIMIT_WINDOW - (now - clientData.firstRequest)) / 1000)
        };
    }
    
    clientData.count++;
    return { allowed: true };
}

// 检查缓存是否有效
function isCacheValid() {
    return weatherDataCache.data && 
           weatherDataCache.timestamp && 
           (Date.now() - weatherDataCache.timestamp) < weatherDataCache.expireTime;
}

// 更新缓存
function updateCache(data) {
    weatherDataCache.data = data;
    weatherDataCache.timestamp = Date.now();
}

// 模拟天气数据（如果没有真实数据）
function generateMockWeatherData() {
    const mockData = [];
    const now = new Date();
    const weatherTypes = ['晴朗', '多云', '局部多云', '阴', '小雨', '局部晴朗'];
    
    for (let i = 0; i < 48; i++) {
        const time = new Date(now.getTime() + i * 60 * 60 * 1000);
        const hour = time.getHours().toString().padStart(2, '0') + ':00';
        const dateStr = i < 24 ? '今天' : (i < 48 ? '明天' : '后天');
        
        mockData.push({
            date: dateStr,
            time: hour,
            weather: weatherTypes[Math.floor(Math.random() * weatherTypes.length)],
            temperature: `${Math.floor(Math.random() * 15) + 15} °`,
            precipitation: `${Math.floor(Math.random() * 100)} %`,
            uvIndex: Math.floor(Math.random() * 10).toString(),
            windSpeed: `${Math.floor(Math.random() * 20) + 1} 公里/小时`,
            details: {
                feelsLike: `${Math.floor(Math.random() * 15) + 15} °`,
                humidity: `${Math.floor(Math.random() * 40) + 40}%`,
                cloudCover: `${Math.floor(Math.random() * 100)}%`,
                visibility: `${Math.floor(Math.random() * 20) + 10} 公里`,
                pressure: `${Math.floor(Math.random() * 50) + 950} hPa`
            }
        });
    }
    
    return mockData;
}

// 主函数
exports.handler = async (event, context) => {
    // 设置CORS头
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // 处理OPTIONS请求（CORS预检）
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // 只允许GET请求
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({
                success: false,
                message: '方法不允许'
            })
        };
    }

    try {
        // 获取客户端IP
        const clientIP = event.headers['x-forwarded-for'] || 
                        event.headers['x-real-ip'] || 
                        context.ip || 
                        'unknown';

        // 检查请求限制
        const rateLimitResult = checkRateLimit(clientIP);
        if (!rateLimitResult.allowed) {
            return {
                statusCode: 429,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: '请求过于频繁，请稍后重试',
                    retryAfter: rateLimitResult.retryAfter
                })
            };
        }

        // 检查缓存
        if (isCacheValid()) {
            console.log('返回缓存数据');
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    data: weatherDataCache.data,
                    cached: true,
                    timestamp: new Date(weatherDataCache.timestamp).toISOString()
                })
            };
        }

        // 尝试读取现有的天气数据文件
        let weatherData;
        try {
            const dataPath = path.join(process.cwd(), 'weather_data.json');
            if (fs.existsSync(dataPath)) {
                const fileContent = fs.readFileSync(dataPath, 'utf8');
                const parsedData = JSON.parse(fileContent);
                weatherData = parsedData.data || parsedData;
                console.log('使用现有天气数据文件');
            } else {
                throw new Error('天气数据文件不存在');
            }
        } catch (fileError) {
            console.log('无法读取天气数据文件，生成模拟数据:', fileError.message);
            weatherData = generateMockWeatherData();
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
            throw new Error('处理后的数据为空');
        }

        // 更新缓存
        updateCache(cleanedData);

        console.log(`成功返回 ${cleanedData.length} 条天气数据`);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: cleanedData,
                cached: false,
                timestamp: new Date().toISOString(),
                count: cleanedData.length,
                source: 'netlify-function'
            })
        };

    } catch (error) {
        console.error('天气数据获取失败:', error.message);

        // 如果有缓存数据，即使过期也返回（带警告）
        if (weatherDataCache.data) {
            console.log('返回过期缓存数据');
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    data: weatherDataCache.data,
                    cached: true,
                    expired: true,
                    warning: '数据可能不是最新的',
                    timestamp: new Date(weatherDataCache.timestamp).toISOString(),
                    error: error.message
                })
            };
        }

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: error.message || '服务器内部错误',
                timestamp: new Date().toISOString()
            })
        };
    }
};
