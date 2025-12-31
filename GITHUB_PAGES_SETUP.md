# 🚀 GitHub Pages Deployment Guide

## ✅ Configuration Complete!

Your project is now configured for GitHub Pages deployment.

---

## 📋 Setup Steps

### Step 1: Enable GitHub Pages

1. Go to your repository: https://github.com/alroshdi/Doorly_Dashboard
2. Click **Settings** (top menu)
3. Scroll down to **Pages** (left sidebar)
4. Under **Source**, select: **GitHub Actions**
5. Save (if there's a save button)

### Step 2: Push Configuration (Already Done!)

The configuration has been updated:
- ✅ `next.config.mjs` - Configured for static export
- ✅ `.github/workflows/deploy.yml` - GitHub Actions workflow ready
- ✅ Base path set to `/Doorly_Dashboard`

### Step 3: Trigger Deployment

The deployment will automatically trigger when you:
- Push to the `main` branch, OR
- Manually trigger it:
  1. Go to **Actions** tab in your repository
  2. Select **"Deploy to GitHub Pages"** workflow
  3. Click **"Run workflow"** → **"Run workflow"**

---

## 🌐 Your Site URL

Once deployed, your site will be available at:

**https://alroshdi.github.io/Doorly_Dashboard/**

---

## ⚠️ Important Notes

### API Routes Won't Work

GitHub Pages only supports **static sites**. This means:

- ❌ `/api/linkedin` route will **NOT work**
- ❌ Any server-side features won't work
- ✅ All client-side features will work
- ✅ Dashboard, charts, and UI will work

### If You Need API Routes

If you need the LinkedIn API to work, use **Vercel** instead:

1. Go to: https://vercel.com
2. Sign up with GitHub
3. Import `alroshdi/Doorly_Dashboard`
4. Deploy (supports API routes)

---

## 🔄 Update Your Code

After making changes:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

GitHub Actions will automatically rebuild and deploy!

---

## 📊 Check Deployment Status

1. Go to: https://github.com/alroshdi/Doorly_Dashboard/actions
2. Click on the latest workflow run
3. Check if it's successful (green checkmark)

---

## 🐛 Troubleshooting

### Build Fails

- Check the **Actions** tab for error messages
- Ensure all dependencies are in `package.json`
- Check Node.js version (should be 18+)

### Site Not Loading

- Wait 2-3 minutes after deployment
- Clear browser cache
- Check the URL: `https://alroshdi.github.io/Doorly_Dashboard/`
- Verify Pages is enabled in Settings

### 404 Errors

- Make sure basePath is correct: `/Doorly_Dashboard`
- Check that `output: 'export'` is set in `next.config.mjs`

---

## 📝 Next Steps

1. **Enable GitHub Pages** (Step 1 above)
2. **Wait for deployment** (check Actions tab)
3. **Visit your site**: https://alroshdi.github.io/Doorly_Dashboard/

---

## 🎉 Success!

Once deployed, share your site URL:
**https://alroshdi.github.io/Doorly_Dashboard/**

