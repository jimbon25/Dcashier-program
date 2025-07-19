#!/bin/bash

# Dcashier Backend Deployment Script
# Untuk deploy ke berbagai platform

echo "🚀 Dcashier Backend Deployment Script"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in backend directory"
    echo "Please run: cd backend && bash deploy.sh"
    exit 1
fi

echo "📦 Building backend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix errors first."
    exit 1
fi

echo "✅ Build successful!"
echo ""

echo "Choose deployment platform:"
echo "1) Render.com (Recommended - Free)"
echo "2) Railway.app (Need credit)"
echo "3) Heroku"
echo "4) Manual VPS"
echo "5) Docker Build"

read -p "Enter choice (1-5): " choice

case $choice in
    1)
        echo "🌐 Deploying to Render.com"
        echo "Steps:"
        echo "1. Open https://render.com and sign up/login"
        echo "2. Click 'New' → 'Web Service'"
        echo "3. Connect your GitHub account"
        echo "4. Select 'Dcashier-program' repository"
        echo "5. Use these settings:"
        echo "   - Name: dcashier-backend"
        echo "   - Environment: Node"
        echo "   - Region: Singapore"
        echo "   - Branch: main"
        echo "   - Root Directory: backend"
        echo "   - Build Command: npm run build"
        echo "   - Start Command: npm start"
        echo ""
        echo "6. Add these Environment Variables:"
        echo "   NODE_ENV=production"
        echo "   JWT_SECRET=dcashier-secret-key-2024"
        echo "   JWT_EXPIRES_IN=24h"
        echo "   FRONTEND_URL=https://dcashier.netlify.app"
        echo "   ENABLE_HELMET=true"
        echo "   ENABLE_COMPRESSION=true"
        echo ""
        echo "7. Click 'Create Web Service'"
        echo "8. Wait for deployment (5-10 minutes)"
        echo "9. Copy the deployed URL"
        echo "10. Update frontend REACT_APP_API_URL with your backend URL"
        ;;
    2)
        echo "🚂 Deploying to Railway.app"
        if ! command -v railway &> /dev/null; then
            echo "Installing Railway CLI..."
            npm install -g @railway/cli
        fi
        
        echo "Login to Railway:"
        railway login
        
        echo "Creating project..."
        railway init dcashier-backend
        
        echo "Setting environment variables..."
        railway variables set NODE_ENV=production
        railway variables set JWT_SECRET=dcashier-secret-key-2024
        railway variables set JWT_EXPIRES_IN=24h
        railway variables set FRONTEND_URL=https://dcashier.netlify.app
        
        echo "Deploying..."
        railway up
        ;;
    3)
        echo "🟣 Heroku deployment instructions:"
        echo "1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli"
        echo "2. Login: heroku login"
        echo "3. Create app: heroku create dcashier-backend"
        echo "4. Set config: heroku config:set NODE_ENV=production JWT_SECRET=dcashier-secret-key-2024"
        echo "5. Deploy: git push heroku main"
        ;;
    4)
        echo "🖥️  Manual VPS deployment:"
        echo "1. Upload code to your VPS"
        echo "2. Install Node.js and PM2"
        echo "3. Run: npm install && npm run build"
        echo "4. Start: pm2 start dist/index.js --name dcashier-backend"
        echo "5. Setup reverse proxy with Nginx"
        ;;
    5)
        echo "🐳 Building Docker image..."
        docker build -t dcashier-backend .
        echo "✅ Docker image built!"
        echo "To run: docker run -p 3001:3001 dcashier-backend"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "📋 After deployment, remember to:"
echo "1. Copy your backend URL"
echo "2. Update REACT_APP_API_URL in Netlify dashboard"
echo "3. Test the full application"
echo ""
echo "Frontend URL: https://dcashier.netlify.app"
echo "Backend will be: https://your-backend-url.com"
echo ""
echo "🎉 Happy deploying!"
