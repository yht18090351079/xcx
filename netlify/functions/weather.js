// 函数配置
exports.config = {
    timeout: 30, // 30秒超时
    memory: 1024 // 1024MB内存
};

// 缓存配置
let weatherDataCache = {
    data: null,
    timestamp: null,
    expireTime: 10 * 60 * 1000 // 10分钟缓存
};

// 请求限制配置
const requestLimiter = new Map();
const REQUEST_LIMIT = 10; // 每分钟最多10次请求
const LIMIT_WINDOW = 60 * 1000; // 1分钟

// OpenWeatherMap API配置
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || 'demo_key';
const GUANGYUAN_COORDS = {
    lat: 32.4301,
    lon: 106.0994
};

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

// 获取实时天气数据
async function fetchWeatherData() {
    const baseUrl = 'https://api.openweathermap.org/data/2.5';
    
    try {
        // 获取当前天气
        const currentResponse = await fetch(
            `${baseUrl}/weather?lat=${GUANGYUAN_COORDS.lat}&lon=${GUANGYUAN_COORDS.lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=zh_cn`
        );
        
        if (!currentResponse.ok) {
            throw new Error(`OpenWeatherMap API error: ${currentResponse.status}`);
        }
        
        // 获取48小时预报
        const forecastResponse = await fetch(
            `${baseUrl}/forecast?lat=${GUANGYUAN_COORDS.lat}&lon=${GUANGYUAN_COORDS.lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=zh_cn&cnt=48`
        );
        
        if (!forecastResponse.ok) {
            throw new Error(`OpenWeatherMap Forecast API error: ${forecastResponse.status}`);
        }
        
        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();
        
        return { current: currentData, forecast: forecastData };
        
    } catch (error) {
        console.error('获取天气数据失败:', error);
        throw error;
    }
}

// 转换API数据为我们的格式
function transformWeatherData(apiData) {
    const { current, forecast } = apiData;
    const result = [];
    
    // 添加当前天气数据
    const now = new Date();
    result.push({
        date: "今天",
        time: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        weather: current.weather[0].description || '未知',
        temperature: `${Math.round(current.main.temp)} °`,
        precipitation: current.rain ? `${Math.round((current.rain['1h'] || 0) * 100)}%` : '0%',
        uvIndex: current.uvi ? Math.round(current.uvi).toString() : '--',
        windSpeed: `${Math.round(current.wind.speed * 3.6)} 公里/小时`,
        details: {
            feelsLike: `${Math.round(current.main.feels_like)} °`,
            humidity: `${current.main.humidity}%`,
            cloudCover: `${current.clouds.all}%`,
            visibility: current.visibility ? `${Math.round(current.visibility / 1000)} 公里` : '--',
            pressure: `${current.main.pressure} hPa`,
            windGust: current.wind.gust ? `${Math.round(current.wind.gust * 3.6)} 公里/小时` : '--'
        }
    });
    
    // 添加预报数据
    forecast.list.forEach((item, index) => {
        const date = new Date(item.dt * 1000);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
        
        let dateStr;
        if (date.toDateString() === today.toDateString()) {
            dateStr = "今天";
        } else if (date.toDateString() === tomorrow.toDateString()) {
            dateStr = "明天";
        } else if (date.toDateString() === dayAfterTomorrow.toDateString()) {
            dateStr = "后天";
        } else {
            dateStr = date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
        }
        
        // 计算降水概率
        const precipitationProb = item.pop ? Math.round(item.pop * 100) : 0;
        
        result.push({
            date: dateStr,
            time: date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            weather: item.weather[0].description || '未知',
            temperature: `${Math.round(item.main.temp)} °`,
            precipitation: `${precipitationProb}%`,
            uvIndex: '--', // 5天预报通常不包含UV指数
            windSpeed: `${Math.round(item.wind.speed * 3.6)} 公里/小时`,
            details: {
                feelsLike: `${Math.round(item.main.feels_like)} °`,
                humidity: `${item.main.humidity}%`,
                cloudCover: `${item.clouds.all}%`,
                visibility: item.visibility ? `${Math.round(item.visibility / 1000)} 公里` : '--',
                pressure: `${item.main.pressure} hPa`,
                windGust: item.wind.gust ? `${Math.round(item.wind.gust * 3.6)} 公里/小时` : '--'
            },
            index: index + 1
        });
    });
    
    return result.slice(0, 48); // 限制到48小时
}

// 生成模拟数据（当API不可用时）
function generateMockWeatherData() {
    const mockData = [];
    const now = new Date();
    const weatherTypes = ['晴朗', '多云', '局部多云', '阴', '小雨', '局部晴朗'];
    
    for (let i = 0; i < 48; i++) {
        const time = new Date(now.getTime() + i * 60 * 60 * 1000);
        const hour = time.getHours().toString().padStart(2, '0') + ':00';
        
        let dateStr;
        if (i < 24) {
            dateStr = '今天';
        } else if (i < 48) {
            dateStr = '明天';
        } else {
            dateStr = '后天';
        }
        
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
            },
            index: i
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
                    timestamp: new Date(weatherDataCache.timestamp).toISOString(),
                    source: 'cache'
                })
            };
        }

        let weatherData;
        
        // 尝试获取实时API数据
        try {
            if (OPENWEATHER_API_KEY === 'demo_key') {
                throw new Error('请配置 OPENWEATHER_API_KEY 环境变量');
            }
            
            console.log('正在获取实时天气数据...');
            const apiData = await fetchWeatherData();
            weatherData = transformWeatherData(apiData);
            console.log(`成功获取 ${weatherData.length} 条实时天气数据`);
            
        } catch (apiError) {
            console.log('API调用失败，使用模拟数据:', apiError.message);
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

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: cleanedData,
                cached: false,
                timestamp: new Date().toISOString(),
                count: cleanedData.length,
                source: OPENWEATHER_API_KEY === 'demo_key' ? 'mock' : 'openweathermap-api'
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