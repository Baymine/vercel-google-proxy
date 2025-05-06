import express from 'express';
import axios from 'axios';
import https from 'https';

const app = express();
const PORT = 3000;

// 创建自定义 HTTPS Agent（忽略证书验证 + 延长超时）
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
  timeout: 10000 // 10秒超时
});

app.use(express.json());

app.all('*', async (req, res) => {
  try {
    const targetUrl = `https://generativelanguage.googleapis.com${req.path}`;
    const apiKey = process.env.GOOGLE_API_KEY || 'YOUR_KEY_FALLBACK';

    const response = await axios({
      method: req.method,
      url: `${targetUrl}?key=${apiKey}`,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers,
      },
      httpsAgent, // 使用自定义 Agent
      timeout: 8000 // 单独请求超时
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Proxy Error Details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    res.status(500).json({
      error: 'Proxy failed',
      details: error.message,
      code: error.code // 显示错误代码（如 ECONNRESET）
    });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy running on http://localhost:${PORT}`);
});