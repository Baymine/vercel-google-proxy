import express from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());

// 拦截所有请求
app.all('*', async (req, res) => {
  try {
    const targetPath = req.path;
    const apiKey = process.env.GOOGLE_API_KEY; // 从环境变量读取 API Key

    // 转发到真实 Google API
    const response = await axios({
      method: req.method,
      url: `https://generativelanguage.googleapis.com${targetPath}?key=${apiKey}`,
      data: req.body,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      headers: {
        'Content-Type': 'application/json',
        ...req.headers,
      },
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default app;