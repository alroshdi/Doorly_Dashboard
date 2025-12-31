@echo off
echo ========================================
echo   Doorly Dashboard - GitHub Push Script
echo ========================================
echo.

REM Check if Git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed!
    echo.
    echo Please install Git first:
    echo 1. Download from: https://git-scm.com/download/win
    echo 2. Or run: winget install Git.Git
    echo 3. Restart your terminal after installation
    echo.
    pause
    exit /b 1
)

echo [OK] Git is installed
echo.

REM Navigate to project directory
cd /d "%~dp0"
echo [INFO] Current directory: %CD%
echo.

REM Check if .git exists
if exist ".git" (
    echo [INFO] Git repository already initialized
) else (
    echo [INFO] Initializing Git repository...
    git init
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to initialize Git repository
        pause
        exit /b 1
    )
)

echo.
echo [INFO] Adding all files...
git add .
if %errorlevel% neq 0 (
    echo [ERROR] Failed to add files
    pause
    exit /b 1
)

echo.
echo [INFO] Creating commit...
git commit -m "Initial commit: Doorly Dashboard with LinkedIn Insights and Admin Features"
if %errorlevel% neq 0 (
    echo [WARNING] Commit failed or no changes to commit
)

echo.
echo [INFO] Setting branch to main...
git branch -M main
if %errorlevel% neq 0 (
    echo [WARNING] Branch rename failed or already on main
)

echo.
echo [INFO] Checking remote...
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Adding remote repository...
    git remote add origin https://github.com/alroshdi/Doorly_Dashboard.git
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to add remote
        pause
        exit /b 1
    )
) else (
    echo [INFO] Remote already configured
    git remote set-url origin https://github.com/alroshdi/Doorly_Dashboard.git
)

echo.
echo ========================================
echo   Ready to push to GitHub!
echo ========================================
echo.
echo Next steps:
echo 1. Make sure you have GitHub credentials ready
echo 2. If you have 2FA enabled, use a Personal Access Token
echo 3. The script will now attempt to push...
echo.
pause

echo.
echo [INFO] Pushing to GitHub...
git push -u origin main
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Push failed!
    echo.
    echo Common issues:
    echo - Authentication failed: Use Personal Access Token
    echo - Repository doesn't exist: Create it on GitHub first
    echo - Network issues: Check your internet connection
    echo.
    echo To create a Personal Access Token:
    echo 1. Go to GitHub.com
    echo 2. Settings ^> Developer settings ^> Personal access tokens
    echo 3. Generate new token with 'repo' permissions
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   SUCCESS! Code pushed to GitHub
echo ========================================
echo.
echo Repository: https://github.com/alroshdi/Doorly_Dashboard
echo.
echo Next steps for hosting:
echo 1. For Vercel (Recommended): Go to vercel.com and import repository
echo 2. For GitHub Pages: Go to repository Settings ^> Pages ^> Enable GitHub Actions
echo.
pause


