# Quick Start - GitHub Setup

## Step 1: Install Git (if not installed)

**Option A: Download**
- Visit: https://git-scm.com/download/win
- Download and install Git for Windows

**Option B: Using Windows Package Manager**
```powershell
winget install Git.Git
```

**Option C: Using Chocolatey**
```powershell
choco install git
```

## Step 2: Verify Git Installation

Open PowerShell or Command Prompt and run:
```bash
git --version
```

## Step 3: Run Setup Script

**Option A: Double-click the batch file**
- Double-click `setup-github.bat` in the project folder

**Option B: Run commands manually**

Open PowerShell in the project directory and run:

```powershell
cd "C:\Users\USER PC\Desktop\DoorlyDashboard_\DoorlyDashboard_"

git init
git add .
git commit -m "Initial commit: Doorly Dashboard with LinkedIn Insights"
git branch -M main
git remote add origin https://github.com/alroshdi/Doorly_Dashboard.git
git push -u origin main
```

## Step 4: Verify on GitHub

1. Go to: https://github.com/alroshdi/Doorly_Dashboard
2. Verify all files are uploaded
3. Check the README.md is displayed correctly

## Deployment Options

### Option 1: Vercel (Recommended for Next.js)

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New Project"
4. Import `alroshdi/Doorly_Dashboard`
5. Add environment variables:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_SERVICE_ACCOUNT_KEY`
   - `GOOGLE_SHEET_ID`
   - `GOOGLE_SHEET_RANGE`
6. Deploy!

### Option 2: GitHub Pages (Static Export)

1. Enable GitHub Pages in repository settings
2. Set source to "GitHub Actions"
3. The workflow will automatically deploy on push

### Option 3: Netlify

1. Go to [netlify.com](https://netlify.com)
2. Connect GitHub repository
3. Configure build settings
4. Add environment variables
5. Deploy

## Important Notes

- **Never commit `.env.local`** - It's in `.gitignore`
- **LinkedIn files** - Make sure the `linkedin` folder is in the parent directory
- **Environment variables** - Add them in your deployment platform

## Troubleshooting

### Git not found
- Install Git first (see Step 1)
- Restart terminal after installation

### Authentication failed
- Use GitHub Personal Access Token instead of password
- Or use GitHub Desktop for easier authentication

### Push rejected
- Make sure the repository exists on GitHub
- Check if you have write access to the repository

