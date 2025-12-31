@echo off
echo ========================================
echo   Git Installation Checker
echo ========================================
echo.

echo Checking if Git is installed...
echo.

REM Check if git command works
git --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Git is installed!
    git --version
    echo.
    echo You can now run: .\after-git-install.bat
    echo.
    pause
    exit /b 0
)

echo [ERROR] Git is NOT installed or not in PATH
echo.

REM Check common installation paths
echo Checking common installation locations...
echo.

if exist "C:\Program Files\Git\bin\git.exe" (
    echo [FOUND] Git found at: C:\Program Files\Git\bin\git.exe
    echo [INFO] Git is installed but not in PATH
    echo.
    echo To fix:
    echo 1. Press Win + X ^> System ^> Advanced system settings
    echo 2. Click Environment Variables
    echo 3. Under System variables, find Path ^> Edit
    echo 4. Add: C:\Program Files\Git\bin
    echo 5. Click OK and restart PowerShell
    echo.
    pause
    exit /b 1
)

if exist "C:\Program Files (x86)\Git\bin\git.exe" (
    echo [FOUND] Git found at: C:\Program Files (x86)\Git\bin\git.exe
    echo [INFO] Git is installed but not in PATH
    echo.
    echo To fix:
    echo 1. Press Win + X ^> System ^> Advanced system settings
    echo 2. Click Environment Variables
    echo 3. Under System variables, find Path ^> Edit
    echo 4. Add: C:\Program Files (x86)\Git\bin
    echo 5. Click OK and restart PowerShell
    echo.
    pause
    exit /b 1
)

echo [NOT FOUND] Git is not installed
echo.
echo ========================================
echo   Install Git Now
echo ========================================
echo.
echo Option 1: Download and Install
echo   https://git-scm.com/download/win
echo.
echo Option 2: Direct Download Link
echo   https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe
echo.
echo After installation:
echo 1. RESTART your PowerShell/terminal
echo 2. Run this script again to verify
echo 3. Then run: .\after-git-install.bat
echo.
pause

