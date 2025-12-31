# ⚡ Quick Deploy Guide

## 🚀 Fastest Way: Use Vercel (Recommended)

### 1. Install Git (if not installed)
```bash
# Download from: https://git-scm.com/download/win
# Or use:
winget install Git.Git
```

### 2. Run the Push Script
Double-click `push-to-github.bat` or run:
```bash
push-to-github.bat
```

### 3. Deploy on Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "Add New Project"
4. Import `alroshdi/Doorly_Dashboard`
5. Click "Deploy"

**Done!** Your site will be live in 2 minutes.

---

## 📋 Manual Steps (Alternative)

If the script doesn't work, run these commands manually:

```bash
# 1. Navigate to project
cd "C:\Users\USER PC\Desktop\DoorlyDashboard_"

# 2. Initialize Git
git init

# 3. Add files
git add .

# 4. Commit
git commit -m "Initial commit: Doorly Dashboard"

# 5. Set branch
git branch -M main

# 6. Add remote
git remote add origin https://github.com/alroshdi/Doorly_Dashboard.git

# 7. Push
git push -u origin main
```

---

## 🎯 Why Vercel?

- ✅ **Free** hosting
- ✅ **Automatic** deployments on every push
- ✅ Supports **API routes** (GitHub Pages doesn't)
- ✅ **Better performance** for Next.js
- ✅ **Easy setup** - just connect GitHub

---

## 📝 Need Help?

See `DEPLOYMENT_GUIDE.md` for detailed instructions.

