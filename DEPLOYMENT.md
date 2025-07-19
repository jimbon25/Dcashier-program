# Deployment Guide - Dcashier POS System

## Overview
This guide covers deploying the Dcashier POS System to production using modern cloud platforms.

## Backend Deployment (Railway)

### 1. Prepare Your Backend

1. **Environment Variables**
   ```bash
   # Copy and configure environment file
   cp backend/.env.example backend/.env
   ```

2. **Required Environment Variables for Railway:**
   ```
   NODE_ENV=production
   PORT=3001
   JWT_SECRET=your-super-secure-jwt-secret-here
   JWT_EXPIRES_IN=24h
   FRONTEND_URL=https://your-netlify-domain.netlify.app
   PRODUCTION_FRONTEND_URLS=https://your-netlify-domain.netlify.app,https://your-custom-domain.com
   ENABLE_HELMET=true
   ENABLE_COMPRESSION=true
   TRUST_PROXY=true
   ```

### 2. Deploy to Railway

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Deploy:**
   ```bash
   cd backend
   railway login
   railway init
   railway up
   ```

3. **Set Environment Variables in Railway Dashboard:**
   - Go to your Railway project dashboard
   - Navigate to Variables tab
   - Add all required environment variables

### 3. Database Considerations

**For SQLite (Current Setup):**
- SQLite works for single-server deployments
- Database file persists in Railway's ephemeral storage
- **Limitation:** Data may be lost during redeployments

**For Production Scale (Recommended):**
- Upgrade to PostgreSQL for better reliability
- Railway provides managed PostgreSQL databases
- See "Database Migration" section below

## Frontend Deployment (Netlify)

### 1. Prepare Your Frontend

1. **Environment Configuration:**
   ```bash
   # Copy environment file
   cp frontend/.env.example frontend/.env.local
   ```

2. **Update Environment Variables:**
   ```
   REACT_APP_API_URL=https://your-railway-backend-url
   GENERATE_SOURCEMAP=false
   ```

### 2. Deploy to Netlify

1. **Manual Deployment:**
   ```bash
   cd frontend
   npm run build
   # Upload build folder to Netlify
   ```

2. **Git-based Deployment (Recommended):**
   - Connect your GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `build`
   - Add environment variables in Netlify dashboard

3. **Environment Variables in Netlify:**
   ```
   REACT_APP_API_URL=https://your-railway-backend-url
   GENERATE_SOURCEMAP=false
   ```

## Alternative Platforms

### Vercel (Frontend Alternative)

1. **Deploy to Vercel:**
   ```bash
   cd frontend
   npx vercel
   ```

2. **vercel.json Configuration:**
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "build",
     "framework": "create-react-app",
     "routes": [
       { "src": "/static/(.*)", "headers": { "cache-control": "31536000" } },
       { "src": "/(.*)", "dest": "/index.html" }
     ]
   }
   ```

### Render (Full Stack Alternative)

1. **Backend on Render:**
   - Connect GitHub repository
   - Set build command: `npm run build`
   - Set start command: `npm start`
   - Add environment variables

2. **Frontend on Render:**
   - Set build command: `npm run build`
   - Set publish directory: `build`

## Database Migration (SQLite to PostgreSQL)

### 1. Setup PostgreSQL on Railway

1. **Add PostgreSQL Database:**
   ```bash
   railway add postgresql
   ```

2. **Get Database URL:**
   ```bash
   railway variables
   # Copy DATABASE_URL
   ```

### 2. Update Backend Code

1. **Install PostgreSQL Driver:**
   ```bash
   cd backend
   npm install pg @types/pg
   ```

2. **Update database.ts:** (Optional upgrade)
   ```typescript
   // Replace SQLite with PostgreSQL configuration
   // This requires code changes in database.ts
   ```

## Security Checklist

### Backend Security
- ✅ Helmet.js for security headers
- ✅ CORS properly configured
- ✅ Rate limiting implemented
- ✅ JWT with secure secrets
- ✅ Input validation
- ✅ Error handling without sensitive data

### Frontend Security
- ✅ HTTPS only (enforced by hosting platforms)
- ✅ Environment variables for API URLs
- ✅ No sensitive data in client code
- ✅ Content Security Policy via Netlify

## Performance Optimizations

### Backend
- ✅ Compression middleware
- ✅ Response time monitoring
- ✅ Efficient database queries
- ✅ File upload size limits

### Frontend
- ✅ Code splitting (automatic with Create React App)
- ✅ Asset optimization
- ✅ CDN delivery (via Netlify/Vercel)
- ✅ Caching headers

## Monitoring and Logging

### Backend Monitoring
```bash
# Check application logs
railway logs

# Monitor health endpoint
curl https://your-backend-url/health
```

### Frontend Monitoring
- Use Netlify Analytics
- Monitor Core Web Vitals
- Set up error tracking (e.g., Sentry)

## Common Issues and Solutions

### 1. CORS Errors
```javascript
// Ensure frontend URL is in CORS whitelist
// Update PRODUCTION_FRONTEND_URLS environment variable
```

### 2. 401 Authentication Errors
```javascript
// Check JWT_SECRET consistency
// Verify token expiration settings
// Ensure proper token storage in frontend
```

### 3. Database Connection Issues
```bash
# Check DATABASE_URL format
# Verify database service is running
# Check connection limits
```

### 4. Build Failures
```bash
# Clear node_modules and package-lock.json
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run build
```

## Environment-Specific Configurations

### Development
```bash
# Backend
cd backend && npm run dev

# Frontend  
cd frontend && npm start
```

### Staging
```bash
# Backend with staging environment
NODE_ENV=staging npm start

# Frontend with staging API
REACT_APP_API_URL=https://staging-api-url npm run build
```

### Production
```bash
# Automated via deployment platforms
# Environment variables set in platform dashboards
```

## Backup and Recovery

### Database Backup (SQLite)
```bash
# Manual backup
cp backend/sembako-pos.db backup/sembako-pos-$(date +%Y%m%d).db
```

### Database Backup (PostgreSQL)
```bash
# Automated backups via Railway
# Manual backup
pg_dump $DATABASE_URL > backup.sql
```

## Cost Optimization

### Free Tier Limits
- **Railway:** 500 hours/month, $5 credit
- **Netlify:** 100GB bandwidth, 300 build minutes
- **Vercel:** 100GB bandwidth, serverless functions

### Scaling Considerations
- Monitor usage via platform dashboards
- Implement caching strategies
- Optimize database queries
- Use CDN for static assets

## Support and Maintenance

### Regular Tasks
1. Monitor application logs
2. Check error rates
3. Update dependencies monthly
4. Review security updates
5. Backup database regularly

### Emergency Procedures
1. Monitor health endpoints
2. Check platform status pages
3. Review recent deployments
4. Rollback if necessary

## Next Steps

1. **Complete deployment following this guide**
2. **Test all functionality in production**
3. **Set up monitoring and alerting**
4. **Plan database migration if needed**
5. **Implement automated testing**
6. **Set up CI/CD pipeline**

For support, check platform documentation:
- [Railway Docs](https://docs.railway.app/)
- [Netlify Docs](https://docs.netlify.com/)
- [Vercel Docs](https://vercel.com/docs)
