@echo off
echo ========================================
echo Doorly Dashboard - GitHub Setup
echo ========================================
echo.

REM Check if git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Git is not installed!
    echo.
    echo Please install Git first:
    echo 1. Download from: https://git-scm.com/download/win
    echo 2. Or run: winget install Git.Git
    echo.
    pause
    exit /b 1
)

echo Git is installed. Proceeding with setup...
echo.

REM Navigate to project directory
cd /d "%~dp0"

echo Initializing Git repository...
git init

echo.
echo Adding all files...
git add .

echo.
echo Creating initial commit...
git commit -m "Initial commit: Doorly Dashboard with LinkedIn Insights and PDF Export"

echo.
echo Renaming branch to main...
git branch -M main

echo.
echo Adding remote repository...
git remote add origin https://github.com/alroshdi/Doorly_Dashboard.git

echo.
echo Pushing to GitHub...
echo Please enter your GitHub credentials when prompted.
git push -u origin main

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Your repository is now available at:
echo https://github.com/alroshdi/Doorly_Dashboard
echo.
pause


