export default function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, method } = req;

  // Health endpoint
  if (url === '/health' || url?.includes('/health')) {
    return res.status(200).json({
      status: 'OK',
      message: 'DCashier API Server is running',
      timestamp: new Date().toISOString(),
      environment: 'production',
      vercel: true
    });
  }

  // Root endpoint
  if (url === '/' || !url || url === '') {
    return res.status(200).json({
      message: 'DCashier API Server',
      version: '1.0.0',
      health: '/health',
      api: '/api',
      status: 'running',
      vercel: true
    });
  }

  // API login endpoint
  if ((url === '/api/auth/login' || url?.includes('/api/auth/login')) && method === 'POST') {
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

  // Default response
  return res.status(200).json({
    message: 'DCashier API - Vercel Function',
    url: url,
    method: method,
    timestamp: new Date().toISOString(),
    status: 'working'
  });
}
