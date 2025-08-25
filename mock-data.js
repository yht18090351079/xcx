// 模拟天气数据生成器
class MockWeatherDataGenerator {
    constructor() {
        this.weatherTypes = ['晴朗', '多云', '局部多云', '小雨', '阵雨', '大部晴朗'];
        this.currentTime = new Date();
    }
    
    // 生成模拟的天气数据（3天）
    generateMockData() {
        const mockData = [];
        const dates = this.getNext3Days();
        
        dates.forEach((date, dayIndex) => {
            // 每天24小时的数据
            for (let hour = 0; hour < 24; hour++) {
                const time = `${hour.toString().padStart(2, '0')}:00`;
                const baseTemp = 18 + Math.sin((hour - 6) / 24 * 2 * Math.PI) * 8; // 模拟温度变化
                const temperature = Math.round(baseTemp + Math.random() * 4 - 2);
                
                const weatherItem = {
                    date: date,
                    time: time,
                    weather: this.getRandomWeatherType(),
                    temperature: `${temperature}°`,
                    precipitation: `${Math.floor(Math.random() * 60)}%`,
                    uvIndex: hour >= 6 && hour <= 18 ? Math.floor(Math.random() * 8) : 'N/A',
                    windSpeed: `${Math.floor(Math.random() * 15 + 3)} 公里/小时`,
                    details: {
                        feelsLike: `${temperature + Math.floor(Math.random() * 6 - 3)}°`,
                        humidity: `${Math.floor(Math.random() * 40 + 40)}%`,
                        cloudCover: `${Math.floor(Math.random() * 100)}%`,
                        visibility: `${Math.floor(Math.random() * 20 + 10)} 公里`,
                        pressure: `${Math.floor(Math.random() * 50 + 1000)} 毫巴`,
                        windGust: `${Math.floor(Math.random() * 20 + 5)} 公里/小时`,
                        dewPoint: `${temperature - Math.floor(Math.random() * 10 + 5)}°`
                    }
                };
                
                mockData.push(weatherItem);
            }
        });
        
        return mockData;
    }
    
    // 获取接下来3天的日期
    getNext3Days() {
        const dates = [];
        const today = new Date();
        
        for (let i = 0; i < 3; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            
            const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            const dayName = dayNames[date.getDay()];
            const monthDay = `${date.getMonth() + 1}月${date.getDate()}日`;
            
            if (i === 0) {
                dates.push('今天');
            } else if (i === 1) {
                dates.push('明天');
            } else {
                dates.push(`${monthDay}${dayName}`);
            }
        }
        
        return dates;
    }
    
    // 随机选择天气类型
    getRandomWeatherType() {
        return this.weatherTypes[Math.floor(Math.random() * this.weatherTypes.length)];
    }
}

module.exports = MockWeatherDataGenerator;