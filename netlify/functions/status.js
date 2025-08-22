// 系统状态API函数
exports.handler = async (event, context) => {
    // 设置CORS头
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
        // 获取部署信息
        const deployInfo = {
            platform: 'Netlify',
            region: process.env.AWS_REGION || 'unknown',
            deployId: process.env.DEPLOY_ID || 'unknown',
            site: process.env.SITE_NAME || 'unknown'
        };

        // 获取运行时信息
        const runtime = {
            node: process.version,
            arch: process.arch,
            platform: process.platform
        };

        // 内存使用情况
        const memoryUsage = process.memoryUsage();
        const memory = {
            used: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
            total: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
            external: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                status: 'running',
                platform: 'Netlify Functions',
                deploy: deployInfo,
                runtime: runtime,
                memory: memory,
                timestamp: new Date().toISOString(),
                uptime: {
                    message: 'Serverless functions reset on each request',
                    type: 'stateless'
                },
                features: {
                    weatherApi: true,
                    caching: true,
                    rateLimiting: true,
                    cors: true
                }
            })
        };

    } catch (error) {
        console.error('状态检查失败:', error);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: '状态检查失败',
                error: error.message,
                timestamp: new Date().toISOString()
            })
        };
    }
};
