@echo off
echo ========================================
echo   Publishing Dashboard to GitHub Pages
echo ========================================
echo.

cd /d "%~dp0DoorlyDashboard_"

echo [1/3] Adding all changes...
git add .
if %errorlevel% neq 0 (
    echo ERROR: Failed to add files
    pause
    exit /b 1
)

echo.
echo [2/3] Committing changes...
git commit -m "Publish dashboard with login and all features"
if %errorlevel% neq 0 (
    echo WARNING: No changes to commit or commit failed
    echo This is OK if everything is already committed
)

echo.
echo [3/3] Pushing to GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo ERROR: Failed to push to GitHub
    echo Please check your Git credentials
    pause
    exit /b 1
)

echo.
echo ========================================
echo   SUCCESS! Deployment Started
echo ========================================
echo.
echo Next steps:
echo 1. Go to: https://github.com/alroshdi/Doorly_Dashboard/settings/pages
echo 2. Make sure Source is set to "GitHub Actions"
echo 3. Go to: https://github.com/alroshdi/Doorly_Dashboard/actions
echo 4. Wait for "Deploy to GitHub Pages" to complete (2-3 minutes)
echo 5. Visit: https://alroshdi.github.io/Doorly_Dashboard/
echo.
echo Login credentials:
echo   Email: admin@admin.com
echo   Password: admin123
echo.
pause

