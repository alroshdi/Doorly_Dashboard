# 🚀 Vercel Deployment Setup Guide

## Quick Steps to Deploy

### Step 1: Sign Up for Vercel
1. Go to **https://vercel.com**
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account

### Step 2: Import Your Repository
1. After signing in, click **"Add New Project"**
2. Find and select your **`DoorlyDashboard_`** repository
3. Click **"Import"**

### Step 3: Configure Project Settings
Vercel will auto-detect Next.js, but verify these settings:

- **Framework Preset:** Next.js (auto-detected)
- **Root Directory:** `./DoorlyDashboard_` (if your repo structure requires it)
- **Build Command:** `npm run build` (default)
- **Output Directory:** `.next` (default)
- **Install Command:** `npm install` (default)

### Step 4: Add Environment Variables ⚠️ IMPORTANT

Click **"Environment Variables"** and add these variables from your `.env.local`:

#### Required Variables:

```
GOOGLE_SERVICE_ACCOUNT_EMAIL
```
- Value: Your Google Service Account email
- Example: `doorly-service@project.iam.gserviceaccount.com`
- Add to: Production, Preview, Development

```
GOOGLE_SERVICE_ACCOUNT_KEY
```
- Value: Your complete private key (keep the `\n` characters)
- Example: `-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----`
- Add to: Production, Preview, Development
- ⚠️ **Important:** Keep the `\n` characters in the key!

```
GOOGLE_SHEET_ID
```
- Value: Your Google Sheets spreadsheet ID
- Example: `1a2b3c4d5e6f7g8h9i0j`
- Add to: Production, Preview, Development

#### Optional Variables:

```
GOOGLE_SHEET_RANGE
```
- Value: Sheet range (default: `requests!A:Z`)
- Add to: Production, Preview, Development

### Step 5: Deploy! 🎉
1. Click **"Deploy"**
2. Wait 2-3 minutes for the build to complete
3. Your site will be live at: `https://your-project-name.vercel.app`

---

## ✅ After Deployment

### Check Your Deployment
1. Visit your Vercel dashboard
2. Click on your project
3. Go to **"Deployments"** tab
4. Click on the latest deployment
5. Test your dashboard at the provided URL

### Test API Routes
- Visit: `https://your-project-name.vercel.app/api/requests`
- Should return JSON data from Google Sheets

### Test Dashboard
- Visit: `https://your-project-name.vercel.app/dashboard`
- Login with: `admin@admin.com` / `admin123`

---

## 🔧 Troubleshooting

### Build Fails
- Check the build logs in Vercel dashboard
- Ensure all environment variables are set correctly
- Verify `GOOGLE_SERVICE_ACCOUNT_KEY` includes `\n` characters

### API Routes Not Working
- Verify environment variables are added to **Production** environment
- Check Vercel function logs in the dashboard
- Ensure Google Sheets API credentials are correct

### Images Not Loading
- This is normal - Vercel will optimize images automatically
- If issues persist, check image paths in your code

---

## 🌐 Custom Domain (Optional)

1. Go to **Project Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `dashboard.doorly.com`)
4. Follow DNS configuration instructions
5. Vercel will automatically provision SSL certificate

---

## 📊 Automatic Deployments

Vercel automatically deploys when you:
- Push to `main` branch → Production deployment
- Push to other branches → Preview deployment
- Open a Pull Request → Preview deployment

---

## 🔐 Security Notes

- ✅ Never commit `.env.local` to GitHub
- ✅ Environment variables are encrypted in Vercel
- ✅ Each environment (Production/Preview/Development) can have different variables

---

## 📝 Need Help?

- Vercel Docs: https://vercel.com/docs
- Next.js on Vercel: https://vercel.com/docs/frameworks/nextjs
- Support: https://vercel.com/support

---

## 🎯 Quick Checklist

- [ ] Signed up for Vercel with GitHub
- [ ] Imported `DoorlyDashboard_` repository
- [ ] Added `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- [ ] Added `GOOGLE_SERVICE_ACCOUNT_KEY` (with `\n` characters)
- [ ] Added `GOOGLE_SHEET_ID`
- [ ] Added `GOOGLE_SHEET_RANGE` (optional)
- [ ] Clicked "Deploy"
- [ ] Tested dashboard at Vercel URL
- [ ] Tested API routes

**You're all set! 🚀**




