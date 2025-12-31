@echo off
echo ========================================
echo   Push to GitHub - After Git Installation
echo ========================================
echo.

REM Check if Git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git is still not found!
    echo.
    echo Please:
    echo 1. Make sure Git is installed
    echo 2. RESTART your terminal/PowerShell
    echo 3. Run this script again
    echo.
    echo Download Git: https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

echo [OK] Git is installed: 
git --version
echo.

REM Navigate to project directory
cd /d "%~dp0"
echo [INFO] Current directory: %CD%
echo.

REM Initialize Git if needed
if not exist ".git" (
    echo [INFO] Initializing Git repository...
    git init
    echo.
)

REM Add all files
echo [INFO] Adding all files...
git add .
echo.

REM Check if there are changes to commit
git diff --cached --quiet
if %errorlevel% equ 0 (
    echo [INFO] No changes to commit. Checking existing commits...
    git log --oneline -1 >nul 2>&1
    if %errorlevel% neq 0 (
        echo [INFO] Creating initial commit...
        git commit -m "Initial commit: Doorly Dashboard with LinkedIn Insights"
    ) else (
        echo [INFO] Files already committed. Skipping commit.
    )
) else (
    echo [INFO] Creating commit...
    git commit -m "Update: Doorly Dashboard with LinkedIn Insights"
)
echo.

REM Set branch to main
echo [INFO] Setting branch to main...
git branch -M main
echo.

REM Configure remote
echo [INFO] Configuring remote repository...
git remote remove origin >nul 2>&1
git remote add origin https://github.com/alroshdi/Doorly_Dashboard.git
if %errorlevel% neq 0 (
    echo [WARNING] Remote might already exist, continuing...
    git remote set-url origin https://github.com/alroshdi/Doorly_Dashboard.git
)
echo.

echo ========================================
echo   Ready to Push!
echo ========================================
echo.
echo Repository: https://github.com/alroshdi/Doorly_Dashboard
echo.
echo You will be prompted for GitHub credentials:
echo - Username: alroshdi
echo - Password: [Your GitHub password OR Personal Access Token]
echo.
echo If you have 2FA enabled, use a Personal Access Token:
echo https://github.com/settings/tokens
echo.
pause

echo.
echo [INFO] Pushing to GitHub...
echo.
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   SUCCESS! Code pushed to GitHub
    echo ========================================
    echo.
    echo View your repository:
    echo https://github.com/alroshdi/Doorly_Dashboard
    echo.
    echo Next: Set up hosting on Vercel (recommended)
    echo https://vercel.com
    echo.
) else (
    echo.
    echo ========================================
    echo   Push Failed
    echo ========================================
    echo.
    echo Common issues:
    echo 1. Authentication failed - Use Personal Access Token
    echo 2. Repository doesn't exist - Create it on GitHub first
    echo 3. Network issues - Check internet connection
    echo.
    echo To create Personal Access Token:
    echo https://github.com/settings/tokens
    echo.
)

pause

