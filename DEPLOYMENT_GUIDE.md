# 🚀 Panduan Deployment Dcashier POS - Step by Step

## ✅ Persiapan Selesai
- ✅ Backend build berhasil
- ✅ Frontend build berhasil
- ✅ Konfigurasi deployment sudah siap

## 🎯 PILIHAN DEPLOYMENT

### **OPTION 1: Render (RECOMMENDED - FREE & MUDAH)**

#### A. Deploy Backend ke Render

1. **Buka [render.com](https://render.com) dan daftar/login**

2. **Klik "New" → "Web Service"**

3. **Connect Repository:**
   - Connect GitHub account Anda
   - Pilih repository `Dcashier-program`
   - Root Directory: `backend`

4. **Configuration:**
   ```
   Name: dcashier-backend
   Environment: Node
   Region: Singapore (terdekat dengan Indonesia)
   Branch: main
   Build Command: npm run build
   Start Command: npm start
   ```

5. **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=3001
   JWT_SECRET=your-super-secure-secret-key-here
   JWT_EXPIRES_IN=24h
   DATABASE_PATH=./sembako-pos.db
   FRONTEND_URL=https://dcashier-frontend.netlify.app
   ```

6. **Klik "Create Web Service"**

#### B. Deploy Frontend ke Netlify

1. **Buka [netlify.com](https://netlify.com) dan login**

2. **Drag & Drop Deployment:**
   - Klik "Add new site" → "Deploy manually"
   - Drag folder `frontend/build` ke area upload
   - Site name: `dcashier-frontend`

3. **Atau Git-based Deployment:**
   - Klik "Add new site" → "Import from Git"
   - Connect GitHub → Pilih `Dcashier-program`
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `build`

4. **Environment Variables di Netlify:**
   ```
   REACT_APP_API_URL=https://dcashier-backend.onrender.com
   GENERATE_SOURCEMAP=false
   ```

5. **Deploy Settings:**
   - Build command: `npm run build`
   - Publish directory: `build`

---

### **OPTION 2: Vercel (Full Stack)**

#### Deploy Frontend ke Vercel

1. **Buka [vercel.com](https://vercel.com) dan login**

2. **Import Project:**
   - Klik "Add New" → "Project"
   - Import `Dcashier-program` dari GitHub
   - Root Directory: `frontend`

3. **Environment Variables:**
   ```
   REACT_APP_API_URL=https://your-backend-url
   GENERATE_SOURCEMAP=false
   ```

4. **Deploy Backend (Serverless Functions):**
   - Buat folder `api` di root frontend
   - Convert Express routes ke Vercel functions
   - (Lebih kompleks, butuh refactoring)

---

### **OPTION 3: Railway (Jika Quota Tersedia)**

1. **Upgrade ke Railway Pro Plan ($5/month)**
2. **Atau gunakan Railway existing project**
3. **Deploy backend dengan `railway up`**

---

## 🔧 DEPLOYMENT MANUAL (LOCALHOST → VPS)

Jika ingin deploy ke VPS sendiri:

### 1. Setup VPS Ubuntu/Debian

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Nginx
sudo apt install nginx -y

# Install PM2 untuk process management
sudo npm install -g pm2
```

### 2. Upload Code ke VPS

```bash
# Clone repository
git clone https://github.com/jimbon25/Dcashier-program.git
cd Dcashier-program

# Setup Backend
cd backend
npm install
npm run build
pm2 start dist/index.js --name "dcashier-backend"

# Setup Frontend
cd ../frontend
npm install
npm run build

# Copy build ke Nginx
sudo cp -r build/* /var/www/html/
```

### 3. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/dcashier
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/dcashier /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🎯 REKOMENDASI UNTUK ANDA

**Untuk pemula/testing:**
1. **Render** untuk backend (gratis, mudah)
2. **Netlify** untuk frontend (gratis, mudah)

**Untuk production serious:**
1. **Railway** ($5/month, reliable)
2. **VPS** (lebih control, $5-10/month)

**Untuk development:**
1. Keep using localhost untuk development
2. Deploy ke staging environment dulu

---

## 📝 NEXT STEPS

1. **Pilih platform deployment** (Render + Netlify recommended)
2. **Setup environment variables** sesuai platform
3. **Test deployment** dengan mengakses aplikasi
4. **Update CORS settings** di backend jika perlu
5. **Monitor logs** untuk troubleshooting

---

## 🆘 TROUBLESHOOTING

**CORS Errors:**
- Update `FRONTEND_URL` di backend environment
- Pastikan URL frontend benar di CORS config

**Database Issues:**
- SQLite akan reset setiap deployment di beberapa platform
- Consider upgrade ke PostgreSQL untuk persistence

**Build Errors:**
- Check logs di platform deployment
- Pastikan semua dependencies ter-install

---

Pilih salah satu option di atas dan ikuti step-by-step nya. Untuk kemudahan, saya sarankan **Render + Netlify** karena gratis dan mudah disetup!
