# 🚀 Deployment Guide - GitHub Hosting

## Step 1: Install Git

**Git is required to push code to GitHub.**

### Windows Installation:
1. Download Git from: https://git-scm.com/download/win
2. Run the installer and follow the setup wizard
3. Or use Windows Package Manager:
   ```powershell
   winget install Git.Git
   ```

### Verify Installation:
```bash
git --version
```

---

## Step 2: Push Code to GitHub

### 2.1 Navigate to Project Directory
```bash
cd "C:\Users\USER PC\Desktop\DoorlyDashboard_"
```

### 2.2 Initialize Git Repository
```bash
git init
```

### 2.3 Add All Files
```bash
git add .
```

### 2.4 Create Initial Commit
```bash
git commit -m "Initial commit: Doorly Dashboard with LinkedIn Insights and Admin Features"
```

### 2.5 Rename Branch to Main
```bash
git branch -M main
```

### 2.6 Add Remote Repository
```bash
git remote add origin https://github.com/alroshdi/Doorly_Dashboard.git
```

### 2.7 Push to GitHub
```bash
git push -u origin main
```

**Note:** You'll be prompted for GitHub credentials. Use a Personal Access Token if 2FA is enabled.

---

## Step 3: Set Up GitHub Pages Hosting

### Option A: GitHub Pages (Static Export)

**⚠️ Important:** GitHub Pages only supports static sites. For Next.js with API routes, use **Vercel** (Option B).

#### 3.1 Update next.config.mjs for Static Export
The config is already set up for static export.

#### 3.2 Enable GitHub Pages
1. Go to your repository: https://github.com/alroshdi/Doorly_Dashboard
2. Click **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. The workflow (`.github/workflows/deploy.yml`) will automatically deploy

#### 3.3 Access Your Site
Your site will be available at:
```
https://alroshdi.github.io/Doorly_Dashboard/
```

---

### Option B: Vercel (Recommended for Next.js) ⭐

**Vercel is the best option for Next.js apps** because it supports:
- ✅ Server-side rendering (SSR)
- ✅ API routes (`/api/linkedin`)
- ✅ Automatic deployments
- ✅ Better performance
- ✅ Free hosting

#### 3.1 Push Code to GitHub (if not done)
Follow Step 2 above.

#### 3.2 Deploy on Vercel
1. Go to [https://vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click **"Add New Project"**
4. Import your repository: `alroshdi/Doorly_Dashboard`
5. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./` (or leave default)
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
6. Click **Deploy**

#### 3.3 Environment Variables (if needed)
If you use Google Sheets API, add environment variables in Vercel:
- Go to **Project Settings** → **Environment Variables**
- Add: `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_KEY`, etc.

#### 3.4 Access Your Site
Vercel will provide a URL like:
```
https://doorly-dashboard.vercel.app
```

---

## Step 4: Update Code (Future Changes)

After making changes to your code:

```bash
# Navigate to project
cd "C:\Users\USER PC\Desktop\DoorlyDashboard_"

# Add changes
git add .

# Commit changes
git commit -m "Description of changes"

# Push to GitHub
git push origin main
```

**Vercel/GitHub Actions will automatically deploy the new version!**

---

## Troubleshooting

### Git Not Found
- Install Git from https://git-scm.com/download/win
- Restart your terminal after installation

### Authentication Failed
- Use a Personal Access Token instead of password
- Generate token: GitHub → Settings → Developer settings → Personal access tokens

### Build Fails
- Check that all dependencies are in `package.json`
- Ensure Node.js version is 18+ (check in `.github/workflows/deploy.yml`)

### API Routes Not Working (GitHub Pages)
- GitHub Pages doesn't support API routes
- Use **Vercel** instead (Option B above)

---

## Quick Setup Script

Save this as `push-to-github.bat` and run it:

```batch
@echo off
echo Installing Git...
winget install Git.Git
echo.
echo Please restart your terminal and run this script again.
pause
```

Or manually run these commands after installing Git:

```bash
cd "C:\Users\USER PC\Desktop\DoorlyDashboard_"
git init
git add .
git commit -m "Initial commit: Doorly Dashboard"
git branch -M main
git remote add origin https://github.com/alroshdi/Doorly_Dashboard.git
git push -u origin main
```

---

## Recommended: Use Vercel

For the best Next.js experience, **use Vercel**:
- ✅ Free hosting
- ✅ Automatic deployments
- ✅ Supports all Next.js features
- ✅ Better performance
- ✅ Easy setup

Just push to GitHub and connect to Vercel!

