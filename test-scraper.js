const puppeteer = require('puppeteer');

async function testScraper() {
    let browser = null;
    try {
        console.log('🔄 启动测试爬虫...');
        
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // 简单测试 - 访问百度
        console.log('🔄 测试网络连接...');
        await page.goto('https://www.baidu.com', { 
            waitUntil: 'domcontentloaded',
            timeout: 10000 
        });
        
        console.log('✅ 网络连接正常');
        
        // 测试MSN页面
        console.log('🔄 测试MSN天气页面...');
        const url = 'https://www.msn.cn/zh-cn/weather/hourlyforecast/in-%E5%9B%9B%E5%B7%9D%E7%9C%81,%E5%B9%BF%E5%85%83%E5%B8%82?loc=eyJhIjoi5p2%2B6b6Z5Z2qIiwibCI6IuaXuuiLjeWOvyIsInIiOiLlm5vlt53nnIEiLCJyMiI6IuW5v%2BWFg%2BW4giIsImMiOiLkuK3ljY7kurrmsJHlhbHlkozlm70iLCJpIjoiY24iLCJ0IjoxMDEsImciOiJ6aC1jbiIsIngiOiIxMDYuMDk5MzY2IiwieSI6IjMyLjQzMDEwMyJ9&weadegreetype=C&fcsttab=precipitation';
        
        await page.goto(url, { 
            waitUntil: 'domcontentloaded',
            timeout: 20000 
        });
        
        console.log('✅ MSN页面加载成功');
        
        // 检查页面内容
        const title = await page.title();
        console.log('📄 页面标题:', title);
        
        // 查找天气容器
        await page.waitForTimeout(3000);
        
        const containers = await page.evaluate(() => {
            const selectors = [
                '#pageBlock_table',
                '[class*="weather"]',
                '[class*="hourly"]',
                '[class*="forecast"]'
            ];
            
            const results = [];
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                results.push({
                    selector: selector,
                    count: elements.length,
                    found: elements.length > 0
                });
            });
            
            return results;
        });
        
        console.log('🔍 容器查找结果:');
        containers.forEach(result => {
            console.log(`  ${result.selector}: ${result.found ? '✅' : '❌'} (${result.count}个)`);
        });
        
        console.log('✅ 测试完成');
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

testScraper();