@echo off
echo Starting Doorly Dashboard Development Server...
echo.
cd /d "%~dp0"
REM Navigate to the actual project directory if nested
if exist "DoorlyDashboard_\package.json" (
    cd DoorlyDashboard_
)
echo Current directory: %CD%
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
    echo.
)

echo [INFO] Starting development server on port 3001...
echo.
echo Server will be available at: http://localhost:3001
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start Next.js dev server on port 3001
call npm run dev:3001

