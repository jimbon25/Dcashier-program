// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://dcashier-program-production.up.railway.app'
    : 'http://localhost:8000');

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string): string => {
  // Ensure endpoint starts with /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // If it's production and doesn't start with /api, add /api prefix
  if (process.env.NODE_ENV === 'production' && !cleanEndpoint.startsWith('/api/')) {
    // Handle special cases
    if (cleanEndpoint.startsWith('/products') || 
        cleanEndpoint.startsWith('/categories') ||
        cleanEndpoint.startsWith('/transactions') ||
        cleanEndpoint.startsWith('/reports') ||
        cleanEndpoint.startsWith('/users') ||
        cleanEndpoint.startsWith('/upload') ||
        cleanEndpoint.startsWith('/reset-transactions') ||
        cleanEndpoint.startsWith('/check-auth')) {
      return `${API_BASE_URL}/api${cleanEndpoint}`;
    }
  }
  
  return `${API_BASE_URL}${cleanEndpoint}`;
};
