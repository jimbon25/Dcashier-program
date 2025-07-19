# 🚀 DEPLOY DCASHIER BACKEND KE RAILWAY - CARA PAKSA!

## CARA YANG PASTI BERHASIL:

### 1. Deploy Template Kosong Dulu
- **Klik**: "New Project"
- **Scroll ke bawah** → **Cari**: "Express" atau "Node.js" template
- **Deploy template** ini dulu (biar dapat web service)

### 2. Ganti ke Repository Kita  
- **Setelah deploy template** → **Settings** 
- **Source** → **Disconnect** template
- **Connect New Repo** → `jimbon25/Dcashier-program`
- **Branch**: `main`
- **Root Directory**: `backend`

### 3. Update Commands
- **Settings** → **Deploy**
- **Build Command**: `npm install`  
- **Start Command**: `node simple-server.js`
- **Port**: `3000` (default Railway)

### 4. Redeploy
- **Deployments** → **Trigger Deploy**
- **Tunggu 2-3 menit**

## INI PASTI BERHASIL KARENA:
✅ **Template dulu** = web service terbuat  
✅ **Ganti repo** = tidak detect database lagi  
✅ **Sudah ada .railwayignore** = file database ignored  

**COBA CARA INI - ANTI GAGAL!** 🎯

## ALTERNATIF: RAILWAY CLI (PALING MUDAH!)

```bash
# 1. Login ke Railway
railway login

# 2. Masuk ke folder backend  
cd backend

# 3. Deploy langsung
railway deploy

# 4. Set start command
railway run --service node simple-server.js
```

**CLI = No database detection!** 🚂
