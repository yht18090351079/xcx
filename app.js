// 天气分析应用主类
class WeatherAnalysisApp {
    constructor() {
        this.weatherData = [];
        this.charts = {};
        this.isLoading = false;
        
        // DOM元素引用
        this.elements = {
            loadingOverlay: document.getElementById('loadingOverlay'),
            lastUpdate: document.getElementById('lastUpdate'),
            refreshBtn: document.getElementById('refreshBtn'),
            
            // 统计卡片元素
            avgPrecipitation: document.getElementById('avgPrecipitation'),
            maxPrecipitation: document.getElementById('maxPrecipitation'),
            rainyPeriods: document.getElementById('rainyPeriods'),
            currentWeather: document.getElementById('currentWeather'),
            
            // 图表画布
            temperatureChart: document.getElementById('temperatureChart'),
            precipitationChart: document.getElementById('precipitationChart'),
            
            // 表格和过滤器
            weatherTable: document.getElementById('weatherTable'),
            weatherTableBody: document.getElementById('weatherTableBody'),
            dayFilter: document.getElementById('dayFilter'),
            
            // 错误模态框
            errorModal: document.getElementById('errorModal'),
            errorMessage: document.getElementById('errorMessage'),
            closeErrorModal: document.getElementById('closeErrorModal'),
            retryBtn: document.getElementById('retryBtn')
        };
        
        this.init();
    }
    
    // 初始化应用
    async init() {
        this.bindEvents();
        this.initCharts();
        await this.loadWeatherData();
    }
    
    // 绑定事件监听器
    bindEvents() {
        // 刷新按钮
        this.elements.refreshBtn.addEventListener('click', () => {
            this.loadWeatherData();
        });
        
        // 图表切换按钮
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const chartType = e.target.dataset.chart;
                const container = e.target.closest('.chart-container');
                
                // 更新按钮状态
                container.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // 更新图表
                this.updateChart(container, chartType);
            });
        });
        
        // 日期过滤器
        this.elements.dayFilter.addEventListener('change', (e) => {
            this.filterTableData(e.target.value);
        });
        
        // 错误模态框事件
        this.elements.closeErrorModal.addEventListener('click', () => {
            this.hideErrorModal();
        });
        
        this.elements.retryBtn.addEventListener('click', () => {
            this.hideErrorModal();
            this.loadWeatherData();
        });
        
        // 点击模态框背景关闭
        this.elements.errorModal.addEventListener('click', (e) => {
            if (e.target === this.elements.errorModal) {
                this.hideErrorModal();
            }
        });
        
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideErrorModal();
            }
            if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
                e.preventDefault();
                this.loadWeatherData();
            }
        });
    }
    
    // 初始化图表
    initCharts() {
        // 温度图表
        const tempCtx = this.elements.temperatureChart.getContext('2d');
        this.charts.temperature = new Chart(tempCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '温度 (°C)',
                    data: [],
                    borderColor: '#FF9800',
                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#FF9800',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#FF9800',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            title: function(context) {
                                return `时间: ${context[0].label}`;
                            },
                            label: function(context) {
                                return `温度: ${context.parsed.y}°C`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: '时间',
                            font: {
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: '温度 (°C)',
                            font: {
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                }
            }
        });
        
        // 降水图表
        const precipCtx = this.elements.precipitationChart.getContext('2d');
        this.charts.precipitation = new Chart(precipCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: '降水概率 (%)',
                    data: [],
                    backgroundColor: 'rgba(33, 150, 243, 0.6)',
                    borderColor: '#2196F3',
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#2196F3',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            title: function(context) {
                                return `时间: ${context[0].label}`;
                            },
                            label: function(context) {
                                return `降水概率: ${context.parsed.y}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: '时间',
                            font: {
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: '概率 (%)',
                            font: {
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }
    
    // 加载天气数据
    async loadWeatherData() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            // 检测是否在Netlify环境
            const apiBase = window.location.hostname.includes('netlify.app') || 
                           window.location.hostname.includes('netlify.com') ||
                           window.location.port === '888' ? '' : '';
            const response = await fetch(`${apiBase}/api/weather`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || '数据获取失败');
            }
            
            this.weatherData = result.data || [];
            this.updateUI();
            this.updateLastUpdateTime();
            
        } catch (error) {
            console.error('加载天气数据失败:', error);
            this.showErrorModal(`数据加载失败: ${error.message}`);
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }
    
    // 更新UI界面
    updateUI() {
        if (!this.weatherData || this.weatherData.length === 0) {
            this.showErrorModal('暂无天气数据');
            return;
        }
        
        this.updateStatsCards();
        this.updateCharts();
        this.updateTable();
        this.updateDayFilter();
    }
    
    // 更新统计卡片
    updateStatsCards() {
        const stats = this.calculateStats();
        
        // 降水统计
        this.elements.avgPrecipitation.textContent = `${stats.avgPrecipitation}%`;
        this.elements.maxPrecipitation.textContent = `${stats.maxPrecipitation}%`;
        this.elements.rainyPeriods.textContent = `${stats.rainyPeriods}个`;
        
        // 天气统计
        this.elements.currentWeather.textContent = stats.currentWeather;
        this.elements.avgWindSpeed.textContent = stats.avgWindSpeed;
        this.elements.avgUVIndex.textContent = stats.avgUVIndex;
    }
    
    // 计算统计数据
    calculateStats() {
        const precipitations = this.weatherData
            .map(item => this.parsePrecipitation(item.precipitation))
            .filter(prec => !isNaN(prec));
            
        const windSpeeds = this.weatherData
            .map(item => item.windSpeed)
            .filter(speed => speed && speed !== '--');
            
        const uvIndexes = this.weatherData
            .map(item => item.uvIndex)
            .filter(uv => uv && uv !== '--');
        
        return {
            avgPrecipitation: precipitations.length > 0 ? 
                Math.round(precipitations.reduce((a, b) => a + b, 0) / precipitations.length) : '--',
            maxPrecipitation: precipitations.length > 0 ? Math.max(...precipitations) : '--',
            rainyPeriods: precipitations.filter(p => p > 30).length,
            currentWeather: this.weatherData[0]?.weather || '--',
            avgWindSpeed: windSpeeds.length > 0 ? windSpeeds[0] : '--',
            avgUVIndex: uvIndexes.length > 0 ? uvIndexes[0] : '--'
        };
    }
    
    // 解析温度数据
    parseTemperature(tempStr) {
        if (!tempStr || tempStr === '--') return NaN;
        const match = tempStr.match(/-?\d+/);
        return match ? parseInt(match[0]) : NaN;
    }
    
    // 解析降水概率数据
    parsePrecipitation(precipStr) {
        if (!precipStr || precipStr === '--') return NaN;
        const match = precipStr.match(/\d+/);
        return match ? parseInt(match[0]) : NaN;
    }
    
    // 更新图表
    updateCharts() {
        const labels = this.weatherData.map(item => {
            const date = item.date || '';
            const time = item.time || '';
            return time || `${date} ${time}`;
        });
        
        // 更新温度图表
        const temperatures = this.weatherData.map(item => this.parseTemperature(item.temperature));
        this.charts.temperature.data.labels = labels;
        this.charts.temperature.data.datasets[0].data = temperatures;
        this.charts.temperature.update();
        
        // 更新降水图表
        const precipitations = this.weatherData.map(item => this.parsePrecipitation(item.precipitation));
        this.charts.precipitation.data.labels = labels;
        this.charts.precipitation.data.datasets[0].data = precipitations;
        this.charts.precipitation.update();
    }
    
    // 更新特定图表
    updateChart(container, chartType) {
        const canvas = container.querySelector('canvas');
        const chartId = canvas.id;
        
        if (!this.charts[chartId.replace('Chart', '')]) return;
        
        const chart = this.charts[chartId.replace('Chart', '')];
        const labels = this.weatherData.map(item => {
            const date = item.date || '';
            const time = item.time || '';
            return time || `${date} ${time}`;
        });
        
        let data, label, color;
        
        switch (chartType) {
            case 'temperature':
                data = this.weatherData.map(item => this.parseTemperature(item.temperature));
                label = '温度 (°C)';
                color = '#FF9800';
                break;
            case 'feelsLike':
                data = this.weatherData.map(item => {
                    const feelsLike = item.details?.feelsLike;
                    return feelsLike ? this.parseTemperature(feelsLike) : NaN;
                });
                label = '体感温度 (°C)';
                color = '#FF5722';
                break;
            case 'precipitation':
                data = this.weatherData.map(item => this.parsePrecipitation(item.precipitation));
                label = '降水概率 (%)';
                color = '#2196F3';
                break;
            case 'humidity':
                data = this.weatherData.map(item => {
                    const humidity = item.details?.humidity;
                    return humidity ? this.parsePrecipitation(humidity) : NaN;
                });
                label = '湿度 (%)';
                color = '#00BCD4';
                break;
        }
        
        chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        chart.data.datasets[0].label = label;
        chart.data.datasets[0].borderColor = color;
        chart.data.datasets[0].backgroundColor = chartType === 'precipitation' || chartType === 'humidity' ? 
            color.replace(')', ', 0.6)').replace('rgb', 'rgba') : 
            color.replace(')', ', 0.1)').replace('rgb', 'rgba');
        chart.update();
    }
    
    // 更新数据表格
    updateTable() {
        const tbody = this.elements.weatherTableBody;
        tbody.innerHTML = '';
        
        this.weatherData.forEach(item => {
            const row = document.createElement('tr');
            
            const dateTime = item.date ? `${item.date} ${item.time || ''}` : item.time || '--';
            const weather = item.weather || '--';
            const temperature = item.temperature || '--';
            const feelsLike = item.details?.feelsLike || '--';
            const precipitation = item.precipitation || '--';
            const windSpeed = item.windSpeed || '--';
            const uvIndex = item.uvIndex || '--';
            const humidity = item.details?.humidity || '--';
            
            row.innerHTML = `
                <td>${dateTime}</td>
                <td>${weather}</td>
                <td>${temperature}</td>
                <td>${feelsLike}</td>
                <td>${precipitation}</td>
                <td>${windSpeed}</td>
                <td>${uvIndex}</td>
                <td>${humidity}</td>
            `;
            
            tbody.appendChild(row);
        });
    }
    
    // 更新日期过滤器
    updateDayFilter() {
        const dayFilter = this.elements.dayFilter;
        const dates = [...new Set(this.weatherData.map(item => item.date).filter(date => date))];
        
        // 清空现有选项，保留"所有天数"
        while (dayFilter.children.length > 1) {
            dayFilter.removeChild(dayFilter.lastChild);
        }
        
        // 添加日期选项
        dates.forEach(date => {
            const option = document.createElement('option');
            option.value = date;
            option.textContent = date;
            dayFilter.appendChild(option);
        });
    }
    
    // 过滤表格数据
    filterTableData(selectedDate) {
        const tbody = this.elements.weatherTableBody;
        const rows = tbody.querySelectorAll('tr');
        
        rows.forEach(row => {
            const dateCell = row.querySelector('td:first-child');
            if (!dateCell) return;
            
            const rowDate = dateCell.textContent.trim();
            
            if (selectedDate === 'all' || rowDate.includes(selectedDate)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
    
    // 更新最后更新时间
    updateLastUpdateTime() {
        const now = new Date();
        const timeString = now.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        this.elements.lastUpdate.textContent = timeString;
    }
    
    // 显示加载状态
    showLoading() {
        this.elements.loadingOverlay.classList.add('active');
        this.elements.refreshBtn.disabled = true;
    }
    
    // 隐藏加载状态
    hideLoading() {
        this.elements.loadingOverlay.classList.remove('active');
        this.elements.refreshBtn.disabled = false;
    }
    
    // 显示错误模态框
    showErrorModal(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.errorModal.classList.add('active');
    }
    
    // 隐藏错误模态框
    hideErrorModal() {
        this.elements.errorModal.classList.remove('active');
    }
}

// 工具函数
const Utils = {
    // 格式化日期
    formatDate(date) {
        return new Date(date).toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // 节流函数
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    // 检查必要的依赖
    if (typeof Chart === 'undefined') {
        console.error('Chart.js 未加载');
        return;
    }
    
    // 初始化应用
    window.weatherApp = new WeatherAnalysisApp();
    
    // 全局错误处理
    window.addEventListener('error', (event) => {
        console.error('全局错误:', event.error);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
        console.error('未处理的Promise拒绝:', event.reason);
        event.preventDefault();
    });
});

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WeatherAnalysisApp, Utils };
}