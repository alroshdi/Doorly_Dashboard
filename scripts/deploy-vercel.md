# Quick Vercel Deployment Commands

## Option 1: Web Interface (Easiest)
1. Go to https://vercel.com
2. Sign up with GitHub
3. Import repository
4. Add environment variables
5. Deploy

## Option 2: Vercel CLI

### Install Vercel CLI
```bash
npm i -g vercel
```

### Login to Vercel
```bash
vercel login
```

### Deploy to Preview
```bash
cd DoorlyDashboard_
vercel
```

### Deploy to Production
```bash
vercel --prod
```

### Link to Existing Project
```bash
vercel link
```

### Set Environment Variables via CLI
```bash
vercel env add GOOGLE_SERVICE_ACCOUNT_EMAIL
vercel env add GOOGLE_SERVICE_ACCOUNT_KEY
vercel env add GOOGLE_SHEET_ID
vercel env add GOOGLE_SHEET_RANGE
```

---

**Note:** The web interface is recommended for first-time setup as it's easier to configure environment variables.








