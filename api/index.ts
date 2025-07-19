import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url } = req;

  // Health endpoint
  if (url === '/health') {
    return res.status(200).json({
      status: 'OK',
      message: 'DCashier API Server is running',
      timestamp: new Date().toISOString(),
      environment: 'production'
    });
  }

  // Root endpoint
  if (url === '/') {
    return res.status(200).json({
      message: 'DCashier API Server',
      version: '1.0.0',
      health: '/health',
      api: '/api',
      status: 'running'
    });
  }

  // API login endpoint (temporary)
  if (url === '/api/auth/login' && req.method === 'POST') {
    const { username, password } = req.body || {};
    
    if (username === 'admin' && password === 'admin123') {
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token: 'dummy-jwt-token-for-testing',
        user: {
          id: 1,
          username: 'admin',
          role: 'admin'
        }
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Default 404
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${url}`,
    timestamp: new Date().toISOString()
  });
}
