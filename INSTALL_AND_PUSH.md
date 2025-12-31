# 🚀 Install Git & Push to GitHub

## Step 1: Install Git

### Download and Install:
1. **Download Git for Windows:**
   - Direct link: https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe
   - Or visit: https://git-scm.com/download/win

2. **Run the installer:**
   - Click "Next" through the installation
   - Use default settings (recommended)
   - Click "Install"
   - Wait for installation to complete

3. **Restart your terminal/PowerShell:**
   - Close this window
   - Open a new PowerShell or Command Prompt
   - Navigate back to: `C:\Users\USER PC\Desktop\DoorlyDashboard_`

---

## Step 2: Push to GitHub

### After installing Git, run these commands:

```bash
# Navigate to project (if not already there)
cd "C:\Users\USER PC\Desktop\DoorlyDashboard_"

# Initialize Git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Doorly Dashboard with LinkedIn Insights"

# Set main branch
git branch -M main

# Add remote repository
git remote add origin https://github.com/alroshdi/Doorly_Dashboard.git

# Push to GitHub
git push -u origin main
```

---

## Step 3: Authentication

When you run `git push`, you'll be prompted for credentials:

### If you have 2FA enabled (recommended):
1. **Use a Personal Access Token** instead of password
2. **Create token:**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token" → "Generate new token (classic)"
   - Name: "Doorly Dashboard"
   - Select scopes: `repo` (full control)
   - Click "Generate token"
   - **Copy the token** (you won't see it again!)

3. **Use the token:**
   - Username: `alroshdi`
   - Password: `[paste your token here]`

### If you don't have 2FA:
- Username: `alroshdi`
- Password: `[your GitHub password]`

---

## Alternative: Use the Batch Script

After installing Git, you can also run:
```bash
.\push-to-github.bat
```

---

## Quick Verification

After pushing, verify your code is on GitHub:
- Visit: https://github.com/alroshdi/Doorly_Dashboard
- You should see all your files there!

---

## Troubleshooting

### "Git is not recognized"
- Make sure you restarted your terminal after installing Git
- Or add Git to PATH manually (usually done automatically)

### "Authentication failed"
- Use Personal Access Token if 2FA is enabled
- Check your username is correct: `alroshdi`

### "Repository not found"
- Make sure the repository exists at: https://github.com/alroshdi/Doorly_Dashboard
- Check you have write access to the repository

### "Remote origin already exists"
- Run: `git remote remove origin`
- Then: `git remote add origin https://github.com/alroshdi/Doorly_Dashboard.git`

---

## Next: Set Up Hosting

After pushing to GitHub, set up hosting:

### Option 1: Vercel (Recommended) ⭐
1. Go to: https://vercel.com
2. Sign up with GitHub
3. Import repository: `alroshdi/Doorly_Dashboard`
4. Click "Deploy"
5. Done! Your site will be live in 2 minutes.

### Option 2: GitHub Pages
1. Go to repository Settings → Pages
2. Source: GitHub Actions
3. The workflow will auto-deploy

---

**Need help?** Check `DEPLOYMENT_GUIDE.md` for detailed instructions.

