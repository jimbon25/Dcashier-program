export default function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return res.status(200).json({
    message: 'DCashier API Server',
    version: '1.0.0',
    health: '/api/health',
    login: '/api/auth/login',
    status: 'running',
    vercel: true,
    timestamp: new Date().toISOString()
  });
}