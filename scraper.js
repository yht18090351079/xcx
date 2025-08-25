const puppeteer = require('puppeteer');

class MSNWeatherScraper {
    constructor() {
        this.url = 'https://www.msn.cn/zh-cn/weather/hourlyforecast/in-%E5%9B%9B%E5%B7%9D%E7%9C%81,%E5%B9%BF%E5%85%83%E5%B8%82?loc=eyJhIjoi5p2%2B6b6Z5Z2qIiwibCI6IuaXuuiLjeWOvyIsInIiOiLlm5vlt53nnIEiLCJyMiI6IuW5v%2BWFg%2BW4giIsImMiOiLkuK3ljY7kurrmsJHlhbHlkozlm70iLCJpIjoiY24iLCJ0IjoxMDEsImciOiJ6aC1jbiIsIngiOiIxMDYuMDk5MzY2IiwieSI6IjMyLjQzMDEwMyJ9&weadegreetype=C&fcsttab=precipitation';
        this.browser = null;
        this.page = null;
    }

    /**
     * 初始化浏览器和页面
     */
    async init() {
        try {
            this.browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-web-security'
                ],
                timeout: 30000
            });

            this.page = await this.browser.newPage();
            
            // 设置超时时间
            this.page.setDefaultTimeout(30000);
            this.page.setDefaultNavigationTimeout(30000);
            
            // 设置用户代理
            await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            
            // 设置视口
            await this.page.setViewport({ width: 1366, height: 768 });

            console.log('✅ 浏览器初始化成功');
        } catch (error) {
            console.error('❌ 浏览器初始化失败:', error.message);
            throw error;
        }
    }

    /**
     * 加载网页并等待内容
     */
    async loadPage() {
        try {
            console.log('🔄 正在加载网页...');
            
            await this.page.goto(this.url, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });
            
            // 等待页面稳定
            await this.page.waitForTimeout(5000);
            
            // 查找主要容器
            try {
                await this.page.waitForSelector('#pageBlock_table', { timeout: 10000 });
                console.log('✅ 找到主要天气容器');
            } catch (e) {
                console.log('⚠️ 主容器未找到，尝试继续...');
            }
            
            // 简单滚动
            console.log('🔄 滚动页面...');
            await this.page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });
            
            await this.page.waitForTimeout(3000);
            
            console.log('✅ 网页加载完成');
            
        } catch (error) {
            console.error('❌ 网页加载失败:', error.message);
            throw error;
        }
    }

    /**
     * 提取天气数据
     */
    async extractWeatherData() {
        try {
            console.log('🔄 正在提取天气数据...');

            const weatherData = await this.page.evaluate(() => {
                const results = [];
                
                // 查找 pageBlock_table 容器
                const tableContainer = document.getElementById('pageBlock_table');
                if (!tableContainer) {
                    throw new Error('未找到 pageBlock_table 容器');
                }

                // 提取日期信息
                const extractDateInfo = () => {
                    const dateLabels = [];
                    
                    // 查找所有日期标签 - 扩展选择器
                    const dayLabelSelectors = [
                        '.dayLabel-DS-N4XCRy',
                        '.title-DS-fNSm7_ .dayLabel-DS-N4XCRy',
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
                    
                    console.log('找到的日期标签:', dateLabels);
                    
                    // 只返回前三天的日期标签
                    return dateLabels.slice(0, 3);
                };
                
                const availableDates = extractDateInfo();
                
                // 调试信息：显示页面结构
                console.log('页面调试信息:');
                const allDayElements = tableContainer.querySelectorAll('[id*="day-"]');
                console.log('所有包含day-的元素数量:', allDayElements.length);
                
                // 查找所有可能的天气项目容器
                const possibleContainers = [
                    '[id*="day-"][id*="-hourlyItem-"]',
                    '[id*="day-"][id*="hourlyItem"]',
                    '[class*="hourlyItem"]',
                    '[class*="mainRow"]'
                ];
                
                let allHourlyItems = [];
                possibleContainers.forEach(selector => {
                    const items = tableContainer.querySelectorAll(selector);
                    console.log(`选择器 "${selector}" 找到 ${items.length} 个元素`);
                    if (items.length > allHourlyItems.length) {
                        allHourlyItems = Array.from(items);
                    }
                });

                // 使用最佳的选择器获取所有逐小时天气项目
                const hourlyItems = allHourlyItems.length > 0 ? allHourlyItems : 
                    Array.from(tableContainer.querySelectorAll('[id*="day-"][id*="-hourlyItem-"]'));
                
                console.log(`最终使用的逐小时项目数量: ${hourlyItems.length}`);
                
                // 统计每天的数据项目
                const dayStats = {};
                hourlyItems.forEach(item => {
                    const itemId = item.id || '';
                    const dayMatch = itemId.match(/day-(\d+)-/);
                    const dayIndex = dayMatch ? dayMatch[1] : 'unknown';
                    dayStats[dayIndex] = (dayStats[dayIndex] || 0) + 1;
                });
                console.log('每天的数据项目统计:', dayStats);
                
                // 只处理前三天的数据
                const filteredHourlyItems = hourlyItems.filter(item => {
                    const itemId = item.id || '';
                    const dayMatch = itemId.match(/day-(\d+)-/);
                    const dayIndex = dayMatch ? parseInt(dayMatch[1]) : 0;
                    return dayIndex < 3; // 只要前3天 (day-0, day-1, day-2)
                });
                
                console.log(`过滤后的数据项目数量: ${filteredHourlyItems.length} (只保留前3天)`);
                
                filteredHourlyItems.forEach((item, index) => {
                    const hourData = {};
                    
                    try {
                        // 从ID中提取日期索引 (例如: day-0-hourlyItem-1 中的 0)
                        const itemId = item.id || '';
                        const dayMatch = itemId.match(/day-(\d+)-/);
                        const dayIndex = dayMatch ? parseInt(dayMatch[1]) : 0;
                        
                        // 添加日期信息
                        if (availableDates[dayIndex]) {
                            hourData.date = availableDates[dayIndex];
                        }
                        
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
                        
                        // 提取基本信息（温度、降水概率、紫外线、风速）
                        const rowInfoItems = item.querySelectorAll('.rowInfo-DS-JGD9Og .rowItemText-DS-cwphqS');
                        if (rowInfoItems.length >= 4) {
                            hourData.temperature = rowInfoItems[0].textContent.trim(); // 温度
                            hourData.precipitation = rowInfoItems[1].textContent.trim(); // 降水概率
                            hourData.uvIndex = rowInfoItems[2].textContent.trim(); // 紫外线指数
                            hourData.windSpeed = rowInfoItems[3].textContent.trim(); // 风速
                        }
                        
                        // 提取扩展信息（体感温度、云量、可见性等）
                        const expandedInfo = item.querySelector('.expandedInfo-DS-SZHQ7S');
                        if (expandedInfo) {
                            const expandedItems = expandedInfo.querySelectorAll('.rowItem-DS-K_cUkD');
                            const expandedData = {};
                            
                            expandedItems.forEach(expandedItem => {
                                const label = expandedItem.querySelector('.itemLabel-DS-EtLmOv');
                                const value = expandedItem.querySelector('.itemValue-DS-hGqBrX');
                                
                                if (label && value) {
                                    const labelText = label.textContent.trim();
                                    const valueText = value.textContent.trim();
                                    
                                    switch(labelText) {
                                        case '体感温度':
                                            expandedData.feelsLike = valueText;
                                            break;
                                        case '云量':
                                            expandedData.cloudCover = valueText;
                                            break;
                                        case '可见性':
                                            expandedData.visibility = valueText;
                                            break;
                                        case '阵风':
                                            expandedData.windGust = valueText;
                                            break;
                                        case '湿度':
                                            expandedData.humidity = valueText;
                                            break;
                                        case '露点':
                                            expandedData.dewPoint = valueText;
                                            break;
                                        case '气压':
                                            expandedData.pressure = valueText;
                                            break;
                                    }
                                }
                            });
                            
                            if (Object.keys(expandedData).length > 0) {
                                hourData.details = expandedData;
                            }
                        }
                        
                        // 只添加有有效数据的项目
                        if (Object.keys(hourData).length > 0) {
                            hourData.index = index;
                            results.push(hourData);
                        }
                        
                    } catch (itemError) {
                        console.warn(`提取第${index}项数据时出错:`, itemError.message);
                    }
                });

                return results;
            });

            console.log('✅ 数据提取完成');
            return weatherData;

        } catch (error) {
            console.error('❌ 数据提取失败:', error.message);
            throw error;
        }
    }

    /**
     * 格式化并显示数据
     */
    displayData(weatherData) {
        console.log('\n📊 ===== MSN天气数据 =====');
        console.log(`📅 抓取时间: ${new Date().toLocaleString('zh-CN')}`);
        console.log('🌤️  逐小时天气详情:');
        
        if (weatherData && weatherData.length > 0) {
            // 按日期分组显示
            const groupedByDate = {};
            weatherData.forEach(item => {
                const dateKey = item.date || '未知日期';
                if (!groupedByDate[dateKey]) {
                    groupedByDate[dateKey] = [];
                }
                groupedByDate[dateKey].push(item);
            });

            // 显示每个日期的数据
            Object.entries(groupedByDate).forEach(([date, items]) => {
                console.log(`\n📅 ${date}:`);
                console.log('='.repeat(60));
                
                items.forEach((item, index) => {
                    const dateTimeDisplay = item.date ? 
                        `${item.date} ${item.time || '未知时间'}` : 
                        `${item.time || '未知时间'}`;
                    
                    console.log(`\n⏰ ${dateTimeDisplay}:`);
                    console.log(`   🌤️  天气: ${item.weather || '未获取'}`);
                    console.log(`   🌡️  温度: ${item.temperature || '未获取'}`);
                    console.log(`   🌧️  降水概率: ${item.precipitation || '未获取'}`);
                    console.log(`   ☀️  紫外线指数: ${item.uvIndex || '未获取'}`);
                    console.log(`   💨 风速: ${item.windSpeed || '未获取'}`);
                    
                    // 显示详细信息（如果有）
                    if (item.details && Object.keys(item.details).length > 0) {
                        console.log('   📋 详细信息:');
                        if (item.details.feelsLike) console.log(`     体感温度: ${item.details.feelsLike}`);
                        if (item.details.cloudCover) console.log(`     云量: ${item.details.cloudCover}`);
                        if (item.details.visibility) console.log(`     可见性: ${item.details.visibility}`);
                        if (item.details.windGust) console.log(`     阵风: ${item.details.windGust}`);
                        if (item.details.humidity) console.log(`     湿度: ${item.details.humidity}`);
                        if (item.details.dewPoint) console.log(`     露点: ${item.details.dewPoint}`);
                        if (item.details.pressure) console.log(`     气压: ${item.details.pressure}`);
                    }
                    
                    console.log('   ' + '-'.repeat(40));
                });
            });
            
            // 统计信息
            console.log(`\n📈 数据统计:`);
            console.log(`   总时段数: ${weatherData.length}个`);
            
            // 统计不同天气状况
            const weatherTypes = {};
            let precipitationSum = 0;
            let precipitationCount = 0;
            
            weatherData.forEach(item => {
                if (item.weather) {
                    weatherTypes[item.weather] = (weatherTypes[item.weather] || 0) + 1;
                }
                
                if (item.precipitation && item.precipitation !== '--' && item.precipitation.includes('%')) {
                    const percentage = parseFloat(item.precipitation.replace('%', '').trim());
                    if (!isNaN(percentage)) {
                        precipitationSum += percentage;
                        precipitationCount++;
                    }
                }
            });
            
            console.log('   天气状况统计:');
            Object.entries(weatherTypes).forEach(([weather, count]) => {
                console.log(`     ${weather}: ${count}次`);
            });
            
            if (precipitationCount > 0) {
                const avgPrecipitation = (precipitationSum / precipitationCount).toFixed(1);
                console.log(`   平均降水概率: ${avgPrecipitation}%`);
            }
            
        } else {
            console.log('⚠️ 未获取到有效数据');
        }

        console.log('\n' + '='.repeat(50) + '\n');
        
        return weatherData;
    }

    /**
     * 关闭浏览器
     */
    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('✅ 浏览器已关闭');
        }
    }

    /**
     * 主要执行函数
     */
    async scrape() {
        try {
            await this.init();
            await this.loadPage();
            const data = await this.extractWeatherData();
            const formattedData = this.displayData(data);
            
            return formattedData;
        } catch (error) {
            console.error('❌ 抓取过程出错:', error.message);
            throw error;
        } finally {
            await this.close();
        }
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    async function main() {
        const scraper = new MSNWeatherScraper();
        
        try {
            const data = await scraper.scrape();
            
            // 可选: 将数据保存到文件
            const fs = require('fs');
            const outputData = {
                timestamp: new Date().toISOString(),
                data: data
            };
            
            fs.writeFileSync('weather_data.json', JSON.stringify(outputData, null, 2), 'utf8');
            console.log('💾 数据已保存到 weather_data.json');
            
        } catch (error) {
            console.error('❌ 程序执行失败:', error.message);
            process.exit(1);
        }
    }

    main();
}

module.exports = MSNWeatherScraper;
