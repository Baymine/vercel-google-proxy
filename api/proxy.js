import express from 'express';
import axios from 'axios';
import https from 'https';

const app = express();
app.use(express.json());

// 统一处理所有请求
app.all('*', async (req, res) => {
  try {
    const fullPath = req.path;
    const apiKey = process.env.GOOGLE_API_KEY;

    // 打印日志用于调试
    console.log('Proxying request to:', `https://generativelanguage.googleapis.com${fullPath}`);

    const response = await axios({
      method: req.method,
      url: `https://generativelanguage.googleapis.com${fullPath}?key=${apiKey}`,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers,
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      timeout: 8000
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Proxy Error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data
    });
    res.status(500).json({
      error: 'Proxy failed',
      details: error.message,
      statusCode: error.response?.status
    });
  }
});

export default app;