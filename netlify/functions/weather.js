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

const puppeteer = require('puppeteer-core');
const chromium = require('chrome-aws-lambda');

// 简化版天气爬虫 - 适配Netlify Functions
class NetlifyWeatherScraper {
    constructor() {
        this.url = 'https://www.msn.cn/zh-cn/weather/hourlyforecast/in-%E5%9B%9B%E5%B7%9D%E7%9C%81,%E5%B9%BF%E5%85%83%E5%B8%82?loc=eyJhIjoi5p2%2B6b6Z5Z2qIiwibCI6IuaXuuiLjeWOvyIsInIiOiLlm5vlt53nnIEiLCJyMiI6IuW5v%2BWFg%2BW4giIsImMiOiLkuK3ljY7kurrmsJHlhbHlkozlm70iLCJpIjoiY24iLCJ0IjoxMDEsImciOiJ6aC1jbiIsIngiOiIxMDYuMDk5MzY2IiwieSI6IjMyLjQzMDEwMyJ9&weadegreetype=C&fcsttab=precipitation';
    }

    async scrape() {
        let browser = null;
        try {
            browser = await puppeteer.launch({
                args: chromium.args,
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath,
                headless: chromium.headless,
                ignoreHTTPSErrors: true,
            });

            const page = await browser.newPage();
            
            // 设置超时时间
            page.setDefaultNavigationTimeout(30000);
            page.setDefaultTimeout(30000);
            
            // 访问页面
            await page.goto(this.url, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });

            // 等待内容加载
            await page.waitForTimeout(5000);

            // 提取天气数据
            const weatherData = await page.evaluate(() => {
                const results = [];
                
                // 查找天气容器
                const tableContainer = document.getElementById('pageBlock_table');
                if (!tableContainer) {
                    return results;
                }

                // 获取日期标签
                const dateLabels = [];
                const dayLabelSelectors = [
                    '.dayLabel-DS-N4XCRy',
                    '[class*="dayLabel"]'
                ];
                
                dayLabelSelectors.forEach(selector => {
                    const labels = tableContainer.querySelectorAll(selector);
                    labels.forEach(label => {
                        const dateText = label.textContent.trim();
                        if (dateText && !dateLabels.includes(dateText)) {
                            dateLabels.push(dateText);
                        }
                    });
                });

                // 只取前3天的日期
                const availableDates = dateLabels.slice(0, 3);

                // 获取逐小时数据
                const hourlyItems = tableContainer.querySelectorAll('[id*="day-"][id*="-hourlyItem-"]');
                
                // 过滤前3天的数据
                const filteredItems = Array.from(hourlyItems).filter(item => {
                    const itemId = item.id || '';
                    const dayMatch = itemId.match(/day-(\d+)-/);
                    const dayIndex = dayMatch ? parseInt(dayMatch[1]) : 0;
                    return dayIndex < 3;
                });

                filteredItems.forEach((item, index) => {
                    try {
                        const itemId = item.id || '';
                        const dayMatch = itemId.match(/day-(\d+)-/);
                        const dayIndex = dayMatch ? parseInt(dayMatch[1]) : 0;
                        
                        const hourData = {
                            date: availableDates[dayIndex] || '',
                            time: '',
                            weather: '',
                            temperature: '',
                            precipitation: '',
                            windSpeed: ''
                        };

                        // 提取时间
                        const timeElement = item.querySelector('.timeItem-DS-hFPfcz span');
                        if (timeElement) {
                            hourData.time = timeElement.textContent.trim();
                        }

                        // 提取天气状况
                        const weatherElement = item.querySelector('.captureItem-DS-BM8Vzt span');
                        if (weatherElement) {
                            hourData.weather = weatherElement.textContent.trim();
                        }

                        // 提取基本信息
                        const rowInfoItems = item.querySelectorAll('.rowInfo-DS-JGD9Og .rowItemText-DS-cwphqS');
                        if (rowInfoItems.length >= 4) {
                            hourData.temperature = rowInfoItems[0].textContent.trim();
                            hourData.precipitation = rowInfoItems[1].textContent.trim();
                            hourData.windSpeed = rowInfoItems[3].textContent.trim();
                        }

                        if (hourData.time || hourData.weather || hourData.temperature) {
                            results.push(hourData);
                        }
                    } catch (itemError) {
                        console.warn(`提取第${index}项数据时出错:`, itemError.message);
                    }
                });

                return results;
            });

            return weatherData;

        } catch (error) {
            console.error('爬取失败:', error.message);
            throw error;
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }
}

// Netlify Function 处理器
exports.handler = async (event, context) => {
    // 设置CORS头
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // 处理OPTIONS请求
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
                message: '只允许GET请求'
            })
        };
    }

    try {
        const scraper = new NetlifyWeatherScraper();
        const weatherData = await scraper.scrape();

        if (!weatherData || weatherData.length === 0) {
            throw new Error('未获取到有效的天气数据');
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: weatherData,
                timestamp: new Date().toISOString(),
                count: weatherData.length
            })
        };

    } catch (error) {
        console.error('API错误:', error.message);
        
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
