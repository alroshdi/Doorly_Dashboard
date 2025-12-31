# GitHub Setup Instructions

## Prerequisites

1. **Install Git** (if not already installed):
   - Download from: https://git-scm.com/download/win
   - Or use: `winget install Git.Git` (Windows Package Manager)

2. **Verify Git Installation**:
   ```bash
   git --version
   ```

## Setup Steps

### 1. Navigate to Project Directory
```bash
cd "C:\Users\USER PC\Desktop\DoorlyDashboard_\DoorlyDashboard_"
```

### 2. Initialize Git Repository
```bash
git init
```

### 3. Add All Files
```bash
git add .
```

### 4. Create Initial Commit
```bash
git commit -m "Initial commit: Doorly Dashboard with LinkedIn Insights"
```

### 5. Rename Branch to Main
```bash
git branch -M main
```

### 6. Add Remote Repository
```bash
git remote add origin https://github.com/alroshdi/Doorly_Dashboard.git
```

### 7. Push to GitHub
```bash
git push -u origin main
```

## GitHub Pages Deployment (Optional)

For static hosting on GitHub Pages, you'll need to:

1. **Update next.config.mjs** for static export
2. **Enable GitHub Pages** in repository settings
3. **Set source** to GitHub Actions

The workflow file (`.github/workflows/deploy.yml`) is already created.

## Alternative: Vercel Deployment (Recommended for Next.js)

1. Push code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your GitHub repository
4. Add environment variables
5. Deploy

Vercel is better suited for Next.js applications as it supports:
- Server-side rendering
- API routes
- Automatic deployments
- Better performance

## Environment Variables

**Important**: Never commit `.env.local` to GitHub!

Create a `.env.example` file for reference:
```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_KEY=
GOOGLE_SHEET_ID=
GOOGLE_SHEET_RANGE=
```

## Next Steps After Pushing

1. Go to your GitHub repository: https://github.com/alroshdi/Doorly_Dashboard
2. Verify all files are uploaded
3. Set up deployment (Vercel recommended)
4. Add environment variables in deployment platform
5. Configure LinkedIn files path (if needed)

