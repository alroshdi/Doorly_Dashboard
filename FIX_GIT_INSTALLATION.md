# 🔧 Fix Git Installation Error

## Problem
```
git : The term 'git' is not recognized...
```

This means Git is **not installed** or **not in your PATH**.

---

## ✅ Solution: Install Git

### Method 1: Download Installer (Recommended)

1. **Download Git for Windows:**
   - **Direct Download:** https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe
   - **Or visit:** https://git-scm.com/download/win

2. **Run the installer:**
   - Double-click the downloaded `.exe` file
   - Click **"Next"** through all steps
   - **Important:** On "Adjusting your PATH environment" screen:
     - Select **"Git from the command line and also from 3rd-party software"** (Recommended)
   - Click **"Install"**
   - Wait for installation to complete
   - Click **"Finish"**

3. **Restart PowerShell/Terminal:**
   - **Close** your current PowerShell window completely
   - **Open a NEW PowerShell window**
   - Navigate back: `cd "C:\Users\USER PC\Desktop\DoorlyDashboard_"`

4. **Verify installation:**
   ```powershell
   git --version
   ```
   Should show: `git version 2.43.0.windows.1` (or similar)

---

### Method 2: Check if Git is Already Installed (But Not in PATH)

If Git might be installed but not accessible:

1. **Check common installation paths:**
   ```powershell
   Test-Path "C:\Program Files\Git\bin\git.exe"
   Test-Path "C:\Program Files (x86)\Git\bin\git.exe"
   ```

2. **If found, add to PATH:**
   - Press `Win + X` → **System** → **Advanced system settings**
   - Click **Environment Variables**
   - Under **System variables**, find **Path** → Click **Edit**
   - Click **New** → Add: `C:\Program Files\Git\bin`
   - Click **OK** on all windows
   - **Restart PowerShell**

---

## 🚀 After Git is Installed

### Quick Push Script

Once Git is installed and verified, run:

```powershell
cd "C:\Users\USER PC\Desktop\DoorlyDashboard_"
.\after-git-install.bat
```

### Or Manual Commands:

```powershell
# Navigate to project
cd "C:\Users\USER PC\Desktop\DoorlyDashboard_"

# Initialize repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Doorly Dashboard"

# Set branch
git branch -M main

# Add remote
git remote add origin https://github.com/alroshdi/Doorly_Dashboard.git

# Push (you'll be prompted for credentials)
git push -u origin main
```

---

## 🔐 Authentication

When you run `git push`, you'll need:

- **Username:** `alroshdi`
- **Password:** 
  - If **2FA enabled:** Use a [Personal Access Token](https://github.com/settings/tokens)
  - If **no 2FA:** Use your GitHub password

### Create Personal Access Token:
1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Name: `Doorly Dashboard`
4. Select scope: **`repo`** (full control)
5. Click **"Generate token"**
6. **Copy the token** (you won't see it again!)
7. Use this token as your password when pushing

---

## ✅ Verification Checklist

After installation, verify:

- [ ] Git is installed: `git --version` works
- [ ] You're in the project directory
- [ ] Repository exists on GitHub: https://github.com/alroshdi/Doorly_Dashboard
- [ ] You have GitHub credentials ready

---

## 🆘 Still Having Issues?

### If Git Still Not Found After Installation:

1. **Restart your computer** (ensures PATH is updated)
2. **Check PATH manually:**
   ```powershell
   $env:PATH -split ';' | Select-String -Pattern 'git'
   ```
3. **Reinstall Git** with "Add to PATH" option selected
4. **Use Git Bash** instead of PowerShell (comes with Git installation)

### Alternative: Use GitHub Desktop

If command line is problematic:
1. Download: https://desktop.github.com/
2. Sign in with GitHub
3. Add repository: `https://github.com/alroshdi/Doorly_Dashboard`
4. Publish repository

---

## 📝 Next Steps After Push

Once code is pushed:

1. **Verify on GitHub:** https://github.com/alroshdi/Doorly_Dashboard
2. **Deploy on Vercel:**
   - Go to: https://vercel.com
   - Sign up with GitHub
   - Import repository
   - Deploy

---

**Need more help?** Check `INSTALL_AND_PUSH.md` for detailed instructions.

