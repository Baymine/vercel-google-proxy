import express from 'express';
import axios from 'axios';
import https from 'https';

const app = express();
app.use(express.json({ limit: '10mb' })); // Increase limit for larger requests

// Debug middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// 统一处理所有请求
app.all('*', async (req, res) => {
  try {
    const fullPath = req.path;
    const apiKey = process.env.GOOGLE_API_KEY;;
    const queryParams = new URLSearchParams(req.query).toString();
    
    // Construct the correct Gemini API endpoint
    const baseUrl = 'https://generativelanguage.googleapis.com';
    const endpoint = `${baseUrl}${fullPath}?key=${apiKey}`;
    const finalUrl = queryParams ? `${endpoint}&${queryParams}` : endpoint;

    console.log('Proxying request to:', finalUrl);
    console.log('Request body:', JSON.stringify(req.body));

    // Remove problematic headers that might cause issues
    const headers = { ...req.headers };
    delete headers.host;
    delete headers.connection;
    delete headers['content-length'];
    
    const response = await axios({
      method: req.method,
      url: finalUrl,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      timeout: 30000, // Increased timeout
      responseType: 'stream'
    });

    // Forward headers and status code
    res.status(response.status);
    Object.entries(response.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Pipe the response stream
    response.data.pipe(res);
  } catch (error) {
    console.error('Proxy Error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
    
    // If we have response data, try to log it
    if (error.response && error.response.data) {
      try {
        // For stream responses, we need to collect the data
        const chunks = [];
        error.response.data.on('data', chunk => chunks.push(chunk));
        error.response.data.on('end', () => {
          const errorData = Buffer.concat(chunks).toString('utf8');
          console.error('Error response data:', errorData);
        });
      } catch (e) {
        console.error('Failed to read error response data', e);
      }
    }
    
    res.status(error.response?.status || 500).json({
      error: 'Proxy failed',
      details: error.message,
      statusCode: error.response?.status
    });
  }
});

export default app;

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
