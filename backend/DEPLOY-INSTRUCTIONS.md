# DCashier Backend Deployment

## ✅ Working Local Server
Server sudah ditest dan berfungsi perfect di:
- Health: http://localhost:10000/health  
- Login: http://localhost:10000/api/auth/login

## 🚀 Deploy Options (Manual Deploy)

### Option 1: Render.com
1. Go to https://render.com
2. Sign up/login with GitHub
3. Click "New" > "Web Service"
4. Connect repository: `jimbon25/Dcashier-program`
5. Settings:
   - Name: `dcashier-backend`
   - Branch: `main` 
   - Root Directory: `backend`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `node simple-server.js`
   - Plan: `Free`
6. Deploy!

URL akan jadi: `https://dcashier-backend.onrender.com`

### Option 2: Railway.app  
1. Go to https://railway.app
2. Login with GitHub
3. Click "New Project" > "Deploy from GitHub repo"
4. Select: `jimbon25/Dcashier-program`
5. Settings:
   - Root Directory: `backend`
   - Start Command: `node simple-server.js`
6. Deploy!

### Option 3: Heroku
1. Go to https://heroku.com
2. Create new app: `dcashier-backend`
3. Connect GitHub repo: `jimbon25/Dcashier-program`
4. Deploy from `main` branch
5. Set config vars:
   - `NODE_ENV=production`

## 🔧 After Deploy
Update frontend API URL in:
`frontend/src/config/api.ts`

Change to your deployed URL.
