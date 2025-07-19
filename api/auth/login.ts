export default function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only POST method is allowed for login'
    });
  }

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
